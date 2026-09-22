(function () {
    "use strict";

    const PRECIOS_NORMALES = {
        opcion1: "S/ 74.90",
        combo: "S/ 99.90",
        vip: "S/ 179.90"
    };

    function normalizar(txt) {
        return (txt || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function detectarTipoCard(card) {
        const txt = normalizar(card.innerText || "");
        const btn = normalizar((card.querySelector("button, a") || {}).innerText || "");

        if (txt.includes("7 ing completos") || btn.includes("quiero los 7 ing")) {
            return "vip";
        }

        if (txt.includes("2 adicionales") || btn.includes("combo pro")) {
            return "combo";
        }

        if (txt.includes("1 adicional") || btn.includes("esta opcion") || btn.includes("esta opciÃ³n")) {
            return "opcion1";
        }

        return null;
    }

    function buscarCardsOferta() {
        const botones = Array.from(document.querySelectorAll("button, a"));
        const cards = [];
        const vistos = new Set();

        botones.forEach(function (btn) {
            const btxt = normalizar(btn.innerText || "");
            if (
                !btxt.includes("elegir") &&
                !btxt.includes("seleccionado") &&
                !btxt.includes("quiero los 7 ing")
            ) {
                return;
            }

            let node = btn;
            for (let i = 0; i < 8 && node; i++) {
                node = node.parentElement;
                if (!node) break;

                const txt = normalizar(node.innerText || "");
                if (
                    (txt.includes("1 adicional") || txt.includes("2 adicionales") || txt.includes("7 ing completos")) &&
                    !vistos.has(node)
                ) {
                    vistos.add(node);
                    cards.push(node);
                    break;
                }
            }
        });

        return cards;
    }

    function crearBloqueAncla(valor) {
        const wrap = document.createElement("div");
        wrap.className = "precioAnclaV91 precioAnclaV92";
        wrap.setAttribute("data-v92", "precio-ancla");
        wrap.innerHTML = `
            <span class="precioNormalV91">
                <span>ANTES:</span>
                <span class="valorNormalV91">${valor}</span>
            </span>
            <span class="precioOfertaTagV91">PRECIO OFERTA</span>
        `;
        return wrap;
    }

    function buscarElementoPrecio(card, valorActual) {
        const todos = Array.from(card.querySelectorAll("*"));
        return todos.find(function (el) {
            const t = (el.textContent || "").trim();
            return t === valorActual;
        }) || null;
    }

    function aplicarBloques() {
        const cards = buscarCardsOferta();

        cards.forEach(function (card) {
            const tipo = detectarTipoCard(card);
            if (!tipo) return;

            card.setAttribute("data-v92-tipo-card", tipo);

            const precioNormal = PRECIOS_NORMALES[tipo];
            const precioActual =
                tipo === "opcion1" ? "S/ 9.90" :
                tipo === "combo"   ? "S/ 15.90" :
                                     "S/ 29.90";

            const todosAncla = Array.from(card.querySelectorAll(".precioAnclaV91, [data-v92='precio-ancla']"));
            let bloque = null;

            if (todosAncla.length > 0) {
                bloque = todosAncla[0];
                todosAncla.slice(1).forEach(function (x) { x.remove(); });
            }

            if (!bloque) {
                bloque = crearBloqueAncla(precioNormal);
            }

            bloque.classList.add("precioAnclaV92");
            bloque.setAttribute("data-v92", "precio-ancla");

            let valor = bloque.querySelector(".valorNormalV91");
            if (!valor) {
                bloque.innerHTML = `
                    <span class="precioNormalV91">
                        <span>ANTES:</span>
                        <span class="valorNormalV91">${precioNormal}</span>
                    </span>
                    <span class="precioOfertaTagV91">PRECIO OFERTA</span>
                `;
            } else {
                valor.textContent = precioNormal;
            }

            const precioEl = buscarElementoPrecio(card, precioActual);

            if (precioEl && precioEl.parentElement) {
                const cont = precioEl.parentElement;
                if (bloque.parentElement !== cont) {
                    cont.appendChild(bloque);
                } else if (cont.lastElementChild !== bloque) {
                    cont.appendChild(bloque);
                }
            } else {
                if (bloque.parentElement !== card) {
                    card.insertBefore(bloque, card.firstElementChild || null);
                }
            }
        });
    }

    function ejecutar() {
        aplicarBloques();
    }

    let raf = null;
    function programar() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(ejecutar);
    }

    document.addEventListener("DOMContentLoaded", programar);
    window.addEventListener("load", programar);

    const observer = new MutationObserver(programar);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["class", "style"]
    });

    setInterval(ejecutar, 1400);
})();
