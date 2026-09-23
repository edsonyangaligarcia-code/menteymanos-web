(function () {
    "use strict";

    const PRECIOS = {
        1: { nombre: "OPCIÓN 1", normal: "S/ 74.90" },
        2: { nombre: "COMBO PRO", normal: "S/ 99.90", oferta: "S/ 15.90" },
        3: { nombre: "VIP FULL", normal: "S/ 179.90", oferta: "S/ 29.90" }
    };

    const PRODUCTOS = {
        ing1: { codigo: "ING 1", nombre: "Planos y Expedientes", precio: "S/ 9.90" },
        ing3: { codigo: "ING 3", nombre: "BIM y Revit", precio: "S/ 12.90" },
        ing7: { codigo: "ING 7", nombre: "Cálculo Estructural PRO", precio: "S/ 12.90" }
    };

    function productoActual() {
        const selector = document.getElementById("selectorProducto");
        if (selector && PRODUCTOS[selector.value]) return selector.value;
        const url = new URLSearchParams(window.location.search).get("producto");
        if (PRODUCTOS[url]) return url;
        return "ing1";
    }

    function precioOferta(plan) {
        if (plan === 1) return PRODUCTOS[productoActual()].precio;
        return PRECIOS[plan].oferta;
    }

    function limpiarResiduos(card) {
        if (!card) return;

        card.querySelectorAll([
            '[data-v91="precio-ancla"]',
            '[data-v92="precio-ancla"]',
            '[data-v93="oferta-header"]',
            '[data-v94="header"]',
            '.precioAnclaV91',
            '.precioAnclaV92',
            '.mmOfertaHeaderV93',
            '.mmOfertaHeaderV94'
        ].join(",")).forEach(el => el.remove());

        const cabecera = card.querySelector(".cabeceraOferta");
        if (cabecera) {
            cabecera.querySelectorAll("*").forEach(el => {
                el.style.removeProperty("display");
                el.style.removeProperty("visibility");
                el.style.removeProperty("opacity");
            });
        }
    }

    function construirCabecera(plan) {
        const card = document.querySelector(`.oferta[data-oferta="${plan}"]`);
        if (!card) return;

        limpiarResiduos(card);

        const cabecera = card.querySelector(".cabeceraOferta");
        if (!cabecera) return;

        cabecera.classList.add("cabeceraOfertaV95");

        const idPrecio = plan === 1 ? ' id="precioOpcion1"' : "";

        cabecera.innerHTML = `
            <span class="nombreOfertaV95">${PRECIOS[plan].nombre}</span>
            <strong class="precioOfertaV95"${idPrecio}>${precioOferta(plan)}</strong>
            <div class="anclaOfertaV95">
                <span class="antesOfertaV95">
                    <span>ANTES:</span>
                    <span class="precioNormalV95">${PRECIOS[plan].normal}</span>
                </span>
                <span class="badgeOfertaV95">PRECIO OFERTA</span>
            </div>
        `;
    }

    function asegurarUnSoloBadgeVip() {
        const vip = document.querySelector('.oferta[data-oferta="3"]');
        if (!vip) return;

        vip.querySelectorAll([
            ".mmOfertaAhorroV94",
            ".mmOfertaAhorroBadgeV93",
            ".mm-v79-badge-top",
            ".mm-v80-badge"
        ].join(",")).forEach(el => el.remove());

        let badges = Array.from(vip.querySelectorAll(".vipBadgeV65"));

        if (badges.length === 0) {
            const badge = document.createElement("span");
            badge.className = "vipBadgeV65";
            badge.textContent = "MAYOR AHORRO";
            vip.appendChild(badge);
            badges = [badge];
        }

        badges.slice(1).forEach(b => b.remove());
        badges[0].textContent = "MAYOR AHORRO";
    }

    function crearBaseVip() {
        const producto = PRODUCTOS[productoActual()];
        const wrap = document.createElement("div");
        wrap.className = "adicionalWrap vipBaseAdicionalV95";
        wrap.setAttribute("data-v95", "vip-base");
        wrap.innerHTML = `
            <label class="adicional">
                <input type="checkbox" checked disabled>
                <div><strong>${producto.codigo} — ${producto.nombre}</strong></div>
            </label>
            <div class="adicionalInfoBar">
                <span class="estadoSeleccion">INCLUIDO EN VIP</span>
            </div>
        `;
        return wrap;
    }

    function asegurarSieteIngVip() {
        const lista = document.getElementById("listaAdicionales");
        if (!lista) return;

        lista.querySelectorAll([
            '[data-v91="vip-base"]',
            '[data-v93="vip-base"]',
            '[data-v94="vip-base"]'
        ].join(",")).forEach(el => el.remove());

        let base = lista.querySelector('[data-v95="vip-base"]');
        const vipActivo = document.body.classList.contains("vipActivoV85");

        if (!vipActivo) {
            if (base) base.remove();
            return;
        }

        if (!base) {
            base = crearBaseVip();
            lista.insertBefore(base, lista.firstChild);
        }
    }

    function aplicarTodo() {
        construirCabecera(1);
        construirCabecera(2);
        construirCabecera(3);
        asegurarUnSoloBadgeVip();
        asegurarSieteIngVip();
    }

    function iniciar() {
        aplicarTodo();
        setTimeout(aplicarTodo, 180);
        setTimeout(aplicarTodo, 650);

        const selector = document.getElementById("selectorProducto");
        if (selector) {
            selector.addEventListener("change", function () {
                setTimeout(aplicarTodo, 120);
                setTimeout(aplicarTodo, 400);
            });
        }

        document.addEventListener("click", function (evento) {
            if (evento.target.closest(".elegirOferta")) {
                setTimeout(function () {
                    asegurarUnSoloBadgeVip();
                    asegurarSieteIngVip();
                }, 160);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();

