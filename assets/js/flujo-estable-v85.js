(function () {
    "use strict";


    let planV85 = 0;
    let pedidoCompletoAnteriorV85 = false;
    let scrollEnCursoV85 = false;


    function visible(el) {

        if (!el) {
            return false;
        }

        const css =
            getComputedStyle(el);

        return (
            css.display !== "none" &&
            css.visibility !== "hidden" &&
            el.getClientRects().length > 0
        );
    }


    function scrollUnaVez(
        elemento,
        offset
    ) {

        if (
            !elemento ||
            scrollEnCursoV85
        ) {
            return;
        }

        scrollEnCursoV85 = true;

        const y =
            elemento.getBoundingClientRect().top +
            window.pageYOffset -
            offset;

        window.scrollTo({
            top:
                Math.max(0, y),
            behavior:
                "smooth"
        });

        setTimeout(
            function () {
                scrollEnCursoV85 =
                    false;
            },
            650
        );
    }


    function planDesdeBoton(
        boton
    ) {

        if (!boton) {
            return 0;
        }

        const dataPlan =
            Number(
                boton.dataset.plan ||
                0
            );

        if (
            dataPlan >= 1 &&
            dataPlan <= 3
        ) {
            return dataPlan;
        }

        const card =
            boton.closest(
                ".oferta[data-oferta]"
            );

        if (!card) {
            return 0;
        }

        return (
            Number(
                card.dataset.oferta
            ) || 0
        );
    }


    function limpiarModoVip() {

        document.body.classList.remove(
            "vipPreparandoV85",
            "vipActivoV85"
        );

        const detalle =
            document.getElementById(
                "detalleVip"
            );

        if (detalle) {
            detalle.classList.add(
                "oculto"
            );
        }
    }


    function prepararVariablesGlobales(
        plan
    ) {

        /*
           app.js usa variables globales con let.
           En scripts clásicos posteriores siguen siendo
           accesibles por identificador aunque no sean
           propiedades de window.
        */

        try {
            planActual =
                plan;
        }
        catch (e) {}

        try {
            adicionales =
                [];
        }
        catch (e) {}

        try {
            maximoAdicionales =
                plan === 1
                    ? 1
                    : (
                        plan === 2
                            ? 2
                            : 0
                    );
        }
        catch (e) {}
    }


    function marcarOferta(
        plan
    ) {

        try {

            if (
                typeof marcarSeleccionVisual ===
                "function"
            ) {
                marcarSeleccionVisual(
                    plan
                );
                return;
            }

        }
        catch (e) {}


        document
            .querySelectorAll(
                ".oferta"
            )
            .forEach(
                card =>
                    card.classList.remove(
                        "ofertaSeleccionada"
                    )
            );

        const card =
            document.querySelector(
                `.oferta[data-oferta="${plan}"]`
            );

        if (card) {

            card.classList.add(
                "ofertaSeleccionada"
            );

            const btn =
                card.querySelector(
                    ".elegirOferta"
                );

            if (btn) {
                btn.textContent =
                    "Seleccionado";
            }
        }
    }


    function renderLista() {

        try {

            if (
                typeof renderizarAdicionales ===
                "function"
            ) {
                renderizarAdicionales();
                return true;
            }

        }
        catch (error) {
            console.warn(
                "[V8.5] renderizarAdicionales:",
                error
            );
        }

        /*
           Si el renderer principal no estuviera disponible,
           vaciamos la lista para que configurador-fix-v57.js
           la recupere.
        */

        const lista =
            document.getElementById(
                "listaAdicionales"
            );

        if (lista) {
            lista.innerHTML =
                "";
        }

        return false;
    }


    function mostrarConfigurador(
        plan
    ) {

        const configurador =
            document.getElementById(
                "configurador"
            );

        if (configurador) {
            configurador.classList.remove(
                "oculto"
            );
        }


        const detalle =
            document.getElementById(
                "detalleVip"
            );

        if (detalle) {
            detalle.classList.add(
                "oculto"
            );
        }


        const titulo =
            document.getElementById(
                "tituloConfigurador"
            );


        if (titulo) {

            if (plan === 1) {

                titulo.textContent =
                    "Elige 1 ING adicional";

            }
            else if (
                plan === 2
            ) {

                titulo.textContent =
                    "Elige 2 ING adicionales";

            }
            else {

                titulo.textContent =
                    "VIP Full seleccionado";
            }
        }
    }


    function activarVipInstantaneo() {

        document.body.classList.add(
            "vipActivoV85"
        );

        document.body.classList.remove(
            "vipPreparandoV85"
        );


        const tarjetas =
            Array.from(
                document.querySelectorAll(
                    "#listaAdicionales .adicionalWrap"
                )
            );


        tarjetas.forEach(
            tarjeta => {

                const input =
                    tarjeta.querySelector(
                        'input[type="checkbox"]'
                    );

                if (input) {

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
                    "incluidoVipV85"
                );


                const estado =
                    tarjeta.querySelector(
                        ".estadoSeleccion"
                    );

                if (estado) {

                    estado.textContent =
                        "INCLUIDO EN VIP";

                    estado.classList.remove(
                        "oculto"
                    );
                }
            }
        );


        const whatsapp =
            document.getElementById(
                "continuarWhatsapp"
            );

        if (whatsapp) {

            whatsapp.disabled =
                false;

            whatsapp.removeAttribute(
                "disabled"
            );

            whatsapp.setAttribute(
                "aria-disabled",
                "false"
            );

            whatsapp.classList.remove(
                "pedidoBloqueadoV60",
                "pedidoIncompletoV59"
            );

            whatsapp.classList.add(
                "pedidoListoV60"
            );
        }
    }


    function botonWhatsapp() {

        const boton =
            document.getElementById(
                "continuarWhatsapp"
            );

        return (
            boton &&
            visible(boton)
        )
            ? boton
            : null;
    }


    function whatsappListo() {

        const boton =
            botonWhatsapp();

        if (!boton) {
            return false;
        }

        if (
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


    function scrollAWhatsappCuandoEsteListo(
        intento
    ) {

        const n =
            intento || 0;

        const boton =
            botonWhatsapp();

        if (
            boton &&
            whatsappListo()
        ) {

            /*
               Centramos el CTA sin llevar al cliente
               a otro bloque intermedio.
            */

            const rect =
                boton.getBoundingClientRect();

            const top =
                rect.top +
                window.pageYOffset -
                (
                    window.innerHeight *
                    .62
                );

            if (!scrollEnCursoV85) {

                scrollEnCursoV85 =
                    true;

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
                        scrollEnCursoV85 =
                            false;
                    },
                    650
                );
            }

            return;
        }


        if (
            n < 8
        ) {

            setTimeout(
                function () {
                    scrollAWhatsappCuandoEsteListo(
                        n + 1
                    );
                },
                80
            );
        }
    }


    function seleccionarPlanEstable(
        plan
    ) {

        planV85 =
            plan;

        pedidoCompletoAnteriorV85 =
            false;

        prepararVariablesGlobales(
            plan
        );

        marcarOferta(
            plan
        );

        mostrarConfigurador(
            plan
        );


        if (
            plan === 3
        ) {

            /*
               Ocultamos el configurador únicamente durante
               el mismo armado de VIP, para que el usuario
               nunca vea los checks "saltando".
            */

            document.body.classList.add(
                "vipPreparandoV85"
            );


            renderLista();


            /*
               Si el renderer es síncrono, esto ocurre en
               el mismo frame. Si V5.7 tiene que reparar,
               repetimos una sola vez después.
            */

            activarVipInstantaneo();


            setTimeout(
                function () {

                    if (
                        document.querySelectorAll(
                            "#listaAdicionales .adicionalWrap"
                        ).length === 0
                    ) {
                        renderLista();
                    }

                    activarVipInstantaneo();

                    /*
                       Damos tiempo a V5.9/V6.0 a dejar el
                       CTA en su estado final y hacemos
                       UN SOLO scroll.
                    */

                    setTimeout(
                        function () {
                            scrollAWhatsappCuandoEsteListo(
                                0
                            );
                        },
                        120
                    );

                },
                60
            );


            return;
        }


        limpiarModoVip();

        renderLista();


        /*
           Solo un destino:
           encabezado "Elige 1/2 ING adicionales".
        */

        setTimeout(
            function () {

                const titulo =
                    document.getElementById(
                        "tituloConfigurador"
                    );

                if (titulo) {

                    scrollUnaVez(
                        titulo,
                        window.innerWidth <= 760
                            ? 78
                            : 100
                    );
                }

            },
            80
        );
    }


    function cantidadSeleccionada() {

        const claves =
            new Set();


        document
            .querySelectorAll(
                "#listaAdicionales .adicionalWrap"
            )
            .forEach(
                card => {

                    const input =
                        card.querySelector(
                            'input[type="checkbox"]'
                        );

                    if (
                        (
                            input?.checked ||
                            card.classList.contains(
                                "seleccionado"
                            )
                        ) &&
                        card.dataset.ing
                    ) {

                        claves.add(
                            card.dataset.ing
                        );
                    }
                }
            );


        return claves.size;
    }


    function pedidoCompleto() {

        if (
            planV85 === 1
        ) {
            return (
                cantidadSeleccionada() >=
                1
            );
        }


        if (
            planV85 === 2
        ) {
            return (
                cantidadSeleccionada() >=
                2
            );
        }


        if (
            planV85 === 3
        ) {
            return true;
        }


        return false;
    }


    function alCambiarAdicional() {

        if (
            planV85 !== 1 &&
            planV85 !== 2
        ) {
            return;
        }


        setTimeout(
            function () {

                const completo =
                    pedidoCompleto();


                if (
                    completo &&
                    !pedidoCompletoAnteriorV85
                ) {

                    pedidoCompletoAnteriorV85 =
                        true;


                    /*
                       Esperamos a que whatsapp-v60 habilite
                       el botón y bajamos una sola vez.
                    */

                    setTimeout(
                        function () {
                            scrollAWhatsappCuandoEsteListo(
                                0
                            );
                        },
                        80
                    );

                }
                else if (
                    !completo
                ) {

                    pedidoCompletoAnteriorV85 =
                        false;
                }

            },
            80
        );
    }


    function iniciar() {

        /*
           Click de oferta.
           Se ejecuta después del listener original y luego
           estabiliza el estado final.
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


                const plan =
                    planDesdeBoton(
                        boton
                    );


                if (
                    !plan
                ) {
                    return;
                }


                /*
                   Dejamos terminar el listener original
                   del mismo clic, pero no esperamos otro
                   render completo.
                */

                setTimeout(
                    function () {
                        seleccionarPlanEstable(
                            plan
                        );
                    },
                    0
                );

            },
            false
        );


        /*
           Cuando se completa Opción 1 o Combo:
           llevar al CTA exactamente una vez.
        */

        document.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        '#listaAdicionales input[type="checkbox"]'
                    )
                ) {
                    alCambiarAdicional();
                }

            },
            false
        );


        /*
           Cambiar ING 1 / 3 / 7 reinicia el flujo.
        */

        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    planV85 =
                        0;

                    pedidoCompletoAnteriorV85 =
                        false;

                    limpiarModoVip();
                }
            );
        }


        console.info(
            "[Mente & Manos V8.5] Flujo estable listo."
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

