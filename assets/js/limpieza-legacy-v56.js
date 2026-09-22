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


    function eliminarVistaPreviaLegacy() {

        const objetivo =
            "mira parte de lo que recibiras";


        const elementos =
            document.querySelectorAll(
                "h1, h2, h3, h4, p, span, strong"
            );


        for (const elemento of elementos) {

            const texto =
                normalizar(
                    elemento.textContent
                );


            if (texto !== objetivo) {
                continue;
            }


            const section =
                elemento.closest(
                    "section"
                );


            if (section) {

                /*
                    Medida extra de seguridad:
                    La sección vieja debe contener
                    "VISTA PREVIA" o el texto
                    "Luego reemplazaremos".
                */

                const contenido =
                    normalizar(
                        section.textContent
                    );


                const pareceLegacy =
                    contenido.includes(
                        "vista previa"
                    ) ||
                    contenido.includes(
                        "luego reemplazaremos"
                    );


                if (pareceLegacy) {

                    section.remove();

                    console.info(
                        "[Mente & Manos] Sección VISTA PREVIA legacy eliminada."
                    );
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
            eliminarVistaPreviaLegacy
        );
    }
    else {
        eliminarVistaPreviaLegacy();
    }

})();
