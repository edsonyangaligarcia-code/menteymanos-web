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


    function eliminarAntesDeComprar() {

        const objetivo =
            "antes de comprar";


        const candidatos =
            document.querySelectorAll(
                "h1, h2, h3, h4"
            );


        for (const heading of candidatos) {

            if (
                normalizar(
                    heading.textContent
                ) !== objetivo
            ) {
                continue;
            }


            const seccion =
                heading.closest(
                    "section"
                );


            if (seccion) {

                seccion.remove();

                console.info(
                    "[Mente & Manos V6.6] Sección 'Antes de comprar' eliminada."
                );

                return;
            }


            /*
                Respaldo por si no está dentro de <section>.
                Buscamos un contenedor cercano que incluya
                también las preguntas del FAQ.
            */

            let contenedor =
                heading.parentElement;


            for (
                let i = 0;
                contenedor && i < 5;
                i++,
                contenedor =
                    contenedor.parentElement
            ) {

                const texto =
                    normalizar(
                        contenedor.innerText
                    );


                const coincideFaq =
                    texto.includes(
                        "como recibo el contenido"
                    ) &&
                    texto.includes(
                        "puedo descargar archivos"
                    );


                if (coincideFaq) {

                    contenedor.remove();

                    console.info(
                        "[Mente & Manos V6.6] Bloque FAQ 'Antes de comprar' eliminado."
                    );

                    return;
                }
            }
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            eliminarAntesDeComprar
        );

    }
    else {

        eliminarAntesDeComprar();
    }

})();
