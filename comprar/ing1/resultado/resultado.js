const params = new URLSearchParams(location.search);
const ref = params.get('ref');
const title = document.getElementById('status-title');
const description = document.getElementById('status-description');
const accessList = document.getElementById('access-list');
const error = document.getElementById('query-error');
const refresh = document.getElementById('refresh-status');
const statusIcon = document.querySelector('.status-icon');
let pollCount = 0;
let pollTimer = null;
const states = {
  creating: ['Estamos verificando tu pago', 'Tu pedido se está preparando. Actualiza el estado en unos momentos.'],
  created: ['Estamos verificando tu pago', 'Esperamos la confirmación de Mercado Pago.'],
  processing: ['Pago en proceso', 'Mercado Pago aún está procesando la operación.'],
  paid: ['Pago confirmado', 'Estamos habilitando tu acceso.'],
  failed: ['Pago no completado', 'La operación no se completó. Puedes volver a la tienda para intentarlo otra vez.'],
  canceled: ['Pago no completado', 'La operación fue cancelada. Puedes volver a la tienda si deseas intentarlo otra vez.'],
  refunded: ['Pago reembolsado', 'El pago figura como reembolsado. Si necesitas ayuda, contáctanos.'],
  partially_refunded: ['Pago parcialmente reembolsado', 'Consulta con soporte si necesitas ayuda.']
};
function render(result) {
  const delivered = result.paymentStatus === 'paid' && result.deliveryStatus === 'delivered';
  const [heading, copy] = delivered ? ['Compra lista', Array.isArray(result.items) && result.items.length ? 'Tu pago fue confirmado. Tus ING ya están disponibles en tu Google Drive. Ábrelos con la misma cuenta de Google usada en la compra.' : 'Tu pago fue confirmado y tu compra ya fue entregada en Google Drive.'] : (states[result.paymentStatus] || states.created);
  title.textContent = heading;
  description.textContent = copy;
  statusIcon.textContent = delivered ? '✓' : '◌';
  refresh.hidden = delivered;
  accessList.replaceChildren();
  if (delivered && Array.isArray(result.items)) for (const item of result.items) {
    if (!/^ING[1-7]$/.test(item?.code)) continue;
    let url;
    try { url = new URL(item.url); } catch { continue; }
    if (url.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(url.hostname)) continue;
    const link = document.createElement('a');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `${item.code.replace('ING', 'ING ')} — ABRIR EN GOOGLE DRIVE ↗`;
    accessList.append(link);
  }
  accessList.hidden = accessList.childElementCount === 0;
  if (!delivered && !['failed', 'canceled', 'refunded', 'partially_refunded'].includes(result.paymentStatus) && pollCount < 24) {
    clearTimeout(pollTimer);
    pollCount += 1;
    pollTimer = setTimeout(load, 5000);
  } else if (!delivered && pollCount >= 24 && !['failed', 'canceled', 'refunded', 'partially_refunded'].includes(result.paymentStatus)) {
    description.textContent = `${copy} La actualización automática terminó; pulsa «Actualizar estado» para consultarlo de nuevo.`;
  }
}
async function load() {
  clearTimeout(pollTimer);
  if (!ref || !/^[0-9a-f-]{36}$/i.test(ref)) { title.textContent = 'Enlace de compra no válido'; description.textContent = 'Revisa el enlace que recibiste al terminar el pago.'; refresh.hidden = true; return; }
  refresh.disabled = true; error.hidden = true;
  try {
    const response = await fetch(`/api/checkout/status?ref=${encodeURIComponent(ref)}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) throw new Error('Status unavailable');
    render(result);
  } catch { error.hidden = false; }
  finally { refresh.disabled = false; }
}
refresh.addEventListener('click', load);
load();
