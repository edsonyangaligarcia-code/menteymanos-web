import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { buildIng1Order } from '../server/ing1-order.js';
import { centsToDecimalString, decimalStringToCents } from '../server/checkout-common.js';
import { createMpBody } from '../server/mercadopago.js';
import { validWebhookSignature } from '../server/mp-webhook.js';
import { onRequestPost as createOrder } from '../functions/api/checkout/create-order.js';
import { onRequestPost as webhook } from '../functions/api/mercadopago/webhook.js';
import { onRequestGet as status } from '../functions/api/checkout/status.js';
import { onRequestPost as verifyEmail } from '../functions/api/drive/verify-email.js';
import { RECONCILE_LEASE_SECONDS, claimReconciliation, claimDelivery, finishDelivery, failDelivery, updatePayment } from '../server/order-store.js';
import { reconcileMercadoPagoOrder } from '../server/reconcile-order.js';
import { onRequestPost as reconcileAdmin } from '../functions/api/checkout/reconcile-admin.js';

const REQUEST_ID = '8e28b35a-1b85-4d4f-8f85-8b464c98f2ed';
const SCRIPT = 'https://script.google.com/macros/s/example/exec';
const CHECKOUT = 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=test';
const encoder = new TextEncoder();
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_checkout_orders.sql', import.meta.url), 'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/0002_checkout_claims.sql', import.meta.url), 'utf8'));
  return { prepare(sql) { const statement = sqlite.prepare(sql); return { bind(...params) { return { first: async () => statement.get(...params) || null, run: async () => ({ meta: { changes: statement.run(...params).changes } }), all: async () => ({ results: statement.all(...params) }) }; }, all: async () => ({ results: statement.all() }) }; }, sqlite };
}
function environment() { return { DB: database(), MM_ENV: 'test', MP_ACCESS_TOKEN: 'TEST-placeholder-unit-test', MP_WEBHOOK_SECRET: 'unit-test-webhook-secret', MP_TEST_PAYER_EMAIL: 'TESTUSER123@testuser.com', MM_PUBLIC_BASE_URL: 'https://preview.example.pages.dev', MM_DRIVE_WEBAPP_URL: SCRIPT, MM_SHARED_SECRET: 'unit-test-drive-secret' }; }
function createRequest(body = { requestId: REQUEST_ID, offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com' }, ip = '198.51.100.1') {
  return new Request('https://shop.test/api/checkout/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip }, body: JSON.stringify(body) });
}
function mpOrder(local, overrides = {}) { return { id: local.mp_order_id, external_reference: local.external_reference, currency: 'PEN', total_amount: centsToDecimalString(local.amount_cents), total_paid_amount: centsToDecimalString(local.amount_cents), status: 'processed', status_detail: 'accredited', ...overrides }; }
function localOrder(env) { return env.DB.sqlite.prepare('SELECT * FROM orders LIMIT 1').get(); }
function mockFetch(env, options = {}) {
  const calls = { verify: 0, create: 0, get: 0, deliver: 0, requestIds: [], verifiedEmails: [], mpPayers: [], delivered: [] };
  globalThis.fetch = async (url, init) => {
    if (String(url) === SCRIPT) {
      const body = JSON.parse(init.body);
      if (body.action === 'verify_email') { calls.verify++; calls.verifiedEmails.push(body.email); return Response.json({ ok: true, compatible: options.compatible ?? true }); }
      if (body.action === 'deliver') { calls.deliver++; calls.delivered.push(body); return Response.json(options.deliverResult?.(calls.deliver) ?? { ok: true, items: body.items.map(code => ({ code, url: `https://drive.google.com/drive/folders/${code}` })) }); }
    }
    if (String(url).endsWith('/v1/orders') && init.method === 'POST') {
      calls.create++; calls.requestIds.push(init.headers['X-Idempotency-Key']);
      const body = JSON.parse(init.body);
      calls.mpPayers.push(body.payer.email);
      assert.equal(body.total_amount, centsToDecimalString(localOrder(env).amount_cents));
      return Response.json({ id: 'ORDER123', checkout_url: CHECKOUT, status: 'created', status_detail: 'created' });
    }
    if (String(url).endsWith('/v1/orders/ORDER123')) { calls.get++; return Response.json(mpOrder(localOrder(env), options.mpOverrides)); }
    throw new Error(`Unexpected mock fetch ${url}`);
  };
  return calls;
}
async function signature(secret, dataId, requestId, timestamp) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`id:${dataId};request-id:${requestId};ts:${timestamp};`)));
  return `ts=${timestamp},v1=${Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
async function hookRequest(env, notificationId = 'notification-1', options = {}) {
  const dataId = options.dataId || 'ORDER123';
  const id = crypto.randomUUID();
  const sig = options.signature || await signature(env.MP_WEBHOOK_SECRET, dataId, id, '1700000000');
  return new Request(`https://shop.test/api/mercadopago/webhook?data.id=${dataId}&type=order`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-request-id': id, ...(options.noSignature ? {} : { 'x-signature': sig }) }, body: JSON.stringify({ id: notificationId, type: 'order', action: 'order.processed', data: { id: dataId }, live_mode: false }) });
}
async function seed(env) { const response = await createOrder({ request: createRequest(), env }); assert.equal(response.status, 200); return response.json(); }
const originalFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = originalFetch; });

