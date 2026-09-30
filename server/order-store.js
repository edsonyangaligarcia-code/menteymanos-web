const now = () => new Date().toISOString();
export const RECONCILE_LEASE_SECONDS = 90;
export const DELIVERY_EMAIL_LEASE_SECONDS = 180;
export const getByRequestId = (db, id) => db.prepare('SELECT * FROM orders WHERE request_id = ?').bind(id).first();
export const getById = (db, id) => db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
export const getByMpId = (db, id) => db.prepare('SELECT * FROM orders WHERE mp_order_id = ?').bind(id).first();
export async function insertOrder(db, order) {
  await db.prepare(`INSERT OR IGNORE INTO orders (id,request_id,external_reference,email,offer_code,additional_items_json,items_json,amount_cents,currency,payment_status,delivery_status,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,'creating','not_ready',?,?)`).bind(order.id, order.requestId, order.externalReference, order.email, order.offer, JSON.stringify(order.additionalItems), JSON.stringify(order.items), order.priceCents, order.currency, now(), now()).run();
  return getByRequestId(db, order.requestId);
}
export async function claimMpCreate(db, order) {
  const lease = Math.floor(Date.now() / 1000) - 30;
  const result = await db.prepare('UPDATE orders SET mp_create_claimed_at = ?, updated_at = ? WHERE id = ? AND mp_checkout_url IS NULL AND (mp_create_claimed_at IS NULL OR mp_create_claimed_at < ?)').bind(Math.floor(Date.now() / 1000), now(), order.id, lease).run();
  return result.meta.changes === 1;
}
export async function saveMpCreate(db, order, mp) {
  await db.prepare(`UPDATE orders SET mp_order_id=?,mp_checkout_url=?,mp_status=?,mp_status_detail=?,payment_status='created',mp_create_claimed_at=NULL,updated_at=? WHERE id=?`)
    .bind(mp.id, mp.checkout_url, mp.status || null, mp.status_detail || null, now(), order.id).run();
}
export async function recordWebhook(db, id, resourceId, action) {
  await db.prepare("INSERT OR IGNORE INTO webhook_events (notification_id,resource_id,action,received_at,processing_status) VALUES (?,?,?,?,'received')")
    .bind(id, resourceId, action || null, now()).run();
}
export const getWebhook = (db, id) => db.prepare('SELECT * FROM webhook_events WHERE notification_id = ?').bind(id).first();
export async function finishWebhook(db, id, state) {
  await db.prepare('UPDATE webhook_events SET processed_at=?,processing_status=? WHERE notification_id=?').bind(now(), state, id).run();
}
export async function updatePayment(db, order, mp, state, reconcileToken) {
  const result = await db.prepare(`UPDATE orders SET
    mp_status=CASE WHEN (payment_status='refunded' AND ? != 'refunded') OR (payment_status='partially_refunded' AND ? NOT IN ('partially_refunded','refunded')) THEN mp_status ELSE ? END,
    mp_status_detail=CASE WHEN (payment_status='refunded' AND ? != 'refunded') OR (payment_status='partially_refunded' AND ? NOT IN ('partially_refunded','refunded')) THEN mp_status_detail ELSE ? END,
    payment_status=CASE WHEN (payment_status='refunded' AND ? != 'refunded') OR (payment_status='partially_refunded' AND ? NOT IN ('partially_refunded','refunded')) THEN payment_status ELSE ? END,
    delivery_status=CASE WHEN ?='paid' AND payment_status NOT IN ('refunded','partially_refunded') AND delivery_status='not_ready' THEN 'pending' ELSE delivery_status END,
    paid_at=CASE WHEN ?='paid' AND payment_status NOT IN ('refunded','partially_refunded') THEN COALESCE(paid_at,?) ELSE paid_at END,updated_at=? WHERE id=? AND reconcile_claim_token=?`)
    .bind(state, state, mp.status || null, state, state, mp.status_detail || null, state, state, state, state, state, now(), now(), order.id, reconcileToken).run();
  if (result.meta.changes !== 1) return null;
  return getById(db, order.id);
}
export async function claimReconciliation(db, order, intervalSeconds = 30, force = false) {
  const timestamp = Math.floor(Date.now() / 1000);
  const token = crypto.randomUUID();
  const result = await db.prepare(`UPDATE orders SET reconcile_claim_token=?,reconcile_claimed_at=?,last_reconcile_attempt_at=?
    WHERE id=? AND (reconcile_claim_token IS NULL OR reconcile_claimed_at < ?)
    AND (?=1 OR last_reconcile_attempt_at IS NULL OR last_reconcile_attempt_at <= ?)`)
    .bind(token, timestamp, timestamp, order.id, timestamp - RECONCILE_LEASE_SECONDS, force ? 1 : 0, timestamp - intervalSeconds).run();
  return result.meta.changes === 1 ? token : null;
}
export async function releaseReconciliation(db, order, token) {
  await db.prepare('UPDATE orders SET reconcile_claim_token=NULL,reconcile_claimed_at=NULL WHERE id=? AND reconcile_claim_token=?').bind(order.id, token).run();
}
export async function claimDelivery(db, order, reconcileToken) {
  const timestamp = Math.floor(Date.now() / 1000);
  const lease = timestamp - 30;
  const token = crypto.randomUUID();
  const result = await db.prepare(`UPDATE orders SET delivery_status='delivering',delivery_attempts=delivery_attempts+1,delivery_claim_token=?,delivery_claimed_at=?,reconcile_claimed_at=?,updated_at=? WHERE id=? AND reconcile_claim_token=? AND payment_status='paid' AND (delivery_status IN ('pending','failed') OR (delivery_status='delivering' AND delivery_claimed_at < ?))`)
    .bind(token, timestamp, timestamp, now(), order.id, reconcileToken, lease).run();
  return result.meta.changes === 1 ? token : null;
}
export async function finishDelivery(db, order, token, reconcileToken, links) {
  const result = await db.prepare("UPDATE orders SET delivery_status='delivered',delivery_email_status='pending',delivery_response_json=?,delivery_error_code=NULL,delivery_claim_token=NULL,delivery_claimed_at=NULL,delivered_at=?,updated_at=? WHERE id=? AND reconcile_claim_token=? AND delivery_status='delivering' AND delivery_claim_token=?")
    .bind(JSON.stringify(links), now(), now(), order.id, reconcileToken, token).run();
  return result.meta.changes === 1;
}
export async function failDelivery(db, order, token, reconcileToken) {
  const result = await db.prepare("UPDATE orders SET delivery_status='failed',delivery_error_code='DRIVE_UNAVAILABLE',delivery_claim_token=NULL,delivery_claimed_at=NULL,updated_at=? WHERE id=? AND reconcile_claim_token=? AND delivery_status='delivering' AND delivery_claim_token=?")
    .bind(now(), order.id, reconcileToken, token).run();
  return result.meta.changes === 1;
}
export async function claimDeliveryEmail(db, order) {
  const timestamp = Math.floor(Date.now() / 1000);
  const token = crypto.randomUUID();
  const result = await db.prepare(`UPDATE orders SET delivery_email_status='sending',delivery_email_claim_token=?,delivery_email_claimed_at=?,updated_at=?
    WHERE id=? AND payment_status='paid' AND delivery_status='delivered' AND delivery_email_sent_at IS NULL
    AND (delivery_email_status IN ('pending','failed') OR (delivery_email_status='sending' AND delivery_email_claimed_at < ?))`)
    .bind(token, timestamp, now(), order.id, timestamp - DELIVERY_EMAIL_LEASE_SECONDS).run();
  return result.meta.changes === 1 ? token : null;
}
export async function finishDeliveryEmail(db, order, token) {
  const result = await db.prepare(`UPDATE orders SET delivery_email_status='sent',delivery_email_claim_token=NULL,delivery_email_claimed_at=NULL,delivery_email_sent_at=?,updated_at=?
    WHERE id=? AND payment_status='paid' AND delivery_status='delivered' AND delivery_email_status='sending' AND delivery_email_claim_token=? AND delivery_email_sent_at IS NULL`)
    .bind(now(), now(), order.id, token).run();
  return result.meta.changes === 1;
}
export async function failDeliveryEmail(db, order, token) {
  const result = await db.prepare(`UPDATE orders SET delivery_email_status='failed',delivery_email_claim_token=NULL,delivery_email_claimed_at=NULL,updated_at=?
    WHERE id=? AND delivery_email_status='sending' AND delivery_email_claim_token=? AND delivery_email_sent_at IS NULL`)
    .bind(now(), order.id, token).run();
  return result.meta.changes === 1;
}
