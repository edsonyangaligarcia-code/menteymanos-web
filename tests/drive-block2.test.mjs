import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/drive/verify-email.js';
import { buildIng1Order } from '../server/ing1-order.js';

const env = { MM_DRIVE_WEBAPP_URL: 'https://script.google.com/macros/s/example/exec', MM_SHARED_SECRET: 'test-only-secret' };
const request = (email, headers = { 'Content-Type': 'application/json' }) => new Request('https://shop.test/api/drive/verify-email', {
  method: 'POST', headers, body: JSON.stringify({ email })
});

test('normalizes a compatible email and returns no upstream fields', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), { secret: env.MM_SHARED_SECRET, action: 'verify_email', email: 'person@gmail.com' });
    return new Response(JSON.stringify({ ok: true, compatible: true, email: 'other@example.com', internal: 'hidden' }));
  };
  try {
    const response = await onRequestPost({ request: request('  PERSON@GMAIL.COM  '), env });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, compatible: true, email: 'person@gmail.com' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { globalThis.fetch = originalFetch; }
});

test('normalizes rejection and hides the remote reason', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, compatible: false, reason: 'internal detail' }));
  try {
    const response = await onRequestPost({ request: request('person@gmail.com'), env });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, compatible: false, reason: 'DRIVE_REJECTED_EMAIL' });
  } finally { globalThis.fetch = originalFetch; }
});

test('rejects invalid input before calling Apps Script', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('unexpected upstream call'); };
  try {
    const invalid = await onRequestPost({ request: request('not-an-email'), env });
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), { ok: false, error: 'INVALID_EMAIL' });
    const unsupported = await onRequestPost({ request: request('person@gmail.com', { 'Content-Type': 'text/plain' }), env });
    assert.equal(unsupported.status, 415);
    const oversized = await onRequestPost({ request: request('x'.repeat(1100) + '@gmail.com'), env });
    assert.equal(oversized.status, 413);
    const missingConfig = await onRequestPost({ request: request('person@gmail.com'), env: {} });
    assert.equal(missingConfig.status, 503);
  } finally { globalThis.fetch = originalFetch; }
});

test('returns a generic error for bad upstream data or network failure', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('<html>not JSON</html>');
    const nonJson = await onRequestPost({ request: request('person@gmail.com'), env });
    assert.equal(nonJson.status, 502);
    assert.deepEqual(await nonJson.json(), { ok: false, error: 'DRIVE_UNAVAILABLE' });
    globalThis.fetch = async () => { throw new Error('network down'); };
    const offline = await onRequestPost({ request: request('person@gmail.com'), env });
    assert.equal(offline.status, 502);
    assert.deepEqual(await offline.json(), { ok: false, error: 'DRIVE_UNAVAILABLE' });
  } finally { globalThis.fetch = originalFetch; }
});

test('server-side ING 1 catalog enforces each offer and allowed items', () => {
  assert.deepEqual(buildIng1Order('opcion1', ['ING 3'])?.items, ['ING 1', 'ING 3']);
  assert.deepEqual(buildIng1Order('combo', ['ING 2', 'ING 7'])?.items, ['ING 1', 'ING 2', 'ING 7']);
  assert.deepEqual(buildIng1Order('vip')?.items, ['ING 1', 'ING 2', 'ING 3', 'ING 4', 'ING 5', 'ING 6', 'ING 7']);
  assert.equal(buildIng1Order('vip')?.priceCents, 2990);
  assert.equal(buildIng1Order('combo', ['ING 2', 'ING 2']), null);
  assert.equal(buildIng1Order('opcion1', ['ING 8']), null);
  assert.equal(buildIng1Order('vip', ['ING 2']), null);
});
