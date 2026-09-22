(function () {
    "use strict";

    const mapaNombres = {
        "ing 1": "Planos y Expedientes",
        "ing 2": "Expedientes, Licencias y Costos",
        "ing 3": "BIM y Revit",
        "ing 4": "CoordinaciÃ³n BIM",
        "ing 5": "GestiÃ³n y SupervisiÃ³n de Obras",
        "ing 6": "Bloques Dinámicos para AutoCAD",
        "ing 7": "CÃ¡lculo Estructural PRO"
    };

    function texto(el) {
        return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
    }

    function corregirListadoLineaING() {
        const desc = document.querySelector(".lineaIngDescV68");
        if (desc) {
            desc.textContent = "Revisa rÃ¡pido quÃ© ING puedes combinar.";
        }

        document.querySelectorAll(".lineaIngItemV68").forEach(function (item) {
            const codeEl = item.querySelector(".lineaIngCodeV68");
            const textEl = item.querySelector(".lineaIngTextV68");
            const badgeEl = item.querySelector(".lineaIngBadgeV68");

            if (!codeEl || !textEl) return;

            const key = texto(codeEl).toLowerCase();
            if (mapaNombres[key]) {
                textEl.textContent = mapaNombres[key];
            }

            if (badgeEl) {
                badgeEl.textContent = "Tu producto";
            }
        });
    }

    function corregirTextosGlobales() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        const cambios = [
            ["AutoCAD + Bloques", "Bloques Dinámicos para AutoCAD"],
            ["Bloques dinámicos, librerías y recursos listos para AutoCAD.", "Bloques dinÃ¡micos para AutoCAD."],
            ["Recomendado para complementar ING 1", "Bloques dinÃ¡micos para AutoCAD."],
            ["Bloques productivos y recursos CAD.", "Bloques dinÃ¡micos para AutoCAD."]
        ];

        const nodos = [];
        while (walker.nextNode()) {
            nodos.push(walker.currentNode);
        }

        nodos.forEach(function (node) {
            let valor = node.nodeValue;
            let nuevo = valor;

            cambios.forEach(function (par) {
                nuevo = nuevo.split(par[0]).join(par[1]);
            });

            if (nuevo !== valor) {
                node.nodeValue = nuevo;
            }
        });
    }

    function corregirTarjetasING6() {
        const contenedores = document.querySelectorAll("div, article, section, li");

        contenedores.forEach(function (box) {
            const t = texto(box);
            if (!t) return;

            if (/ING 6/i.test(t) && /(AutoCAD \+ Bloques|Bloques DinÃ¡micos|recomendado para complementar)/i.test(t)) {
                const hijos = box.querySelectorAll("h1,h2,h3,h4,h5,strong,b,p,span,small,div");
                hijos.forEach(function (el) {
                    const tx = texto(el);
                    if (!tx) return;

                    if (/^ING 6\s*[â€”-]/i.test(tx) || tx === "AutoCAD + Bloques" || /ING 6.*AutoCAD \+ Bloques/i.test(tx)) {
                        el.textContent = "ING 6 â€” Bloques Dinámicos para AutoCAD";
                    }

                    if (
                        tx === "Bloques dinámicos, librerías y recursos listos para AutoCAD." ||
                        tx === "Recomendado para complementar ING 1" ||
                        tx === "Bloques productivos y recursos CAD."
                    ) {
                        el.textContent = "Bloques dinÃ¡micos para AutoCAD.";
                    }
                });
            }
        });
    }

    function aplicar() {
        corregirListadoLineaING();
        corregirTextosGlobales();
        corregirTarjetasING6();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", aplicar);
    } else {
        aplicar();
    }

    setTimeout(aplicar, 250);
    setTimeout(aplicar, 900);
    setTimeout(aplicar, 1800);
})();

