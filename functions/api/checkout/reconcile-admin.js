import { json } from '../../../server/checkout-common.js';
import { reconcileMercadoPagoOrder } from '../../../server/reconcile-order.js';

async function authorized(request, secret) {
  if (typeof secret !== 'string' || secret.length < 32) return false;
  const supplied = request.headers.get('authorization');
  if (!supplied?.startsWith('Bearer ')) return false;
  const encoder = new TextEncoder();
  const [actual, expected] = await Promise.all([supplied.slice(7), secret].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
  const a = new Uint8Array(actual);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !['test', 'production'].includes(env.MM_ENV)) return json({ ok: false, error: 'CHECKOUT_NOT_CONFIGURED' }, 503);
  if (!(await authorized(request, env.MM_ADMIN_SECRET))) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
  try {
    const { results } = await env.DB.prepare(`SELECT mp_order_id FROM orders WHERE mp_order_id IS NOT NULL
      ORDER BY COALESCE(last_reconcile_attempt_at,0), created_at LIMIT 5`).all();
    const summary = { checked: 0, busy: 0, errors: 0 };
    for (const row of results) {
      try {
        const result = await reconcileMercadoPagoOrder(env, row.mp_order_id, { intervalSeconds: 30 });
        if (result.state === 'already_reconciling_or_backoff') summary.busy++;
        else summary.checked++;
      } catch { summary.errors++; }
    }
    return json({ ok: true, ...summary });
  } catch { return json({ ok: false, error: 'ORDER_STORE_NOT_CONFIGURED' }, 503); }
}
