(function () {
    "use strict";

    const MAPA_PRODUCTOS = {
        ing1: {
            codigo: "ING 1",
            nombre: "Planos y Expedientes"
        },
        ing3: {
            codigo: "ING 3",
            nombre: "BIM y Revit"
        },
        ing7: {
            codigo: "ING 7",
            nombre: "Cálculo Estructural PRO"
        }
    };

    const PRECIOS_ANCLA = {
        opcion1: "S/ 75.00",
        combo: "S/ 99.00",
        vip: "S/ 199.00"
    };

    function normalizar(txt) {
        return (txt || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function productoActual() {
        const q = new URLSearchParams(window.location.search);
        const k = normalizar(q.get("producto") || "ing1");
        return MAPA_PRODUCTOS[k] || MAPA_PRODUCTOS.ing1;
    }

    function crearPrecioAncla(tipo) {
        const wrap = document.createElement("div");
        wrap.className = "precioAnclaV91 cardPrecioAnclaV91";
        wrap.setAttribute("data-v91", "precio-ancla");

        let normal = PRECIOS_ANCLA.opcion1;
        if (tipo === "combo") normal = PRECIOS_ANCLA.combo;
        if (tipo === "vip") normal = PRECIOS_ANCLA.vip;

        wrap.innerHTML = `
            <span class="precioNormalV91">
                <span>Antes:</span>
                <span class="valorNormalV91">${normal}</span>
            </span>
            <span class="precioOfertaTagV91">Precio oferta</span>
        `;
        return wrap;
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

        if (txt.includes("1 adicional") || btn.includes("esta opcion") || btn.includes("esta opción")) {
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
            for (let i = 0; i < 6 && node; i++) {
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

    function insertarPreciosAncla() {
        const cards = buscarCardsOferta();

        cards.forEach(function (card) {
            const tipo = detectarTipoCard(card);
            if (!tipo) return;

            const existente = card.querySelector('[data-v91="precio-ancla"]');
            if (existente) return;

            const bloque = crearPrecioAncla(tipo);

            const precioExistente = Array.from(card.querySelectorAll("*")).find(function (el) {
                const t = normalizar(el.textContent || "");
                return t === "s/ 9.90" || t === "s/ 15.90" || t === "s/ 29.90";
            });

            if (precioExistente && precioExistente.parentElement) {
                precioExistente.parentElement.insertBefore(bloque, precioExistente);
                return;
            }

            const titulo = card.querySelector("h2, h3, h4, strong");
            if (titulo && titulo.parentElement) {
                titulo.insertAdjacentElement("beforebegin", bloque);
                return;
            }

            card.insertBefore(bloque, card.firstChild);
        });
    }

    function crearCardBaseVip() {
        const p = productoActual();
        const wrap = document.createElement("div");
        wrap.className = "adicionalWrap vipBaseAdicionalV91";
        wrap.setAttribute("data-v91", "vip-base");

        wrap.innerHTML = `
            <label class="adicional">
                <input type="checkbox" checked disabled>
                <div>
                    <strong>${p.codigo} — ${p.nombre}</strong>
                </div>
            </label>
            <div class="adicionalInfoBar">
                <span class="estadoSeleccion">INCLUIDO EN VIP</span>
            </div>
        `;

        return wrap;
    }

    function refrescarVipCon7Ing() {
        const lista = document.getElementById("listaAdicionales");
        if (!lista) return;

        const vipActivo = document.body.classList.contains("vipActivoV85");
        const existente = lista.querySelector('[data-v91="vip-base"]');

        if (!vipActivo) {
            if (existente) existente.remove();
            return;
        }

        if (existente) return;

        const card = crearCardBaseVip();
        lista.insertBefore(card, lista.firstChild);
    }

    function ejecutarV91() {
        insertarPreciosAncla();
        refrescarVipCon7Ing();
    }

    let raf = null;
    function programar() {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
            ejecutarV91();
        });
    }

    document.addEventListener("DOMContentLoaded", programar);
    window.addEventListener("load", programar);

    const observer = new MutationObserver(programar);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ["class", "style"]
    });

    setInterval(ejecutarV91, 1200);
})();
