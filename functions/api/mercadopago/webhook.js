import { json, readJson } from '../../../server/checkout-common.js';
import { validWebhookSignature } from '../../../server/mp-webhook.js';
import { getWebhook, recordWebhook, finishWebhook } from '../../../server/order-store.js';
import { reconcileMercadoPagoOrder } from '../../../server/reconcile-order.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB || env.MM_ENV !== 'test' || !env.MP_WEBHOOK_SECRET) return json({ ok: false, error: 'CHECKOUT_NOT_CONFIGURED' }, 503);
  const url = new URL(request.url);
  const dataId = url.searchParams.get('data.id');
  const requestId = request.headers.get('x-request-id');
  const signature = request.headers.get('x-signature');
  if (!(await validWebhookSignature(env.MP_WEBHOOK_SECRET, dataId, requestId, signature))) return json({ ok: false, error: 'INVALID_SIGNATURE' }, 401);
  const parsed = await readJson(request, 4096);
  if (parsed.error) return json({ ok: false, error: 'INVALID_ORDER' }, 400);
  const body = parsed.value;
  if (url.searchParams.get('type') !== 'order' || body?.type !== 'order' || typeof dataId !== 'string' || !/^[\w-]{1,128}$/.test(dataId) || body?.data?.id !== dataId) return json({ ok: false, error: 'INVALID_ORDER' }, 400);
  const notificationId = String(body?.id || requestId);
  if (!/^[\w-]{1,128}$/.test(notificationId)) return json({ ok: false, error: 'INVALID_ORDER' }, 400);
  try {
    const prior = await getWebhook(env.DB, notificationId);
    if (prior?.processing_status === 'completed' && prior.resource_id === dataId) return json({ ok: true });
    await recordWebhook(env.DB, notificationId, dataId, body.action);
    const result = await reconcileMercadoPagoOrder(env, dataId, { force: true });
    if (['unknown', 'delivery_failed', 'already_reconciling_or_backoff', 'claim_lost', 'mismatch', 'invalid_local_order'].includes(result.state)) {
      await finishWebhook(env.DB, notificationId, 'retryable_error');
    } else {
      await finishWebhook(env.DB, notificationId, 'completed');
    }
    if (result.state === 'unknown') return json({ ok: false, error: 'ORDER_IN_PROGRESS' }, 503);
    if (result.state === 'delivery_failed') return json({ ok: false, error: 'DRIVE_UNAVAILABLE' }, 503);
    if (result.state === 'already_reconciling_or_backoff' || result.state === 'claim_lost') return json({ ok: false, error: 'ORDER_IN_PROGRESS' }, 503);
    if (result.state === 'mismatch' || result.state === 'invalid_local_order') return json({ ok: false, error: 'INVALID_ORDER' }, 409);
    return json({ ok: true });
  } catch {
    await finishWebhook(env.DB, notificationId, 'retryable_error').catch(() => {});
    return json({ ok: false, error: 'MERCADOPAGO_UNAVAILABLE' }, 503);
  }
}
