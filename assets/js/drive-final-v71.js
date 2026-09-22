(function () {
    "use strict";

    function norm(text) {
        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    const TEXTO_VIP = norm(
        "Incluye ING 1, ING 2, ING 3, ING 4, ING 5, ING 6 e ING 7 en un solo acceso."
    );

    const TEXTO_LINEA = norm(
        "Incluye toda la LÃ­nea ING: Planos, expedientes, BIM, coordinaciÃ³n, obra, AutoCAD y cÃ¡lculo estructural."
    );

    const TEXTO_ARCHIVOS = norm(
        "Los archivos solo se muestran como referencia. No se pueden abrir ni descargar desde esta pÃ¡gina."
    );

    const TEXTO_VISTA = norm(
        "Vista previa del contenido incluido. Los archivos se muestran Ãºnicamente como referencia: no se pueden abrir ni descargar desde esta pÃ¡gina. Las secciones de software se muestran como vista restringida. ContraseÃ±as, patches, archivos temporales y datos internos no se muestran en esta pÃ¡gina."
    );

    function esMuestraVisual(texto) {
        const t = norm(texto);
        return /^muestras visuales de ing (1|3|7)\. toca una imagen para verla en detalle\.?$/.test(t);
    }

    function limpiar() {
        let mensajeVipPuesto = false;

        document
            .querySelectorAll("p, span, small, div")
            .forEach(function (el) {
                if (el.children.length > 4) return;

                const t = norm(el.textContent);
                if (!t || t.length > 500) return;

                if (t === TEXTO_VIP) {
                    if (!mensajeVipPuesto) {
                        el.textContent = "Elige la opciÃ³n que prefieras.";
                        el.style.display = "";
                        mensajeVipPuesto = true;
                    } else {
                        el.remove();
                    }
                    return;
                }

                if (t === TEXTO_LINEA) {
                    el.remove();
                    return;
                }

                if (t === TEXTO_ARCHIVOS || t === TEXTO_VISTA) {
                    el.remove();
                    return;
                }

                if (esMuestraVisual(el.textContent)) {
                    el.remove();
                }
            });

        /*
            media-v54.js vuelve a escribir esta nota cuando renderiza.
            La ocultamos por ID para que no pueda reaparecer visualmente.
        */
        const notaMedia = document.getElementById("mediaV54Nota");
        if (notaMedia) {
            notaMedia.textContent = "";
            notaMedia.style.display = "none";
        }

        /*
            Por seguridad, eliminamos el detalle que V6.8 insertaba
            cuando contiene justamente el texto que ya no queremos.
        */
        document.querySelectorAll(".vipDetailV68").forEach(function (el) {
            const t = norm(el.textContent);
            if (t === TEXTO_LINEA || t === TEXTO_VIP) {
                el.remove();
            }
        });
    }

    function iniciar() {
        limpiar();

        /*
            Algunos scripts antiguos renderizan despuÃ©s de DOMContentLoaded.
            Por eso repetimos una vez y luego observamos cambios puntuales.
        */
        setTimeout(limpiar, 120);
        setTimeout(limpiar, 500);

        const observer = new MutationObserver(function () {
            limpiar();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }
})();
