(function () {
    "use strict";

    function aplicar() {

        const titulo =
            document.querySelector(
                ".lineaIngTitleV68"
            );

        const descripcion =
            document.querySelector(
                ".lineaIngDescV68"
            );

        if (titulo) {
            titulo.textContent =
                "Toda la Línea ING";
        }

        if (descripcion) {
            descripcion.textContent =
                "Elige los ING que quieras combinar.";
        }

        document
            .querySelectorAll(
                ".lineaIngBadgeV68"
            )
            .forEach(
                badge => {
                    badge.textContent =
                        "TU ING";
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

    setTimeout(
        aplicar,
        300
    );

})();
