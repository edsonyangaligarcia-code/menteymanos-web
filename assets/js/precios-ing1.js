(function () {
    "use strict";

    const precios = Object.freeze({ 1: 15.90, 2: 24.90, 3: 39.90 });
    function productoActual() {
        const selector = document.getElementById("selectorProducto");
        const ruta = window.location.pathname.match(/\/(ing1|ing3|ing7)(?:\/index\.html|\/)?$/i);
        return ruta?.[1].toLowerCase() || new URLSearchParams(window.location.search).get("producto") || selector?.value || "ing1";
    }
    window.preciosIng1 = Object.freeze({
        importe(plan, producto = productoActual()) {
            return producto === "ing1" ? precios[plan] : ({ 1: 12.90, 2: 15.90, 3: 29.90 })[plan];
        },
        texto(plan, producto = productoActual()) {
            return "S/ " + this.importe(plan, producto).toFixed(2);
        }
    });
})();
