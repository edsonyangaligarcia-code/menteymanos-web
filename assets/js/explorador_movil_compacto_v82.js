(function () {
    "use strict";

    function textOf(el) {
        return (el && el.textContent ? el.textContent : "").trim().toLowerCase();
    }

    function buscarSeccionExplorador() {
        const headings = Array.from(document.querySelectorAll("h1, h2, h3"));

        for (const heading of headings) {
            const txt = textOf(heading);
            if (txt.includes("explora lo que incluye")) {
                const section =
                    heading.closest("section") ||
                    heading.closest(".seccion") ||
                    heading.closest(".card") ||
                    heading.closest(".panel") ||
                    heading.parentElement;

                if (section) {
                    return section;
                }
            }
        }

        return null;
    }

    function marcarExplorador() {
        const section = buscarSeccionExplorador();
        if (!section) return;

        section.classList.add("mm-explorer-compact-section");

        const search =
            section.querySelector('input[placeholder*="Buscar archivo"]') ||
            section.querySelector('input[placeholder*="Buscar archivo o carpeta"]') ||
            section.querySelector('input[type="search"]') ||
            section.querySelector('input[type="text"]');

        if (search) {
            const wrap = search.closest("div") || search.parentElement;
            if (wrap) wrap.classList.add("mm-explorer-search-wrap");
        }

        const buttons = Array.from(section.querySelectorAll("button, a"));
        const backBtn = buttons.find(b => textOf(b).includes("atrás"));
        const nextBtn = buttons.find(b => textOf(b).includes("adelante"));

        if (backBtn && nextBtn) {
            const parent = backBtn.parentElement;
            if (parent && parent === nextBtn.parentElement) {
                parent.classList.add("mm-explorer-nav");
            } else {
                const shared =
                    backBtn.closest("div") &&
                    nextBtn.closest("div") &&
                    backBtn.closest("div") === nextBtn.closest("div")
                        ? backBtn.closest("div")
                        : null;

                if (shared) shared.classList.add("mm-explorer-nav");
            }
        }

        const possibleStats = Array.from(section.querySelectorAll("p, small, div, span"));
        for (const el of possibleStats) {
            const txt = textOf(el);
            if (txt.includes("carpetas") && txt.includes("archivos")) {
                el.classList.add("mm-explorer-stats");
                break;
            }
        }

        const possibleTitle = Array.from(section.querySelectorAll("h3, h4, strong, div"));
        for (const el of possibleTitle) {
            const txt = textOf(el);
            if (txt.includes("ing 1") || txt.includes("ing 3") || txt.includes("ing 7")) {
                if (txt.includes("planos") || txt.includes("bim") || txt.includes("cálculo") || txt.includes("calculo")) {
                    el.classList.add("mm-explorer-title");
                    break;
                }
            }
        }

        const tables = section.querySelectorAll("table");
        tables.forEach(t => t.classList.add("mm-explorer-table"));

        // Chip tipo ING 1 / ING 3 / ING 7
        const chips = Array.from(section.querySelectorAll("span, div, a, strong"));
        chips.forEach(ch => {
            const txt = textOf(ch);
            if (txt === "ing 1" || txt === "ing 3" || txt === "ing 7") {
                const parent = ch.parentElement;
                if (parent) parent.classList.add("mm-explorer-breadcrumb");
            }
        });
    }

    function init() {
        marcarExplorador();
        setTimeout(marcarExplorador, 400);
        setTimeout(marcarExplorador, 1200);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
