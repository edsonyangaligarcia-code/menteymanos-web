(function () {
    "use strict";


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
    let renderProgramado = false;


    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function precioTexto(valor) {

        return `S/ ${Number(valor).toFixed(2)}`;
    }


    function obtenerProductoActual() {

        /*
            1. Selector visible.
        */

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


        /*
            2. URL.
        */

        const desdeUrl =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        if (LINEA[desdeUrl]) {
            return desdeUrl;
        }


        return "ing1";
    }


    function detectarPlanSeleccionado() {

        /*
            Detectamos la tarjeta cuyo botón actualmente
            dice "Seleccionado".
        */

        const botones =
            Array.from(
                document.querySelectorAll(
                    "button"
                )
            );


        const botonSeleccionado =
            botones.find(
                boton =>
                    normalizar(
                        boton.textContent
                    ) === "seleccionado"
            );


        if (botonSeleccionado) {

            let nodo =
                botonSeleccionado;


            for (
                let nivel = 0;
                nodo && nivel < 7;
                nivel++,
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


    function claveDesdeTarjeta(tarjeta, input) {

        /*
            ESTA ES LA CORRECCIÓN PRINCIPAL.

            El checkbox original puede tener:
            input.value === "on"

            La clave correcta está en:
            .adicionalWrap[data-ing="ing4"]
        */

        const desdeData =
            tarjeta?.dataset?.ing;


        if (
            desdeData &&
            LINEA[desdeData]
        ) {
            return desdeData;
        }


        const value =
            input?.value;


        if (
            value &&
            LINEA[value]
        ) {
            return value;
        }


        return null;
    }


    function leerAdicionalesSeleccionados() {

        const seleccion = [];


        /*
            Método A:
            Checkbox realmente marcado.
        */

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


                    const visualSeleccionada =
                        tarjeta.classList.contains(
                            "seleccionado"
                        );


                    const estaMarcado =
                        !!input?.checked ||
                        visualSeleccionada;


                    if (!estaMarcado) {
                        return;
                    }


                    const clave =
                        claveDesdeTarjeta(
                            tarjeta,
                            input
                        );


                    if (
                        clave &&
                        !seleccion.includes(
                            clave
                        )
                    ) {
                        seleccion.push(
                            clave
                        );
                    }
                }
            );


        /*
            Método B de respaldo:
            Si el HTML original no usa .adicionalWrap,
            buscamos inputs marcados y su ancestro data-ing.
        */

        if (
            seleccion.length === 0
        ) {

            document
                .querySelectorAll(
                    '#listaAdicionales input[type="checkbox"]:checked'
                )
                .forEach(
                    input => {

                        const tarjeta =
                            input.closest(
                                "[data-ing]"
                            );


                        const clave =
                            claveDesdeTarjeta(
                                tarjeta,
                                input
                            );


                        if (
                            clave &&
                            !seleccion.includes(
                                clave
                            )
                        ) {
                            seleccion.push(
                                clave
                            );
                        }
                    }
                );
        }


        return seleccion;
    }


    function datosPlan(plan, principal) {

        if (plan === 3) {

            return {
                nombre:
                    "VIP Full",
                precio:
                    29.90,
                necesarios:
                    0
            };
        }


        if (plan === 2) {

            return {
                nombre:
                    "Combo Pro",
                precio:
                    15.90,
                necesarios:
                    2
            };
        }


        return {
            nombre:
                "Opción 1",
            precio:
                PRECIOS_BASE[
                    principal
                ] || 9.90,
            necesarios:
                1
        };
    }


    function construirPedido() {

        const principal =
            obtenerProductoActual();


        const plan =
            detectarPlanSeleccionado();


        const meta =
            datosPlan(
                plan,
                principal
            );


        /*
            VIP Full no depende de checkbox:
            siempre son los 7.
        */

        if (plan === 3) {

            return {
                principal,
                plan,
                meta,
                claves:
                    Object.keys(
                        LINEA
                    ),
                adicionales:
                    Object.keys(
                        LINEA
                    ).filter(
                        clave =>
                            clave !== principal
                    ),
                faltan:
                    0,
                completo:
                    true
            };
        }


        const seleccion =
            leerAdicionalesSeleccionados()
                .filter(
                    clave =>
                        clave !== principal
                );


        /*
            El configurador original controla el máximo.
            Nosotros reflejamos hasta el número que corresponde
            al plan.
        */

        const usados =
            seleccion.slice(
                0,
                meta.necesarios
            );


        const faltan =
            Math.max(
                0,
                meta.necesarios -
                usados.length
            );


        return {
            principal,
            plan,
            meta,
            claves:
                [
                    principal,
                    ...usados
                ],
            adicionales:
                usados,
            faltan,
            completo:
                faltan === 0
        };
    }


    function encontrarWhatsapp() {

        return Array.from(
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
                elemento.classList.contains(
                    "whatsappV58"
                ) ||
                elemento.classList.contains(
                    "whatsappV59"
                )
        ) || null;
    }


    function obtenerContenedorResumen() {

        /*
            Eliminamos el resumen dinámico viejo V5.8
            si existiera.
        */

        const viejo =
            document.getElementById(
                "resumenPedidoV58"
            );


        if (viejo) {
            viejo.remove();
        }


        let actual =
            document.getElementById(
                "resumenPedidoV59"
            );


        if (actual) {
            return actual;
        }


        const whatsapp =
            encontrarWhatsapp();


        if (!whatsapp) {
            return null;
        }


        actual =
            document.createElement(
                "div"
            );


        actual.id =
            "resumenPedidoV59";


        whatsapp.insertAdjacentElement(
            "beforebegin",
            actual
        );


        return actual;
    }


    function itemHtml(
        clave,
        tipo
    ) {

        const ing =
            LINEA[clave];


        let subtitulo;


        if (tipo === "principal") {
            subtitulo =
                "Producto principal";
        }
        else if (tipo === "vip") {
            subtitulo =
                "Incluido en VIP Full";
        }
        else {
            subtitulo =
                "Adicional incluido";
        }


        return `
            <div class="pedidoV59Item">

                <span class="pedidoV59Check">
                    ✓
                </span>

                <span class="pedidoV59Info">

                    <strong>
                        ${ing.codigo} — ${ing.nombre}
                    </strong>

                    <small>
                        ${subtitulo}
                    </small>

                </span>

            </div>
        `;
    }


    function resumenCodigos(pedido) {

        if (pedido.plan === 3) {
            return "Los 7 ING completos";
        }


        return pedido.claves
            .map(
                clave =>
                    LINEA[clave].codigo
            )
            .join(" + ");
    }


    function actualizarBoton(
        boton,
        pedido
    ) {

        if (!boton) {
            return;
        }


        /*
            Cambiamos SOLO el contenido visual.
            No reemplazamos el elemento, para conservar
            el onclick/listener original de app.js.
        */


        if (!pedido.completo) {

            const cantidad =
                pedido.faltan;


            boton.innerHTML = `
                <span class="waV59Principal">
                    Elige ${cantidad} ING adicional${
                        cantidad === 1
                            ? ""
                            : "es"
                    }
                </span>

                <span class="waV59Detalle">
                    ${pedido.meta.nombre}
                    ·
                    ${precioTexto(
                        pedido.meta.precio
                    )}
                </span>
            `;


            boton.classList.add(
                "pedidoIncompletoV59"
            );

        }
        else {

            boton.innerHTML = `
                <span class="waV59Principal">
                    Continuar por WhatsApp
                </span>

                <span class="waV59Detalle">
                    ${resumenCodigos(
                        pedido
                    )}
                    ·
                    ${precioTexto(
                        pedido.meta.precio
                    )}
                </span>
            `;


            boton.classList.remove(
                "pedidoIncompletoV59"
            );
        }


        boton.classList.add(
            "whatsappV59"
        );
    }


    function renderResumen() {

        renderProgramado =
            false;


        const pedido =
            construirPedido();


        const zona =
            obtenerContenedorResumen();


        const whatsapp =
            encontrarWhatsapp();


        if (
            !zona ||
            !whatsapp
        ) {
            return;
        }


        const items =
            pedido.claves
                .map(
                    clave => {

                        if (
                            clave ===
                            pedido.principal
                        ) {
                            return itemHtml(
                                clave,
                                "principal"
                            );
                        }


                        return itemHtml(
                            clave,
                            pedido.plan === 3
                                ? "vip"
                                : "adicional"
                        );
                    }
                )
                .join("");


        const aviso =
            pedido.completo
                ? `
                    <div class="pedidoV59Estado completo">
                        Selección completa
                    </div>
                `
                : `
                    <div class="pedidoV59Estado pendiente">
                        Falta elegir
                        <strong>
                            ${pedido.faltan}
                        </strong>
                        ING adicional${
                            pedido.faltan === 1
                                ? ""
                                : "es"
                        }.
                    </div>
                `;


        zona.innerHTML = `
            <div class="pedidoV59">

                <div class="pedidoV59Head">

                    <div>
                        <span class="pedidoV59Mini">
                            RESUMEN
                        </span>

                        <strong>
                            ${pedido.meta.nombre}
                        </strong>
                    </div>

                    <span class="pedidoV59Precio">
                        ${precioTexto(
                            pedido.meta.precio
                        )}
                    </span>

                </div>


                <div class="pedidoV59Lista">
                    ${items}
                </div>


                ${aviso}


                <div class="pedidoV59Footer">

                    <span>
                        ${
                            pedido.completo
                                ? (
                                    pedido.plan === 3
                                        ? "Te llevarás los 7 productos de la Línea ING."
                                        : `Tu pedido incluye ${pedido.claves.length} productos.`
                                )
                                : "Completa tu selección para continuar."
                        }
                    </span>

                    ${
                        pedido.plan === 3
                            ? ""
                            : `
                                <button
                                    type="button"
                                    class="editarV59"
                                >
                                    Editar selección
                                </button>
                            `
                    }

                </div>

            </div>
        `;


        const editar =
            zona.querySelector(
                ".editarV59"
            );


        if (editar) {

            editar.addEventListener(
                "click",
                function () {

                    document
                        .getElementById(
                            "listaAdicionales"
                        )
                        ?.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "center"
                        });
                }
            );
        }


        actualizarBoton(
            whatsapp,
            pedido
        );


        console.info(
            "[Mente & Manos V5.9]",
            {
                plan:
                    pedido.meta.nombre,
                producto:
                    pedido.principal,
                seleccion:
                    pedido.claves,
                faltan:
                    pedido.faltan
            }
        );
    }


    function programarRender(
        espera = 0
    ) {

        if (renderProgramado) {
            return;
        }


        renderProgramado =
            true;


        setTimeout(
            renderResumen,
            espera
        );
    }


    function interpretarPlanClic(
        boton
    ) {

        if (!boton) {
            return;
        }


        let texto =
            normalizar(
                boton.textContent
            );


        /*
            El propio botón puede decir:
            Elegir Combo Pro
            Elegir VIP Full
        */

        if (
            texto.includes(
                "combo pro"
            )
        ) {
            planMemoria = 2;
            return;
        }


        if (
            texto.includes(
                "vip full"
            )
        ) {
            planMemoria = 3;
            return;
        }


        if (
            texto.includes(
                "opcion 1"
            )
        ) {
            planMemoria = 1;
            return;
        }


        /*
            Si dice solo "Seleccionado",
            inspeccionamos su tarjeta.
        */

        if (
            texto ===
            "seleccionado"
        ) {

            let nodo =
                boton;


            for (
                let i = 0;
                nodo && i < 7;
                i++,
                nodo = nodo.parentElement
            ) {

                const bloque =
                    normalizar(
                        nodo.innerText
                    );


                if (
                    bloque.includes(
                        "vip full"
                    )
                ) {
                    planMemoria = 3;
                    return;
                }


                if (
                    bloque.includes(
                        "combo pro"
                    )
                ) {
                    planMemoria = 2;
                    return;
                }


                if (
                    bloque.includes(
                        "opcion 1"
                    )
                ) {
                    planMemoria = 1;
                    return;
                }
            }
        }
    }


    function iniciar() {

        planMemoria =
            detectarPlanSeleccionado();


        /*
            Primer render después de que V5.7 termine
            de construir las tarjetas.
        */

        programarRender(
            80
        );


        /*
            Checkbox:
            capturamos change después de que el configurador
            original procese la selección.
        */

        document.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        '#listaAdicionales input[type="checkbox"]'
                    )
                ) {

                    /*
                        0ms + un segundo intento para cualquier
                        actualización asíncrona del código original.
                    */

                    renderProgramado = false;
                    programarRender(10);

                    setTimeout(
                        function () {
                            renderProgramado = false;
                            programarRender(0);
                        },
                        80
                    );
                }
            }
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


                interpretarPlanClic(
                    boton
                );


                renderProgramado = false;
                programarRender(60);

            },
            true
        );


        /*
            Cambio ING 1 / 3 / 7.
        */

        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    planMemoria = 1;

                    renderProgramado = false;
                    programarRender(100);
                }
            );
        }


        /*
            Observamos específicamente las tarjetas.
            Cuando V5.7 pone/quita la clase seleccionado
            también refrescamos el resumen.
        */

        const lista =
            document.getElementById(
                "listaAdicionales"
            );


        if (lista) {

            const observer =
                new MutationObserver(
                    function (mutations) {

                        const relevante =
                            mutations.some(
                                mutation => {

                                    if (
                                        mutation.type ===
                                        "attributes"
                                    ) {
                                        return true;
                                    }


                                    return (
                                        mutation.type ===
                                        "childList"
                                    );
                                }
                            );


                        if (relevante) {
                            renderProgramado = false;
                            programarRender(20);
                        }
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

