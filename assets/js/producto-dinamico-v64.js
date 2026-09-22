(function () {
    "use strict";


    const PRODUCTOS = {

        ing1: {
            codigo: "ING 1",
            precioBase: 9.90
        },

        ing3: {
            codigo: "ING 3",
            precioBase: 12.90
        },

        ing7: {
            codigo: "ING 7",
            precioBase: 12.90
        }

    };


    let claveAnterior = null;
    let sincronizando = false;


    function normalizar(texto) {

        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    }


    function claveProducto() {

        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (
            selector &&
            PRODUCTOS[selector.value]
        ) {
            return selector.value;
        }


        const desdeUrl =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        if (PRODUCTOS[desdeUrl]) {
            return desdeUrl;
        }


        return "ing1";
    }


    function reemplazarTextosExactos(
        reemplazos
    ) {

        const walker =
            document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT
            );


        const nodos = [];


        while (
            walker.nextNode()
        ) {
            nodos.push(
                walker.currentNode
            );
        }


        for (const nodo of nodos) {

            const texto =
                nodo.nodeValue;


            if (!texto) {
                continue;
            }


            const limpio =
                texto.trim();


            for (
                const {
                    patron,
                    reemplazo
                } of reemplazos
            ) {

                if (
                    patron.test(
                        limpio
                    )
                ) {

                    const inicio =
                        texto.indexOf(
                            limpio
                        );


                    nodo.nodeValue =
                        texto.slice(
                            0,
                            inicio
                        ) +
                        reemplazo +
                        texto.slice(
                            inicio +
                            limpio.length
                        );


                    break;
                }
            }
        }
    }


    function actualizarTextosProducto() {

        const clave =
            claveProducto();


        const producto =
            PRODUCTOS[clave];


        const codigo =
            producto.codigo;


        reemplazarTextosExactos([
            {
                patron:
                    /^ING\s+[137]\s*\+\s*1 adicional$/i,

                reemplazo:
                    `${codigo} + 1 adicional`
            },

            {
                patron:
                    /^Agrega 1 ING adicional a ING\s+[137]\.$/i,

                reemplazo:
                    `Agrega 1 ING adicional a ${codigo}.`
            },

            {
                patron:
                    /^ING\s+[137]\s*\+\s*2 adicionales$/i,

                reemplazo:
                    `${codigo} + 2 adicionales`
            },

            {
                patron:
                    /^Combina ING\s+[137] con 2 ING adicionales\.$/i,

                reemplazo:
                    `Combina ${codigo} con 2 ING adicionales.`
            },

            {
                patron:
                    /^Elige 1 ING adicional para complementar ING\s+[137]$/i,

                reemplazo:
                    `Elige 1 ING adicional para complementar ${codigo}`
            },

            {
                patron:
                    /^Elige 2 ING adicionales para complementar ING\s+[137]$/i,

                reemplazo:
                    `Elige 2 ING adicionales para complementar ${codigo}`
            },

            {
                patron:
                    /^ING\s+[137] ya está incluido en tu pedido\.$/i,

                reemplazo:
                    `${codigo} ya está incluido en tu pedido.`
            },

            {
                patron:
                    /^ING\s+[137] ya esta incluido en tu pedido\.$/i,

                reemplazo:
                    `${codigo} ya está incluido en tu pedido.`
            }
        ]);


        actualizarPrecioOpcion1(
            producto.precioBase
        );
    }


    function encontrarEtiquetaOpcion1() {

        return Array.from(
            document.querySelectorAll(
                "*"
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
                    "opcion 1"
                );
            }
        ) || null;
    }


    function actualizarPrecioOpcion1(
        precio
    ) {

        const etiqueta =
            encontrarEtiquetaOpcion1();


        if (!etiqueta) {
            return;
        }


        let contenedor =
            etiqueta.parentElement;


        /*
            Buscamos el ancestro MÁS pequeño que tenga
            precio y botón, pero que no contenga las otras
            dos ofertas.
        */

        for (
            let i = 0;
            contenedor && i < 7;
            i++,
            contenedor =
                contenedor.parentElement
        ) {

            const texto =
                normalizar(
                    contenedor.innerText
                );


            const contienePrecio =
                /s\/\s*\d+\.\d{2}/i
                    .test(
                        texto
                    );


            const contieneBoton =
                !!contenedor.querySelector(
                    "button"
                );


            const mezclaOtras =
                texto.includes(
                    "combo pro"
                ) ||
                texto.includes(
                    "vip full"
                );


            if (
                contienePrecio &&
                contieneBoton &&
                !mezclaOtras
            ) {

                const candidatos =
                    Array.from(
                        contenedor.querySelectorAll(
                            "*"
                        )
                    );


                for (
                    const elemento of
                    candidatos
                ) {

                    if (
                        elemento.children.length >
                        0
                    ) {
                        continue;
                    }


                    if (
                        /^S\/\s*\d+\.\d{2}$/i
                            .test(
                                elemento.textContent
                                    .trim()
                            )
                    ) {

                        elemento.textContent =
                            `S/ ${precio.toFixed(2)}`;

                        return;
                    }
                }
            }
        }
    }


    function listaTieneProductoBase() {

        const clave =
            claveProducto();


        return !!document.querySelector(
            `#listaAdicionales .adicionalWrap[data-ing="${clave}"]`
        );
    }


    function listaTieneSeisOpciones() {

        return (
            document.querySelectorAll(
                "#listaAdicionales .adicionalWrap"
            ).length === 6
        );
    }


    function regenerarAdicionalesSiHaceFalta(
        forzar = false
    ) {

        const lista =
            document.getElementById(
                "listaAdicionales"
            );


        if (!lista) {
            return;
        }


        const incorrecta =
            listaTieneProductoBase() ||
            !listaTieneSeisOpciones();


        if (
            !forzar &&
            !incorrecta
        ) {
            return;
        }


        /*
            Vaciamos la lista.

            El MutationObserver de configurador-fix-v57.js
            detectará que quedó vacía y la reconstruirá.
            Como V5.7 ya usa selector/URL primero, excluirá
            correctamente el producto principal.
        */

        lista.innerHTML = "";


        /*
            Respaldo por si el observer no se dispara:
            llamamos a la función reparadora únicamente si
            estuviera expuesta en alguna versión futura.
        */

        setTimeout(
            function () {

                actualizarTextosProducto();

            },
            40
        );
    }


    function validarLista() {

        const clave =
            claveProducto();


        const esperadas =
            Object.keys({
                ing1: 1,
                ing2: 1,
                ing3: 1,
                ing4: 1,
                ing5: 1,
                ing6: 1,
                ing7: 1
            })
            .filter(
                x =>
                    x !== clave
            );


        const actuales =
            Array.from(
                document.querySelectorAll(
                    "#listaAdicionales .adicionalWrap"
                )
            )
            .map(
                tarjeta =>
                    tarjeta.dataset.ing
            )
            .filter(Boolean);


        return (
            actuales.length === 6 &&
            esperadas.every(
                claveEsperada =>
                    actuales.includes(
                        claveEsperada
                    )
            ) &&
            !actuales.includes(
                clave
            )
        );
    }


    function sincronizar(
        forzarLista = false
    ) {

        if (sincronizando) {
            return;
        }


        sincronizando =
            true;


        const clave =
            claveProducto();


        /*
            Si cambió ING 1 -> ING 3 -> ING 7,
            regeneramos siempre los adicionales.
        */

        const cambioProducto =
            clave !==
            claveAnterior;


        actualizarTextosProducto();


        regenerarAdicionalesSiHaceFalta(
            forzarLista ||
            cambioProducto
        );


        claveAnterior =
            clave;


        /*
            Dejamos tiempo a V5.7 para reconstruir.
        */

        setTimeout(
            function () {

                actualizarTextosProducto();


                if (
                    !validarLista()
                ) {

                    console.warn(
                        "[Mente & Manos V6.4] La lista aún no coincide. Reintentando..."
                    );


                    const lista =
                        document.getElementById(
                            "listaAdicionales"
                        );


                    if (lista) {
                        lista.innerHTML =
                            "";
                    }


                    setTimeout(
                        actualizarTextosProducto,
                        80
                    );
                }


                sincronizando =
                    false;


                console.info(
                    "[Mente & Manos V6.4]",
                    {
                        producto:
                            claveProducto(),
                        adicionales:
                            Array.from(
                                document.querySelectorAll(
                                    "#listaAdicionales .adicionalWrap"
                                )
                            ).map(
                                x =>
                                    x.dataset.ing
                            )
                    }
                );

            },
            100
        );
    }


    function actualizarUrl(
        clave
    ) {

        if (!PRODUCTOS[clave]) {
            return;
        }


        const url =
            new URL(
                window.location.href
            );


        url.searchParams.set(
            "producto",
            clave
        );


        history.replaceState(
            null,
            "",
            url
        );
    }


    function iniciar() {

        /*
            Si la URL trae ing3 o ing7, garantizamos que
            el selector coincida antes de reconstruir.
        */

        const desdeUrl =
            new URLSearchParams(
                window.location.search
            ).get("producto");


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (
            selector &&
            PRODUCTOS[desdeUrl] &&
            selector.value !==
            desdeUrl
        ) {
            selector.value =
                desdeUrl;
        }


        setTimeout(
            function () {
                sincronizar(
                    true
                );
            },
            120
        );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    if (
                        PRODUCTOS[
                            selector.value
                        ]
                    ) {

                        actualizarUrl(
                            selector.value
                        );


                        /*
                            Desmarcar visualmente lo que
                            pertenecía al producto anterior.
                        */

                        setTimeout(
                            function () {
                                sincronizar(
                                    true
                                );
                            },
                            80
                        );
                    }
                }
            );
        }


        /*
            Los cambios de plan pueden cambiar el encabezado
            de "Elige 1 / 2 ING". Lo resincronizamos.
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
                        "combo pro"
                    ) ||
                    texto.includes(
                        "vip full"
                    ) ||
                    texto.includes(
                        "opcion 1"
                    ) ||
                    texto ===
                        "seleccionado"
                ) {

                    setTimeout(
                        actualizarTextosProducto,
                        90
                    );
                }
            },
            true
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
