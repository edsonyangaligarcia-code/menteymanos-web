import { centsToDecimalString, checkoutUrl, decimalStringToCents, normalizeEmail, publicBaseUrl } from './checkout-common.js';

const API = 'https://api.mercadopago.com';
const TIMEOUT_MS = 8000;
async function mpFetch(env, path, options = {}) {
  if (!['test', 'production'].includes(env.MM_ENV) || !env.MP_ACCESS_TOKEN) throw new Error('CHECKOUT_NOT_CONFIGURED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${API}${path}`, { ...options, headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, Accept: 'application/json', ...options.headers }, signal: controller.signal });
    if (!response.ok) throw new Error('MERCADOPAGO_UNAVAILABLE');
    return await response.json();
  } catch { throw new Error('MERCADOPAGO_UNAVAILABLE'); }
  finally { clearTimeout(timer); }
}
export function mpItems(order) {
  const base = Math.floor(order.priceCents / order.items.length);
  const remainder = order.priceCents % order.items.length;
  return order.items.map((code, index) => ({ title: code, quantity: 1, unit_price: centsToDecimalString(base + (index < remainder ? 1 : 0)) }));
}
export function testPayerEmail(value) {
  const email = normalizeEmail(value);
  return email?.endsWith('@testuser.com') ? email : null;
}
export function createMpBody(order, baseUrl, env = {}) {
  const origin = publicBaseUrl(baseUrl);
  if (!origin) throw new Error('CHECKOUT_NOT_CONFIGURED');
  const payerEmail = env.MM_ENV === 'test' ? testPayerEmail(env.MP_TEST_PAYER_EMAIL) : order.email;
  if (!payerEmail) throw new Error('CHECKOUT_NOT_CONFIGURED');
  const result = path => `${origin}/comprar/ing1/resultado/?ref=${encodeURIComponent(order.id)}&return=${path}`;
  return { type: 'online', processing_mode: 'manual', total_amount: centsToDecimalString(order.priceCents), external_reference: order.externalReference,
    payer: { email: payerEmail }, items: mpItems(order), config: { online: { success_url: result('success'), failure_url: result('failure'), pending_url: result('pending'), auto_return: 'approved' } } };
}
export async function createMpOrder(env, order) {
  const body = createMpBody(order, env.MM_PUBLIC_BASE_URL, env);
  const mp = await mpFetch(env, '/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': order.requestId }, body: JSON.stringify(body) });
  if (typeof mp.id !== 'string' || !/^[\w-]{1,128}$/.test(mp.id) || !checkoutUrl(mp.checkout_url)) throw new Error('MERCADOPAGO_UNAVAILABLE');
  return mp;
}
export async function getMpOrder(env, id) {
  if (typeof id !== 'string' || !/^[\w-]{1,128}$/.test(id)) throw new Error('MERCADOPAGO_UNAVAILABLE');
  return mpFetch(env, `/v1/orders/${encodeURIComponent(id)}`);
}
export function validateMpOrder(mp, local) {
  if (String(mp.id) !== local.mp_order_id || mp.external_reference !== local.external_reference || mp.currency !== 'PEN' || local.currency !== 'PEN') return false;
  if (decimalStringToCents(mp.total_amount) !== local.amount_cents) return false;
  if (mp.status === 'processed' && mp.status_detail === 'accredited' && decimalStringToCents(mp.total_paid_amount) !== local.amount_cents) return false;
  return true;
}
export function paymentState(mp) {
  if (mp.status === 'processed' && mp.status_detail === 'accredited') return 'paid';
  if (mp.status === 'processed' && ['refunded', 'partially_refunded'].includes(mp.status_detail)) return mp.status_detail;
  if (mp.status === 'created') return 'created';
  if (mp.status === 'processing') return 'processing';
  if (mp.status === 'failed' || mp.status === 'canceled') return mp.status;
  return 'processing';
}
