(function () {
    "use strict";

    const PRODUCTOS = {
        ing1: {
            codigo: "ING 1",
            titulo: "Planos y Expedientes"
        },
        ing3: {
            codigo: "ING 3",
            titulo: "BIM y Revit"
        },
        ing7: {
            codigo: "ING 7",
            titulo: "Cálculo Estructural PRO"
        }
    };


    function iniciar() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const clave =
            params.get("producto");


        /*
            Solo activamos el modo campaña cuando el enlace
            lleva explícitamente uno de los 3 productos.
        */

        if (!PRODUCTOS[clave]) {
            return;
        }


        document.documentElement.classList.add(
            "modoCampanaV67"
        );


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            /*
                Conservamos el elemento para que el resto de
                JavaScript pueda leerlo, pero el cliente no
                puede verlo ni cambiar de producto.
            */

            selector.value =
                clave;

            selector.tabIndex =
                -1;

            selector.setAttribute(
                "aria-hidden",
                "true"
            );

            selector.classList.add(
                "selectorOcultoV67"
            );


            const padre =
                selector.parentElement;


            /*
                Si el padre solamente contiene el selector,
                ocultamos también la caja exterior.
                Si contiene más elementos, no lo tocamos.
            */

            if (
                padre &&
                padre.children.length === 1
            ) {
                padre.classList.add(
                    "contenedorSelectorOcultoV67"
                );
            }
        }


        /*
            Título limpio en la pestaña del navegador.
        */

        document.title =
            `${PRODUCTOS[clave].codigo} - ${PRODUCTOS[clave].titulo} | Mente & Manos`;


        console.info(
            "[Mente & Manos V6.7] Modo campaña:",
            clave
        );
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );
    }
    else {
        iniciar();
    }

})();
