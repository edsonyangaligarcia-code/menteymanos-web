import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker, { RECONCILE_TIMEOUT_MS } from '../workers/reconcile-cron.js';

const RECONCILE_URL = 'https://preview.example.pages.dev/api/checkout/reconcile-admin';
const SECRET = 'x'.repeat(32);
const env = () => ({ RECONCILE_URL, RECONCILE_SECRET: SECRET });
const originalFetch = globalThis.fetch;
const originalLog = console.log;
test.after(() => { globalThis.fetch = originalFetch; console.log = originalLog; });

test('only the preview Worker has the five-minute Cron and Pages URL', () => {
  const config = JSON.parse(readFileSync(new URL('../wrangler.reconcile.jsonc', import.meta.url), 'utf8'));
  assert.deepEqual(config.env.preview.triggers.crons, ['*/5 * * * *']);
  assert.equal(config.env.preview.vars.RECONCILE_URL, 'https://feature-ing1-compra-directa.menteymanos.pages.dev/api/checkout/reconcile-admin');
  assert.equal(config.env.production, undefined);
  assert.equal(config.d1_databases, undefined);
});

test('missing URL or secret rejects before fetch', async () => {
  globalThis.fetch = () => { throw new Error('fetch must not run'); };
  await assert.rejects(worker.scheduled(null, { RECONCILE_SECRET: SECRET }, null), /RECONCILE_NOT_CONFIGURED/);
  await assert.rejects(worker.scheduled(null, { RECONCILE_URL }, null), /RECONCILE_NOT_CONFIGURED/);
  await assert.rejects(worker.scheduled(null, { ...env(), RECONCILE_SECRET: 'short' }, null), /RECONCILE_NOT_CONFIGURED/);
});

test('non-HTTPS URL rejects before fetch', async () => {
  globalThis.fetch = () => { throw new Error('fetch must not run'); };
  await assert.rejects(worker.scheduled(null, { ...env(), RECONCILE_URL: 'http://preview.example.pages.dev/api/checkout/reconcile-admin' }, null), /RECONCILE_NOT_CONFIGURED/);
});

test('successful run sends POST Bearer without body and logs only counters', async () => {
  const logs = [];
  console.log = value => logs.push(value);
  globalThis.fetch = async (url, options) => {
    assert.equal(url, RECONCILE_URL);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, `Bearer ${SECRET}`);
    assert.equal(options.body, undefined);
    assert.ok(options.signal);
    return Response.json({ ok: true, checked: 3, busy: 1, errors: 0 });
  };
  try {
    await worker.scheduled(null, env(), null);
    assert.deepEqual(logs.map(JSON.parse), [{ checked: 3, busy: 1, errors: 0 }]);
    assert.ok(!logs[0].includes(SECRET));
  } finally { console.log = originalLog; }
});

for (const status of [401, 500]) {
  test(`HTTP ${status} rejects`, async () => {
    globalThis.fetch = async () => Response.json({ ok: false }, { status });
    await assert.rejects(worker.scheduled(null, env(), null), /RECONCILE_HTTP_ERROR/);
  });
}

test('invalid JSON rejects', async () => {
  globalThis.fetch = async () => new Response('invalid JSON', { status: 200 });
  await assert.rejects(worker.scheduled(null, env(), null), /RECONCILE_INVALID_JSON/);
});

test('JSON without ok true rejects', async () => {
  globalThis.fetch = async () => Response.json({ ok: false, checked: 1 });
  await assert.rejects(worker.scheduled(null, env(), null), /RECONCILE_INVALID_RESPONSE/);
});

test('timeout aborts the request', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  });
  try {
    const pending = worker.scheduled(null, env(), null);
    t.mock.timers.tick(RECONCILE_TIMEOUT_MS);
    await assert.rejects(pending, /RECONCILE_TIMEOUT/);
  } finally { t.mock.timers.reset(); }
});
