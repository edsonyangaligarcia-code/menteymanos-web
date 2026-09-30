import { normalizeEmail } from './checkout-common.js';

const TIMEOUT_MS = 18000;
function driveUrl(env) {
  if (!env.MM_DRIVE_WEBAPP_URL || !env.MM_SHARED_SECRET) return null;
  try { const url = new URL(env.MM_DRIVE_WEBAPP_URL); return url.protocol === 'https:' ? url : null; } catch { return null; }
}
async function postDrive(env, body) {
  const url = driveUrl(env);
  if (!url) throw new Error('DRIVE_NOT_CONFIGURED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: env.MM_SHARED_SECRET, ...body }), signal: controller.signal });
    if (!response.ok) throw new Error('DRIVE_UNAVAILABLE');
    return await response.json();
  } catch (error) { throw new Error(error.message === 'DRIVE_NOT_CONFIGURED' ? error.message : 'DRIVE_UNAVAILABLE'); }
  finally { clearTimeout(timer); }
}
export async function verifyDriveEmail(env, email) {
  if (!normalizeEmail(email)) throw new Error('INVALID_EMAIL');
  const result = await postDrive(env, { action: 'verify_email', email });
  if (result?.ok !== true || typeof result.compatible !== 'boolean') throw new Error('DRIVE_UNAVAILABLE');
  return result.compatible;
}
export async function deliverDriveItems(env, order, codes) {
  const result = await postDrive(env, { action: 'deliver', email: order.email, items: codes, orderId: order.id });
  if (result?.ok !== true) throw new Error('DRIVE_UNAVAILABLE');
  // Apps Script may return links or only an acknowledgement. Store only vetted Drive links.
  const raw = Array.isArray(result.items) ? result.items : Array.isArray(result.links) ? result.links : [];
  const links = raw.map(item => {
    const code = item?.code || item?.ing;
    const value = item?.url;
    if (!codes.includes(code) || typeof value !== 'string') return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(url.hostname) ? { code, url: url.href } : null;
    } catch { return null; }
  }).filter(Boolean);
  return links;
}
