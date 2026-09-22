(function () {
    "use strict";

    const ING_LINEA = [
        {
            code: "ING 1",
            title: "Planos y Expedientes",
            desc: "Planos DWG, expedientes, cortes, elevaciones e instalaciones.",
            key: "ing1"
        },
        {
            code: "ING 2",
            title: "Expedientes, Licencias y Costos",
            desc: "Normativa, metrados, costos, formatos y documentación técnica.",
            key: "ing2"
        },
        {
            code: "ING 3",
            title: "BIM y Revit",
            desc: "Plantillas, familias, proyectos y formación BIM.",
            key: "ing3"
        },
        {
            code: "ING 4",
            title: "Coordinación BIM Avanzada",
            desc: "Navisworks, Dynamo, coordinación y automatización.",
            key: "ing4"
        },
        {
            code: "ING 5",
            title: "Gestión y Supervisión de Obras",
            desc: "Residencia, supervisión, planeamiento y control.",
            key: "ing5"
        },
        {
            code: "ING 6",
            title: "AutoCAD + Bloques",
            desc: "Bloques, productividad y recursos CAD.",
            key: "ing6"
        },
        {
            code: "ING 7",
            title: "Cálculo Estructural PRO",
            desc: "S2K, Mathcad, Tekla y recursos de cálculo estructural.",
            key: "ing7"
        }
    ];

    function norm(text) {
        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function findHeadingByText(text) {
        const objetivo = norm(text);
        const heads = document.querySelectorAll("h1, h2, h3, h4, h5");
        for (const h of heads) {
            const val = norm(h.textContent);
            if (val.includes(objetivo)) return h;
        }
        return null;
    }

    function findSectionByHeading(text) {
        const heading = findHeadingByText(text);
        if (!heading) return null;
        return (
            heading.closest("section") ||
            heading.closest(".section") ||
            heading.parentElement
        );
    }

    function getCurrentProductKey() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get("producto");
        if (fromUrl) return fromUrl.toLowerCase();

        const selector = document.getElementById("selectorProducto");
        if (selector && selector.value) return String(selector.value).toLowerCase();

        const bodyText = norm(document.body.innerText);
        if (bodyText.includes("ing 3")) return "ing3";
        if (bodyText.includes("ing 7")) return "ing7";
        return "ing1";
    }

    function insertLineaIngSimple() {
        const ref = findSectionByHeading("Arma tu paquete") || findSectionByHeading("Elige tu oferta");
        if (!ref) return;
        if (document.getElementById("lineaIngSimpleV68")) return;

        const actual = getCurrentProductKey();

        const wrapper = document.createElement("section");
        wrapper.id = "lineaIngSimpleV68";
        wrapper.className = "lineaIngSimpleV68 compactBlockV68";
        wrapper.innerHTML = `
            <div class="lineaIngEyebrowV68">Línea completa</div>
            <h2 class="lineaIngTitleV68">Conoce todos los ING antes de elegir</h2>
            <p class="lineaIngDescV68">
                Así entiendes mejor qué incluye cada opción y por qué puedes complementar tu compra con otros ING.
            </p>
            <div class="lineaIngGridV68">
                ${ING_LINEA.map(item => `
                    <div class="lineaIngItemV68 ${item.key === actual ? "activo" : ""}">
                        <div class="lineaIngCodeV68">${item.code}</div>
                        <div>
                            <div class="lineaIngTextV68">${item.title}</div>
                            <div class="lineaIngMetaV68">${item.desc}</div>
                            ${item.key === actual ? `<span class="lineaIngBadgeV68">Producto por el que llegó el cliente</span>` : ``}
                        </div>
                    </div>
                `).join("")}
            </div>
        `;

        ref.parentNode.insertBefore(wrapper, ref);
    }

    function styleExplorerAsDrive() {
        const section = findSectionByHeading("Explora lo que incluye");
        if (!section) return;

        section.classList.add("driveLikeV68");

        const heads = section.querySelectorAll("h1, h2, h3, h4");
        heads.forEach(h => {
            if (norm(h.textContent).includes("explora lo que incluye")) {
                h.classList.add("driveAccentV68");
            }
        });

        const search = section.querySelector('input[type="text"], input[type="search"]');
        if (search) {
            search.placeholder = "Buscar archivo o carpeta...";
        }

        const allButtons = section.querySelectorAll("button, a");
        let navWrap = null;

        allButtons.forEach(btn => {
            const t = norm(btn.textContent);

            if (t.includes("atras") || t.includes("adelante")) {
                btn.classList.add("navBtnV68");

                if (!navWrap) {
                    navWrap = document.createElement("div");
                    navWrap.className = "driveNavWrapV68";
                }

                const parent = btn.parentElement;
                if (parent && !parent.classList.contains("driveNavWrapV68")) {
                    // more robust: let CSS style button; wrap only if both are siblings later
                }
            }

            if (t.includes("elegir oferta")) {
                btn.classList.add("mobileStickyCtaV68", "ctaPulseV68");
            }
        });

        // Try to wrap only if both buttons exist in same row
        const navCandidates = Array.from(allButtons).filter(btn => {
            const t = norm(btn.textContent);
            return t.includes("atras") || t.includes("adelante");
        });

        if (navCandidates.length >= 2) {
            const first = navCandidates[0];
            const second = navCandidates[1];
            const sameParent = first.parentElement && first.parentElement === second.parentElement;

            if (sameParent && !first.parentElement.classList.contains("driveNavWrapV68")) {
                first.parentElement.classList.add("driveNavWrapV68");
            }
        }
    }

    function refineVipTexts() {
        const allElements = document.querySelectorAll("h1, h2, h3, h4, h5, div, span, p");
        allElements.forEach(el => {
            const t = norm(el.textContent);

            if (t === "los 7 ing completos") {
                const card = el.closest("div");
                const maybeP = card ? card.parentElement.querySelector("p, div") : null;
                if (maybeP && norm(maybeP.textContent).length < 180) {
                    maybeP.textContent = "Elige la opción que mejor se adapte a lo que necesitas.";
                }

                if (card && !card.parentElement.querySelector(".vipDetailV68")) {
                    const detail = document.createElement("div");
                    detail.className = "vipDetailV68";
                    detail.textContent = "";
                    card.parentElement.appendChild(detail);
                }
            }
        });
    }

    function addSelectionHints() {
        const heading = findHeadingByText("Elige 1 ING adicional")
            || findHeadingByText("Elige 2 ING adicionales")
            || findHeadingByText("VIP Full seleccionado");

        if (!heading) return;

        const section = heading.closest("section") || heading.parentElement;
        if (!section) return;
        if (section.querySelector(".conversionHintV68")) return;

        const hint = document.createElement("div");
        hint.className = "conversionHintV68";
        hint.innerHTML = `
            <strong>¿Cómo usar esta parte?</strong><br>
            1) Primero elige tu opción de compra.<br>
            2) Luego toca un ING adicional o pulsa <strong>“Ver qué incluye”</strong> para revisar rápido el contenido.<br>
            3) Cuando termines, usa el botón verde para continuar por WhatsApp.
        `;

        heading.insertAdjacentElement("afterend", hint);
    }

    function enhanceIncludeButtons() {
        const buttons = document.querySelectorAll("button, a");
        buttons.forEach(btn => {
            const t = norm(btn.textContent);

            if (t.includes("ver que incluye")) {
                btn.classList.add("includeButtonV68");

                btn.addEventListener("click", function () {
                    setTimeout(() => {
                        const card = btn.closest("div");
                        if (card) {
                            card.scrollIntoView({
                                behavior: "smooth",
                                block: "center"
                            });
                        }
                    }, 140);
                }, { once: false });
            }
        });
    }

    function makeOfferSelectionClear() {
        const allButtons = document.querySelectorAll("button, a");
        allButtons.forEach(btn => {
            const t = norm(btn.textContent);

            if (
                t.includes("elegir combo pro") ||
                t.includes("quiero vip full") ||
                t.includes("elegir vip full") ||
                t.includes("elegir esta opcion") ||
                t === "seleccionado"
            ) {
                btn.addEventListener("click", function () {
                    setTimeout(() => {
                        const target =
                            findHeadingByText("Elige 1 ING adicional") ||
                            findHeadingByText("Elige 2 ING adicionales") ||
                            findHeadingByText("VIP Full seleccionado") ||
                            findHeadingByText("Tu pedido");

                        if (target) {
                            target.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                        }
                    }, 180);
                }, { once: false });
            }
        });
    }

    function addProductClarifiers() {
        const labels = [
            ["ING 2", "Expedientes, licencias, metrados y costos."],
            ["ING 3", "BIM, Revit, plantillas, familias y formación."],
            ["ING 4", "Coordinación BIM, Navisworks y automatización."],
            ["ING 5", "Gestión, supervisión y control de obra."],
            ["ING 6", "AutoCAD, bloques y productividad CAD."],
            ["ING 7", "Cálculo estructural, software y recursos PRO."]
        ];

        labels.forEach(([code, txt]) => {
            const nodes = Array.from(document.querySelectorAll("div, label, p, h3, h4, h5, span"))
                .filter(el => norm(el.textContent).startsWith(norm(code + " ")));

            nodes.forEach(el => {
                const card = el.closest("div");
                if (!card) return;
                if (card.querySelector(".subInfoV68")) return;

                const btnArea = Array.from(card.querySelectorAll("a, button")).find(x => norm(x.textContent).includes("ver que incluye"));
                if (btnArea) {
                    const info = document.createElement("div");
                    info.className = "subInfoV68";
                    info.innerHTML = `<strong>${code}</strong> · ${txt}`;
                    btnArea.insertAdjacentElement("afterend", info);
                }
            });
        });
    }

    function equalizeExplorerButtons() {
        const buttons = document.querySelectorAll("button, a");

        let backBtn = null;
        let nextBtn = null;

        buttons.forEach(btn => {
            const t = norm(btn.textContent);
            if (t.includes("atras")) backBtn = backBtn || btn;
            if (t.includes("adelante")) nextBtn = nextBtn || btn;
        });

        if (backBtn) backBtn.classList.add("navBtnV68");
        if (nextBtn) nextBtn.classList.add("navBtnV68");

        if (backBtn && nextBtn && backBtn.parentElement === nextBtn.parentElement) {
            backBtn.parentElement.classList.add("driveNavWrapV68");
        }
    }

    function attachFolderColor() {
        const explorer = findSectionByHeading("Explora lo que incluye");
        if (!explorer) return;

        const rows = explorer.querySelectorAll("tr, li, .row, .item, div");
        rows.forEach(row => {
            const tx = norm(row.textContent);
            if (tx.includes("carpeta")) {
                row.classList.add("folderV68");
            }
        });
    }

    function activate() {
        document.documentElement.classList.add("mobileConversionV68");

        insertLineaIngSimple();
        styleExplorerAsDrive();
        refineVipTexts();
        addSelectionHints();
        enhanceIncludeButtons();
        makeOfferSelectionClear();
        addProductClarifiers();
        equalizeExplorerButtons();
        attachFolderColor();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", activate);
    } else {
        activate();
    }

})();

