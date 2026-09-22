(function () {
    "use strict";

    const MAPA_PRODUCTOS = {
        ing1: { codigo: "ING 1", nombre: "Planos y Expedientes" },
        ing3: { codigo: "ING 3", nombre: "BIM y Revit" },
        ing7: { codigo: "ING 7", nombre: "CÃ¡lculo Estructural PRO" }
    };

    const PRECIOS = {
        opcion1: { normal: "S/ 74.90", oferta: "S/ 9.90", label: "OPCIÃ“N 1" },
        combo:   { normal: "S/ 99.90", oferta: "S/ 15.90", label: "COMBO PRO" },
        vip:     { normal: "S/ 179.90", oferta: "S/ 29.90", label: "VIP FULL" }
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

    function detectarTipoCard(card) {
        const txt = normalizar(card.innerText || "");
        const btn = normalizar((card.querySelector("button, a") || {}).innerText || "");

        if (txt.includes("7 ing completos") || btn.includes("quiero los 7 ing")) return "vip";
        if (txt.includes("2 adicionales") || btn.includes("combo pro")) return "combo";
        if (txt.includes("1 adicional") || btn.includes("esta opcion") || btn.includes("esta opciÃ³n")) return "opcion1";
        return null;
    }

    function buscarCardsOferta() {
        const botones = Array.from(document.querySelectorAll("button, a"));
        const cards = [];
        const vistos = new Set();

        botones.forEach(function (btn) {
            const btxt = normalizar(btn.innerText || "");
            if (!btxt.includes("elegir") && !btxt.includes("seleccionado") && !btxt.includes("quiero los 7 ing")) {
                return;
            }

            let node = btn;
            for (let i = 0; i < 8 && node; i++) {
                node = node.parentElement;
                if (!node) break;
                const txt = normalizar(node.innerText || "");
                if ((txt.includes("1 adicional") || txt.includes("2 adicionales") || txt.includes("7 ing completos")) && !vistos.has(node)) {
                    vistos.add(node);
                    cards.push(node);
                    break;
                }
            }
        });

        return cards;
    }

    function textoExacto(el) {
        return (el && el.childElementCount === 0) ? normalizar(el.textContent || "") : "";
    }

    function ocultarElementosViejos(card, tipo) {
        // Quitar restos v91 / v92 de anclas viejas
        Array.from(card.querySelectorAll('[data-v91="precio-ancla"], [data-v92="precio-ancla"], .precioAnclaV91, .precioAnclaV92'))
            .forEach(function (el) { el.remove(); });

        // Ocultar textos viejos de etiqueta / precios para evitar duplicados
        const mapaOcultar = {
            opcion1: ["opcion 1", "s/ 9.90", "antes: s/ 74.90", "precio oferta"],
            combo:   ["combo pro", "s/ 15.90", "antes: s/ 99.90", "precio oferta"],
            vip:     ["vip full", "s/ 29.90", "antes: s/ 179.90", "precio oferta", "mayor ahorro"]
        };

        const permitidos = [
            normalizar(tipo === "opcion1" ? "ING 1 + 1 adicional" : tipo === "combo" ? "ING 1 + 2 adicionales" : "Los 7 ING completos")
        ];

        Array.from(card.querySelectorAll("*"))
            .forEach(function (el) {
                const t = textoExacto(el);
                if (!t) return;
                if (permitidos.includes(t)) return;
                if ((mapaOcultar[tipo] || []).includes(t)) {
                    el.setAttribute("data-v93-hide", "1");
                }
            });
    }

    function construirHeader(tipo) {
        const data = PRECIOS[tipo];
        const wrap = document.createElement("div");
        wrap.className = "mmOfertaHeaderV93";
        wrap.setAttribute("data-v93", "oferta-header");

        let badge = "";
        if (tipo === "vip") {
            badge = '<div class="mmOfertaAhorroBadgeV93">MAYOR AHORRO</div>';
        }

        wrap.innerHTML = `
            ${badge}
            <div class="mmOfertaHeaderTopV93">
                <div class="mmOfertaLabelWrapV93">
                    <div class="mmOfertaLabelV93">${data.label}</div>
                </div>
                <div class="mmOfertaPrecioWrapV93">
                    <div class="mmOfertaPrecioActualV93">${data.oferta}</div>
                </div>
            </div>
            <div class="mmOfertaPrecioAnclaRowV93">
                <span class="mmOfertaAntesV93">
                    <span>ANTES:</span>
                    <span class="valorAnclaV93">${data.normal}</span>
                </span>
                <span class="mmOfertaBadgeOfertaV93">PRECIO OFERTA</span>
            </div>
        `;
        return wrap;
    }

    function insertarHeadersLimpios() {
        const cards = buscarCardsOferta();

        cards.forEach(function (card) {
            const tipo = detectarTipoCard(card);
            if (!tipo) return;

            card.classList.add("mmOfertaCardV93");
            card.setAttribute("data-v93-card", tipo);

            ocultarElementosViejos(card, tipo);

            let header = card.querySelector('[data-v93="oferta-header"]');
            if (!header) {
                header = construirHeader(tipo);
                card.insertBefore(header, card.firstChild);
            }
        });
    }

    function crearCardBaseVip() {
        const p = productoActual();
        const wrap = document.createElement("div");
        wrap.className = "adicionalWrap vipBaseAdicionalV93";
        wrap.setAttribute("data-v93", "vip-base");
        wrap.innerHTML = `
            <label class="adicional">
                <input type="checkbox" checked disabled>
                <div>
                    <strong>${p.codigo} â€” ${p.nombre}</strong>
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
        const existente = lista.querySelector('[data-v93="vip-base"]') || lista.querySelector('[data-v91="vip-base"]');

        if (!vipActivo) {
            if (existente) existente.remove();
            return;
        }

        if (!existente) {
            const card = crearCardBaseVip();
            lista.insertBefore(card, lista.firstChild);
        }
    }

    function ejecutar() {
        insertarHeadersLimpios();
        refrescarVipCon7Ing();
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

    setInterval(ejecutar, 1200);
})();
