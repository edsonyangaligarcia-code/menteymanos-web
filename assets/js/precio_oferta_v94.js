(function () {
    "use strict";

    const MAPA_PRODUCTOS = {
        ing1: { codigo: "ING 1", nombre: "Planos y Expedientes" },
        ing3: { codigo: "ING 3", nombre: "BIM y Revit" },
        ing7: { codigo: "ING 7", nombre: "Cálculo Estructural PRO" }
    };

    const PRECIOS = {
        opcion1: {
            nombre: "OPCIÓN 1",
            antes: "S/ 74.90",
            oferta: "S/ 9.90"
        },
        combo: {
            nombre: "COMBO PRO",
            antes: "S/ 99.90",
            oferta: "S/ 15.90"
        },
        vip: {
            nombre: "VIP FULL",
            antes: "S/ 179.90",
            oferta: "S/ 29.90"
        }
    };

    function norm(texto) {
        return (texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function productoActual() {
        const q = new URLSearchParams(window.location.search);
        const key = norm(q.get("producto") || "ing1");
        return MAPA_PRODUCTOS[key] || MAPA_PRODUCTOS.ing1;
    }

    function tipoCard(card) {
        const texto = norm(card.innerText || "");
        const boton = norm((card.querySelector("button, a") || {}).innerText || "");

        if (texto.includes("7 ing completos") || boton.includes("quiero los 7 ing")) {
            return "vip";
        }

        if (texto.includes("2 adicionales") || boton.includes("combo pro")) {
            return "combo";
        }

        if (texto.includes("1 adicional") || boton.includes("esta opcion")) {
            return "opcion1";
        }

        return null;
    }

    function buscarCards() {
        const botones = Array.from(document.querySelectorAll("button, a"));
        const encontrados = [];
        const vistos = new Set();

        botones.forEach(function (boton) {
            const txt = norm(boton.innerText || "");

            if (
                !txt.includes("elegir") &&
                !txt.includes("seleccionado") &&
                !txt.includes("quiero los 7 ing")
            ) {
                return;
            }

            let nodo = boton;

            for (let i = 0; i < 8 && nodo; i++) {
                nodo = nodo.parentElement;
                if (!nodo) break;

                const texto = norm(nodo.innerText || "");

                if (
                    (
                        texto.includes("1 adicional") ||
                        texto.includes("2 adicionales") ||
                        texto.includes("7 ing completos")
                    ) &&
                    !vistos.has(nodo)
                ) {
                    vistos.add(nodo);
                    encontrados.push(nodo);
                    break;
                }
            }
        });

        return encontrados;
    }

    function esHoja(el) {
        return el && el.children.length === 0;
    }

    function limpiarHeaderAnterior(card) {
        card.querySelectorAll('[data-v94="header"]').forEach(function (el) {
            el.remove();
        });

        /* Quitar bloques V9.1/V9.2 que pudieran quedar */
        card.querySelectorAll(
            '[data-v91="precio-ancla"], ' +
            '[data-v92="precio-ancla"], ' +
            '.precioAnclaV91, ' +
            '.precioAnclaV92'
        ).forEach(function (el) {
            el.remove();
        });
    }

    function ocultarCabeceraOriginal(card, tipo) {
        const valores = {
            opcion1: ["opcion 1", "s/ 9.90", "precio oferta", "antes: s/ 74.90"],
            combo: ["combo pro", "s/ 15.90", "precio oferta", "antes: s/ 99.90"],
            vip: ["vip full", "s/ 29.90", "precio oferta", "antes: s/ 179.90", "mayor ahorro"]
        };

        Array.from(card.querySelectorAll("*")).forEach(function (el) {
            /* NUNCA ocultar elementos del nuevo header */
            if (el.closest('[data-v94="header"]')) return;
            if (!esHoja(el)) return;

            const t = norm(el.textContent || "");

            if ((valores[tipo] || []).includes(t)) {
                el.style.setProperty("display", "none", "important");
            }
        });
    }

    function crearHeader(tipo) {
        const d = PRECIOS[tipo];
        const header = document.createElement("div");
        header.className = "mmOfertaHeaderV94";
        header.setAttribute("data-v94", "header");

        const badge = tipo === "vip"
            ? '<div class="mmOfertaAhorroV94">MAYOR AHORRO</div>'
            : '';

        header.innerHTML = `
            ${badge}
            <div class="mmOfertaTopV94">
                <div class="mmOfertaNombreV94">${d.nombre}</div>
                <div class="mmOfertaPrecioActualV94">${d.oferta}</div>
            </div>
            <div class="mmOfertaAnclaV94">
                <span class="mmOfertaAntesV94">
                    <span>ANTES:</span>
                    <span class="mmOfertaAntesPrecioV94">${d.antes}</span>
                </span>
                <span class="mmOfertaOfertaBadgeV94">PRECIO OFERTA</span>
            </div>
        `;

        return header;
    }

    function instalarHeaders() {
        const cards = buscarCards();

        cards.forEach(function (card) {
            const tipo = tipoCard(card);
            if (!tipo) return;

            /* Si ya existe correcto, no reconstruir */
            const existente = card.querySelector('[data-v94="header"]');
            if (existente) {
                existente.querySelectorAll("*").forEach(function (el) {
                    el.style.removeProperty("display");
                });
                return;
            }

            limpiarHeaderAnterior(card);

            const header = crearHeader(tipo);
            card.insertBefore(header, card.firstChild);

            /* Después de insertarlo, ocultar SOLO la cabecera vieja */
            ocultarCabeceraOriginal(card, tipo);
        });
    }

    function crearBaseVip() {
        const p = productoActual();
        const wrap = document.createElement("div");
        wrap.className = "adicionalWrap vipBaseAdicionalV94";
        wrap.setAttribute("data-v94", "vip-base");

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

    function asegurar7IngVip() {
        const lista = document.getElementById("listaAdicionales");
        if (!lista) return;

        const vipActivo = document.body.classList.contains("vipActivoV85");

        const viejo = lista.querySelector('[data-v91="vip-base"], [data-v93="vip-base"]');
        if (viejo) viejo.remove();

        let base = lista.querySelector('[data-v94="vip-base"]');

        if (!vipActivo) {
            if (base) base.remove();
            return;
        }

        if (!base) {
            base = crearBaseVip();
            lista.insertBefore(base, lista.firstChild);
        }
    }

    function ejecutar() {
        instalarHeaders();
        asegurar7IngVip();
    }

    document.addEventListener("DOMContentLoaded", ejecutar);
    window.addEventListener("load", ejecutar);

    /* Solo algunas revalidaciones controladas: sin bucles agresivos */
    setTimeout(ejecutar, 350);
    setTimeout(ejecutar, 1100);
    setTimeout(ejecutar, 2200);
})();
