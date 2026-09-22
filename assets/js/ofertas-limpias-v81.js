(function () {
    "use strict";

    const PRECIOS = {
        ing1: "S/ 9.90",
        ing3: "S/ 12.90",
        ing7: "S/ 12.90"
    };

    function productoActual() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const key =
            String(
                params.get("producto") ||
                ""
            ).toLowerCase();

        if (
            key === "ing1" ||
            key === "ing3" ||
            key === "ing7"
        ) {
            return key;
        }

        const selector =
            document.getElementById(
                "selectorProducto"
            );

        if (
            selector &&
            PRECIOS[selector.value]
        ) {
            return selector.value;
        }

        return "ing1";
    }


    function codigoProducto(key) {

        if (key === "ing3") {
            return "ING 3";
        }

        if (key === "ing7") {
            return "ING 7";
        }

        return "ING 1";
    }


    function quitarInyeccionesViejas() {

        document
            .querySelectorAll(
                ".mm-v79-tag," +
                ".mm-v79-price," +
                ".mm-v79-title," +
                ".mm-v79-desc," +
                ".mm-v79-note," +
                ".mm-v79-badge-top," +
                ".mm-v80-shell," +
                ".mm-v80-badge"
            )
            .forEach(
                element => element.remove()
            );


        document
            .querySelectorAll(
                ".mm-v79-card," +
                ".mm-v79-vip," +
                ".mm-v80-offer-card," +
                ".mm-v80-vip"
            )
            .forEach(
                element => {

                    element.classList.remove(
                        "mm-v79-card",
                        "mm-v79-vip",
                        "mm-v80-offer-card",
                        "mm-v80-vip"
                    );

                }
            );
    }


    function normalizarTarjeta(
        card,
        data
    ) {

        if (!card) {
            return;
        }


        const cabecera =
            card.querySelector(
                ".cabeceraOferta"
            );

        const tag =
            cabecera
                ? cabecera.querySelector(
                    "span"
                )
                : null;

        const precio =
            cabecera
                ? cabecera.querySelector(
                    "strong"
                )
                : null;

        const titulo =
            card.querySelector(
                ":scope > h3"
            );

        const descripcion =
            card.querySelector(
                ":scope > p"
            );

        const boton =
            card.querySelector(
                ":scope > .elegirOferta"
            ) ||
            card.querySelector(
                ".elegirOferta"
            );


        if (tag) {
            tag.textContent =
                data.tag;
        }

        if (precio) {
            precio.textContent =
                data.precio;
        }

        if (titulo) {
            titulo.textContent =
                data.titulo;
        }

        if (descripcion) {
            descripcion.textContent =
                data.descripcion;
        }

        if (boton) {
            boton.textContent =
                data.boton;
        }
    }


    function arreglarMarca() {

        const nombre =
            document.querySelector(
                ".marcaTexto strong"
            );

        const subtitulo =
            document.querySelector(
                ".marcaTexto small"
            );


        if (nombre) {
            nombre.innerHTML =
                "MENTE <b>&</b> MANOS";
        }

        if (subtitulo) {
            subtitulo.textContent =
                "Capacitación Integral";
        }
    }


    function aplicar() {

        quitarInyeccionesViejas();

        arreglarMarca();


        const key =
            productoActual();

        const codigo =
            codigoProducto(
                key
            );


        const opcion1 =
            document.querySelector(
                '.oferta[data-oferta="1"]'
            );

        const combo =
            document.querySelector(
                '.oferta[data-oferta="2"]'
            );

        const vip =
            document.querySelector(
                '.oferta[data-oferta="3"]'
            );


        normalizarTarjeta(
            opcion1,
            {
                tag:
                    "OPCIÓN 1",

                precio:
                    PRECIOS[key],

                titulo:
                    codigo +
                    " + 1 adicional",

                descripcion:
                    "Agrega 1 ING adicional a " +
                    codigo +
                    ".",

                boton:
                    "Elegir esta opción"
            }
        );


        normalizarTarjeta(
            combo,
            {
                tag:
                    "COMBO PRO",

                precio:
                    "S/ 15.90",

                titulo:
                    codigo +
                    " + 2 adicionales",

                descripcion:
                    "Combina " +
                    codigo +
                    " con 2 ING adicionales.",

                boton:
                    "Elegir Combo Pro"
            }
        );


        normalizarTarjeta(
            vip,
            {
                tag:
                    "VIP FULL",

                precio:
                    "S/ 29.90",

                titulo:
                    "Los 7 ING completos",

                descripcion:
                    "Llévate los 7 ING completos en un solo acceso: más recursos, más herramientas y más soluciones para avanzar tus proyectos de principio a fin.",

                boton:
                    "Quiero los 7 ING"
            }
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            aplicar
        );

    }
    else {

        aplicar();
    }


    /*
        Algunos scripts anteriores actualizan el producto
        unos milisegundos después. Reaplicamos únicamente
        textos/estilos de las tarjetas originales.
    */

    setTimeout(
        aplicar,
        250
    );

    setTimeout(
        aplicar,
        900
    );

})();
