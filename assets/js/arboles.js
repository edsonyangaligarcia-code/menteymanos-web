(function () {
    "use strict";

    let productoActual = "ing1";
    let datosProducto = null;

    let raiz = [];
    let ruta = [];

    let historialAtras = [];
    let historialAdelante = [];

    let termino = "";


    // ======================================================
    // UTILIDADES
    // ======================================================

    function escapar(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function normalizar(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }


    function arraySeguro(valor) {

        if (!valor) {
            return [];
        }

        if (Array.isArray(valor)) {
            return valor;
        }

        if (
            typeof valor === "object" &&
            valor.type
        ) {
            return [valor];
        }

        if (typeof valor === "object") {
            return Object.values(valor)
                .filter(
                    item =>
                        item &&
                        typeof item === "object" &&
                        item.type
                );
        }

        return [];
    }


    function clonarNodo(node) {

        if (
            !node ||
            typeof node !== "object"
        ) {
            return null;
        }

        if (node.type === "folder") {
            return {
                name:
                    String(node.name || ""),
                type:
                    "folder",
                children:
                    arraySeguro(node.children)
                        .map(clonarNodo)
                        .filter(Boolean)
            };
        }

        return {
            name:
                String(node.name || ""),
            type:
                "file"
        };
    }


    function clonarArbol(tree) {
        return arraySeguro(tree)
            .map(clonarNodo)
            .filter(Boolean);
    }


    function extension(nombre) {

        const texto =
            String(nombre || "");

        const punto =
            texto.lastIndexOf(".");

        if (punto < 0) {
            return "";
        }

        return texto
            .slice(punto + 1)
            .toLowerCase();
    }


    function etiquetaArchivo(nombre) {

        const ext =
            extension(nombre)
                .toUpperCase();

        return ext
            ? ext.substring(0, 5)
            : "FILE";
    }


    const collator =
        new Intl.Collator(
            "es",
            {
                numeric: true,
                sensitivity: "base"
            }
        );


    function ordenar(nodes) {

        return [...arraySeguro(nodes)]
            .sort(
                (a, b) => {

                    if (
                        a.type === "folder" &&
                        b.type !== "folder"
                    ) {
                        return -1;
                    }

                    if (
                        a.type !== "folder" &&
                        b.type === "folder"
                    ) {
                        return 1;
                    }

                    return collator.compare(
                        a.name || "",
                        b.name || ""
                    );
                }
            );
    }


    // ======================================================
    // ENCONTRAR LA CARPETA PRINCIPAL CORRECTA
    // ======================================================

    const patronesProducto = {

        ing1: [
            "ing 1",
            "coleccion maestra de planos",
            "planos y expedientes"
        ],

        ing3: [
            "ing 3 masterpack",
            "masterpack bim y revit",
            "ing 3"
        ],

        ing7: [
            "ing 7 calculo estructural pro",
            "calculo estructural pro",
            "ing 7"
        ]

    };


    function buscarCarpetaPrincipal(nodes, clave) {

        const patrones =
            patronesProducto[clave] || [];


        // Primero revisar raíz inmediata.
        for (
            const node of
            arraySeguro(nodes)
        ) {

            if (node.type !== "folder") {
                continue;
            }

            const nombre =
                normalizar(node.name);


            if (
                patrones.some(
                    patron =>
                        nombre.includes(
                            normalizar(patron)
                        )
                )
            ) {
                return node;
            }
        }


        // Si no aparece, buscar recursivamente.
        for (
            const node of
            arraySeguro(nodes)
        ) {

            if (node.type !== "folder") {
                continue;
            }

            const encontrada =
                buscarCarpetaPrincipal(
                    node.children,
                    clave
                );

            if (encontrada) {
                return encontrada;
            }
        }


        return null;
    }


    function resolverRaiz(clave, tree) {

        const arbol =
            clonarArbol(tree);


        const principal =
            buscarCarpetaPrincipal(
                arbol,
                clave
            );


        /*
            Si encontramos:
            ING 7 Cálculo Estructural PRO
            mostramos TODOS sus hijos directos:

            01...
            02...
            03...
            04 Instalador SAP2000
            INSTALADOR Mathcad...
            INSTALADOR TEKLA

            Lo mismo para ING 1 e ING 3.
        */

        if (principal) {
            return ordenar(
                principal.children
            );
        }


        /*
            Si el JSON ya vino sin carpeta contenedora,
            usamos directamente la raíz.
        */

        return ordenar(arbol);
    }


    // ======================================================
    // CONTEOS
    // ======================================================

    function contar(nodes) {

        let carpetas = 0;
        let archivos = 0;


        for (
            const node of
            arraySeguro(nodes)
        ) {

            if (node.type === "folder") {

                carpetas++;

                const sub =
                    contar(
                        node.children
                    );

                carpetas +=
                    sub.carpetas;

                archivos +=
                    sub.archivos;
            }
            else {
                archivos++;
            }
        }


        return {
            carpetas,
            archivos
        };
    }


    // ======================================================
    // NAVEGACIÓN
    // ======================================================

    function copiarRuta() {
        return [...ruta];
    }


    function carpetaActual() {

        if (!ruta.length) {
            return null;
        }

        return ruta[
            ruta.length - 1
        ];
    }


    function elementosActuales() {

        const actual =
            carpetaActual();


        if (!actual) {
            return raiz;
        }


        return arraySeguro(
            actual.children
        );
    }


    function limpiarBusqueda() {

        termino = "";

        const input =
            document.getElementById(
                "buscarArchivo"
            );

        if (input) {
            input.value = "";
        }
    }


    function navegarA(
        nuevaRuta,
        guardar = true
    ) {

        if (guardar) {

            historialAtras.push(
                copiarRuta()
            );

            historialAdelante = [];
        }


        ruta =
            [...nuevaRuta];


        limpiarBusqueda();

        render();
    }


    function entrar(node) {

        navegarA(
            [
                ...ruta,
                node
            ],
            true
        );
    }


    function atras() {

        if (
            !historialAtras.length
        ) {
            return;
        }


        historialAdelante.push(
            copiarRuta()
        );


        ruta =
            historialAtras.pop();


        limpiarBusqueda();

        render();
    }


    function adelante() {

        if (
            !historialAdelante.length
        ) {
            return;
        }


        historialAtras.push(
            copiarRuta()
        );


        ruta =
            historialAdelante.pop();


        limpiarBusqueda();

        render();
    }


    // ======================================================
    // CONTROLES
    // ======================================================

    function prepararControles() {

        const filtros =
            document.getElementById(
                "filtrosArbol"
            );

        if (filtros) {
            filtros.innerHTML = "";
            filtros.style.display =
                "none";
        }


        const meta =
            document.querySelector(
                ".arbolMeta"
            );


        if (
            meta &&
            !document.getElementById(
                "rutaArbol"
            )
        ) {

            const breadcrumb =
                document.createElement(
                    "div"
                );

            breadcrumb.id =
                "rutaArbol";

            breadcrumb.className =
                "rutaArbolDrive";


            meta.insertAdjacentElement(
                "afterend",
                breadcrumb
            );
        }


        const btnAtras =
            document.getElementById(
                "expandirArbol"
            );

        const btnAdelante =
            document.getElementById(
                "contraerArbol"
            );


        if (btnAtras) {

            btnAtras.innerHTML =
                '<span class="navFlecha">&larr;</span><span>Atrás</span>';

            btnAtras.onclick =
                atras;
        }


        if (btnAdelante) {

            btnAdelante.innerHTML =
                '<span>Adelante</span><span class="navFlecha">&rarr;</span>';

            btnAdelante.onclick =
                adelante;
        }
    }


    // ======================================================
    // BREADCRUMB
    // ======================================================

    function renderRuta() {

        const contenedor =
            document.getElementById(
                "rutaArbol"
            );


        if (
            !contenedor ||
            !datosProducto
        ) {
            return;
        }


        let html = `
            <button
                type="button"
                class="crumbDrive ${
                    ruta.length === 0
                        ? "actual"
                        : ""
                }"
                data-nivel="-1"
            >
                ${escapar(
                    datosProducto.code
                )}
            </button>
        `;


        ruta.forEach(
            (folder, index) => {

                html += `
                    <span class="crumbSeparador">
                        &rsaquo;
                    </span>

                    <button
                        type="button"
                        class="crumbDrive ${
                            index === ruta.length - 1
                                ? "actual"
                                : ""
                        }"
                        data-nivel="${index}"
                    >
                        ${escapar(
                            folder.name
                        )}
                    </button>
                `;
            }
        );


        contenedor.innerHTML =
            html;


        contenedor
            .querySelectorAll(
                ".crumbDrive"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        function () {

                            const nivel =
                                Number(
                                    boton.dataset.nivel
                                );


                            const nuevaRuta =
                                nivel < 0
                                    ? []
                                    : ruta.slice(
                                        0,
                                        nivel + 1
                                    );


                            if (
                                nuevaRuta.length ===
                                ruta.length
                            ) {
                                return;
                            }


                            navegarA(
                                nuevaRuta,
                                true
                            );
                        }
                    );

                }
            );
    }


    // ======================================================
    // FILAS
    // ======================================================

    function crearCabecera(visor) {

        const cabecera =
            document.createElement(
                "div"
            );

        cabecera.className =
            "driveHeader";


        cabecera.innerHTML = `
            <span></span>
            <span>Nombre</span>
            <span>Tipo</span>
            <span>Contenido</span>
            <span></span>
        `;


        visor.appendChild(
            cabecera
        );
    }


    function crearCarpeta(node) {

        const boton =
            document.createElement(
                "button"
            );

        boton.type =
            "button";

        boton.className =
            "driveRow driveFolderRow";


        boton.innerHTML = `
            <span class="driveFolderIcon"></span>

            <span class="driveNombre">
                ${escapar(
                    node.name
                )}
            </span>

            <span class="driveTipo">
                Carpeta
            </span>

            <span class="driveCantidad">
                ${arraySeguro(
                    node.children
                ).length}
            </span>

            <span class="driveEntrar">
                &rsaquo;
            </span>
        `;


        boton.addEventListener(
            "click",
            function () {
                entrar(node);
            }
        );


        return boton;
    }


    function crearArchivo(node) {

        const fila =
            document.createElement(
                "div"
            );

        fila.className =
            "driveRow driveFileRow";


        fila.innerHTML = `
            <span class="driveFileBadge">
                ${escapar(
                    etiquetaArchivo(
                        node.name
                    )
                )}
            </span>

            <span class="driveNombre">
                ${escapar(
                    node.name
                )}
            </span>

            <span class="driveTipo">
                ${escapar(
                    extension(
                        node.name
                    ).toUpperCase() ||
                    "Archivo"
                )}
            </span>

            <span class="driveCantidad">
                Solo vista
            </span>

            <span class="driveEntrar vacio"></span>
        `;


        return fila;
    }


    // ======================================================
    // BÚSQUEDA GLOBAL
    // ======================================================

    function buscar() {

        const resultados = [];


        function recorrer(
            nodes,
            padres,
            rutaTexto
        ) {

            for (
                const node of
                arraySeguro(nodes)
            ) {

                const nombre =
                    normalizar(
                        node.name
                    );


                if (
                    nombre.includes(
                        termino
                    )
                ) {

                    resultados.push({
                        node,
                        padres,
                        rutaTexto,
                        folder:
                            node.type ===
                            "folder"
                    });
                }


                if (
                    node.type ===
                    "folder"
                ) {

                    recorrer(
                        node.children,
                        [
                            ...padres,
                            node
                        ],
                        [
                            ...rutaTexto,
                            node.name
                        ]
                    );
                }


                if (
                    resultados.length >=
                    300
                ) {
                    return;
                }
            }
        }


        recorrer(
            raiz,
            [],
            [
                datosProducto?.code ||
                "ING"
            ]
        );


        return resultados;
    }


    function crearResultado(item) {

        if (item.folder) {

            const boton =
                crearCarpeta(
                    item.node
                );


            const nombre =
                boton.querySelector(
                    ".driveNombre"
                );


            if (nombre) {

                nombre.innerHTML = `
                    ${escapar(
                        item.node.name
                    )}

                    <small class="drivePath">
                        ${escapar(
                            item.rutaTexto.join(
                                " / "
                            )
                        )}
                    </small>
                `;
            }


            boton.onclick = null;


            boton.addEventListener(
                "click",
                function () {

                    navegarA(
                        [
                            ...item.padres,
                            item.node
                        ],
                        true
                    );
                }
            );


            return boton;
        }


        const fila =
            crearArchivo(
                item.node
            );


        const nombre =
            fila.querySelector(
                ".driveNombre"
            );


        if (nombre) {

            nombre.innerHTML = `
                ${escapar(
                    item.node.name
                )}

                <small class="drivePath">
                    ${escapar(
                        item.rutaTexto.join(
                            " / "
                        )
                    )}
                </small>
            `;
        }


        return fila;
    }


    // ======================================================
    // RENDER PRINCIPAL
    // ======================================================

    function render() {

        prepararControles();


        const visor =
            document.getElementById(
                "visorArchivos"
            );

        const stats =
            document.getElementById(
                "arbolStats"
            );

        const btnAtras =
            document.getElementById(
                "expandirArbol"
            );

        const btnAdelante =
            document.getElementById(
                "contraerArbol"
            );


        if (
            !visor ||
            !stats
        ) {
            return;
        }


        if (btnAtras) {
            btnAtras.disabled =
                historialAtras.length ===
                0;
        }


        if (btnAdelante) {
            btnAdelante.disabled =
                historialAdelante.length ===
                0;
        }


        if (!datosProducto) {

            stats.innerHTML = `
                <strong>
                    No se cargó el árbol
                </strong>

                <span>
                    Revisa assets/data/arboles-data.js
                </span>
            `;


            visor.innerHTML = `
                <div class="driveEmpty">
                    No encontré datos para este producto.
                </div>
            `;

            return;
        }


        renderRuta();


        const conteos =
            contar(raiz);


        const actual =
            carpetaActual();


        stats.innerHTML = `
            <strong>
                ${escapar(
                    datosProducto.code
                )}
                —
                ${escapar(
                    actual
                        ? actual.name
                        : datosProducto.name
                )}
            </strong>

            <span>
                ${conteos.carpetas
                    .toLocaleString(
                        "es-PE"
                    )}
                carpetas
                ·
                ${conteos.archivos
                    .toLocaleString(
                        "es-PE"
                    )}
                archivos
            </span>
        `;


        visor.innerHTML = "";


        crearCabecera(
            visor
        );


        // BUSCADOR
        if (termino) {

            const resultados =
                buscar();


            if (
                !resultados.length
            ) {

                visor.innerHTML = `
                    <div class="driveEmpty">
                        <strong>
                            No encontré “${escapar(
                                termino
                            )}”
                        </strong>
                    </div>
                `;

                return;
            }


            for (
                const item of
                resultados
            ) {

                visor.appendChild(
                    crearResultado(
                        item
                    )
                );
            }


            return;
        }


        // NAVEGACIÓN NORMAL
        const nodes =
            ordenar(
                elementosActuales()
            );


        if (!nodes.length) {

            visor.innerHTML = `
                <div class="driveEmpty">
                    <strong>
                        Esta carpeta está vacía.
                    </strong>

                    <span>
                        Usa Atrás para volver.
                    </span>
                </div>
            `;

            return;
        }


        for (
            const node of
            nodes
        ) {

            visor.appendChild(
                node.type ===
                "folder"
                    ? crearCarpeta(
                        node
                    )
                    : crearArchivo(
                        node
                    )
            );
        }
    }


    // ======================================================
    // CARGAR ING
    // ======================================================

    function cargar(clave) {

        productoActual =
            clave;


        ruta = [];
        historialAtras = [];
        historialAdelante = [];


        limpiarBusqueda();


        if (
            !window.ARBOLES
        ) {

            datosProducto =
                null;

            raiz = [];

            render();

            return;
        }


        datosProducto =
            window.ARBOLES[clave] ||
            null;


        if (!datosProducto) {

            raiz = [];

            render();

            return;
        }


        raiz =
            resolverRaiz(
                clave,
                datosProducto.tree
            );


        console.info(
            "[MenteYManos visor]",
            clave,
            {
                raiz:
                    raiz.map(
                        x => x.name
                    ),
                conteos:
                    contar(raiz)
            }
        );


        render();
    }


    window.cargarArbolProducto =
        cargar;


    window.filtrarArbol =
        function () {

            const input =
                document.getElementById(
                    "buscarArchivo"
                );


            termino =
                input
                    ? normalizar(
                        input.value
                    )
                    : "";


            render();
        };


    // Compatibilidad
    window.expandirPrimerNivel =
        atras;

    window.contraerArbol =
        adelante;


    // ======================================================
    // INICIO
    // ======================================================

    function iniciar() {

        prepararControles();


        const buscador =
            document.getElementById(
                "buscarArchivo"
            );


        if (buscador) {

            buscador.oninput =
                window.filtrarArbol;
        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const urlProducto =
            params.get(
                "producto"
            );


        const inicial =
            [
                "ing1",
                "ing3",
                "ing7"
            ].includes(
                urlProducto
            )
                ? urlProducto
                : "ing1";


        cargar(
            inicial
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
