(function () {
    "use strict";

    function norm(text) {
        return String(text || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }

    function byText(selector, text) {
        const goal = norm(text);
        return Array.from(document.querySelectorAll(selector)).find(el => norm(el.textContent).includes(goal));
    }

    function removeBlocksByText() {
        const snippets = [
            "los archivos solo se muestran como referencia. no se pueden abrir ni descargar desde esta pagina",
            "vista previa del contenido incluido. los archivos se muestran unicamente como referencia",
            "contraseÃ±as, patches, archivos temporales y datos internos no se muestran en esta pagina",
            "contrasenas, patches, archivos temporales y datos internos no se muestran en esta pagina"
        ];

        Array.from(document.querySelectorAll("p, div, small, span")).forEach(el => {
            const t = norm(el.textContent);
            if (!t) return;
            if (snippets.some(s => t.includes(s))) {
                const container = el.closest("p, div, section") || el;
                container.style.display = "none";
            }
        });
    }

    function styleDriveExplorerMore() {
        const explorerHeading = byText("h1,h2,h3,h4", "explora lo que incluye");
        if (!explorerHeading) return;
        const section = explorerHeading.closest("section") || explorerHeading.parentElement;
        if (!section) return;

        section.classList.add("driveLikeV68");

        const buttons = section.querySelectorAll("button, a");
        let backBtn = null;
        let nextBtn = null;

        buttons.forEach(btn => {
            const t = norm(btn.textContent);
            if (t.includes("atras")) backBtn = btn;
            if (t.includes("adelante")) nextBtn = btn;
            if (t.includes("ver que incluye")) {
                btn.classList.add("blueActionV69");
            }
        });

        if (backBtn) backBtn.classList.add("navBtnV68");
        if (nextBtn) nextBtn.classList.add("navBtnV68");
        if (backBtn && nextBtn && backBtn.parentElement === nextBtn.parentElement) {
            backBtn.parentElement.classList.add("driveNavWrapV68");
        }

        const rows = Array.from(section.querySelectorAll("tr"));
        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (!cells.length) return;
            const rowText = norm(row.textContent);
            if (rowText.includes("carpeta")) {
                row.classList.add("folderV69");
                const first = cells[0];
                if (first && !first.querySelector(".folderIconV69")) {
                    const wrap = document.createElement("span");
                    wrap.className = "firstColDriveV69";
                    const icon = document.createElement("span");
                    icon.className = "folderIconV69";
                    icon.innerHTML = "ðŸ“";

                    const text = document.createElement("span");
                    text.textContent = first.textContent.trim();

                    first.textContent = "";
                    wrap.appendChild(icon);
                    wrap.appendChild(text);
                    first.appendChild(wrap);
                }
            }
        });
    }

    function findChoiceHeading() {
        return byText("h1,h2,h3,h4", "elige 1 ing adicional")
            || byText("h1,h2,h3,h4", "elige 2 ing adicionales")
            || byText("h1,h2,h3,h4", "vip full seleccionado");
    }

    function addSelectionGuide() {
        const heading = findChoiceHeading();
        if (!heading) return;
        heading.classList.add("offerJumpTargetV69");
        const section = heading.closest("section") || heading.parentElement;
        if (!section) return;
        if (section.querySelector(".selectionGuideV69")) return;

        const guide = document.createElement("div");
        guide.className = "selectionGuideV69";
        guide.innerHTML = "<strong>Siguiente paso:</strong> elige aquÃ­ tu adicional y luego continÃºa por WhatsApp. Si deseas comparar mejor, toca <strong>â€˜Ver quÃ© incluyeâ€™</strong> en cualquiera de los ING.";
        heading.insertAdjacentElement("afterend", guide);
    }

    function smoothScrollToChoiceSection() {
        const target = findChoiceHeading();
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.pageYOffset - 92;
        window.scrollTo({ top, behavior: "smooth" });
    }

    function hookOfferButtons() {
        const buttons = Array.from(document.querySelectorAll("button, a"));
        buttons.forEach(btn => {
            const t = norm(btn.textContent);
            if (
                t.includes("elegir combo pro") ||
                t.includes("quiero vip full") ||
                t.includes("elegir vip full") ||
                t.includes("elegir esta opcion") ||
                t === "seleccionado"
            ) {
                btn.addEventListener("click", () => {
                    setTimeout(smoothScrollToChoiceSection, 220);
                });
            }
        });
    }

    function clarifyVipCard() {
        const all = Array.from(document.querySelectorAll("div, p, span, h1, h2, h3, h4"));
        const vipTitle = all.find(el => norm(el.textContent) === "los 7 ing completos");
        if (!vipTitle) return;

        const card = vipTitle.closest("div");
        if (!card) return;
        const parent = card.parentElement || card;
        if (parent.querySelector(".vipDetailV68")) return;

        const d = document.createElement("div");
        d.className = "vipDetailV68";
        d.textContent = "Elige la opción que mejor se adapte a lo que necesitas.";
        parent.appendChild(d);
    }

    function init() {
        removeBlocksByText();
        styleDriveExplorerMore();
        addSelectionGuide();
        hookOfferButtons();
        clarifyVipCard();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();

