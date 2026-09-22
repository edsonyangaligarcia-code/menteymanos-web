(function () {
    "use strict";

    let planElegidoV84 = 0;
    let ultimoEstadoCompletoV84 = false;
    let bloqueoScrollV84 = false;


    function visible(elemento) {

        if (!elemento) {
            return false;
        }

        const estilo =
            window.getComputedStyle(
                elemento
            );

        return (
            estilo.display !== "none" &&
            estilo.visibility !== "hidden" &&
            elemento.getClientRects().length > 0
        );
    }


    function scrollSuaveConOffset(
        elemento,
        offset
    ) {

        if (
            !elemento ||
            bloqueoScrollV84
        ) {
            return;
        }

        bloqueoScrollV84 = true;

        const top =
            elemento
                .getBoundingClientRect()
                .top +
            window.pageYOffset -
            offset;

        window.scrollTo({
            top:
                Math.max(
                    0,
                    top
                ),
            behavior:
                "smooth"
        });

        setTimeout(
            function () {
                bloqueoScrollV84 =
                    false;
            },
            550
        );
    }


    function scrollAlSelector() {

        const titulo =
            document.getElementById(
                "tituloConfigurador"
            );

        const configurador =
            document.getElementById(
                "configurador"
            );

        const destino =
            visible(titulo)
                ? titulo
                : configurador;

        if (!destino) {
            return;
        }

        /*
            Dejamos el título algo más abajo del header.
            Así el cliente ve claramente:
            "Elige 1/2 ING adicional..."
        */

        scrollSuaveConOffset(
            destino,
            window.innerWidth <= 760
                ? 92
                : 110
        );
    }


    function encontrarBotonWhatsapp() {

        const principal =
            document.getElementById(
                "continuarWhatsapp"
            );

        if (
            principal &&
            visible(principal)
        ) {
            return principal;
        }

        const vip =
            document.getElementById(
                "vipContinuar"
            );

        if (
            vip &&
            visible(vip)
        ) {
            return vip;
        }

        return (
            Array.from(
                document.querySelectorAll(
                    "button, a"
                )
            ).find(
                elemento =>
                    visible(elemento) &&
                    /continuar.*whatsapp/i.test(
                        elemento.textContent || ""
                    )
            ) ||
            null
        );
    }


    function botonWhatsappListo(
        boton
    ) {

        if (!boton) {
            return false;
        }

        if (
            "disabled" in boton &&
            boton.disabled
        ) {
            return false;
        }

        if (
            boton.getAttribute(
                "aria-disabled"
            ) === "true"
        ) {
            return false;
        }

        return true;
    }


    function llevarAWhatsapp(
        intento
    ) {

        const numeroIntento =
            intento || 0;

        const boton =
            encontrarBotonWhatsapp();

        /*
            Damos tiempo a whatsapp-v60.js /
            resumen-pedido-v59.js para habilitar
            el botón después de la selección.
        */

        if (
            !boton ||
            !botonWhatsappListo(
                boton
            )
        ) {

            if (
                numeroIntento < 10
            ) {
                setTimeout(
                    function () {
                        llevarAWhatsapp(
                            numeroIntento + 1
                        );
                    },
                    100
                );
            }

            return;
        }

        /*
            El botón queda aproximadamente en el centro
            de la pantalla, cómodo para pulsarlo.
        */

        const rect =
            boton.getBoundingClientRect();

        const top =
            rect.top +
            window.pageYOffset -
            (
                window.innerHeight / 2
            ) +
            (
                rect.height / 2
            );

        window.scrollTo({
            top:
                Math.max(
                    0,
                    top
                ),
            behavior:
                "smooth"
        });
    }


    function cantidadNecesaria() {

        if (
            planElegidoV84 === 1
        ) {
            return 1;
        }

        if (
            planElegidoV84 === 2
        ) {
            return 2;
        }

        return 0;
    }


    function adicionalesMarcados() {

        return Array.from(
            document.querySelectorAll(
                '#listaAdicionales input[type="checkbox"]'
            )
        ).filter(
            input =>
                input.checked &&
                !input.disabled
        ).length;
    }


    function adicionalesMarcadosIncluyendoVisual() {

        const claves =
            new Set();

        document
            .querySelectorAll(
                "#listaAdicionales .adicionalWrap"
            )
            .forEach(
                tarjeta => {

                    const input =
                        tarjeta.querySelector(
                            'input[type="checkbox"]'
                        );

                    const seleccionado =
                        !!input?.checked ||
                        tarjeta.classList.contains(
                            "seleccionado"
                        );

                    if (
                        seleccionado &&
                        tarjeta.dataset.ing
                    ) {
                        claves.add(
                            tarjeta.dataset.ing
                        );
                    }
                }
            );

        return claves.size;
    }


    function pedidoCompleto() {

        if (
            planElegidoV84 === 3
        ) {
            return true;
        }

        const necesarios =
            cantidadNecesaria();

        if (!necesarios) {
            return false;
        }

        /*
            Normalmente basta el checkbox.
            La segunda lectura cubre el renderer
            de respaldo del configurador.
        */

        const seleccionados =
            Math.max(
                adicionalesMarcados(),
                adicionalesMarcadosIncluyendoVisual()
            );

        return (
            seleccionados >=
            necesarios
        );
    }


    function planDesdeBoton(
        boton
    ) {

        if (!boton) {
            return 0;
        }

        const directo =
            Number(
                boton.dataset.plan ||
                boton.closest(
                    "[data-plan]"
                )?.dataset.plan ||
                0
            );

        if (
            directo >= 1 &&
            directo <= 3
        ) {
            return directo;
        }

        const tarjeta =
            boton.closest(
                ".oferta[data-oferta]"
            );

        if (tarjeta) {

            const porTarjeta =
                Number(
                    tarjeta.dataset.oferta
                );

            if (
                porTarjeta >= 1 &&
                porTarjeta <= 3
            ) {
                return porTarjeta;
            }
        }

        return 0;
    }


    function manejarEleccionPlan(
        boton
    ) {

        const plan =
            planDesdeBoton(
                boton
            );

        if (!plan) {
            return;
        }

        planElegidoV84 =
            plan;

        ultimoEstadoCompletoV84 =
            false;

        if (
            plan === 3
        ) {

            /*
                VIP Full:
                todos los ING están incluidos.
                Va directo al CTA de WhatsApp.
            */

            setTimeout(
                function () {
                    llevarAWhatsapp(0);
                },
                420
            );

            return;
        }

        /*
            Opción 1 / Combo:
            esperamos a que el configurador sea
            renderizado y bajamos al encabezado.
        */

        setTimeout(
            scrollAlSelector,
            330
        );
    }


    function manejarCambioAdicional(
        input
    ) {

        if (
            !input ||
            (
                planElegidoV84 !== 1 &&
                planElegidoV84 !== 2
            )
        ) {
            return;
        }

        /*
            Esperamos a que app.js, V5.7, V5.9 y V6.0
            terminen de actualizar la selección.
        */

        setTimeout(
            function () {

                const completo =
                    pedidoCompleto();

                /*
                    Solo hacemos el salto en el momento
                    exacto en que el pedido pasa de
                    incompleto -> completo.
                */

                if (
                    completo &&
                    !ultimoEstadoCompletoV84
                ) {

                    ultimoEstadoCompletoV84 =
                        true;

                    setTimeout(
                        function () {
                            llevarAWhatsapp(0);
                        },
                        120
                    );
                }
                else if (
                    !completo
                ) {
                    ultimoEstadoCompletoV84 =
                        false;
                }

            },
            170
        );
    }


    function detectarPlanInicial() {

        const seleccionada =
            document.querySelector(
                ".oferta.ofertaSeleccionada[data-oferta]"
            );

        if (seleccionada) {
            planElegidoV84 =
                Number(
                    seleccionada.dataset.oferta
                ) || 0;
        }
    }


    function iniciar() {

        detectarPlanInicial();


        /*
            OFERTAS
            Captura todos los botones .elegirOferta
            sin importar ING 1, ING 3 o ING 7.
        */

        document.addEventListener(
            "click",
            function (event) {

                const boton =
                    event.target.closest(
                        ".elegirOferta"
                    );

                if (!boton) {
                    return;
                }

                manejarEleccionPlan(
                    boton
                );

            },
            false
        );


        /*
            ADICIONALES
            Funciona cuando se toca la tarjeta/label
            porque finalmente cambia el checkbox.
        */

        document.addEventListener(
            "change",
            function (event) {

                const input =
                    event.target.closest(
                        '#listaAdicionales input[type="checkbox"]'
                    );

                if (!input) {
                    return;
                }

                manejarCambioAdicional(
                    input
                );

            },
            false
        );


        /*
            Si se cambia de producto internamente,
            reiniciamos memoria del flujo.
        */

        const selector =
            document.getElementById(
                "selectorProducto"
            );

        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    planElegidoV84 =
                        0;

                    ultimoEstadoCompletoV84 =
                        false;
                }
            );
        }


        console.info(
            "[Mente & Manos V8.4] Flujo compra automático listo."
        );
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
