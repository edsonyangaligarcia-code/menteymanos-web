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
const checkoutSteps = [...dialog.querySelectorAll('[data-checkout-step]')];
const emailInput = document.getElementById('checkout-email');
const emailStatus = document.getElementById('email-status');
const verifyButton = document.getElementById('verify-email-button');
const emailTryAgain = document.getElementById('email-try-again');
const paymentButton = document.getElementById('continue-payment');
const paymentStatus = document.getElementById('payment-status');
let planKey = null;
let selectedExtras = [];
let verifiedEmail = null;
let activeVerification = null;
let verificationVersion = 0;
let reviewTransitionTimer = null;
let paymentIntent = null;
let paymentPending = false;
let paymentController = null;
function invalidatePaymentIntent() { paymentIntent = null; paymentController?.abort(); }

function formatPrice(number) { return `S/ ${number.toFixed(2)}`; }
function getOrder() {
  const plan = offers[planKey];
  return { offer: planKey, label: plan.label, price: plan.price, items: ['ING 1', ...(planKey === 'vip' ? products.map(([code]) => code) : selectedExtras)], verifiedEmail };
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
      invalidatePaymentIntent();
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
  invalidatePaymentIntent();
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
  resetVerification();
  emailInput.value = '';
  document.getElementById('payment-status').hidden = true;
  const order = getOrder();
  dialog.querySelectorAll('[data-checkout-offer]').forEach(element => { element.textContent = order.label; });
  dialog.querySelectorAll('[data-checkout-items]').forEach(element => { element.textContent = order.items.join(' · '); });
  dialog.querySelectorAll('[data-checkout-price]').forEach(element => { element.textContent = formatPrice(order.price); });
  dialog.showModal();
  document.body.classList.add('checkout-open');
  showCheckoutStep('intro');
}
function showCheckoutStep(name) {
  for (const step of checkoutSteps) step.hidden = step.dataset.checkoutStep !== name;
  dialog.scrollTop = 0;
  const heading = dialog.querySelector(`[data-checkout-step="${name}"] h2`);
  heading.tabIndex = -1;
  heading.focus();
}
function setEmailStatus(kind, title, description, address = '') {
  emailStatus.replaceChildren();
  emailStatus.className = `checkout-status ${kind}`;
  if (kind === 'loading') {
    const spinner = document.createElement('span'); spinner.className = 'checkout-spinner'; spinner.setAttribute('aria-hidden', 'true'); emailStatus.append(spinner);
  }
  const content = document.createElement('div');
  const strong = document.createElement('strong'); strong.textContent = title;
  const text = document.createElement('p'); text.textContent = description;
  content.append(strong, text);
  if (address) { const shownEmail = document.createElement('span'); shownEmail.className = 'verified-address'; shownEmail.textContent = address; content.append(shownEmail); }
  emailStatus.append(content);
  emailStatus.hidden = false;
}
function resetVerification() {
  verificationVersion += 1;
  clearTimeout(reviewTransitionTimer);
  reviewTransitionTimer = null;
  if (activeVerification) { activeVerification.controller.abort(); clearTimeout(activeVerification.timer); activeVerification = null; }
  verifiedEmail = null;
  emailStatus.hidden = true;
  emailStatus.replaceChildren();
  emailInput.removeAttribute('aria-invalid');
  verifyButton.hidden = false;
  verifyButton.disabled = false;
  emailTryAgain.hidden = true;
}
async function verifyEmail(event) {
  event.preventDefault();
  if (activeVerification) return;
  const email = emailInput.value.trim().toLowerCase();
  emailInput.value = email;
  if (!emailInput.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    resetVerification();
    emailInput.setAttribute('aria-invalid', 'true');
    setEmailStatus('error', 'Correo no válido', 'Revisa el formato e inténtalo nuevamente.');
    return;
  }
  resetVerification();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16000);
  activeVerification = { controller, timer };
  const version = verificationVersion;
  verifyButton.disabled = true;
  setEmailStatus('loading', 'Comprobando correo con Google Drive…', 'Esto puede tardar unos segundos.');
  try {
    const response = await fetch('/api/drive/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => null);
    if (version !== verificationVersion || !dialog.open) return;
    if (response.ok && result?.ok === true && result.compatible === true && result.email === email) {
      verifiedEmail = email;
      setEmailStatus('success', '✓ CORREO APTO', 'Correo apto para recibir tu compra. Este correo puede recibir tu acceso en Google Drive.', email);
      verifyButton.hidden = true;
      document.getElementById('review-email').textContent = email;
      reviewTransitionTimer = setTimeout(() => {
        if (version === verificationVersion && dialog.open && verifiedEmail === email && emailInput.value.trim().toLowerCase() === email) showCheckoutStep('review');
        reviewTransitionTimer = null;
      }, 400);
    } else if (response.ok && result?.ok === true && result.compatible === false) {
      setEmailStatus('rejected', '⚠ NO PODEMOS ENTREGAR A ESTE CORREO', 'Usa el correo con el que normalmente accedes a Google Drive.');
      verifyButton.hidden = true;
      emailTryAgain.hidden = false;
    } else if (response.status === 400 && result?.error === 'INVALID_EMAIL') {
      emailInput.setAttribute('aria-invalid', 'true');
      setEmailStatus('error', 'Correo no válido', 'Revisa el formato e inténtalo nuevamente.');
    } else {
      setEmailStatus('error', 'Verificación no disponible', 'No pudimos comprobar el correo ahora. Inténtalo de nuevo en unos momentos.');
    }
  } catch {
    if (version === verificationVersion && dialog.open) setEmailStatus('error', 'Verificación no disponible', 'No pudimos comprobar el correo ahora. Inténtalo de nuevo en unos momentos.');
  } finally {
    clearTimeout(timer);
    if (activeVerification?.controller === controller) { activeVerification = null; verifyButton.disabled = false; }
  }
}
buyButton.addEventListener('click', openCheckout);
stickyBuy.addEventListener('click', openCheckout);
document.getElementById('checkout-to-email').addEventListener('click', () => { showCheckoutStep('email'); emailInput.focus(); });
document.getElementById('verify-email-form').addEventListener('submit', verifyEmail);
emailInput.addEventListener('input', () => { invalidatePaymentIntent(); if (verifiedEmail || !emailStatus.hidden || activeVerification) resetVerification(); });
emailTryAgain.addEventListener('click', () => { emailInput.value = ''; resetVerification(); emailInput.focus(); });
document.getElementById('edit-email').addEventListener('click', () => { resetVerification(); showCheckoutStep('email'); emailInput.focus(); });
paymentButton.addEventListener('click', async () => {
  if (paymentPending || !verifiedEmail || emailInput.value.trim().toLowerCase() !== verifiedEmail) return;
  const fingerprint = JSON.stringify([planKey, selectedExtras, verifiedEmail]);
  if (!paymentIntent || paymentIntent.fingerprint !== fingerprint) paymentIntent = { fingerprint, requestId: crypto.randomUUID() };
  const currentIntent = paymentIntent;
  const controller = new AbortController();
  paymentController = controller;
  paymentPending = true;
  paymentButton.disabled = true;
  paymentStatus.hidden = false;
  paymentStatus.textContent = 'Preparando pago seguro…';
  try {
    const response = await fetch('/api/checkout/create-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: currentIntent.requestId, offer: planKey, additionalItems: selectedExtras, email: verifiedEmail }),
      signal: controller.signal
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true || typeof result.checkoutUrl !== 'string') {
      paymentStatus.textContent = result?.error === 'RATE_LIMITED'
        ? 'Demasiados intentos. Espera unos minutos antes de reintentar.'
        : 'No pudimos preparar el pago. Inténtalo de nuevo.';
      return;
    }
    const url = new URL(result.checkoutUrl);
    if (url.protocol !== 'https:' || !/(^|\.)mercadopago\.com(?:\.[a-z]{2})?$/.test(url.hostname)) throw new Error('Invalid checkout URL');
    if (!dialog.open || currentIntent !== paymentIntent || controller.signal.aborted) { paymentStatus.textContent = 'La selección cambió. Revisa la compra antes de continuar.'; return; }
    window.location.assign(url.href);
  } catch { paymentStatus.textContent = 'No pudimos conectar con el pago seguro. Inténtalo de nuevo.'; }
  finally { if (paymentController === controller) paymentController = null; paymentPending = false; paymentButton.disabled = false; }
});
document.getElementById('close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => { invalidatePaymentIntent(); resetVerification(); emailInput.value = ''; document.body.classList.remove('checkout-open'); });
mountCatalog();
mountViewer();
