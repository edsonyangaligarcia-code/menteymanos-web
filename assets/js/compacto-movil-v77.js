(function () {
    "use strict";
    function fixText(root) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(function (node) {
            let t = node.nodeValue || "";
            t = t.replaceAll("Bloques Dinámicos para AutoCAD", "Bloques Dinámicos para AutoCAD");
            t = t.replaceAll("ING 6 â€” Bloques Dinámicos para AutoCAD", "ING 6 — Bloques Dinámicos para AutoCAD");
            t = t.replaceAll("Bloques Dinámicos para AutoCAD", "Bloques Dinámicos para AutoCAD");
            node.nodeValue = t;
        });
    }
    function apply() { fixText(document.body); }
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', apply); } else { apply(); }
    setTimeout(apply, 350); setTimeout(apply, 1200);
})();

