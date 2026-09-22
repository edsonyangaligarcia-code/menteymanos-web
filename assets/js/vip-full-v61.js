(function () {
    "use strict";


    let vipActivoAnterior =
        false;


    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function vipEstaActivo() {

        /*
            Forma 1:
            encabezado que ya genera el configurador:
            "VIP Full seleccionado"
        */

        const textos =
            Array.from(
                document.querySelectorAll(
                    "h1,h2,h3,h4,strong,span"
                )
            );


        const encabezadoVip =
            textos.some(
                elemento =>
                    normalizar(
                        elemento.textContent
                    ) ===
                    "vip full seleccionado"
            );


        if (encabezadoVip) {
            return true;
        }


        /*
            Forma 2:
            buscar el botón "Seleccionado" de la tarjeta VIP.
        */

        const botones =
            Array.from(
                document.querySelectorAll(
                    "button"
                )
            );


        const seleccionado =
            botones.find(
                boton =>
                    normalizar(
                        boton.textContent
                    ) ===
                    "seleccionado"
            );


        if (!seleccionado) {
            return false;
        }


        let nodo =
            seleccionado;


        for (
            let i = 0;
            nodo && i < 7;
            i++,
            nodo = nodo.parentElement
        ) {

            const texto =
                normalizar(
                    nodo.innerText
                );


            if (
                texto.includes(
                    "vip full"
                )
            ) {
                return true;
            }


            if (
                texto.includes(
                    "combo pro"
                ) ||
                texto.includes(
                    "opcion 1"
                )
            ) {
                return false;
            }
        }


        return false;
    }


    function tarjetasAdicionales() {

        return Array.from(
            document.querySelectorAll(
                "#listaAdicionales .adicionalWrap"
            )
        );
    }


    function activarVipVisual() {

        for (
            const tarjeta of
            tarjetasAdicionales()
        ) {

            const input =
                tarjeta.querySelector(
                    'input[type="checkbox"]'
                );


            if (input) {

                /*
                    Guardamos el estado que tenía antes de VIP
                    una sola vez.
                */

                if (
                    input.dataset.vipEstadoGuardado !==
                    "1"
                ) {

                    input.dataset.vipEstadoGuardado =
                        "1";

                    input.dataset.vipAntes =
                        input.checked
                            ? "1"
                            : "0";
                }


                input.checked =
                    true;

                input.disabled =
                    true;

                input.setAttribute(
                    "aria-disabled",
                    "true"
                );
            }


            tarjeta.classList.add(
                "seleccionado",
                "incluidoVipV61"
            );


            const estado =
                tarjeta.querySelector(
                    ".estadoSeleccion"
                );


            if (estado) {

                if (
                    !estado.dataset.textoAntesVip
                ) {
                    estado.dataset.textoAntesVip =
                        estado.textContent ||
                        "SELECCIONADO";
                }


                estado.textContent =
                    "INCLUIDO EN VIP";

                estado.classList.remove(
                    "oculto"
                );
            }
        }
    }


    function desactivarVipVisual() {

        for (
            const tarjeta of
            tarjetasAdicionales()
        ) {

            const input =
                tarjeta.querySelector(
                    'input[type="checkbox"]'
                );


            let seleccionadoAntes =
                false;


            if (input) {

                seleccionadoAntes =
                    input.dataset.vipAntes ===
                    "1";


                input.disabled =
                    false;

                input.removeAttribute(
                    "aria-disabled"
                );


                /*
                    Restauramos exactamente cómo estaba
                    antes de elegir VIP.
                */

                if (
                    input.dataset.vipEstadoGuardado ===
                    "1"
                ) {
                    input.checked =
                        seleccionadoAntes;
                }


                delete input.dataset.vipAntes;
                delete input.dataset.vipEstadoGuardado;
            }


            tarjeta.classList.remove(
                "incluidoVipV61"
            );


            tarjeta.classList.toggle(
                "seleccionado",
                seleccionadoAntes
            );


            const estado =
                tarjeta.querySelector(
                    ".estadoSeleccion"
                );


            if (estado) {

                estado.textContent =
                    estado.dataset.textoAntesVip ||
                    "SELECCIONADO";


                delete estado.dataset.textoAntesVip;


                estado.classList.toggle(
                    "oculto",
                    !seleccionadoAntes
                );
            }
        }
    }


    function etiquetasTuPedido() {

        return Array.from(
            document.querySelectorAll(
                "div,span,p,small"
            )
        ).filter(
            elemento => {

                /*
                    Solo elementos cuyo contenido propio
                    sea exactamente TU PEDIDO.
                */

                const tieneHijosConTexto =
                    Array.from(
                        elemento.children
                    ).some(
                        hijo =>
                            normalizar(
                                hijo.textContent
                            ).length > 0
                    );


                return (
                    !tieneHijosConTexto &&
                    normalizar(
                        elemento.textContent
                    ) ===
                    "tu pedido"
                );
            }
        );
    }


    function ocultarResumenVip(
        activo
    ) {

        /*
            Resumen creado por V5.9.
        */

        const resumen =
            document.getElementById(
                "resumenPedidoV59"
            );


        if (resumen) {

            resumen.style.display =
                activo
                    ? "none"
                    : "";
        }


        /*
            Compatibilidad si quedara un resumen anterior.
        */

        const resumen58 =
            document.getElementById(
                "resumenPedidoV58"
            );


        if (resumen58) {

            resumen58.style.display =
                activo
                    ? "none"
                    : "";
        }


        /*
            También ocultamos solo la pequeña etiqueta
            "TU PEDIDO" cuando VIP está activo.
        */

        for (
            const etiqueta of
            etiquetasTuPedido()
        ) {

            etiqueta.style.display =
                activo
                    ? "none"
                    : "";
        }
    }


    function mejorarBotonVip(
        activo
    ) {

        const boton =
            document.querySelector(
                ".whatsappV59, .whatsappV58, .pedidoListoV60"
            );


        if (!boton) {
            return;
        }


        boton.classList.toggle(
            "botonVipV61",
            activo
        );


        /*
            V5.9 ya construye el texto correcto.
            Solo garantizamos que VIP muestre el copy
            simplificado solicitado.
        */

        if (activo) {

            boton.innerHTML = `
                <span class="waV59Principal">
                    Continuar por WhatsApp
                </span>

                <span class="waV59Detalle">
                    VIP Full · Los 7 ING completos · S/ 29.90
                </span>
            `;
        }
    }


    function aplicar() {

        const activo =
            vipEstaActivo();


        if (activo) {

            activarVipVisual();

        }
        else if (
            vipActivoAnterior
        ) {

            desactivarVipVisual();
        }


        ocultarResumenVip(
            activo
        );


        mejorarBotonVip(
            activo
        );


        vipActivoAnterior =
            activo;


        console.info(
            "[Mente & Manos VIP V6.1]",
            {
                vip:
                    activo,
                tarjetas:
                    tarjetasAdicionales()
                        .length
            }
        );
    }


    function programar(
        demora = 0
    ) {

        setTimeout(
            aplicar,
            demora
        );
    }


    function iniciar() {

        programar(
            120
        );


        /*
            Cambio de plan.
        */

        document.addEventListener(
            "click",
            function (event) {

                const boton =
                    event.target.closest(
                        "button"
                    );


                if (!boton) {
                    return;
                }


                const texto =
                    normalizar(
                        boton.textContent
                    );


                if (
                    texto.includes(
                        "vip full"
                    ) ||
                    texto.includes(
                        "combo pro"
                    ) ||
                    texto.includes(
                        "opcion 1"
                    ) ||
                    texto ===
                        "seleccionado"
                ) {

                    programar(
                        80
                    );

                    programar(
                        180
                    );
                }
            },
            true
        );


        /*
            Cambio ING 1 / ING 3 / ING 7.
        */

        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    vipActivoAnterior =
                        false;

                    programar(
                        150
                    );
                }
            );
        }


        /*
            Si el configurador vuelve a reconstruir tarjetas,
            reaplicamos estado VIP.
        */

        const lista =
            document.getElementById(
                "listaAdicionales"
            );


        if (lista) {

            const observer =
                new MutationObserver(
                    function () {

                        if (
                            vipEstaActivo()
                        ) {
                            programar(
                                20
                            );
                        }
                    }
                );


            observer.observe(
                lista,
                {
                    childList:
                        true,
                    subtree:
                        true
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
