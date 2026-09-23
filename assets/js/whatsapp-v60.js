(function () {
    "use strict";


    const NUMERO_WHATSAPP =
        "51901174129";


    const LINEA = {

        ing1: {
            codigo: "ING 1",
            nombre: "Planos y Expedientes"
        },

        ing2: {
            codigo: "ING 2",
            nombre: "Expedientes, Licencias y Costos"
        },

        ing3: {
            codigo: "ING 3",
            nombre: "BIM y Revit"
        },

        ing4: {
            codigo: "ING 4",
            nombre: "Coordinación BIM Avanzada"
        },

        ing5: {
            codigo: "ING 5",
            nombre: "Gestión y Supervisión de Obras"
        },

        ing6: {
            codigo: "ING 6",
            nombre: "Bloques Dinámicos para AutoCAD"
        },

        ing7: {
            codigo: "ING 7",
            nombre: "Cálculo Estructural PRO"
        }

    };


    const PRECIOS_BASE = {
        ing1: 9.90,
        ing3: 12.90,
        ing7: 12.90
    };


    let planMemoria = 1;


    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function productoActual() {

        const coincidenciaRuta =
            window.location.pathname.match(
                /\/(ing1|ing3|ing7)(?:\/index\.html|\/)?$/i
            );


        const desdeRuta =
            coincidenciaRuta
                ? coincidenciaRuta[1].toLowerCase()
                : null;


        if (LINEA[desdeRuta]) {
            return desdeRuta;
        }


        const url =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        if (LINEA[url]) {
            return url;
        }


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (
            selector &&
            LINEA[selector.value]
        ) {
            return selector.value;
        }


        return "ing1";
    }


    function detectarPlan() {

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
                    ) === "seleccionado"
            );


        if (seleccionado) {

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
                    planMemoria = 3;
                    return 3;
                }


                if (
                    texto.includes(
                        "combo pro"
                    )
                ) {
                    planMemoria = 2;
                    return 2;
                }


                if (
                    texto.includes(
                        "opcion 1"
                    )
                ) {
                    planMemoria = 1;
                    return 1;
                }
            }
        }


        return planMemoria;
    }


    function adicionalesSeleccionados() {

        const resultado = [];


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


                    if (!seleccionado) {
                        return;
                    }


                    const clave =
                        tarjeta.dataset.ing;


                    if (
                        clave &&
                        LINEA[clave] &&
                        !resultado.includes(
                            clave
                        )
                    ) {
                        resultado.push(
                            clave
                        );
                    }
                }
            );


        return resultado;
    }


    function datosPedido() {

        const principal =
            productoActual();


        const plan =
            detectarPlan();


        if (plan === 3) {

            return {
                plan,
                nombrePlan:
                    "VIP Full",
                precio:
                    29.90,
                principal,
                claves:
                    Object.keys(
                        LINEA
                    ),
                completo:
                    true,
                faltan:
                    0
            };
        }


        const necesarios =
            plan === 2
                ? 2
                : 1;


        const seleccion =
            adicionalesSeleccionados()
                .filter(
                    clave =>
                        clave !== principal
                )
                .slice(
                    0,
                    necesarios
                );


        const faltan =
            Math.max(
                0,
                necesarios -
                seleccion.length
            );


        return {
            plan,
            nombrePlan:
                plan === 2
                    ? "Combo Pro"
                    : "Opción 1",
            precio:
                plan === 2
                    ? 15.90
                    : (
                        PRECIOS_BASE[
                            principal
                        ] || 9.90
                    ),
            principal,
            claves:
                [
                    principal,
                    ...seleccion
                ],
            completo:
                faltan === 0,
            faltan
        };
    }


    function encontrarBoton() {

        /*
            Preferimos clases agregadas por V5.8/V5.9.
        */

        return (
            document.querySelector(
                ".whatsappV59"
            ) ||
            document.querySelector(
                ".whatsappV58"
            ) ||
            Array.from(
                document.querySelectorAll(
                    "button, a"
                )
            ).find(
                elemento =>
                    normalizar(
                        elemento.textContent
                    ).includes(
                        "continuar por whatsapp"
                    ) ||
                    normalizar(
                        elemento.textContent
                    ).startsWith(
                        "elige 1 ing adicional"
                    ) ||
                    normalizar(
                        elemento.textContent
                    ).startsWith(
                        "elige 2 ing adicionales"
                    )
            ) ||
            null
        );
    }


    function dinero(valor) {

        return `S/ ${Number(valor).toFixed(2)}`;
    }


    function mensajeWhatsapp(pedido) {

        const lista =
            pedido.claves
                .map(
                    clave =>
                        `${LINEA[clave].codigo} - ${LINEA[clave].nombre}`
                )
                .join("\n");


        const codigoPlan =
            pedido.plan === 1
                ? "OP1"
                : (
                    pedido.plan === 2
                        ? "COMBO"
                        : "VIP"
                );


        const referencia =
            `WEB-${String(pedido.principal).toUpperCase()}-${codigoPlan}`;


        return (
            `Hola, ya revisé el contenido y quiero adquirir la ${pedido.nombrePlan} por ${dinero(pedido.precio)}.\n\n` +
            `Mi pedido:\n\n` +
            `${lista}\n\n` +
            `Quiero continuar con la compra.\n\nRef: ${referencia}`
        );
    }


    function abrirWhatsapp(pedido) {

        if (!pedido.completo) {
            return;
        }


        const mensaje =
            mensajeWhatsapp(
                pedido
            );


        const url =
            `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );
    }


    function actualizar() {

        const boton =
            encontrarBoton();


        if (!boton) {
            return;
        }


        const pedido =
            datosPedido();


        /*
            CORRECCIÓN CLAVE:
            quitamos el disabled real cuando el pedido está completo.
        */

        if (pedido.completo) {

            if (
                "disabled" in boton
            ) {
                boton.disabled =
                    false;
            }


            boton.removeAttribute(
                "disabled"
            );


            boton.setAttribute(
                "aria-disabled",
                "false"
            );


            boton.classList.remove(
                "pedidoBloqueadoV60"
            );


            boton.classList.add(
                "pedidoListoV60"
            );


            boton.style.pointerEvents =
                "auto";


            boton.style.cursor =
                "pointer";
        }
        else {

            if (
                "disabled" in boton
            ) {
                boton.disabled =
                    true;
            }


            boton.setAttribute(
                "disabled",
                ""
            );


            boton.setAttribute(
                "aria-disabled",
                "true"
            );


            boton.classList.add(
                "pedidoBloqueadoV60"
            );


            boton.classList.remove(
                "pedidoListoV60"
            );
        }


        /*
            Listener propio V6.0.
            Se añade una sola vez.
        */

        if (
            !boton.dataset.whatsappV60
        ) {

            boton.dataset.whatsappV60 =
                "1";


            boton.addEventListener(
                "click",
                function (event) {

                    const pedidoActual =
                        datosPedido();


                    if (
                        !pedidoActual.completo
                    ) {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        return;
                    }


                    /*
                        Evitamos que el listener viejo de app.js
                        abra un mensaje diferente o falle.
                    */

                    event.preventDefault();
                    event.stopImmediatePropagation();


                    abrirWhatsapp(
                        pedidoActual
                    );

                },
                true
            );
        }


        console.info(
            "[Mente & Manos WhatsApp V6.0]",
            pedido
        );
    }


    function interpretarPlan(
        boton
    ) {

        if (!boton) {
            return;
        }


        const texto =
            normalizar(
                boton.textContent
            );


        if (
            texto.includes(
                "combo pro"
            )
        ) {
            planMemoria = 2;
        }
        else if (
            texto.includes(
                "vip full"
            )
        ) {
            planMemoria = 3;
        }
        else if (
            texto.includes(
                "opcion 1"
            )
        ) {
            planMemoria = 1;
        }
    }


    function iniciar() {

        planMemoria =
            detectarPlan();


        setTimeout(
            actualizar,
            120
        );


        document.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        '#listaAdicionales input[type="checkbox"]'
                    )
                ) {

                    setTimeout(
                        actualizar,
                        30
                    );


                    setTimeout(
                        actualizar,
                        120
                    );
                }
            }
        );


        document.addEventListener(
            "click",
            function (event) {

                const boton =
                    event.target.closest(
                        "button"
                    );


                if (boton) {

                    interpretarPlan(
                        boton
                    );


                    setTimeout(
                        actualizar,
                        80
                    );
                }
            },
            true
        );


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    planMemoria = 1;


                    setTimeout(
                        actualizar,
                        120
                    );
                }
            );
        }


        /*
            También observamos cambios visuales del configurador.
        */

        const lista =
            document.getElementById(
                "listaAdicionales"
            );


        if (lista) {

            const observer =
                new MutationObserver(
                    function () {

                        setTimeout(
                            actualizar,
                            20
                        );
                    }
                );


            observer.observe(
                lista,
                {
                    subtree:
                        true,
                    childList:
                        true,
                    attributes:
                        true,
                    attributeFilter: [
                        "class",
                        "checked"
                    ]
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