test('canonical OP1, COMBO, VIP prices and contents', () => {
  assert.deepEqual(buildIng1Order('opcion1', ['ING 3'])?.items, ['ING 1', 'ING 3']);
  assert.equal(buildIng1Order('opcion1', ['ING 3'])?.priceCents, 990);
  assert.deepEqual(buildIng1Order('combo', ['ING 2', 'ING 6'])?.items, ['ING 1', 'ING 2', 'ING 6']);
  assert.equal(buildIng1Order('combo', ['ING 2', 'ING 6'])?.priceCents, 1590);
  assert.equal(buildIng1Order('vip')?.items.length, 7);
  assert.equal(buildIng1Order('vip')?.priceCents, 2990);
});
test('money conversion and MP item sum use integer cents', () => {
  for (const offer of [buildIng1Order('opcion1', ['ING 3']), buildIng1Order('combo', ['ING 2', 'ING 6']), buildIng1Order('vip')]) {
    const body = createMpBody({ ...offer, id: REQUEST_ID, externalReference: 'mym_test', email: 'buyer@gmail.com' }, 'https://preview.example.pages.dev');
    assert.equal(body.items.reduce((sum, item) => sum + decimalStringToCents(item.unit_price) * item.quantity, 0), offer.priceCents);
    assert.equal(decimalStringToCents(body.total_amount), offer.priceCents);
    assert.equal(body.processing_mode, 'manual');
    assert.equal(body.type, 'online');
    assert.equal(body.payer.email, 'buyer@gmail.com');
  }
  assert.equal(decimalStringToCents('9.901'), null);
});
test('client price and arbitrary final items cannot change order', async () => {
  const env = environment(); const calls = mockFetch(env);
  const valid = await createOrder({ request: createRequest({ requestId: REQUEST_ID, offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com', price: 1, total: '0.01', currency: 'USD' }), env });
  assert.equal(valid.status, 200);
  assert.equal(localOrder(env).amount_cents, 2990);
  assert.equal(localOrder(env).currency, 'PEN');
  const invalid = await createOrder({ request: createRequest({ requestId: REQUEST_ID, offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com', items: ['ING 8'] }), env });
  assert.equal(invalid.status, 400);
  assert.equal(calls.create, 1);
});

test('test payer is normalized while local order and Drive keep the real buyer email', async () => {
  const env = environment(); env.MP_TEST_PAYER_EMAIL = ' TESTUSER123@testuser.com ';
  const calls = mockFetch(env);
  assert.equal((await createOrder({ request: createRequest(), env })).status, 200);
  assert.deepEqual(calls.mpPayers, ['testuser123@testuser.com']);
  assert.equal(localOrder(env).email, 'buyer@gmail.com');
  assert.deepEqual(calls.verifiedEmails, ['buyer@gmail.com']);
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 200);
  assert.equal(calls.delivered[0].email, 'buyer@gmail.com');
});

test('missing test payer blocks checkout before creating a local or MP order', async () => {
  const env = environment(); env.MP_TEST_PAYER_EMAIL = undefined;
  const calls = mockFetch(env);
  const response = await createOrder({ request: createRequest(), env });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'CHECKOUT_NOT_CONFIGURED');
  assert.equal(calls.create, 0);
  assert.equal(localOrder(env), undefined);
});

test('test payer outside testuser.com is rejected before creating an MP order', async () => {
  const env = environment();
  const calls = mockFetch(env);
  for (const payer of ['buyer@gmail.com', 'not-an-email', 'buyer@testuser.com.evil']) {
    env.MP_TEST_PAYER_EMAIL = payer;
    const response = await createOrder({ request: createRequest(), env });
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error, 'CHECKOUT_NOT_CONFIGURED');
  }
  assert.equal(calls.create, 0);
});

test('browser cannot supply a payer email', async () => {
  const env = environment(); const calls = mockFetch(env);
  for (const extra of [{ payer: { email: 'attacker@testuser.com' } }, { payerEmail: 'attacker@testuser.com' }]) {
    const response = await createOrder({ request: createRequest({ requestId: crypto.randomUUID(), offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com', ...extra }), env });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).error, 'INVALID_ORDER');
  }
  assert.equal(calls.create, 0);
});
test('same request ID returns stored checkout and keeps MP idempotency key', async () => {
  const env = environment(); const calls = mockFetch(env);
  const first = await seed(env);
  const second = await createOrder({ request: createRequest(), env });
  assert.deepEqual(await second.json(), first);
  assert.equal(calls.create, 1);
  assert.deepEqual(calls.requestIds, [REQUEST_ID]);
});
test('server revalidates email and blocks incompatible email', async () => {
  const env = environment(); const calls = mockFetch(env, { compatible: false });
  const response = await createOrder({ request: createRequest(), env });
  assert.equal(response.status, 400);
  assert.equal(calls.verify, 1);
  assert.equal(calls.create, 0);
});
test('OP1 and COMBO accept only the required distinct additional ING', async () => {
  const env = environment(); const calls = mockFetch(env);
  for (const [index, [offer, additions]] of [['OP1', []], ['OP1', ['ING1']], ['OP1', ['ING2', 'ING3']], ['COMBO', ['ING2']], ['COMBO', ['ING2', 'ING2']], ['COMBO', ['ING2', 'ING8']], ['VIP', ['ING2']]].entries()) {
    const response = await createOrder({ request: createRequest({ requestId: crypto.randomUUID(), offer, additionalItems: additions, email: 'buyer@gmail.com' }, `198.51.100.${20 + index}`), env });
    assert.equal(response.status, 400);
  }
  assert.equal(calls.create, 0);
});
test('create-order refuses missing D1 and missing checkout config', async () => {
  const env = environment();
  assert.equal((await createOrder({ request: createRequest(), env: { ...env, DB: undefined } })).status, 503);
  assert.equal((await createOrder({ request: createRequest(), env: { ...env, MP_ACCESS_TOKEN: undefined } })).status, 503);
  assert.equal((await createOrder({ request: createRequest(), env: { ...env, MP_WEBHOOK_SECRET: undefined } })).status, 503);
});
test('webhook without signature or with invalid signature returns 401', async () => {
  const env = environment(); mockFetch(env); await seed(env);
  assert.equal((await webhook({ request: await hookRequest(env, 'n1', { noSignature: true }), env })).status, 401);
  assert.equal((await webhook({ request: await hookRequest(env, 'n1', { signature: 'ts=1700000000,v1=' + '0'.repeat(64) }), env })).status, 401);
});
test('signed webhook always GETs MP; body action cannot authorize delivery', async () => {
  const env = environment(); const calls = mockFetch(env, { mpOverrides: { status: 'created', status_detail: 'created' } }); await seed(env);
  const response = await webhook({ request: await hookRequest(env), env });
  assert.equal(response.status, 200);
  assert.equal(calls.get, 1);
  assert.equal(calls.deliver, 0);
  assert.equal(localOrder(env).payment_status, 'created');
});
test('unknown signed order requests webhook retry', async () => {
  const env = environment(); const calls = mockFetch(env);
  const response = await webhook({ request: await hookRequest(env), env });
  assert.equal(response.status, 503);
  assert.equal(calls.get, 0);
});
test('refund state is recorded without new delivery', async () => {
  const env = environment(); const calls = mockFetch(env, { mpOverrides: { status: 'processed', status_detail: 'refunded', total_paid_amount: '0.00' } }); await seed(env);
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 200);
  assert.equal(localOrder(env).payment_status, 'refunded');
  assert.equal(calls.deliver, 0);
});
for (const [label, override] of [
  ['wrong amount', { total_amount: '1.00' }],
  ['wrong currency', { currency: 'USD' }],
  ['wrong external reference', { external_reference: 'other' }],
  ['underpayment', { total_paid_amount: '1.00' }],
  ['wrong MP id', { id: 'OTHER' }]
]) test(`accredited payment with ${label} never delivers`, async () => {
  const env = environment(); const calls = mockFetch(env, { mpOverrides: override }); await seed(env);
  const response = await webhook({ request: await hookRequest(env), env });
  assert.equal(response.status, 409);
  assert.equal(calls.deliver, 0);
});
test('valid accredited webhook delivers once and stores only canonical codes', async () => {
  const env = environment(); const calls = mockFetch(env); await seed(env);
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 200);
  assert.equal(calls.deliver, 1);
  assert.deepEqual(calls.delivered[0].items, ['ING1', 'ING2', 'ING3', 'ING4', 'ING5', 'ING6', 'ING7']);
  assert.equal(localOrder(env).delivery_status, 'delivered');
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 200);
  assert.equal(calls.get, 1);
  assert.equal(calls.deliver, 1);
  assert.equal(env.DB.sqlite.prepare('SELECT COUNT(*) AS count FROM webhook_events').get().count, 1);
});
test('failed Drive delivery is retried by duplicate webhook', async () => {
  const env = environment(); const calls = mockFetch(env, { deliverResult: count => count === 1 ? { ok: false } : { ok: true } }); await seed(env);
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 503);
  assert.equal(localOrder(env).delivery_status, 'failed');
  assert.equal((await webhook({ request: await hookRequest(env), env })).status, 200);
  assert.equal(calls.deliver, 2);
  assert.equal(localOrder(env).delivery_status, 'delivered');
});
test('return success cannot change status; links shown only after delivered', async () => {
  const env = environment(); const mpOptions = { mpOverrides: { status: 'created', status_detail: 'created', total_paid_amount: '0.00' } }; mockFetch(env, mpOptions); const created = await seed(env);
  const request = new Request(`https://shop.test/api/checkout/status?ref=${created.ref}&return=success`);
  const before = await (await status({ request, env })).json();
  assert.equal(before.paymentStatus, 'created');
  assert.deepEqual(before.items, []);
  mpOptions.mpOverrides = {};
  await webhook({ request: await hookRequest(env), env });
  const after = await (await status({ request, env })).json();
  assert.equal(after.paymentStatus, 'paid');
  assert.equal(after.deliveryStatus, 'delivered');
  assert.equal(after.items.length, 7);
  assert.equal(after.email, undefined);
});
test('signed manifest matches official structure', async () => {
  const env = environment(); const id = crypto.randomUUID(); const sig = await signature(env.MP_WEBHOOK_SECRET, 'ORDER123', id, '1700000000');
  assert.equal(await validWebhookSignature(env.MP_WEBHOOK_SECRET, 'ORDER123', id, sig), true);
  assert.equal(await validWebhookSignature(env.MP_WEBHOOK_SECRET, 'OTHER', id, sig), false);
});
test('verify-email rate limit is 10 per window', async () => {
  const env = environment(); const calls = mockFetch(env);
  const request = () => new Request('https://shop.test/api/drive/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.91' }, body: JSON.stringify({ email: 'buyer@gmail.com' }) });
  for (let i = 0; i < 10; i++) assert.equal((await verifyEmail({ request: request(), env })).status, 200);
  const blocked = await verifyEmail({ request: request(), env });
  assert.equal(blocked.status, 429); assert.equal((await blocked.json()).error, 'RATE_LIMITED'); assert.equal(calls.verify, 10);
});
test('create-order rate limit is 5 per window', async () => {
  const env = environment(); const calls = mockFetch(env);
  for (let i = 0; i < 5; i++) await createOrder({ request: createRequest({ requestId: crypto.randomUUID(), offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com' }, '198.51.100.92'), env });
  const blocked = await createOrder({ request: createRequest({ requestId: crypto.randomUUID(), offer: 'VIP', additionalItems: [], email: 'buyer@gmail.com' }, '198.51.100.92'), env });
  assert.equal(blocked.status, 429); assert.equal((await blocked.json()).error, 'RATE_LIMITED'); assert.equal(calls.create, 5);
});

for (const [label, paid, accepted] of [
  ['absent', undefined, false], ['null', null, false], ['invalid', '29.901', false],
  ['lower', '29.89', false], ['higher', '29.91', false], ['exact', '29.90', true]
]) test(`accredited total_paid_amount ${label} ${accepted ? 'delivers' : 'does not deliver'}`, async () => {
  const env = environment();
  const calls = mockFetch(env, { mpOverrides: { total_paid_amount: paid } });
  await seed(env);
  const response = await webhook({ request: await hookRequest(env, `paid-${label}`), env });
  assert.equal(response.status, accepted ? 200 : 409);
  assert.equal(calls.deliver, accepted ? 1 : 0);
});

test('an expired delivery owner cannot finish or fail a newer claim', async () => {
  const env = environment(); mockFetch(env); await seed(env);
  env.DB.sqlite.prepare("UPDATE orders SET payment_status='paid',delivery_status='pending'").run();
  const order = localOrder(env);
  const reconcileToken = await claimReconciliation(env.DB, order, 30, true);
  const first = await claimDelivery(env.DB, order, reconcileToken);
  env.DB.sqlite.prepare('UPDATE orders SET delivery_claimed_at=?').run(Math.floor(Date.now() / 1000) - 31);
  const second = await claimDelivery(env.DB, order, reconcileToken);
  assert.ok(first && second && first !== second);
  assert.equal(await finishDelivery(env.DB, order, first, reconcileToken, []), false);
  assert.equal(await failDelivery(env.DB, order, first, reconcileToken), false);
  assert.equal(localOrder(env).delivery_status, 'delivering');
  assert.equal(await finishDelivery(env.DB, order, second, reconcileToken, []), true);
  assert.equal(localOrder(env).delivery_status, 'delivered');
});

test('delivery completion cannot persist after reconciliation ownership changes', async () => {
  const env = environment(); mockFetch(env); await seed(env);
  env.DB.sqlite.prepare("UPDATE orders SET payment_status='paid',delivery_status='pending'").run();
  const order = localOrder(env);
  const reconcileToken = await claimReconciliation(env.DB, order, 30, true);
  const deliveryToken = await claimDelivery(env.DB, order, reconcileToken);
  assert.ok(deliveryToken);
  assert.ok(localOrder(env).reconcile_claimed_at >= Math.floor(Date.now() / 1000) - 1);
  env.DB.sqlite.prepare('UPDATE orders SET reconcile_claim_token=?').run(crypto.randomUUID());
  assert.equal(await finishDelivery(env.DB, order, deliveryToken, reconcileToken, []), false);
  assert.equal(await failDelivery(env.DB, order, deliveryToken, reconcileToken), false);
  assert.equal(localOrder(env).delivery_status, 'delivering');
});

for (const [initial, incoming, expected] of [
  ['paid', 'refunded', 'refunded'], ['refunded', 'paid', 'refunded'],
  ['paid', 'partially_refunded', 'partially_refunded'], ['partially_refunded', 'paid', 'partially_refunded'],
  ['refunded', 'processing', 'refunded'], ['refunded', 'created', 'refunded'],
  ['refunded', 'failed', 'refunded'], ['refunded', 'canceled', 'refunded'],
  ['refunded', 'partially_refunded', 'refunded'], ['partially_refunded', 'processing', 'partially_refunded'],
  ['partially_refunded', 'refunded', 'refunded'], ['processing', 'paid', 'paid']
]) test(`payment transition ${initial} then ${incoming} stays ${expected}`, async () => {
  const env = environment(); mockFetch(env); await seed(env);
  const stale = localOrder(env);
  const token = await claimReconciliation(env.DB, stale, 30, true);
  for (const state of [initial, incoming]) {
    const detail = state === 'paid' ? 'accredited' : state;
    assert.ok(await updatePayment(env.DB, stale, { status: state === 'processing' ? 'processing' : state === 'created' ? 'created' : 'processed', status_detail: detail }, state, token));
  }
  assert.equal(localOrder(env).payment_status, expected);
  assert.equal(localOrder(env).mp_status_detail, expected === 'paid' ? 'accredited' : expected);
});

test('expired reconciliation A cannot update payment or deliver after B replaces its token', async () => {
  const env = environment(); mockFetch(env); await seed(env);
  let releaseA;
  const barrier = new Promise(resolve => { releaseA = resolve; });
  let enteredA;
  const entered = new Promise(resolve => { enteredA = resolve; });
  let gets = 0;
  let deliveries = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/v1/orders/ORDER123')) {
      gets++;
      if (gets === 1) { enteredA(); await barrier; return Response.json(mpOrder(localOrder(env))); }
      return Response.json(mpOrder(localOrder(env), { status: 'processing', status_detail: 'processing', total_paid_amount: '0.00' }));
    }
    if (String(url) === SCRIPT) { deliveries++; return Response.json({ ok: true }); }
    throw new Error('Unexpected fetch');
  };
  const first = reconcileMercadoPagoOrder(env, 'ORDER123', { force: true });
  await entered;
  const tokenA = localOrder(env).reconcile_claim_token;
  env.DB.sqlite.prepare('UPDATE orders SET reconcile_claimed_at=?').run(Math.floor(Date.now() / 1000) - RECONCILE_LEASE_SECONDS - 1);
  const second = await reconcileMercadoPagoOrder(env, 'ORDER123', { force: true });
  assert.equal(second.state, 'processing');
  assert.notEqual(tokenA, localOrder(env).reconcile_claim_token);
  assert.equal(await updatePayment(env.DB, localOrder(env), mpOrder(localOrder(env)), 'paid', tokenA), null);
  releaseA();
  assert.deepEqual(await first, { state: 'claim_lost' });
  assert.equal(localOrder(env).payment_status, 'processing');
  assert.equal(deliveries, 0);
  assert.equal(gets, 2);
});

test('two simultaneous status requests initiate only one MP GET', async () => {
  const env = environment(); mockFetch(env); const created = await seed(env);
  const baseFetch = globalThis.fetch;
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  let gets = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/v1/orders/ORDER123')) { gets++; entered(); await barrier; }
    return baseFetch(url, init);
  };
  const request = () => new Request(`https://shop.test/api/checkout/status?ref=${created.ref}`);
  const first = status({ request: request(), env });
  await started;
  const second = await status({ request: request(), env });
  assert.equal(second.status, 200);
  release();
  assert.equal((await first).status, 200);
  assert.equal(gets, 1);
});

test('MP failure is backed off persistently across status requests', async () => {
  const env = environment(); mockFetch(env); const created = await seed(env);
  let gets = 0;
  globalThis.fetch = async url => { if (String(url).endsWith('/v1/orders/ORDER123')) gets++; throw new Error('MP down'); };
  const request = () => new Request(`https://shop.test/api/checkout/status?ref=${created.ref}`);
  assert.equal((await status({ request: request(), env })).status, 200);
  assert.equal((await status({ request: request(), env })).status, 200);
  assert.equal(gets, 1);
  assert.ok(localOrder(env).last_reconcile_attempt_at);
});

test('delivered order records a later refund without calling Drive again or exposing links', async () => {
  const env = environment(); const options = { mpOverrides: {} }; const calls = mockFetch(env, options); const created = await seed(env);
  assert.equal((await webhook({ request: await hookRequest(env, 'delivered-event'), env })).status, 200);
  options.mpOverrides = { status: 'processed', status_detail: 'refunded', total_paid_amount: '0.00' };
  assert.equal((await webhook({ request: await hookRequest(env, 'refund-event'), env })).status, 200);
  assert.equal(localOrder(env).payment_status, 'refunded');
  assert.equal(localOrder(env).delivery_status, 'delivered');
  assert.equal(calls.deliver, 1);
  const result = await (await status({ request: new Request(`https://shop.test/api/checkout/status?ref=${created.ref}`), env })).json();
  assert.deepEqual(result.items, []);
});

test('completed webhook is skipped but a failed delivery notification can retry', async () => {
  const env = environment(); const calls = mockFetch(env, { deliverResult: count => count === 1 ? { ok: false } : { ok: true } }); await seed(env);
  const request = () => hookRequest(env, 'same-notification');
  assert.equal((await webhook({ request: await request(), env })).status, 503);
  assert.equal((await webhook({ request: await request(), env })).status, 200);
  assert.equal(calls.get, 2);
  assert.equal(calls.deliver, 2);
  assert.equal((await webhook({ request: await request(), env })).status, 200);
  assert.equal(calls.get, 2);
  assert.equal(calls.deliver, 2);
});

test('administrative reconciliation requires a configured secret', async () => {
  const env = environment(); env.MM_ADMIN_SECRET = 'a'.repeat(32); mockFetch(env); await seed(env);
  const request = token => new Request('https://shop.test/api/checkout/reconcile-admin', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  assert.equal((await reconcileAdmin({ request: request('wrong'), env })).status, 401);
  assert.equal((await reconcileAdmin({ request: request(env.MM_ADMIN_SECRET), env })).status, 200);
});
