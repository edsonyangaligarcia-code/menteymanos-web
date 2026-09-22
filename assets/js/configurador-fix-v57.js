(function () {
    "use strict";

    const LINEA = {
        ing1: {
            codigo: "ING 1",
            nombre: "Planos y Expedientes",
            descripcion: "Planos, expedientes, proyectos y recursos CAD.",
            etiqueta: "PLANOS Y EXPEDIENTES",
            promesa: "Colección de planos, expedientes y referencias técnicas para consultar y adaptar a tus proyectos.",
            incluye: [
                "Planos arquitectónicos y especialidades.",
                "Expedientes y proyectos de referencia.",
                "Biblioteca CAD y recursos complementarios.",
                "Proyectos residenciales, comerciales y especiales.",
                "Material organizado para consulta rápida."
            ],
            ideal: "Arquitectos, ingenieros, estudiantes y profesionales que trabajan con planos y expedientes."
        },

        ing2: {
            codigo: "ING 2",
            nombre: "Expedientes, Licencias y Costos",
            descripcion: "Documentación, normativa, metrados y costos.",
            etiqueta: "DOCUMENTACIÓN Y EXPEDIENTES",
            promesa: "Modelos y referencias para organizar la documentación técnica que acompaña tus proyectos.",
            incluye: [
                "Expedientes técnicos modelo.",
                "Memorias de arquitectura, estructuras e instalaciones.",
                "Documentos y formularios de licencia como referencia.",
                "Biblioteca normativa RNE y diseño estructural.",
                "Metrados, presupuestos, costos y hojas de cálculo."
            ],
            ideal: "Ingenieros, arquitectos, gestores de proyectos, tramitadores y contratistas."
        },

        ing3: {
            codigo: "ING 3",
            nombre: "BIM y Revit",
            descripcion: "Plantillas, familias, proyectos y formación BIM.",
            etiqueta: "BIM Y REVIT",
            promesa: "Recursos BIM para acelerar tu flujo de trabajo en Revit y desarrollar proyectos con una base más completa.",
            incluye: [
                "Plantillas profesionales de Revit.",
                "Familias paramétricas y biblioteca RFA.",
                "Proyectos y modelos BIM.",
                "Arquitectura, estructuras, MEP y metrados.",
                "Cursos, masterclasses y recursos de apoyo."
            ],
            ideal: "Usuarios de Revit, modeladores BIM, arquitectos, ingenieros y estudiantes."
        },

        ing4: {
            codigo: "ING 4",
            nombre: "Coordinación BIM Avanzada",
            descripcion: "Navisworks, Dynamo, coordinación y automatización.",
            etiqueta: "COORDINACIÓN BIM",
            promesa: "Recursos para coordinar especialidades, detectar interferencias y automatizar procesos BIM.",
            incluye: [
                "Coordinación y revisión de modelos BIM.",
                "Navisworks y detección de interferencias.",
                "Dynamo y automatización.",
                "Flujos de coordinación multidisciplinaria.",
                "Recursos de gestión BIM."
            ],
            ideal: "Coordinadores BIM, modeladores y profesionales que trabajan con varias especialidades."
        },

        ing5: {
            codigo: "ING 5",
            nombre: "Gestión y Supervisión de Obras",
            descripcion: "Residencia, supervisión, planeamiento y control.",
            etiqueta: "GESTIÓN DE OBRAS",
            promesa: "Material de apoyo para organizar, supervisar y controlar actividades de obra.",
            incluye: [
                "Residencia y supervisión de obras.",
                "Planeamiento y control.",
                "Recursos de gestión y seguimiento.",
                "Material de Lean Construction.",
                "Documentación técnica de apoyo."
            ],
            ideal: "Residentes, supervisores, ingenieros de obra y profesionales de construcción."
        },

        ing6: {
            codigo: "ING 6",
            nombre: "AutoCAD + Bloques",
            descripcion: "Bibliotecas, bloques y herramientas para trabajar más rápido.",
            etiqueta: "AUTOCAD Y BLOQUES",
            promesa: "Biblioteca de recursos CAD para dibujar y documentar con mayor rapidez.",
            incluye: [
                "Bloques y bibliotecas CAD.",
                "Detalles constructivos.",
                "Recursos y plantillas AutoCAD.",
                "Proyectos y referencias DWG.",
                "Herramientas para acelerar el dibujo."
            ],
            ideal: "Usuarios de AutoCAD, dibujantes, arquitectos, ingenieros y estudiantes."
        },

        ing7: {
            codigo: "ING 7",
            nombre: "Cálculo Estructural PRO",
            descripcion: "Análisis, modelado y recursos de cálculo estructural.",
            etiqueta: "CÁLCULO ESTRUCTURAL",
            promesa: "Recursos de análisis estructural, modelado y cálculo para reforzar tu flujo de trabajo técnico.",
            incluye: [
                "SAP2000 y análisis estructural.",
                "Modelado de estructuras metálicas.",
                "Plantillas Mathcad y Excel.",
                "Ejercicios y casos prácticos.",
                "Videotutoriales y material técnico."
            ],
            ideal: "Ingenieros civiles, estructurales, proyectistas y estudiantes de estructuras."
        }
    };


    const RECOMENDADOS = {
        ing1: "ing6",
        ing3: "ing4",
        ing7: "ing3"
    };


    let reparando = false;


    function productoActualSeguro() {

        /*
            V6.4:
            El selector y la URL son la fuente real del
            producto por el que llegó el cliente.

            No priorizamos una variable antigua que pueda
            haberse quedado en ING 1.
        */

        const selector =
            document.getElementById("selectorProducto");

        if (
            selector &&
            LINEA[selector.value]
        ) {
            return selector.value;
        }


        const desdeUrl =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        if (LINEA[desdeUrl]) {
            return desdeUrl;
        }


        try {
            if (
                typeof productoActual !== "undefined" &&
                LINEA[productoActual]
            ) {
                return productoActual;
            }
        }
        catch (e) {}


        return "ing1";
    }


    function seleccionActualSegura() {
        try {
            if (
                typeof adicionales !== "undefined" &&
                Array.isArray(adicionales)
            ) {
                return [...adicionales];
            }
        }
        catch (e) {}

        return [];
    }


    function sincronizarVisual() {
        const seleccion =
            seleccionActualSegura();


        document
            .querySelectorAll(
                "#listaAdicionales .adicionalWrap"
            )
            .forEach(
                tarjeta => {

                    const clave =
                        tarjeta.dataset.ing;

                    const marcado =
                        seleccion.includes(clave) ||
                        !!tarjeta.querySelector(
                            'input[type="checkbox"]:checked'
                        );


                    tarjeta.classList.toggle(
                        "seleccionado",
                        marcado
                    );


                    const estado =
                        tarjeta.querySelector(
                            ".estadoSeleccion"
                        );


                    if (estado) {
                        estado.classList.toggle(
                            "oculto",
                            !marcado
                        );
                    }
                }
            );
    }


    function rendererFallback() {
        const lista =
            document.getElementById(
                "listaAdicionales"
            );

        if (!lista) {
            console.warn(
                "[Mente & Manos] No existe #listaAdicionales."
            );
            return;
        }


        const actual =
            productoActualSeguro();

        const seleccion =
            seleccionActualSegura();

        const recomendado =
            RECOMENDADOS[actual];


        lista.innerHTML =
            Object.entries(LINEA)
                .filter(
                    ([clave]) =>
                        clave !== actual
                )
                .map(
                    ([clave, item]) => {

                        const checked =
                            seleccion.includes(clave)
                                ? "checked"
                                : "";

                        const claseSeleccion =
                            seleccion.includes(clave)
                                ? " seleccionado"
                                : "";

                        const estadoOculto =
                            seleccion.includes(clave)
                                ? ""
                                : " oculto";

                        const descripcion =
                            clave === recomendado
                                ? `<span class="recomendacionMini">Recomendado para complementar ${LINEA[actual].codigo}</span>`
                                : `<small>${item.descripcion}</small>`;

                        const bullets =
                            item.incluye
                                .map(
                                    texto =>
                                        `<li>${texto}</li>`
                                )
                                .join("");


                        return `
                            <div
                                class="adicionalWrap${claseSeleccion}"
                                data-ing="${clave}"
                            >

                                <label class="adicional">

                                    <input
                                        type="checkbox"
                                        value="${clave}"
                                        ${checked}
                                    >

                                    <span>
                                        <strong>
                                            ${item.codigo} — ${item.nombre}
                                        </strong>

                                        ${descripcion}
                                    </span>

                                </label>


                                <div class="adicionalInfoBar">

                                    <button
                                        type="button"
                                        class="verIncluye"
                                    >
                                        Ver qué incluye
                                    </button>

                                    <span
                                        class="estadoSeleccion${estadoOculto}"
                                    >
                                        SELECCIONADO
                                    </span>

                                </div>


                                <div class="fichaAdicional oculto">

                                    <span class="fichaEtiqueta">
                                        ${item.etiqueta}
                                    </span>

                                    <h4>
                                        ${item.codigo} — ${item.nombre}
                                    </h4>

                                    <p class="fichaPromesa">
                                        ${item.promesa}
                                    </p>

                                    <ul>
                                        ${bullets}
                                    </ul>

                                    <div class="paraQuien">
                                        <strong>Ideal para:</strong>
                                        ${item.ideal}
                                    </div>

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


        lista
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(
                input => {

                    input.addEventListener(
                        "change",
                        function () {

                            /*
                                Usamos la lógica original siempre que exista.
                                Así se conservan:
                                - límite 1 / 2 adicionales
                                - resumen del pedido
                                - precio
                                - botón WhatsApp
                            */
                            try {
                                if (
                                    typeof seleccionarAdicional ===
                                    "function"
                                ) {
                                    seleccionarAdicional(
                                        input
                                    );
                                }
                            }
                            catch (error) {
                                console.error(
                                    "[Mente & Manos] seleccionarAdicional:",
                                    error
                                );
                            }


                            setTimeout(
                                sincronizarVisual,
                                0
                            );
                        }
                    );
                }
            );


        lista
            .querySelectorAll(
                ".verIncluye"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        function () {

                            const tarjeta =
                                boton.closest(
                                    ".adicionalWrap"
                                );

                            const ficha =
                                tarjeta.querySelector(
                                    ".fichaAdicional"
                                );

                            const estabaAbierta =
                                !ficha.classList.contains(
                                    "oculto"
                                );


                            document
                                .querySelectorAll(
                                    "#listaAdicionales .fichaAdicional"
                                )
                                .forEach(
                                    x =>
                                        x.classList.add(
                                            "oculto"
                                        )
                                );


                            document
                                .querySelectorAll(
                                    "#listaAdicionales .verIncluye"
                                )
                                .forEach(
                                    x =>
                                        x.textContent =
                                            "Ver qué incluye"
                                );


                            if (!estabaAbierta) {
                                ficha.classList.remove(
                                    "oculto"
                                );

                                boton.textContent =
                                    "Ocultar información";
                            }
                        }
                    );
                }
            );


        sincronizarVisual();

        console.info(
            "[Mente & Manos] Configurador V5.7 renderizado."
        );
    }


    function repararSiHaceFalta() {
        if (reparando) {
            return;
        }


        const lista =
            document.getElementById(
                "listaAdicionales"
            );

        if (!lista) {
            return;
        }


        /*
            Si ya contiene tarjetas, no tocamos nada.
        */
        if (
            lista.querySelector(
                ".adicionalWrap"
            )
        ) {
            sincronizarVisual();
            return;
        }


        reparando = true;


        /*
            Primero intentamos recuperar la función original.
        */
        try {
            if (
                typeof renderizarAdicionales ===
                "function"
            ) {
                renderizarAdicionales();
            }
        }
        catch (error) {
            console.warn(
                "[Mente & Manos] El renderer original falló:",
                error
            );
        }


        /*
            Si siguió vacío, usamos el renderer seguro.
        */
        if (
            !lista.querySelector(
                ".adicionalWrap"
            )
        ) {
            rendererFallback();
        }


        reparando = false;
    }


    function iniciar() {
        repararSiHaceFalta();


        /*
            Cambios de producto.
        */
        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {
            selector.addEventListener(
                "change",
                function () {

                    setTimeout(
                        repararSiHaceFalta,
                        20
                    );
                }
            );
        }


        /*
            Cambios de plan:
            escuchamos los botones del bloque de ofertas sin
            depender del nombre exacto de sus clases.
        */
        document.addEventListener(
            "click",
            function (event) {

                const texto =
                    String(
                        event.target?.textContent ||
                        ""
                    ).toLowerCase();


                if (
                    texto.includes("opción") ||
                    texto.includes("opcion") ||
                    texto.includes("combo pro") ||
                    texto.includes("vip full") ||
                    texto.includes("seleccionado")
                ) {
                    setTimeout(
                        repararSiHaceFalta,
                        30
                    );
                }
            }
        );


        /*
            Si otro script vuelve a vaciar #listaAdicionales,
            lo recuperamos automáticamente.
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
                            !reparando &&
                            !lista.querySelector(
                                ".adicionalWrap"
                            )
                        ) {
                            setTimeout(
                                repararSiHaceFalta,
                                20
                            );
                        }
                    }
                );


            observer.observe(
                lista,
                {
                    childList: true
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

