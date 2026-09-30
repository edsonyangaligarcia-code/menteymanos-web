import { json, uuid } from '../../../server/checkout-common.js';
import { getById } from '../../../server/order-store.js';
import { reconcileMercadoPagoOrder } from '../../../server/reconcile-order.js';

function reconcileInterval(order) {
  return order.delivery_status === 'delivered' || ['failed', 'canceled', 'refunded', 'partially_refunded'].includes(order.payment_status) ? 300 : 30;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'ORDER_STORE_NOT_CONFIGURED' }, 503);

  const ref = new URL(request.url).searchParams.get('ref');
  if (!uuid(ref)) return json({ ok: false, error: 'INVALID_ORDER' }, 400);

  try {
    let order = await getById(env.DB, ref);
    if (!order) return json({ ok: false, error: 'INVALID_ORDER' }, 404);

    if (order.mp_order_id) {
      try {
        await reconcileMercadoPagoOrder(env, order.mp_order_id, { intervalSeconds: reconcileInterval(order) });
      } catch {
        // El polling de estado no debe fallar por una indisponibilidad temporal
        // de Mercado Pago o Drive. Conservamos el último estado seguro en D1.
      }

      order = await getById(env.DB, ref);
      if (!order) return json({ ok: false, error: 'INVALID_ORDER' }, 404);
    }

    let items = [];

    if (order.payment_status === 'paid' && order.delivery_status === 'delivered') {
      try {
        items = JSON.parse(order.delivery_response_json || '[]');
      } catch {
        items = [];
      }
    }

    return json({
      ok: true,
      paymentStatus: order.payment_status,
      deliveryStatus: order.delivery_status,
      items
    });
  } catch {
    return json({ ok: false, error: 'ORDER_STORE_NOT_CONFIGURED' }, 503);
  }
}
