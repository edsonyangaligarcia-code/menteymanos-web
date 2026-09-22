(function () {
    "use strict";

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function corregirMojibake(root) {
        const walker = document.createTreeWalker(
            root || document.body,
            NodeFilter.SHOW_TEXT
        );

        const nodos = [];
        while (walker.nextNode()) {
            nodos.push(walker.currentNode);
        }

        nodos.forEach(function (node) {
            let t = node.nodeValue || "";

            t = t
                .replaceAll("opciÃ³n", "opción")
                .replaceAll("informaciÃ³n", "información")
                .replaceAll("coordinaciÃ³n", "coordinación")
                .replaceAll("cÃ¡lculo", "cálculo")
                .replaceAll("pÃ¡gina", "página")
                .replaceAll("Ãš", "Ú")
                .replaceAll("Ã³", "ó")
                .replaceAll("Ã¡", "á")
                .replaceAll("Ã©", "é")
                .replaceAll("Ã­", "í")
                .replaceAll("Ãº", "ú")
                .replaceAll("Ã±", "ñ");

            if (t !== node.nodeValue) {
                node.nodeValue = t;
            }
        });
    }

    function limpiarTextos() {
        document
            .querySelectorAll("p, div, span, small")
            .forEach(function (el) {

                if (el.children.length > 3) {
                    return;
                }

                const t = normalizar(el.textContent);

                if (
                    t === normalizar(
                        "Incluye ING 1, ING 2, ING 3, ING 4, ING 5, ING 6 e ING 7 en un solo acceso."
                    )
                ) {
                    el.textContent =
                        "Elige la opción que mejor se adapte a lo que necesitas.";
                    return;
                }

                if (
                    t === normalizar(
                        "Elige la opción que mejor se adapte a lo que necesitas."
                    )
                ) {
                    el.remove();
                    return;
                }

                if (
                    /^muestras visuales de ing [137]\. toca una imagen para verla en detalle\.$/i.test(
                        t
                    )
                ) {
                    el.remove();
                    return;
                }

                if (
                    t === normalizar(
                        "Los archivos solo se muestran como referencia. No se pueden abrir ni descargar desde esta página."
                    )
                ) {
                    el.remove();
                    return;
                }

                if (
                    t.startsWith(
                        normalizar(
                            "Vista previa del contenido incluido."
                        )
                    )
                ) {
                    el.remove();
                }
            });
    }

    function mejorarNavegacion() {
        const atras =
            document.getElementById("expandirArbol");

        const adelante =
            document.getElementById("contraerArbol");

        if (atras) {
            atras.innerHTML =
                '<span class="navFlecha">←</span><span>Atrás</span>';
        }

        if (adelante) {
            adelante.innerHTML =
                '<span>Adelante</span><span class="navFlecha">→</span>';
        }
    }

    function aplicar() {
        corregirMojibake(document.body);
        limpiarTextos();
        mejorarNavegacion();
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            aplicar
        );
    }
    else {
        aplicar();
    }

    setTimeout(aplicar, 250);
    setTimeout(aplicar, 900);
})();

