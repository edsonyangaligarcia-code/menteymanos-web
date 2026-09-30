const encoder = new TextEncoder();
export async function rateLimit(env, request, scope, limit, windowSeconds) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local-development';
  const salt = env.MM_SHARED_SECRET || env.MP_WEBHOOK_SECRET;
  if (!salt) throw new Error('RATE_LIMIT_NOT_CONFIGURED');
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(`${salt}:${ip}`));
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  const key = `${scope}:${hash}`;
  const now = Math.floor(Date.now() / 1000);
  const until = (Math.floor(now / windowSeconds) + 1) * windowSeconds;
  if (!env.DB) {
    // The email-only local preview remains usable without D1. Checkout itself requires D1.
    if (scope !== 'verify-email') throw new Error('ORDER_STORE_NOT_CONFIGURED');
    const memory = globalThis.__mmVerifyRate || (globalThis.__mmVerifyRate = new Map());
    const old = memory.get(key);
    const count = old?.until === until ? old.count + 1 : 1;
    memory.set(key, { count, until });
    return { allowed: count <= limit, retryAfter: until - now };
  }
  const row = await env.DB.prepare(`INSERT INTO rate_limits (key, window_until, attempts) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET attempts = CASE WHEN window_until = excluded.window_until THEN attempts + 1 ELSE 1 END,
    window_until = excluded.window_until RETURNING attempts`).bind(key, until).first();
  return { allowed: row.attempts <= limit, retryAfter: until - now };
}
