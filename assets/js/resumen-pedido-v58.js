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
            nombre: "AutoCAD + Bloques"
        },

        ing7: {
            codigo: "ING 7",
            nombre: "Cálculo Estructural PRO"
        }

    };


    const PRECIO_BASE = {
        ing1: 9.90,
        ing3: 12.90,
        ing7: 12.90
    };


    /*
        El plan se actualiza también por clic.
        Esto evita depender de variables internas de app.js.
    */
    let planActualV58 = 1;


    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function dinero(valor) {

        return `S/ ${Number(valor).toFixed(2)}`;
    }


    function productoActual() {

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


        const url =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        if (LINEA[url]) {
            return url;
        }


        return "ing1";
    }


    function detectarPlanVisual() {

        /*
            Primero buscamos el botón que dice "Seleccionado".
            Subimos por sus padres hasta encontrar el texto
            de la tarjeta correspondiente.
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


        if (seleccionado) {

            let nodo =
                seleccionado.parentElement;


            for (
                let i = 0;
                nodo && i < 6;
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
                    return 3;
                }


                if (
                    texto.includes(
                        "combo pro"
                    )
                ) {
                    return 2;
                }


                if (
                    texto.includes(
                        "opcion 1"
                    )
                ) {
                    return 1;
                }
            }
        }


        return planActualV58;
    }


    function leerSeleccion() {

        const principal =
            productoActual();


        const plan =
            detectarPlanVisual();


        /*
            VIP = todos los ING.
        */

        if (plan === 3) {

            return {
                plan,
                principal,
                claves:
                    Object.keys(
                        LINEA
                    ),
                faltan:
                    0
            };
        }


        const marcados =
            Array.from(
                document.querySelectorAll(
                    '#listaAdicionales input[type="checkbox"]:checked'
                )
            )
            .map(
                input =>
                    input.value ||
                    input.closest(
                        "[data-ing]"
                    )?.dataset.ing
            )
            .filter(
                clave =>
                    clave &&
                    LINEA[clave] &&
                    clave !== principal
            );


        const unicos =
            [...new Set(marcados)];


        const necesarios =
            plan === 2
                ? 2
                : 1;


        return {
            plan,
            principal,
            claves:
                [
                    principal,
                    ...unicos.slice(
                        0,
                        necesarios
                    )
                ],
            faltan:
                Math.max(
                    0,
                    necesarios -
                    unicos.length
                )
        };
    }


    function precioPedido(
        plan,
        principal
    ) {

        if (plan === 3) {
            return 29.90;
        }


        if (plan === 2) {
            return 15.90;
        }


        return (
            PRECIO_BASE[
                principal
            ] || 9.90
        );
    }


    function nombrePlan(plan) {

        if (plan === 3) {
            return "VIP Full";
        }


        if (plan === 2) {
            return "Combo Pro";
        }


        return "Opción 1";
    }


    function encontrarBotonWhatsapp() {

        const candidatos =
            Array.from(
                document.querySelectorAll(
                    "button, a"
                )
            );


        return candidatos.find(
            elemento =>
                normalizar(
                    elemento.textContent
                ).includes(
                    "continuar por whatsapp"
                )
        ) || null;
    }


    function encontrarZonaPedido() {

        /*
            Preferimos un resumen original si existe.
        */

        const ids = [
            "resumenPedido",
            "pedidoResumen",
            "resumenSeleccion"
        ];


        for (const id of ids) {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {
                return elemento;
            }
        }


        /*
            Si no existe un contenedor específico,
            buscamos el botón WhatsApp y creamos el
            resumen inmediatamente antes.
        */

        const whatsapp =
            encontrarBotonWhatsapp();


        if (!whatsapp) {
            return null;
        }


        let existente =
            document.getElementById(
                "resumenPedidoV58"
            );


        if (existente) {
            return existente;
        }


        existente =
            document.createElement(
                "div"
            );


        existente.id =
            "resumenPedidoV58";


        whatsapp.insertAdjacentElement(
            "beforebegin",
            existente
        );


        return existente;
    }


    function textoBoton(
        seleccion,
        precio
    ) {

        if (
            seleccion.plan === 3
        ) {
            return `
                <span class="waV58Principal">
                    Continuar por WhatsApp
                </span>

                <span class="waV58Detalle">
                    Los 7 ING completos · ${dinero(precio)}
                </span>
            `;
        }


        const codigos =
            seleccion.claves
                .map(
                    clave =>
                        LINEA[clave].codigo
                )
                .join(" + ");


        if (
            seleccion.faltan > 0
        ) {
            return `
                <span class="waV58Principal">
                    Elige ${
                        seleccion.faltan
                    } ING adicional${
                        seleccion.faltan > 1
                            ? "es"
                            : ""
                    }
                </span>

                <span class="waV58Detalle">
                    ${nombrePlan(
                        seleccion.plan
                    )} · ${dinero(precio)}
                </span>
            `;
        }


        return `
            <span class="waV58Principal">
                Continuar por WhatsApp
            </span>

            <span class="waV58Detalle">
                ${codigos} · ${dinero(precio)}
            </span>
        `;
    }


    function crearItem(
        clave,
        esPrincipal
    ) {

        const item =
            LINEA[clave];


        return `
            <div class="pedidoV58Item">

                <span class="pedidoV58Check">
                    ✓
                </span>

                <span class="pedidoV58Texto">

                    <strong>
                        ${item.codigo} — ${item.nombre}
                    </strong>

                    <small>
                        ${
                            esPrincipal
                                ? "Producto principal"
                                : "Adicional incluido"
                        }
                    </small>

                </span>

            </div>
        `;
    }


    function render() {

        const zona =
            encontrarZonaPedido();


        const whatsapp =
            encontrarBotonWhatsapp();


        if (
            !zona ||
            !whatsapp
        ) {
            return;
        }


        const seleccion =
            leerSeleccion();


        planActualV58 =
            seleccion.plan;


        const precio =
            precioPedido(
                seleccion.plan,
                seleccion.principal
            );


        const items =
            seleccion.claves
                .map(
                    (clave, index) =>
                        crearItem(
                            clave,
                            index === 0
                        )
                )
                .join("");


        const cantidad =
            seleccion.plan === 3
                ? 7
                : seleccion.claves.length;


        const aviso =
            seleccion.faltan > 0
                ? `
                    <div class="pedidoV58Falta">
                        Falta elegir
                        <strong>
                            ${seleccion.faltan}
                        </strong>
                        ING adicional${
                            seleccion.faltan > 1
                                ? "es"
                                : ""
                        }.
                    </div>
                `
                : "";


        zona.innerHTML = `
            <div class="pedidoV58">

                <div class="pedidoV58Cabecera">

                    <div>
                        <span class="pedidoV58Mini">
                            RESUMEN
                        </span>

                        <strong>
                            ${nombrePlan(
                                seleccion.plan
                            )}
                        </strong>
                    </div>

                    <span class="pedidoV58Precio">
                        ${dinero(
                            precio
                        )}
                    </span>

                </div>


                <div class="pedidoV58Items">
                    ${items}
                </div>


                ${aviso}


                <div class="pedidoV58Pie">

                    <span>
                        ${
                            seleccion.faltan > 0
                                ? "Completa tu selección para continuar"
                                : `Te llevarás ${cantidad} producto${
                                    cantidad === 1
                                        ? ""
                                        : "s"
                                }`
                        }
                    </span>

                    ${
                        seleccion.plan !== 3
                            ? `
                                <button
                                    type="button"
                                    class="editarPedidoV58"
                                >
                                    Editar selección
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>
        `;


        const editar =
            zona.querySelector(
                ".editarPedidoV58"
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


        /*
            Mejoramos visualmente el botón SIN reemplazar
            su listener original.
        */

        whatsapp.innerHTML =
            textoBoton(
                seleccion,
                precio
            );


        whatsapp.classList.add(
            "whatsappV58"
        );


        /*
            No forzamos disabled porque dejamos que la lógica
            original controle si puede continuar o no.
            Solo reflejamos el estado visual.
        */

        whatsapp.classList.toggle(
            "pedidoIncompletoV58",
            seleccion.faltan > 0
        );
    }


    function detectarClicPlan(event) {

        const boton =
            event.target.closest(
                "button"
            );


        if (!boton) {
            return;
        }


        let texto =
            normalizar(
                boton.textContent
            );


        /*
            Si el texto del botón es "Seleccionado",
            buscamos el texto de su tarjeta.
        */

        if (
            texto ===
            "seleccionado"
        ) {

            let nodo =
                boton.parentElement;


            for (
                let i = 0;
                nodo && i < 5;
                i++,
                nodo =
                    nodo.parentElement
            ) {

                const contenido =
                    normalizar(
                        nodo.innerText
                    );


                if (
                    contenido.includes(
                        "vip full"
                    )
                ) {
                    planActualV58 = 3;
                    break;
                }


                if (
                    contenido.includes(
                        "combo pro"
                    )
                ) {
                    planActualV58 = 2;
                    break;
                }


                if (
                    contenido.includes(
                        "opcion 1"
                    )
                ) {
                    planActualV58 = 1;
                    break;
                }
            }
        }
        else if (
            texto.includes(
                "vip full"
            )
        ) {
            planActualV58 = 3;
        }
        else if (
            texto.includes(
                "combo pro"
            )
        ) {
            planActualV58 = 2;
        }
        else if (
            texto.includes(
                "opcion 1"
            )
        ) {
            planActualV58 = 1;
        }


        setTimeout(
            render,
            60
        );
    }


    function iniciar() {

        /*
            Detectamos cuál tarjeta está seleccionada
            al cargar.
        */

        planActualV58 =
            detectarPlanVisual();


        render();


        document.addEventListener(
            "change",
            function (event) {

                if (
                    event.target.matches(
                        '#listaAdicionales input[type="checkbox"]'
                    )
                ) {
                    setTimeout(
                        render,
                        30
                    );
                }
            }
        );


        document.addEventListener(
            "click",
            detectarClicPlan,
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

                    /*
                        La página vuelve a Opción 1 cuando
                        cambia el producto.
                    */
                    planActualV58 = 1;

                    setTimeout(
                        render,
                        80
                    );
                }
            );
        }


        /*
            Observamos solo el configurador.
            Si app.js actualiza selección/precio,
            refrescamos inmediatamente el resumen.
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
                            render,
                            10
                        );
                    }
                );


            observer.observe(
                lista,
                {
                    childList: true,
                    subtree: true,
                    attributes: true,
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
