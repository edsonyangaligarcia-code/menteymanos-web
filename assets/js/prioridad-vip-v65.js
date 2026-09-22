(function () {
    "use strict";


    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function elementoHojaConTexto(textoObjetivo) {

        const objetivo =
            normalizar(
                textoObjetivo
            );


        return Array.from(
            document.querySelectorAll(
                "span,strong,small,div,p,h2,h3,h4"
            )
        ).find(
            elemento => {

                if (
                    elemento.children.length >
                    0
                ) {
                    return false;
                }


                return (
                    normalizar(
                        elemento.textContent
                    ) ===
                    objetivo
                );
            }
        ) || null;
    }


    function encontrarTarjeta(
        textoClave,
        precioClave
    ) {

        const hoja =
            elementoHojaConTexto(
                textoClave
            );


        if (!hoja) {
            return null;
        }


        let nodo =
            hoja;


        for (
            let i = 0;
            nodo && i < 8;
            i++,
            nodo = nodo.parentElement
        ) {

            const texto =
                normalizar(
                    nodo.innerText
                );


            const tienePrecio =
                texto.includes(
                    normalizar(
                        precioClave
                    )
                );


            const tieneBoton =
                !!nodo.querySelector(
                    "button"
                );


            if (
                texto.includes(
                    normalizar(
                        textoClave
                    )
                ) &&
                tienePrecio &&
                tieneBoton
            ) {

                /*
                    Evitamos subir hasta el contenedor
                    que engloba las tres ofertas.
                */

                const mezcla =
                    texto.includes(
                        "opcion 1"
                    ) &&
                    texto.includes(
                        "combo pro"
                    ) &&
                    texto.includes(
                        "vip full"
                    );


                if (!mezcla) {
                    return nodo;
                }
            }
        }


        return null;
    }


    function quitarMejorValor() {

        const elementos =
            Array.from(
                document.querySelectorAll(
                    "span,strong,small,div"
                )
            );


        for (const elemento of elementos) {

            if (
                elemento.children.length >
                0
            ) {
                continue;
            }


            if (
                normalizar(
                    elemento.textContent
                ) ===
                "mejor valor"
            ) {

                /*
                    Lo eliminamos, no solo lo ocultamos,
                    para evitar que ocupe espacio.
                */

                elemento.remove();
            }
        }
    }


    function destacarVip() {

        const vip =
            encontrarTarjeta(
                "VIP FULL",
                "S/ 29.90"
            );


        if (!vip) {
            return;
        }


        vip.classList.add(
            "vipObjetivoV65"
        );


        /*
            Badge.
        */

        if (
            !vip.querySelector(
                ".vipBadgeV65"
            )
        ) {

            const badge =
                document.createElement(
                    "span"
                );


            badge.className =
                "vipBadgeV65";


            badge.textContent =
                "MAYOR AHORRO";


            vip.appendChild(
                badge
            );
        }


        /*
            Argumento de valor.
            Lo insertamos antes del botón.
        */

        if (
            !vip.querySelector(
                ".vipValorV65"
            )
        ) {

            const boton =
                vip.querySelector(
                    "button"
                );


            const valor =
                document.createElement(
                    "div"
                );


            valor.className =
                "vipValorV65";


            valor.innerHTML = `
                <strong>
                    7 ING completos
                </strong>

                <span>
                    Aprox. S/ 4.27 por ING
                </span>
            `;


            if (boton) {

                boton.insertAdjacentElement(
                    "beforebegin",
                    valor
                );

            }
            else {

                vip.appendChild(
                    valor
                );
            }
        }


        /*
            CTA VIP más claro.
        */

        const botonVip =
            Array.from(
                vip.querySelectorAll(
                    "button"
                )
            ).find(
                boton =>
                    normalizar(
                        boton.textContent
                    ).includes(
                        "vip full"
                    ) ||
                    normalizar(
                        boton.textContent
                    ) ===
                    "seleccionado"
            );


        if (botonVip) {

            botonVip.classList.add(
                "vipCtaV65"
            );


            if (
                normalizar(
                    botonVip.textContent
                ).includes(
                    "elegir vip full"
                )
            ) {
                botonVip.textContent =
                    "Quiero los 7 ING";
            }
        }
    }


    function limpiarCombo() {

        const combo =
            encontrarTarjeta(
                "COMBO PRO",
                "S/ 15.90"
            );


        if (!combo) {
            return;
        }


        combo.classList.add(
            "comboNeutralV65"
        );


        /*
            Si un badge viejo estuviera dentro del Combo,
            lo quitamos también por seguridad.
        */

        Array.from(
            combo.querySelectorAll(
                "*"
            )
        ).forEach(
            elemento => {

                if (
                    elemento.children.length ===
                    0 &&
                    normalizar(
                        elemento.textContent
                    ) ===
                    "mejor valor"
                ) {
                    elemento.remove();
                }
            }
        );
    }


    function aplicar() {

        quitarMejorValor();

        limpiarCombo();

        destacarVip();


        console.info(
            "[Mente & Manos V6.5] Prioridad visual VIP aplicada."
        );
    }


    function iniciar() {

        setTimeout(
            aplicar,
            100
        );


        /*
            Si app.js cambia producto u oferta y vuelve a
            pintar tarjetas, aplicamos el diseño de nuevo.
        */

        const observer =
            new MutationObserver(
                function () {

                    setTimeout(
                        aplicar,
                        25
                    );
                }
            );


        observer.observe(
            document.body,
            {
                childList:
                    true,
                subtree:
                    true
            }
        );


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    setTimeout(
                        aplicar,
                        100
                    );
                }
            );
        }
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    }
    else {

        iniciar();
    }

})();
