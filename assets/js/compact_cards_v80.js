(function(){
  "use strict";

  const PRODUCT_MAP = {
    ing1: { code: 'ING 1' },
    ing3: { code: 'ING 3' },
    ing7: { code: 'ING 7' }
  };

  function getParam(name){
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function getCurrentProduct(){
    const k = (getParam('producto') || 'ing1').toLowerCase();
    return PRODUCT_MAP[k] || PRODUCT_MAP.ing1;
  }

  function text(el){
    return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function locateCard(marker){
    const blocks = Array.from(document.querySelectorAll('div, section, article'));
    const matches = blocks.filter(el => {
      const t = text(el);
      if (!t || !t.includes(marker)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 180 && r.height > 180;
    });
    matches.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    });
    return matches[0] || null;
  }

  function preserveButton(card){
    return card.querySelector('button, a[href*="wa.me"], a[href*="whatsapp"], .btn, [role="button"]');
  }

  function removePriorInjects(card){
    card.classList.remove('mm-v79-card', 'mm-v79-vip');
    const old = card.querySelectorAll('.mm-v79-tag,.mm-v79-price,.mm-v79-title,.mm-v79-desc,.mm-v79-note,.mm-v79-badge-top,.mm-v80-shell');
    old.forEach(n => n.remove());
  }

  function buildCard(card, cfg){
    if (!card) return;

    removePriorInjects(card);

    const actionBtn = preserveButton(card);
    if (!actionBtn) return;

    // Conservamos el botón real con sus eventos, limpiamos el resto.
    actionBtn.remove();
    card.innerHTML = '';
    card.classList.add('mm-v80-offer-card');
    if (cfg.kind === 'vip') card.classList.add('mm-v80-vip');

    const shell = document.createElement('div');
    shell.className = 'mm-v80-shell';

    if (cfg.badge) {
      const badge = document.createElement('div');
      badge.className = 'mm-v80-badge';
      badge.textContent = cfg.badge;
      card.appendChild(badge);
    }

    const top = document.createElement('div');
    top.className = 'mm-v80-top';

    const tag = document.createElement('div');
    tag.className = 'mm-v80-tag';
    tag.textContent = cfg.tag;

    const price = document.createElement('div');
    price.className = 'mm-v80-price';
    price.textContent = cfg.price;

    top.appendChild(tag);
    top.appendChild(price);

    const title = document.createElement('div');
    title.className = 'mm-v80-title';
    title.textContent = cfg.title;

    const desc = document.createElement('p');
    desc.className = 'mm-v80-desc';
    desc.textContent = cfg.desc;

    shell.appendChild(top);
    shell.appendChild(title);
    shell.appendChild(desc);

    if (cfg.noteTitle) {
      const note = document.createElement('div');
      note.className = 'mm-v80-note';
      note.innerHTML = cfg.noteTitle + '<small>' + cfg.noteSub + '</small>';
      shell.appendChild(note);
    }

    const spacer = document.createElement('div');
    spacer.className = 'mm-v80-spacer';
    shell.appendChild(spacer);

    const action = document.createElement('div');
    action.className = 'mm-v80-action';
    actionBtn.textContent = cfg.button;
    action.appendChild(actionBtn);
    shell.appendChild(action);

    card.appendChild(shell);
  }

  function applyCompactOffers(){
    const base = getCurrentProduct();

    buildCard(locateCard('OPCIÓN 1'), {
      tag: 'OPCIÓN 1',
      price: 'S/ 9.90',
      title: base.code + ' + 1 adicional',
      desc: 'Agrega 1 ING adicional al ' + base.code + '.',
      button: 'Elegir esta opción'
    });

    buildCard(locateCard('COMBO PRO'), {
      tag: 'COMBO PRO',
      price: 'S/ 15.90',
      title: base.code + ' + 2 adicionales',
      desc: 'Combina ' + base.code + ' con 2 ING adicionales.',
      button: 'Elegir Combo Pro'
    });

    buildCard(locateCard('VIP FULL'), {
      kind: 'vip',
      badge: 'MAYOR AHORRO',
      tag: 'VIP FULL',
      price: 'S/ 29.90',
      title: 'Los 7 ING completos',
      desc: 'Llévate los 7 ING completos en un solo acceso: más recursos, más herramientas y más soluciones para avanzar tus proyectos de principio a fin.',
      noteTitle: '7 ING completos',
      noteSub: 'Aprox. S/ 4.27 por ING',
      button: 'Quiero los 7 ING'
    });
  }

  function run(){
    applyCompactOffers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  setTimeout(run, 200);
  setTimeout(run, 900);
  setTimeout(run, 1800);
})();
