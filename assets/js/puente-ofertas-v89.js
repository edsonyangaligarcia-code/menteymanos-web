(function () {
    "use strict";

    function instalarPuente() {

        const ofertas =
            document.getElementById(
                "ofertas"
            );

        if (!ofertas) {
            return;
        }


        let puente =
            document.getElementById(
                "puenteOfertasV89"
            );


        if (!puente) {

            puente =
                document.createElement(
                    "div"
                );

            puente.id =
                "puenteOfertasV89";

            puente.innerHTML = `
                <div class="puenteOfertaV89">
                    <span>Siguiente paso · Elige tu oferta</span>
                    <span class="flechaV89">↓</span>
                </div>
            `;

            ofertas.parentNode.insertBefore(
                puente,
                ofertas
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            instalarPuente
        );

    }
    else {

        instalarPuente();
    }


    /*
       La Línea ING se genera dinámicamente.
       Revalidamos una vez después del render.
    */
    setTimeout(
        instalarPuente,
        500
    );

})();
