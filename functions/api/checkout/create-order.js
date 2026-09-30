import { buildIng1Order } from '../../../server/ing1-order.js';
import { json, normalizeEmail, readJson, uuid, checkoutUrl, publicBaseUrl } from '../../../server/checkout-common.js';
import { verifyDriveEmail } from '../../../server/drive-client.js';
import { rateLimit } from '../../../server/rate-limit.js';
import { insertOrder, getByRequestId, claimMpCreate, saveMpCreate } from '../../../server/order-store.js';
import { createMpOrder } from '../../../server/mercadopago.js';

const offerMap = { OP1: 'opcion1', COMBO: 'combo', VIP: 'vip', opcion1: 'opcion1', combo: 'combo', vip: 'vip' };
function invalid(code, status = 400) { return json({ ok: false, error: code }, status); }
export async function onRequestPost({ request, env }) {
  if (!env.DB) return invalid('ORDER_STORE_NOT_CONFIGURED', 503);
  if (env.MM_ENV !== 'test' || !env.MP_ACCESS_TOKEN || !env.MP_WEBHOOK_SECRET || !publicBaseUrl(env.MM_PUBLIC_BASE_URL)) return invalid('CHECKOUT_NOT_CONFIGURED', 503);
  if (!env.MM_DRIVE_WEBAPP_URL || !env.MM_SHARED_SECRET) return invalid('DRIVE_NOT_CONFIGURED', 503);
  try {
    const limit = await rateLimit(env, request, 'create-order', 5, 900);
    if (!limit.allowed) return json({ ok: false, error: 'RATE_LIMITED' }, 429, { 'Retry-After': String(limit.retryAfter) });
  } catch { return invalid('ORDER_STORE_NOT_CONFIGURED', 503); }
  const parsed = await readJson(request, 2048);
  if (parsed.error) return invalid(parsed.error, parsed.status);
  const body = parsed.value;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['requestId', 'offer', 'additionalItems', 'email', 'price', 'total', 'currency'].includes(key)) || !uuid(body.requestId)) return invalid('INVALID_ORDER');
  const email = normalizeEmail(body.email);
  if (!email) return invalid('INVALID_EMAIL');
  const offer = offerMap[body.offer];
  if (!offer) return invalid('INVALID_OFFER');
  if (!Array.isArray(body.additionalItems)) return invalid('INVALID_ADDITIONAL_ITEMS');
  const additionalItems = body.additionalItems.map(code => typeof code === 'string' ? code.replace(/^ING([2-7])$/, 'ING $1') : code);
  const canonical = buildIng1Order(offer, additionalItems);
  if (!canonical) return invalid('INVALID_ADDITIONAL_ITEMS');
  try {
    const existing = await getByRequestId(env.DB, body.requestId);
    if (existing && (existing.email !== email || existing.offer_code !== offer || existing.additional_items_json !== JSON.stringify(additionalItems))) return invalid('INVALID_ORDER', 409);
    if (existing?.mp_checkout_url) {
      const url = checkoutUrl(existing.mp_checkout_url);
      return url ? json({ ok: true, checkoutUrl: url, ref: existing.id }) : invalid('MERCADOPAGO_UNAVAILABLE', 502);
    }
    try {
      if (!(await verifyDriveEmail(env, email))) return invalid('INVALID_EMAIL');
    } catch (error) { return invalid(error.message === 'DRIVE_NOT_CONFIGURED' ? 'DRIVE_NOT_CONFIGURED' : 'DRIVE_UNAVAILABLE', 502); }
    const id = crypto.randomUUID();
    const order = existing || await insertOrder(env.DB, { id, requestId: body.requestId, externalReference: `mym_${id.replaceAll('-', '')}`, email, offer, additionalItems, items: canonical.items, priceCents: canonical.priceCents, currency: canonical.currency });
    if (order.mp_checkout_url) return json({ ok: true, checkoutUrl: checkoutUrl(order.mp_checkout_url), ref: order.id });
    if (!(await claimMpCreate(env.DB, order))) return invalid('ORDER_IN_PROGRESS', 409);
    const mp = await createMpOrder(env, { ...canonical, id: order.id, requestId: body.requestId, externalReference: order.external_reference, email });
    await saveMpCreate(env.DB, order, mp);
    return json({ ok: true, checkoutUrl: mp.checkout_url, ref: order.id });
  } catch (error) {
    return invalid(error.message === 'CHECKOUT_NOT_CONFIGURED' ? 'CHECKOUT_NOT_CONFIGURED' : 'MERCADOPAGO_UNAVAILABLE', 502);
  }
}
