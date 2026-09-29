import { mountCatalog } from './catalogo.js';
import { mountViewer } from './visor.js';

const offers = {
  opcion1: { label: 'Opción 1', price: 9.90, extras: 1 },
  combo: { label: 'Combo Pro', price: 15.90, extras: 2 },
  vip: { label: 'VIP Full', price: 29.90, extras: 0 }
};
const products = [
  ['ING 2', 'Expedientes, Licencias y Costos'],
  ['ING 3', 'BIM y Revit'],
  ['ING 4', 'Coordinación BIM Avanzada'],
  ['ING 5', 'Gestión y Supervisión de Obras'],
  ['ING 6', 'Bloques Dinámicos para AutoCAD'],
  ['ING 7', 'Cálculo Estructural PRO']
];
const orderCard = document.getElementById('order-card');
const extrasBox = document.getElementById('extras');
const summary = document.getElementById('order-summary');
const buyButton = document.getElementById('buy-button');
const sticky = document.getElementById('mobile-sticky');
const stickyBuy = document.getElementById('sticky-buy');
const dialog = document.getElementById('checkout-dialog');
let planKey = null;
let selectedExtras = [];

function formatPrice(number) { return `S/ ${number.toFixed(2)}`; }
function getOrder() {
  const plan = offers[planKey];
  return { producto: 'ING 1', oferta: plan.label, adicionales: planKey === 'vip' ? products.map(([code]) => code) : selectedExtras, moneda: 'PEN', total: plan.price, estado: 'pago_proximamente' };
}
function renderOrder() {
  const plan = offers[planKey];
  const needed = plan.extras;
  document.getElementById('order-title').textContent = plan.label;
  document.getElementById('order-instruction').textContent = planKey === 'vip' ? 'Incluye ING 1 a ING 7; no necesitas elegir adicionales.' : `Elige ${needed} línea${needed > 1 ? 's' : ''} adicional${needed > 1 ? 'es' : ''}.`;
  extrasBox.replaceChildren();
  extrasBox.hidden = planKey === 'vip';
  document.getElementById('vip-included').hidden = planKey !== 'vip';
  buyButton.textContent = 'Comprar ahora';
  stickyBuy.textContent = 'COMPRAR AHORA';
  if (planKey !== 'vip') for (const [code, name] of products) {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.value = code; input.checked = selectedExtras.includes(code);
    input.addEventListener('change', () => {
      if (input.checked && selectedExtras.length >= needed) { input.checked = false; return; }
      selectedExtras = input.checked ? [...selectedExtras, code] : selectedExtras.filter(item => item !== code);
      renderSummary();
    });
    label.append(input, document.createTextNode(`${code} — ${name}`)); extrasBox.append(label);
  }
  renderSummary();
}
function renderSummary() {
  const plan = offers[planKey];
  const ready = planKey === 'vip' || selectedExtras.length === plan.extras;
  summary.textContent = `${plan.label} · ${formatPrice(plan.price)}${planKey === 'vip' ? ' · ING 1–7' : ` · ING 1 + ${selectedExtras.length}/${plan.extras} adicionales`}`;
  buyButton.disabled = !ready;
  stickyBuy.disabled = !ready;
  document.getElementById('sticky-plan').textContent = plan.label;
  document.getElementById('sticky-price').textContent = formatPrice(plan.price);
}
document.querySelectorAll('[data-plan]').forEach(button => button.addEventListener('click', () => {
  planKey = button.dataset.plan;
  selectedExtras = [];
  document.querySelectorAll('[data-plan-card]').forEach(card => card.classList.toggle('selected', card.dataset.planCard === planKey));
  orderCard.hidden = false;
  sticky.hidden = false;
  document.body.classList.add('has-mobile-sticky');
  renderOrder();
  orderCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}));
function openCheckout() {
  if (!planKey || buyButton.disabled) return;
  const order = getOrder();
  console.info('Pedido ING1 (sin cobro):', order);
  const box = document.getElementById('checkout-summary');
  box.replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = `${order.oferta} · ${formatPrice(order.total)}`;
  const details = document.createElement('span'); details.textContent = order.oferta === 'VIP Full' ? 'Incluye ING 1 a ING 7' : `ING 1 + ${order.adicionales.join(', ')}`;
  box.append(heading, details);
  dialog.showModal();
}
buyButton.addEventListener('click', openCheckout);
stickyBuy.addEventListener('click', openCheckout);
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
document.getElementById('dialog-ok').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
mountCatalog();
mountViewer();
