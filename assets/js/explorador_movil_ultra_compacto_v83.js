(function () {
    "use strict";

    function norm(t) {
        return (t || "").trim().toLowerCase();
    }

    function addClassToExplorer() {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3"));
        let section = null;

        for (const h of headings) {
            const txt = norm(h.textContent);
            if (txt.includes("explora lo que incluye")) {
                section =
                    h.closest("section") ||
                    h.closest(".seccion") ||
                    h.closest(".panel") ||
                    h.closest(".card") ||
                    h.parentElement;
                break;
            }
        }

        if (!section) return;

        section.classList.add("mm-explorer-ultra-compact");

        // Botonera atrás/adelante
        const controls = Array.from(section.querySelectorAll("button, a"));
        const back = controls.find(el => norm(el.textContent).includes("atrás"));
        const next = controls.find(el => norm(el.textContent).includes("adelante"));
        if (back && next) {
            const p1 = back.parentElement;
            const p2 = next.parentElement;
            if (p1 && p1 === p2) {
                p1.classList.add("mm-explorer-nav");
            }
        }

        // Título del producto
        const all = Array.from(section.querySelectorAll("div, p, span, strong, h3, h4"));
        for (const el of all) {
            const txt = norm(el.textContent);
            if ((txt.includes("ing 1") || txt.includes("ing 3") || txt.includes("ing 7")) &&
                (txt.includes("planos") || txt.includes("bim") || txt.includes("cálculo") || txt.includes("calculo"))) {
                el.classList.add("mm-explorer-title");
                break;
            }
        }

        // Stats
        for (const el of all) {
            const txt = norm(el.textContent);
            if (txt.includes("carpetas") && txt.includes("archivos")) {
                el.classList.add("mm-explorer-stats");
                break;
            }
        }

        // Breadcrumb chip
        for (const el of all) {
            const txt = norm(el.textContent);
            if (txt === "ing 1" || txt === "ing 3" || txt === "ing 7") {
                (el.parentElement || el).classList.add("mm-explorer-breadcrumb");
            }
        }

        section.querySelectorAll("table").forEach(t => t.classList.add("mm-explorer-table"));
    }

    function init() {
        addClassToExplorer();
        setTimeout(addClassToExplorer, 300);
        setTimeout(addClassToExplorer, 1000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
