import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { buildIng1Order } from '../server/ing1-order.js';
import { createMpBody } from '../server/mercadopago.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function browser(pathname = '/', search = '') {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', disabled: false, hidden: false,
      dataset: {}, classList: { add() {}, remove() {}, toggle() {} }, addEventListener() {},
      append() {}, replaceChildren() {}, setAttribute() {}, removeAttribute() {}, focus() {}, scrollIntoView() {}, showModal() {} });
    return elements.get(id);
  };
  const context = createContext({ window: { location: { pathname, search } }, URLSearchParams, AbortController,
    document: { readyState: 'loading', getElementById: get, querySelectorAll: () => [], addEventListener() {},
      createElement: () => get(Math.random()), body: { classList: { add() {}, remove() {} } } },
    setTimeout() {}, clearTimeout() {}, localStorage: { getItem() { return ''; } } });
  runInContext(read('assets/js/precios-ing1.js'), context);
  return { context, get };
}
function expose(context, file, expression) {
  runInContext(read(file).replace(/\}\)\(\);\s*$/, `window.check = ${expression}; })();`), context);
  return context.window.check;
}

test('public cards, summary and WhatsApp use current ING1 prices and retain ING3/ING7 prices', () => {
  for (const [product, prices] of [['ing1', [15.90, 24.90, 39.90]], ['ing3', [12.90, 15.90, 29.90]], ['ing7', [12.90, 15.90, 29.90]]]) {
    const { context, get } = browser(`/${product}/`);
    get('selectorProducto').value = product;
    const cards = expose(context, 'assets/js/cards-ofertas-v95.js', 'precioOferta');
    const summary = expose(context, 'assets/js/resumen-pedido-v59.js', 'datosPlan');
    const whatsapp = expose(context, 'assets/js/whatsapp-v60.js', '{ pedido: datosPedido, mensaje: mensajeWhatsapp, plan: value => { planMemoria = value; } }');
    for (const [index, price] of prices.entries()) {
      const plan = index + 1;
      assert.equal(cards(plan), `S/ ${price.toFixed(2)}`);
      assert.equal(summary(plan, product).precio, price);
      whatsapp.plan(plan);
      const order = whatsapp.pedido();
      assert.equal(order.precio, price);
      assert.ok(whatsapp.mensaje(order).includes(`por S/ ${price.toFixed(2)}.`));
    }
  }
});

test('direct selector, summary, mobile sticky and both checkout totals agree with the server and MP', () => {
  const { context, get } = browser('/comprar/ing1/');
  const totals = [{}, {}];
  get('checkout-dialog').querySelectorAll = selector => selector === '[data-checkout-price]' ? totals : [];
  get('checkout-dialog').querySelector = () => get('heading');
  context.fichasIng = Object.fromEntries([2, 3, 4, 5, 6, 7].map(code => [`ING ${code}`, { incluye: [] }]));
  runInContext(read('comprar/ing1/tienda.js').replace(/^import .*;\r?\n/gm, '').replace(/mountCatalog\(\);\s*mountViewer\(\);\s*$/, ''), context);
  const html = read('comprar/ing1/index.html');
  for (const [key, extras, price] of [['opcion1', ['ING 2'], '15.90'], ['combo', ['ING 2', 'ING 3'], '24.90'], ['vip', [], '39.90']]) {
    runInContext(`planKey = '${key}'; selectedExtras = ${JSON.stringify(extras)}; renderOrder(); openCheckout();`, context);
    assert.ok(get('order-summary').textContent.includes(`S/ ${price}`));
    assert.equal(get('sticky-price').textContent, `S/ ${price}`);
    for (const total of totals) assert.equal(total.textContent, `S/ ${price}`);
    assert.match(html, new RegExp(`data-plan-card="${key}"[^\\n]+<strong class="price">S/ ${price.replace('.', '\\.')}</strong>`));
    const canonical = buildIng1Order(key, extras);
    const mp = createMpBody({ ...canonical, id: 'test', externalReference: 'test', email: 'buyer@gmail.com' }, 'https://shop.test');
    assert.equal(mp.total_amount, price);
  }
  for (const price of ['74.90', '99.90', '179.90']) assert.ok(html.includes(`<del>S/ ${price}</del>`));
  assert.ok(html.includes('S/ 39.90 total · ≈ S/ 5.70 por ING'));
});

test('manual panel uses new prices even with historical product configuration, without rewriting sales', () => {
  const { context, get } = browser('/panel/');
  runInContext(read('panel/assets/panel.js').replace(/init\(\)\.catch\([^\n]+\);/, ''), context);
  const seed = read('panel/data/historico.json');
  runInContext(`state = ${seed};`, context);
  for (const [product, prices] of [['ING 1', [15.90, 24.90, 39.90]], ['ING 3', [12.90, 15.90, 29.90]], ['ING 7', [12.90, 15.90, 29.90]]]) {
    get('saleProduct').value = product;
    for (const [index, offer] of ['OP1', 'COMBO', 'VIP'].entries()) {
      get('saleOffer').value = offer;
      runInContext('syncSalePrice(true)', context);
      assert.equal(get('saleCanonicalPrice').value, prices[index].toFixed(2));
      assert.equal(get('saleSoldPrice').value, prices[index].toFixed(2));
    }
  }
  get('saleProduct').options = [{ value: 'ING 1' }, { value: 'ING 3' }];
  for (const [offer, price] of [['OP1', '15.90'], ['COMBO', '24.90'], ['VIP', '39.90']]) {
    get('saleProduct').value = 'ING 3';
    get('whatsappPaste').value = `Ref: WEB-ING1-${offer}`;
    runInContext('parseWhatsapp()', context);
    assert.equal(get('saleCanonicalPrice').value, price);
    assert.equal(get('saleSoldPrice').value, price);
  }
  get('whatsappPaste').value = 'Hola, ya revisé el contenido y quiero adquirir la VIP Full por S/ 35.00.\nRef: WEB-ING1-VIP';
  runInContext('parseWhatsapp()', context);
  assert.equal(get('saleCanonicalPrice').value, '39.90');
  assert.equal(get('saleSoldPrice').value, '35.00');
  assert.equal(runInContext('JSON.stringify(state)', context), JSON.stringify(JSON.parse(seed)));
});
