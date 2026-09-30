const encoder = new TextEncoder();
export async function validWebhookSignature(secret, dataId, requestId, signature) {
  if (!secret || !dataId || !requestId || !signature) return false;
  const entries = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
  if (!/^\d{10,16}$/.test(entries.ts || '') || !/^[0-9a-f]{64}$/i.test(entries.v1 || '')) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${entries.ts};`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(manifest)));
  const actual = Uint8Array.from(entries.v1.match(/.{2}/g), hex => parseInt(hex, 16));
  let difference = 0;
  for (let i = 0; i < bytes.length; i++) difference |= bytes[i] ^ actual[i];
  return difference === 0;
}
