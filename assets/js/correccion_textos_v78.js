(function () {
    "use strict";

    const VIP_TEXT = "Llévate los 7 ING completos en un solo acceso: más recursos, más herramientas y más soluciones para avanzar tus proyectos de principio a fin.";
    const ING6_TEXT = "Bloques Dinámicos para AutoCAD";
    const ING6_DESC = "Bloques dinámicos, librerías y recursos listos para AutoCAD.";

    function fixTextNodes(root) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach(function (node) {
            let t = node.nodeValue || "";
            t = t.replaceAll("AutoCAD + Bloques Dinámicos Dinámicos", ING6_TEXT);
            t = t.replaceAll("AutoCAD + Bloques Dinámicos", ING6_TEXT);
            t = t.replaceAll("Bloques DinÃ¡micos para AutoCAD", ING6_TEXT);
            t = t.replaceAll("AutoCAD + Bloques DinÃ¡micos DinÃ¡micos", ING6_TEXT);
            t = t.replaceAll("AutoCAD + Bloques DinÃ¡micos", ING6_TEXT);
            t = t.replaceAll("Diseño, documentación, BIM, coordinación, obra, AutoCAD y cálculo estructural.", VIP_TEXT);
            t = t.replaceAll("DiseÃ±o, documentaciÃ³n, BIM, coordinaciÃ³n, obra, AutoCAD y cÃ¡lculo estructural.", VIP_TEXT);
            node.nodeValue = t;
        });
    }

    function fixLineaIngRows() {
        const rows = Array.from(document.querySelectorAll('*')).filter(el => {
            const txt = (el.textContent || '').trim();
            return txt.includes('ING 6') && (
                txt.includes('AutoCAD + Bloques') ||
                txt.includes('Bloques Dinámicos') ||
                txt.includes('Bloques DinÃ¡micos')
            );
        });

        rows.forEach(function (el) {
            const nombre = el.querySelector('.lineaIngNombreV76, .lineaIngNombre, .ing-name, .item-name, strong, b');
            if (nombre) {
                nombre.textContent = ING6_TEXT;
            }

            const desc = el.querySelector('.ing-desc, .lineaIngDesc, small, p, span');
            if (desc && desc.textContent.includes('Bloques')) {
                desc.textContent = ING6_DESC;
            }
        });
    }

    function fixVipCard() {
        const cards = Array.from(document.querySelectorAll('section, article, div'));
        cards.forEach(function (card) {
            const txt = (card.textContent || '').replace(/\s+/g, ' ').trim();
            if (!txt) return;
            if (txt.includes('VIP FULL') && txt.includes('Los 7 ING completos')) {
                const ps = card.querySelectorAll('p');
                ps.forEach(function (p) {
                    const ptxt = (p.textContent || '').replace(/\s+/g, ' ').trim();
                    if (
                        ptxt.includes('Diseño, documentación, BIM, coordinación, obra, AutoCAD y cálculo estructural.') ||
                        ptxt.includes('DiseÃ±o, documentaciÃ³n, BIM, coordinaciÃ³n, obra, AutoCAD y cÃ¡lculo estructural.')
                    ) {
                        p.textContent = VIP_TEXT;
                    }
                });
            }
        });
    }

    function applyAll() {
        fixTextNodes(document.body);
        fixLineaIngRows();
        fixVipCard();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAll);
    } else {
        applyAll();
    }

    setTimeout(applyAll, 200);
    setTimeout(applyAll, 800);
    setTimeout(applyAll, 1600);
})();
