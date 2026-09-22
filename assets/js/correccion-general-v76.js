(function () {
    "use strict";

    const ING = [
        { key: "ing1", codigo: "ING 1", nombre: "Planos y Expedientes" },
        { key: "ing2", codigo: "ING 2", nombre: "Expedientes, Licencias y Costos" },
        { key: "ing3", codigo: "ING 3", nombre: "BIM y Revit" },
        { key: "ing4", codigo: "ING 4", nombre: "Coordinación BIM Avanzada" },
        { key: "ing5", codigo: "ING 5", nombre: "Gestión y Supervisión de Obras" },
        { key: "ing6", codigo: "ING 6", nombre: "AutoCAD + Bloques Dinámicos" },
        { key: "ing7", codigo: "ING 7", nombre: "Cálculo Estructural PRO" }
    ];

    function productoActual() {
        const params = new URLSearchParams(window.location.search);
        const desdeUrl = String(params.get("producto") || "").toLowerCase();

        if (ING.some(x => x.key === desdeUrl)) {
            return desdeUrl;
        }

        const selector = document.getElementById("selectorProducto");

        if (selector && ING.some(x => x.key === selector.value)) {
            return selector.value;
        }

        return "ing1";
    }

    function corregirMojibakeTexto(texto) {
        let t = String(texto || "");

        const cambios = [
            ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
            ["Ã", "Á"], ["Ã‰", "É"], ["Ã", "Í"], ["Ã“", "Ó"], ["Ãš", "Ú"],
            ["Ã±", "ñ"], ["Ã‘", "Ñ"],
            ["Â¿", "¿"], ["Â¡", "¡"], ["Â", ""],
            ["â€”", "—"], ["â€“", "–"], ["â€™", "’"],
            ["â€œ", "“"], ["â€", "”"],
            ["â†’", "→"], ["â†", "←"],
            ["â€¦", "…"],
            ["ÃƒÂ³", "ó"], ["ÃƒÂ¡", "á"], ["ÃƒÂ©", "é"],
            ["ÃƒÂ­", "í"], ["ÃƒÂº", "ú"], ["ÃƒÂ±", "ñ"]
        ];

        cambios.forEach(function (par) {
            t = t.split(par[0]).join(par[1]);
        });

        return t;
    }

    function corregirMojibake(root) {
        if (!root) return;

        const walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT
        );

        const nodos = [];

        while (walker.nextNode()) {
            nodos.push(walker.currentNode);
        }

        nodos.forEach(function (nodo) {
            const antes = nodo.nodeValue || "";
            const despues = corregirMojibakeTexto(antes);

            if (antes !== despues) {
                nodo.nodeValue = despues;
            }
        });
    }

    function reconstruirLineaING() {
        const original =
            document.getElementById("lineaIngSimpleV68") ||
            document.querySelector(".lineaIngSimpleV68") ||
            document.querySelector(".lineaIngSimpleV76");

        if (!original) {
            return;
        }

        const actual = productoActual();

        original.id = "lineaIngSimpleV76";
        original.className = "lineaIngSimpleV76";

        original.innerHTML = `
            <div class="lineaIngEyebrowV76">LÍNEA COMPLETA</div>
            <h2 class="lineaIngTitleV76">Toda la Línea ING</h2>
            <p class="lineaIngDescV76">Revisa rápido los ING disponibles para combinar.</p>

            <div class="lineaIngListaV76">
                ${ING.map(function (item) {
                    return `
                        <div class="lineaIngFilaV76 ${item.key === actual ? "esActualV76" : ""}">
                            <span class="lineaIngCodigoV76">${item.codigo}</span>
                            <span class="lineaIngNombreV76">${item.nombre}</span>
                            ${item.key === actual
                                ? '<span class="lineaIngActualV76">TU PRODUCTO</span>'
                                : ''
                            }
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    function corregirING6Global() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT
        );

        const nodos = [];

        while (walker.nextNode()) {
            nodos.push(walker.currentNode);
        }

        nodos.forEach(function (nodo) {
            let t = nodo.nodeValue || "";

            t = t
                .replaceAll("ING 6 — AutoCAD + Bloques", "ING 6 — AutoCAD + Bloques Dinámicos")
                .replaceAll("ING 6 - AutoCAD + Bloques", "ING 6 - AutoCAD + Bloques Dinámicos")
                .replaceAll("AutoCAD + Bloques", "AutoCAD + Bloques Dinámicos")
                .replaceAll("Bloques, productividad y recursos CAD.", "Bloques dinámicos para AutoCAD.")
                .replaceAll("Bloques productivos y recursos CAD.", "Bloques dinámicos para AutoCAD.");

            nodo.nodeValue = t;
        });
    }

    function aplicar() {
        corregirMojibake(document.body);
        reconstruirLineaING();
        corregirING6Global();
        corregirMojibake(document.body);
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
