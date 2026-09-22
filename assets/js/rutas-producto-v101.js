(function () {
    "use strict";

    const PRODUCTOS_RUTA = {
        ing1: "ING 1 | Mente & Manos",
        ing3: "ING 3 | Mente & Manos",
        ing7: "ING 7 | Mente & Manos"
    };

    function productoDesdeRuta() {
        const match = window.location.pathname.match(
            /\/(ing1|ing3|ing7)(?:\/index\.html|\/)?$/i
        );

        return match
            ? match[1].toLowerCase()
            : null;
    }

    function activarRutaDirecta() {
        const producto = productoDesdeRuta();

        if (!producto) {
            return;
        }

        document.body.classList.add(
            "rutaProductoDirecta"
        );

        document.documentElement.setAttribute(
            "data-producto-ruta",
            producto
        );

        document.title =
            PRODUCTOS_RUTA[producto] ||
            "Mente & Manos";

        const selector =
            document.getElementById(
                "selectorProducto"
            );

        if (selector) {
            selector.value = producto;
        }
    }

    /*
       Las páginas /ing1/, /ing3/, /ing7/ usan
       <base href="../"> para que todos los assets sigan
       apuntando a la raíz del proyecto.

       Eso normalmente afectaría enlaces como #ofertas.
       Este listener los mantiene dentro de la página actual.
    */
    function activarAnclasLocales() {
        document.addEventListener(
            "click",
            function (event) {
                const enlace =
                    event.target.closest(
                        'a[href^="#"]'
                    );

                if (!enlace) {
                    return;
                }

                const producto =
                    productoDesdeRuta();

                if (!producto) {
                    return;
                }

                const href =
                    enlace.getAttribute(
                        "href"
                    );

                event.preventDefault();

                if (!href || href === "#") {
                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });
                    return;
                }

                const destino =
                    document.querySelector(
                        href
                    );

                if (destino) {
                    destino.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }
        );
    }

    function iniciar() {
        activarRutaDirecta();
        activarAnclasLocales();
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
