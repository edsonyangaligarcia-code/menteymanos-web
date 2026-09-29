const MAX_BODY_BYTES = 1024;
const MAX_EMAIL_LENGTH = 254;
const UPSTREAM_TIMEOUT_MS = 12000;
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

async function readLimitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return { error: 'INVALID_JSON' };
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return { error: 'PAYLOAD_TOO_LARGE' };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch {
    return { error: 'INVALID_JSON' };
  }
}

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@<>(),;:"\[\]]+@[a-z0-9.-]+\.[a-z]{2,63}$/i.test(email)) return null;
  const [local, domain] = email.split('@');
  if (local.length > 64 || local.includes('..') || domain.includes('..') || domain.startsWith('-') || domain.includes('.-') || domain.includes('-.')) return null;
  return email;
}

export async function onRequestPost({ request, env }) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return json({ ok: false, error: 'UNSUPPORTED_MEDIA_TYPE' }, 415);
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return json({ ok: false, error: 'PAYLOAD_TOO_LARGE' }, 413);
  const body = await readLimitedBody(request);
  if (body.error) return json({ ok: false, error: body.error }, body.error === 'PAYLOAD_TOO_LARGE' ? 413 : 400);
  const email = normalizeEmail(body.value?.email);
  if (!email) return json({ ok: false, error: 'INVALID_EMAIL' }, 400);
  if (!env.MM_DRIVE_WEBAPP_URL || !env.MM_SHARED_SECRET) return json({ ok: false, error: 'DRIVE_NOT_CONFIGURED' }, 503);

  let url;
  try {
    url = new URL(env.MM_DRIVE_WEBAPP_URL);
    if (url.protocol !== 'https:') throw new Error('Invalid protocol');
  } catch {
    return json({ ok: false, error: 'DRIVE_NOT_CONFIGURED' }, 503);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.MM_SHARED_SECRET, action: 'verify_email', email }),
      signal: controller.signal
    });
    if (!upstream.ok) return json({ ok: false, error: 'DRIVE_UNAVAILABLE' }, 502);
    const result = await upstream.json();
    if (result?.ok !== true || typeof result.compatible !== 'boolean') return json({ ok: false, error: 'DRIVE_UNAVAILABLE' }, 502);
    return result.compatible
      ? json({ ok: true, compatible: true, email })
      : json({ ok: true, compatible: false, reason: 'DRIVE_REJECTED_EMAIL' });
  } catch (error) {
    return json({ ok: false, error: 'DRIVE_UNAVAILABLE' }, controller.signal.aborted || error?.name === 'AbortError' ? 504 : 502);
  } finally {
    clearTimeout(timer);
  }
}
