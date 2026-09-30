import { getMpOrder, paymentState, validateMpOrder } from './mercadopago.js';
import { getByMpId, updatePayment, claimReconciliation, releaseReconciliation, claimDelivery, finishDelivery, failDelivery } from './order-store.js';
import { deliverDriveItems } from './drive-client.js';
import { buildIng1Order } from './ing1-order.js';
import { normalizeEmail } from './checkout-common.js';

export async function reconcileMercadoPagoOrder(env, mpId, { force = false, intervalSeconds = 30 } = {}) {
  const local = await getByMpId(env.DB, mpId);
  if (!local) return { state: 'unknown' };
  const reconcileToken = await claimReconciliation(env.DB, local, intervalSeconds, force);
  if (!reconcileToken) return { state: 'already_reconciling_or_backoff' };
  try {
    const mp = await getMpOrder(env, mpId);
    if (!validateMpOrder(mp, local)) return { state: 'mismatch' };
    const state = paymentState(mp);
    const current = await updatePayment(env.DB, local, mp, state, reconcileToken);
    if (!current) return { state: 'claim_lost' };
    if (current.payment_status !== 'paid') return { state: current.payment_status };
    if (current.delivery_status === 'delivered') return { state: 'delivered' };
    const email = normalizeEmail(local.email);
    let additions;
    try { additions = JSON.parse(local.additional_items_json); } catch { return { state: 'invalid_local_order' }; }
    const canonical = buildIng1Order(local.offer_code, additions);
    if (!email || !canonical || canonical.priceCents !== local.amount_cents || JSON.stringify(canonical.items) !== local.items_json) return { state: 'invalid_local_order' };
    const deliveryToken = await claimDelivery(env.DB, local, reconcileToken);
    if (!deliveryToken) return { state: (await getByMpId(env.DB, mpId))?.reconcile_claim_token === reconcileToken ? 'already_delivering_or_delivered' : 'claim_lost' };
    const codes = canonical.items.map(code => code.replace(' ', ''));
    try {
      const links = await deliverDriveItems(env, local, codes);
      return { state: await finishDelivery(env.DB, local, deliveryToken, reconcileToken, links) ? 'delivered' : 'claim_lost' };
    } catch {
      return { state: await failDelivery(env.DB, local, deliveryToken, reconcileToken) ? 'delivery_failed' : 'claim_lost' };
    }
  } finally {
    await releaseReconciliation(env.DB, local, reconcileToken);
  }
}
