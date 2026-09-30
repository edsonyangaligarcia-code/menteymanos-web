export const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });
export const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const normalizeEmail = value => {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@<>(),;:"\[\]]+@[a-z0-9.-]+\.[a-z]{2,63}$/i.test(email)) return null;
  const [local, domain] = email.split('@');
  return local.length <= 64 && !local.includes('..') && !domain.includes('..') && !domain.startsWith('-') && !domain.includes('.-') && !domain.includes('-.') ? email : null;
};
export async function readJson(request, maxBytes = 4096) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type') || '')) return { error: 'INVALID_ORDER', status: 415 };
  const length = Number(request.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) return { error: 'INVALID_ORDER', status: 413 };
  const reader = request.body?.getReader();
  if (!reader) return { error: 'INVALID_ORDER', status: 400 };
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); return { error: 'INVALID_ORDER', status: 413 }; }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return { value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) };
  } catch { return { error: 'INVALID_ORDER', status: 400 }; }
}
export const centsToDecimalString = cents => {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid cents');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
};
export const decimalStringToCents = value => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const scaled = value * 100;
    const cents = Math.round(scaled);
    return Number.isSafeInteger(cents) && Math.abs(scaled - cents) < 1e-7 ? cents : null;
  }
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
};
export function publicBaseUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
    return url.origin;
  } catch { return null; }
}
export function checkoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && /(^|\.)mercadopago\.com(?:\.[a-z]{2})?$/.test(url.hostname) && url.pathname.startsWith('/checkout/') ? url.href : null;
  } catch { return null; }
}
