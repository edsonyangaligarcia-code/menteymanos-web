(function(){
  "use strict";
  const CONFIG = {
    brand: "MENTE & MANOS",
    subtitle: "Capacitación Integral",
    products: {
      ing1: { code: "ING 1" },
      ing3: { code: "ING 3" },
      ing7: { code: "ING 7" }
    }
  };
  function qp(name){ return new URLSearchParams(window.location.search).get(name) || ""; }
  function currentProduct(){ const raw = (qp("producto") || "ing1").toLowerCase(); return CONFIG.products[raw] || CONFIG.products.ing1; }
  function txt(el){ return (el && el.textContent ? el.textContent : "").replace(/\s+/g,' ').trim(); }
  function fixBrand(){
    const nodes = Array.from(document.querySelectorAll('body *')).filter(el => {
      if (el.children.length > 0) return false;
      const t = txt(el); if (!t) return false;
      const r = el.getBoundingClientRect();
      return r.top < 120 && r.left < 320 && t.length < 80;
    });
    if (!nodes.length) return;
    const main = nodes.find(n => /MENTE|Bloques|Planos|BIM|Cálculo|AutoCAD/i.test(txt(n))) || nodes[0];
    if (main) main.textContent = CONFIG.brand;
    const mr = main ? main.getBoundingClientRect() : null;
    if (mr) {
      const sub = nodes.find(n => n !== main && Math.abs(n.getBoundingClientRect().left - mr.left) < 40 && n.getBoundingClientRect().top >= mr.top && n.getBoundingClientRect().top < 140);
      if (sub) sub.textContent = CONFIG.subtitle;
    }
  }
  function locateCard(marker){
    const all = Array.from(document.querySelectorAll('div, article, section'));
    const matches = all.filter(el => { const t = txt(el); if (!t || !t.includes(marker)) return false; const r = el.getBoundingClientRect(); return r.width > 180 && r.height > 180; });
    matches.sort((a,b)=>a.getBoundingClientRect().width*a.getBoundingClientRect().height - b.getBoundingClientRect().width*b.getBoundingClientRect().height);
    return matches[0] || null;
  }
  function ensureNode(parent, cls, tag, text){ let node = parent.querySelector('.' + cls); if (!node) { node = document.createElement(tag || 'div'); node.className = cls; parent.prepend(node);} if (typeof text === 'string') node.textContent = text; return node; }
  function hideBadTexts(card, baseCode){
    const badPatterns = [/Bloques Dinámicos para AutoCAD/i,/AutoCAD \+ Bloques/i,/Planos y Expedientes/i,/BIM y Revit/i,/Cálculo Estructural PRO/i];
    Array.from(card.querySelectorAll('*')).forEach(el => {
      const t = txt(el); if (!t) return;
      if (t === baseCode + ' + 1 adicional' || t === baseCode + ' + 2 adicionales' || t === 'Los 7 ING completos') return;
      if (badPatterns.some(r => r.test(t)) && el.closest('button') == null) {
        const r = el.getBoundingClientRect(), c = card.getBoundingClientRect();
        if (r.top - c.top < 120) el.classList.add('mm-v79-hide');
      }
    });
  }
  function retitleButtons(card, label){ const btn = card.querySelector('button, .btn, [role="button"]'); if (btn) btn.textContent = label; }
  function ensureCard(card, cfg){
    if (!card) return;
    card.classList.add('mm-v79-card'); if (cfg.kind === 'vip') card.classList.add('mm-v79-vip');
    hideBadTexts(card, cfg.baseCode || 'ING 1');
    ensureNode(card, 'mm-v79-tag', 'div', cfg.tag);
    ensureNode(card, 'mm-v79-price', 'div', cfg.price);
    const title = ensureNode(card, 'mm-v79-title', 'div', cfg.title);
    let desc = card.querySelector('.mm-v79-desc');
    if (!desc) { desc = document.createElement('p'); desc.className = 'mm-v79-desc'; title.insertAdjacentElement('afterend', desc); }
    desc.textContent = cfg.desc;
    const oldBadge = card.querySelector('.mm-v79-badge-top'); if (oldBadge) oldBadge.remove();
    if (cfg.topBadge) { const tb = document.createElement('div'); tb.className = 'mm-v79-badge-top'; tb.textContent = cfg.topBadge; card.appendChild(tb); }
    let note = card.querySelector('.mm-v79-note'); if (note) note.remove();
    if (cfg.noteTitle) { note = document.createElement('div'); note.className = 'mm-v79-note'; note.innerHTML = cfg.noteTitle + '<small>' + cfg.noteSub + '</small>'; desc.insertAdjacentElement('afterend', note); }
    retitleButtons(card, cfg.button);
  }
  function fixOfferCards(){
    const base = currentProduct();
    ensureCard(locateCard('OPCIÓN 1'), { tag:'OPCIÓN 1', price:'S/ 9.90', title: base.code + ' + 1 adicional', desc:'Agrega 1 ING adicional al ' + base.code + '.', button:'Elegir esta opción', baseCode:base.code });
    ensureCard(locateCard('COMBO PRO'), { tag:'COMBO PRO', price:'S/ 15.90', title: base.code + ' + 2 adicionales', desc:'Combina ' + base.code + ' con 2 ING adicionales.', button:'Elegir Combo Pro', baseCode:base.code });
    ensureCard(locateCard('VIP FULL'), { kind:'vip', tag:'VIP FULL', price:'S/ 29.90', title:'Los 7 ING completos', desc:'Accede a toda la Línea ING en un solo pago y aprovecha el mayor ahorro para llevarte todo el contenido completo.', noteTitle:'7 ING completos', noteSub:'Aprox. S/ 4.27 por ING', button:'Quiero los 7 ING', topBadge:'MAYOR AHORRO', baseCode:base.code });
  }
  function applyAll(){ fixBrand(); fixOfferCards(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll); else applyAll();
  setTimeout(applyAll,250); setTimeout(applyAll,1000); setTimeout(applyAll,2200);
})();
