const NUMERO_WHATSAPP = "51901174129";

const productos = {
    ing1: {
        codigo: "ING 1",
        nombre: "Colección Maestra de Planos y Expedientes",
        descripcion: "Referencias reales para dejar de empezar cada proyecto desde cero.",
        precio: 9.90,
        recomendado: "ing6",
        beneficios: [
            "Viviendas de diferentes medidas",
            "Proyectos unifamiliares y multifamiliares",
            "Arquitectura, estructuras e instalaciones",
            "Archivos editables en AutoCAD"
        ],
        archivos: [
            "CARPETA  Viviendas Unifamiliares",
            "  CARPETA  Modelos de diferentes medidas",
            "    ARCHIVO  ARQUITECTURA.dwg",
            "    ARCHIVO  CIMENTACION.dwg",
            "    ARCHIVO  INSTALACIONES ELECTRICAS.dwg",
            "    ARCHIVO  INSTALACIONES SANITARIAS.dwg",
            "    ARCHIVO  CORTES Y ELEVACIONES.dwg",
            "CARPETA  Viviendas Multifamiliares",
            "CARPETA  Locales Comerciales",
            "CARPETA  Proyectos Especiales",
            "CARPETA  Biblioteca CAD Complementaria"
        ]
    },

    ing3: {
        codigo: "ING 3",
        nombre: "BIM y Revit Nivel VIP",
        descripcion: "Plantillas, familias, proyectos y formación para trabajar mejor con Revit y BIM.",
        precio: 12.90,
        recomendado: "ing4",
        beneficios: [
            "Plantillas profesionales Revit",
            "Biblioteca de familias RFA",
            "Masterclasses de arquitectura y estructuras",
            "MEP, metrados y proyectos BIM"
        ],
        archivos: [
            "CARPETA  Plantillas Profesionales Revit",
            "  ARCHIVO  Plantilla Arquitectura.rte",
            "  ARCHIVO  Plantilla Estructura.rte",
            "  ARCHIVO  Plantilla Instalaciones Electricas.rte",
            "  ARCHIVO  Plantilla Instalaciones Sanitarias.rte",
            "CARPETA  Familias Paramétricas RFA",
            "CARPETA  Masterclasses",
            "CARPETA  MEP y Metrados BIM",
            "CARPETA  Proyectos Revit"
        ]
    },

    ing7: {
        codigo: "ING 7",
        nombre: "Cálculo Estructural PRO",
        descripcion: "Análisis, diseño y modelado estructural con clases, casos y plantillas.",
        precio: 12.90,
        recomendado: "ing3",
        beneficios: [
            "Análisis estructural con SAP2000",
            "Modelado estructural y Tekla",
            "Plantillas de cálculo",
            "Clases y casos prácticos"
        ],
        archivos: [
            "CARPETA  Análisis Estructural",
            "  CARPETA  Videotutoriales",
            "    ARCHIVO  Edificio de 3 niveles.mp4",
            "    ARCHIVO  Zapata Cuadrada.mp4",
            "    ARCHIVO  Galpón Metálico.mp4",
            "CARPETA  Plantillas de Cálculo",
            "  ARCHIVO  Diseño de Vigas.mcdx",
            "  ARCHIVO  Diseño de Zapata Aislada.mcdx",
            "CARPETA  Tekla y Estructuras Metálicas"
        ]
    }
};

const lineaING = {
    ing1: { codigo: "ING 1", nombre: "Planos y Expedientes", descripcion: "Planos, proyectos y referencias CAD." },
    ing2: { codigo: "ING 2", nombre: "Expedientes, Licencias y Costos", descripcion: "Documentación, normativa, metrados y costos." },
    ing3: { codigo: "ING 3", nombre: "BIM y Revit", descripcion: "Plantillas, familias, proyectos y formación BIM." },
    ing4: { codigo: "ING 4", nombre: "Coordinación BIM Avanzada", descripcion: "Navisworks, Dynamo, coordinación y automatización." },
    ing5: { codigo: "ING 5", nombre: "Gestión y Supervisión de Obras", descripcion: "Residencia, supervisión, planeamiento y control." },
    ing6: { codigo: "ING 6", nombre: "AutoCAD + Bloques", descripcion: "Bibliotecas, proyectos y recursos para dibujo CAD." },
    ing7: { codigo: "ING 7", nombre: "Cálculo Estructural PRO", descripcion: "Análisis, modelado y recursos de cálculo estructural." }
};

const fichasIng = {
    ing1: {
        etiqueta: "PLANOS Y REFERENCIAS CAD",
        promesa: "Una biblioteca para consultar soluciones reales y no tener que empezar cada proyecto desde cero.",
        incluye: [
            "Viviendas unifamiliares de diferentes medidas.",
            "Proyectos y expedientes multifamiliares.",
            "Arquitectura, cimentación y estructuras.",
            "Instalaciones eléctricas y sanitarias.",
            "Cortes, elevaciones, ubicación y proyectos especiales."
        ],
        ideal: "Arquitectos, ingenieros, proyectistas, cadistas y estudiantes.",
        muestra: [
            "[CARPETA] Viviendas Unifamiliares",
            "  [CARPETA] Diferentes medidas",
            "    ARQUITECTURA.dwg",
            "    CIMENTACION.dwg",
            "    INSTALACIONES ELECTRICAS.dwg",
            "    INSTALACIONES SANITARIAS.dwg",
            "[CARPETA] Multifamiliares",
            "[CARPETA] Proyectos Especiales"
        ]
    },

    ing2: {
        etiqueta: "DOCUMENTACION Y EXPEDIENTES",
        promesa: "Modelos y referencias para organizar la documentación técnica que acompaña tus proyectos.",
        incluye: [
            "Expedientes técnicos modelo.",
            "Memorias de arquitectura, estructuras e instalaciones.",
            "Documentos y formularios de licencia como referencia.",
            "Biblioteca normativa RNE y diseño estructural.",
            "Metrados, presupuestos, costos y hojas de cálculo.",
            "Casos de trámites, catastro y urbanismo."
        ],
        ideal: "Ingenieros, arquitectos, gestores de proyectos, tramitadores y contratistas.",
        muestra: [
            "[CARPETA] Expedientes Tecnicos Modelo",
            "  MEMORIA ARQUITECTURA.docx",
            "  ESTRUCTURAS.dwg",
            "  INSTALACIONES ELECTRICAS.dwg",
            "  INSTALACIONES SANITARIAS.dwg",
            "[CARPETA] Biblioteca Normativa RNE",
            "[CARPETA] Presupuestos y Metrados",
            "[CARPETA] Casos y Tramites"
        ]
    },

    ing3: {
        etiqueta: "BIM Y REVIT",
        promesa: "Recursos preparados para modelar, documentar y aprender Revit con una biblioteca BIM más completa.",
        incluye: [
            "Plantillas profesionales para arquitectura y estructuras.",
            "Plantillas y recursos para instalaciones MEP.",
            "Biblioteca de familias paramétricas RFA.",
            "Plantillas y proyectos Revit 2024, 2025 y 2026.",
            "Masterclasses de arquitectura y estructuras.",
            "Topografía, metrados y presupuestos BIM."
        ],
        ideal: "Arquitectos, ingenieros, modeladores BIM y estudiantes de Revit.",
        muestra: [
            "[CARPETA] Plantillas Profesionales Revit",
            "  Plantilla Arquitectura.rte",
            "  Plantilla Estructura.rte",
            "  Plantilla Instalaciones Electricas.rte",
            "  Plantilla Instalaciones Sanitarias.rte",
            "[CARPETA] Familias Parametricas RFA",
            "[CARPETA] Masterclasses",
            "[CARPETA] MEP y Metrados BIM"
        ]
    },

    ing4: {
        etiqueta: "COORDINACION BIM",
        promesa: "El siguiente paso después del modelado: coordinar especialidades, detectar interferencias y automatizar procesos.",
        incluye: [
            "Gestión y coordinación BIM.",
            "Navisworks y detección de interferencias.",
            "Talleres con modelos para coordinación.",
            "Automatización y programación visual con Dynamo.",
            "Análisis de datos BIM con Power BI.",
            "Material de control de obra BIM y Lean Construction."
        ],
        ideal: "Coordinadores BIM, modeladores avanzados, ingenieros y responsables de proyectos.",
        muestra: [
            "[CARPETA] Gestion y Coordinacion BIM",
            "[CARPETA] Navisworks y Deteccion de Clashes",
            "  Coordinacion 1.nwd",
            "  Coordinacion 2.nwf",
            "  Modelo Estructuras.nwc",
            "[CARPETA] Dynamo",
            "[CARPETA] Power BI",
            "[CARPETA] Control de Obra BIM"
        ]
    },

    ing5: {
        etiqueta: "GESTION DE OBRA",
        promesa: "Material formativo y de referencia para residencia, supervisión, planeamiento y control de obras.",
        incluye: [
            "Residencia y supervisión profesional de obras.",
            "Clases, plantillas y material digital de apoyo.",
            "Planeamiento y control de obra.",
            "Metodologías Lean Construction.",
            "Biblioteca especializada de ingeniería civil.",
            "Material formativo sobre Contrataciones con el Estado."
        ],
        ideal: "Residentes, supervisores, ingenieros civiles y profesionales de gestión de construcción.",
        muestra: [
            "[CARPETA] Residencia y Supervision",
            "  [CARPETA] Clases en Video",
            "  [CARPETA] Plantillas y Material Digital",
            "[CARPETA] Planeamiento y Lean Construction",
            "[CARPETA] Biblioteca de Ingenieria Civil",
            "[CARPETA] Contrataciones con el Estado"
        ]
    },

    ing6: {
        etiqueta: "AUTOCAD Y RECURSOS CAD",
        promesa: "Una biblioteca para acelerar el trabajo en AutoCAD con proyectos, detalles y recursos ya disponibles.",
        incluye: [
            "Megapack de arquitectura y proyectos CAD.",
            "Expedientes de viviendas y edificios.",
            "Proyectos comerciales y material de urbanismo.",
            "Biblioteca de bloques y recursos CAD.",
            "Archivos DWG para consulta y edición.",
            "Casos y recursos de saneamiento legal."
        ],
        ideal: "Cadistas, dibujantes, arquitectos, ingenieros y estudiantes que trabajan con AutoCAD.",
        muestra: [
            "[CARPETA] Megapack Arquitectura y Proyectos",
            "[CARPETA] Viviendas y Edificios",
            "  PROYECTO.dwg",
            "  ARQUITECTURA.dwg",
            "  PLANO DE LOCALIZACION.dwg",
            "[CARPETA] Proyectos Comerciales y Urbanismo",
            "[CARPETA] Recursos CAD",
            "[CARPETA] Saneamiento Legal"
        ]
    },

    ing7: {
        etiqueta: "CALCULO ESTRUCTURAL",
        promesa: "Recursos técnicos para estudiar análisis, diseño y modelado estructural mediante clases y casos prácticos.",
        incluye: [
            "Masterclass de análisis estructural con SAP2000.",
            "Espectros sísmicos, guías y plantillas Excel de apoyo.",
            "Casos de vigas, losas, pórticos, zapatas y edificios.",
            "Modelado estructural con Tekla.",
            "Gestión y costos de proyectos metálicos.",
            "Plantillas automatizadas de cálculo con Mathcad."
        ],
        ideal: "Ingenieros civiles, calculistas, estructurales y estudiantes avanzados.",
        muestra: [
            "[CARPETA] Analisis Estructural SAP2000",
            "  Edificio de 3 niveles.mp4",
            "  Zapata Cuadrada.mp4",
            "  Galpon Metalico.mp4",
            "[CARPETA] Tekla y Estructuras Metalicas",
            "[CARPETA] Plantillas de Calculo",
            "  Diseno de Vigas.mcdx",
            "  Diseno de Zapata Aislada.mcdx"
        ]
    }
};

let productoActual = "ing1";
let planActual = 0;
let adicionales = [];
let maximoAdicionales = 0;

const selector = document.getElementById("selectorProducto");

function iniciar() {
    const parametros = new URLSearchParams(window.location.search);
    const productoURL = parametros.get("producto");

    if (productoURL && productos[productoURL]) {
        productoActual = productoURL;
    }

    selector.value = productoActual;

    selector.addEventListener("change", function () {
        productoActual = selector.value;
        const url = new URL(window.location.href);
        url.searchParams.set("producto", productoActual);
        window.history.replaceState({}, "", url);
        mostrarProducto();
    });

    document.querySelectorAll(".elegirOferta").forEach(boton => {
        boton.addEventListener("click", function () {
            seleccionarPlan(Number(boton.dataset.plan));
        });
    });

    document.getElementById("buscarArchivo").addEventListener("input", function () {
        if (window.filtrarArbol) {
            window.filtrarArbol();
        } else {
            mostrarArchivos();
        }
    });
    document.getElementById("continuarWhatsapp").addEventListener("click", abrirWhatsapp);
    document.getElementById("vipContinuar").addEventListener("click", abrirWhatsapp);

    mostrarProducto();
}

function mostrarProducto() {
    const p = productos[productoActual];

    document.getElementById("codigoProducto").textContent = p.codigo;
    document.getElementById("nombreProducto").textContent = p.nombre;
    document.getElementById("descripcionProducto").textContent = p.descripcion;

    const tituloArbolProducto =
        document.getElementById("tituloArbolProducto");

    if (tituloArbolProducto) {
        tituloArbolProducto.textContent =
            `Explora el contenido de ${p.codigo}`;
    }
    document.getElementById("precioOpcion1").textContent = formatearPrecio(p.precio);

    const tituloOferta1 = document.getElementById("tituloOferta1");
    const textoOferta1 = document.getElementById("textoOferta1");
    const tituloOferta2 = document.getElementById("tituloOferta2");
    const textoOferta2 = document.getElementById("textoOferta2");

    if (tituloOferta1) tituloOferta1.textContent = `${p.codigo} + 1 adicional`;
    if (textoOferta1) textoOferta1.textContent = `Agrega 1 ING adicional a ${p.codigo}.`;
    if (tituloOferta2) tituloOferta2.textContent = `${p.codigo} + 2 adicionales`;
    if (textoOferta2) textoOferta2.textContent = `Combina ${p.codigo} con 2 ING adicionales.`;

    document.getElementById("beneficios").innerHTML =
        p.beneficios.map(texto => `<div class="beneficio">${texto}</div>`).join("");

    renderMediaProducto(); // V5

    planActual = 0;
    adicionales = [];
    maximoAdicionales = 0;

    limpiarSeleccionVisual();
    document.getElementById("configurador").classList.add("oculto");
    document.getElementById("detalleVip").classList.add("oculto");

    if (window.cargarArbolProducto) {
        window.cargarArbolProducto(productoActual);
    }


}

function mostrarArchivos() {
    const termino = document.getElementById("buscarArchivo").value.trim().toLowerCase();
    const archivos = productos[productoActual].archivos;
    const filtrados = archivos.filter(archivo => archivo.toLowerCase().includes(termino));
    const visor = document.getElementById("visorArchivos");

    visor.innerHTML = filtrados.map(archivo => {
        const esCarpeta = archivo.includes("CARPETA");
        const limpio = archivo.replace("CARPETA  ", "").replace("ARCHIVO  ", "");
        return `<div class="${esCarpeta ? "carpeta" : "archivo"}">${esCarpeta ? "[+] " : "    - "}${limpio}</div>`;
    }).join("");
}

function limpiarSeleccionVisual() {
    document.querySelectorAll(".oferta").forEach(tarjeta => {
        tarjeta.classList.remove("ofertaSeleccionada");
    });

    const textos = {
        1: "Elegir esta opción",
        2: "Elegir Combo Pro",
        3: "Elegir VIP Full"
    };

    document.querySelectorAll(".elegirOferta").forEach(boton => {
        boton.textContent = textos[Number(boton.dataset.plan)];
    });
}

function marcarSeleccionVisual(plan) {
    limpiarSeleccionVisual();
    const tarjeta = document.querySelector(`.oferta[data-oferta="${plan}"]`);

    if (tarjeta) {
        tarjeta.classList.add("ofertaSeleccionada");
        const boton = tarjeta.querySelector(".elegirOferta");
        if (boton) boton.textContent = "Seleccionado";
    }
}

function seleccionarPlan(plan) {
    planActual = plan;
    adicionales = [];
    marcarSeleccionVisual(plan);

    const configurador = document.getElementById("configurador");
    const detalleVip = document.getElementById("detalleVip");

    configurador.classList.remove("oculto");

    if (plan === 3) {
        maximoAdicionales = 0;
        document.getElementById("tituloConfigurador").textContent = "VIP Full seleccionado";
        const ayudaConfiguradorVip =
            document.getElementById("ayudaConfigurador");

        if (ayudaConfiguradorVip) {
            ayudaConfiguradorVip.textContent =
                "Los 7 ING están incluidos automáticamente.";
        }
        document.getElementById("listaAdicionales").innerHTML = "";
        detalleVip.classList.remove("oculto");
        actualizarResumen();
        /* V8.5: el scroll VIP lo controla flujo-estable-v85.js */

        return;
    }

    detalleVip.classList.add("oculto");

    const cantidad = plan === 1 ? 1 : 2;
    maximoAdicionales = cantidad;

    document.getElementById("tituloConfigurador").textContent =
        `Elige ${cantidad} ING adicional${cantidad > 1 ? "es" : ""} para complementar ${lineaING[productoActual].codigo}`;

    const ayudaConfiguradorNormal =
        document.getElementById("ayudaConfigurador");

    if (ayudaConfiguradorNormal) {
        ayudaConfiguradorNormal.textContent =
            `${lineaING[productoActual].codigo} — ${lineaING[productoActual].nombre} ya está incluido en tu pedido.`;
    }

    renderizarAdicionales();
    actualizarResumen();
    /* V8.5: scroll controlado por flujo-estable-v85.js */
}

function renderizarAdicionales() {

    const recomendacion = productos[productoActual].recomendado;

    const html =
        Object.entries(lineaING)

            .filter(([clave]) => clave !== productoActual)

            .map(([clave, producto]) => {

                const ficha = fichasIng[clave];

                const recomendado =
                    clave === recomendacion
                        ? `<span class="recomendacionMini">Recomendado para complementar ${lineaING[productoActual].codigo}</span>`
                        : `<small>${producto.descripcion}</small>`;


                const bullets =
                    ficha.incluye
                        .map(item => `<li>${item}</li>`)
                        .join("");


                return `

                <div class="adicionalWrap" data-ing="${clave}">

                    <label class="adicional">

                        <input
                            type="checkbox"
                            value="${clave}"
                        >

                        <span>
                            <strong>
                                ${producto.codigo} — ${producto.nombre}
                            </strong>

                            ${recomendado}
                        </span>

                    </label>


                    <div class="adicionalInfoBar">

                        <button
                            type="button"
                            class="verIncluye"
                            data-ing="${clave}"
                        >
                            Ver qué incluye
                        </button>

                        <span
                            class="estadoSeleccion oculto"
                            data-estado="${clave}"
                        >
                            SELECCIONADO
                        </span>

                    </div>


                    <div
                        class="fichaAdicional oculto"
                        data-ficha="${clave}"
                    >

                        <span class="fichaEtiqueta">
                            ${ficha.etiqueta}
                        </span>

                        <h4>
                            ${producto.codigo} — ${producto.nombre}
                        </h4>

                        <p class="fichaPromesa">
                            ${ficha.promesa}
                        </p>

                        <ul>
                            ${bullets}
                        </ul>

                        <div class="paraQuien">
                            <strong>Ideal para:</strong>
                            ${ficha.ideal}
                        </div>

                    </div>

                </div>

                `;

            })
            .join("");


    document.getElementById("listaAdicionales").innerHTML =
        html +
        `<div id="mensajeLimite" class="mensajeLimite oculto"></div>`;


    /*
        Selección mediante el checkbox de la propia tarjeta.
    */

    document
        .querySelectorAll("#listaAdicionales input[type='checkbox']")
        .forEach(input => {

            input.addEventListener("change", function () {
                seleccionarAdicional(input);
            });

        });


    /*
        "Ver qué incluye" abre SOLO la información resumida.
        No abre otro explorador dentro de la tarjeta.
    */

    document
        .querySelectorAll(".verIncluye")
        .forEach(boton => {

            boton.addEventListener("click", function () {

                const clave = boton.dataset.ing;

                const ficha =
                    document.querySelector(
                        `[data-ficha="${clave}"]`
                    );


                const estabaAbierta =
                    !ficha.classList.contains("oculto");


                document
                    .querySelectorAll(".fichaAdicional")
                    .forEach(item => item.classList.add("oculto"));


                document
                    .querySelectorAll(".verIncluye")
                    .forEach(item => item.textContent = "Ver qué incluye");


                if (!estabaAbierta) {

                    ficha.classList.remove("oculto");

                    boton.textContent = "Ocultar información";

                }

            });

        });


    sincronizarTarjetasAdicionales();

}


function seleccionarAdicional(input) {
    const clave = input.value;

    if (input.checked) {
        if (adicionales.length >= maximoAdicionales) {
            input.checked = false;
            mostrarLimite();
            return;
        }

        if (!adicionales.includes(clave)) {
            adicionales.push(clave);
        }
    } else {
        adicionales = adicionales.filter(item => item !== clave);
    }

    ocultarLimite();
    sincronizarTarjetasAdicionales();
    actualizarResumen();
}

function sincronizarTarjetasAdicionales() {

    document
        .querySelectorAll(".adicionalWrap")
        .forEach(tarjeta => {

            const clave = tarjeta.dataset.ing;

            const seleccionado =
                adicionales.includes(clave);


            tarjeta.classList.toggle(
                "seleccionado",
                seleccionado
            );


            const estado =
                tarjeta.querySelector(
                    `[data-estado="${clave}"]`
                );


            if (estado) {

                estado.classList.toggle(
                    "oculto",
                    !seleccionado
                );

            }

        });

}


function mostrarLimite() {
    const mensaje = document.getElementById("mensajeLimite");
    if (!mensaje) return;

    mensaje.textContent =
        `Ya elegiste ${maximoAdicionales} ING adicional${maximoAdicionales > 1 ? "es" : ""}. Desmarca uno si deseas cambiar tu selección.`;

    mensaje.classList.remove("oculto");

    setTimeout(() => {
        if (mensaje) mensaje.classList.add("oculto");
    }, 4500);
}

function ocultarLimite() {
    const mensaje = document.getElementById("mensajeLimite");
    if (mensaje) mensaje.classList.add("oculto");
}

function actualizarResumen() {
    let precio;
    let productosPedido;

    if (planActual === 3) {
        precio = 29.90;
        productosPedido = Object.keys(lineaING);
    } else {
        precio = planActual === 1 ? productos[productoActual].precio : 15.90;
        productosPedido = [productoActual, ...adicionales];
    }

    const nombres = productosPedido.map(clave => lineaING[clave].codigo).join(" + ");

    const resumenProductosLegacy =
        document.getElementById("resumenProductos");

    const resumenPrecioLegacy =
        document.getElementById("resumenPrecio");

    if (resumenProductosLegacy) {
        resumenProductosLegacy.textContent = nombres;
    }

    if (resumenPrecioLegacy) {
        resumenPrecioLegacy.textContent =
            formatearPrecio(precio);
    }

    const boton = document.getElementById("continuarWhatsapp");

    let habilitado = false;

    if (planActual === 3) habilitado = true;
    if (planActual === 1 && adicionales.length === 1) habilitado = true;
    if (planActual === 2 && adicionales.length === 2) habilitado = true;

    boton.disabled = !habilitado;
    boton.textContent = `Continuar por WhatsApp · ${formatearPrecio(precio)}`;
}

function abrirWhatsapp() {
    let precio;
    let seleccion;

    if (planActual === 3) {
        precio = 29.90;
        seleccion = Object.keys(lineaING);
    } else {
        precio = planActual === 1 ? productos[productoActual].precio : 15.90;
        seleccion = [productoActual, ...adicionales];
    }

    const nombrePlan =
        planActual === 1 ? "Opción 1" :
        planActual === 2 ? "Combo Pro" :
        "VIP Full";

    const lista = seleccion
        .map(clave => `- ${lineaING[clave].codigo} — ${lineaING[clave].nombre}`)
        .join("\n");

    const mensaje =
`Hola. Ya revisé el contenido y quiero adquirir ${nombrePlan} por ${formatearPrecio(precio)}.

Mi selección:

${lista}

Quiero continuar con la compra.`;

    const enlace =
        `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

    window.open(enlace, "_blank");
}

function formatearPrecio(precio) {
    return "S/ " + Number(precio).toFixed(2);
}

/* === V5 MEDIA PRODUCTOS START === */

const mediaProductos = {

    ing1: {

        video:
            "assets/media/ing1/video.mp4",

        videoTitulo:
            "Mira el contenido real de ING 1",

        videoTexto:
            "Una demostración rápida del material que encontrarás dentro del pack.",

        imagenes: [

            {
                src:
                    "assets/media/ing1/01-arquitectura.jpg",

                titulo:
                    "Planos de Arquitectura",

                texto:
                    "Distribuciones, plantas, cotas y documentación arquitectónica."
            },

            {
                src:
                    "assets/media/ing1/02-sanitarias.jpg",

                titulo:
                    "Instalaciones Sanitarias",

                texto:
                    "Redes, desagüe, detalles y especificaciones técnicas."
            },

            {
                src:
                    "assets/media/ing1/03-electricas.jpg",

                titulo:
                    "Instalaciones Eléctricas",

                texto:
                    "Distribución eléctrica, circuitos, leyendas y detalles."
            },

            {
                src:
                    "assets/media/ing1/04-estructuras.jpg",

                titulo:
                    "Estructuras y Detalles",

                texto:
                    "Vigas, aligerados, acero de refuerzo y detalles constructivos."
            }

        ]
    },


    /*
        Cuando tengas ING 3 e ING 7,
        solo agregaremos sus rutas aquí.
    */

    ing3: {

        video:
            "assets/media/ing3/video.mp4",

        videoTitulo:
            "Mira el contenido real de ING 3",

        videoTexto:
            "Explora proyectos, modelos y recursos BIM preparados para trabajar con Revit.",

        imagenes: [

            {
                src:
                    "assets/media/ing3/01-documentacion-revit.jpg",

                titulo:
                    "Documentación desde Revit",

                texto:
                    "Plantas, elevaciones, láminas y vistas 3D dentro de un mismo flujo BIM."
            },

            {
                src:
                    "assets/media/ing3/02-visualizacion-revit.jpg",

                titulo:
                    "Visualización de Proyecto en Revit",

                texto:
                    "Imagen referencial de visualización arquitectónica y presentación de un proyecto desarrollado en entorno BIM."
            },

            {
                src:
                    "assets/media/ing3/03-modelo-arquitectonico.jpg",

                titulo:
                    "Proyectos y Modelos Revit",

                texto:
                    "Vistas isométricas y modelos editables para estudiar y desarrollar proyectos."
            }

        ]
    },
    ing7: null

};



/* === MEDIA ING7 V5.2 START === */

mediaProductos.ing7 = {

    video:
        "assets/media/ing7/video.mp4",

    videoTitulo:
        "Mira el contenido real de ING 7",

    videoTexto:
        "Explora recursos de análisis estructural, SAP2000, modelado metálico, plantillas de cálculo y material técnico incluido en Cálculo Estructural PRO.",

    imagenes: [

        {
            src:
                "assets/media/ing7/01-sap2000.png",

            titulo:
                "Análisis Estructural en SAP2000",

            texto:
                "Visualización de modelos estructurales, elementos y superficies dentro de un entorno de análisis y cálculo."
        },

        {
            src:
                "assets/media/ing7/02-estructura-metalica.png",

            titulo:
                "Modelado Estructural Metálico 3D",

            texto:
                "Estructuras de acero, plataformas, arriostres y elementos metálicos representados en un modelo técnico tridimensional."
        }

    ]
};

/* === MEDIA ING7 V5.2 END === */

function renderMediaProducto() {

    const media =
        mediaProductos[
            productoActual
        ];


    const contenedorVideo =
        document.getElementById(
            "mediaProducto"
        );


    const galeria =
        document.getElementById(
            "galeriaProducto"
        );


    const nota =
        document.getElementById(
            "notaGaleria"
        );


    if (
        !contenedorVideo ||
        !galeria
    ) {
        return;
    }


    /*
        Si aún no hemos cargado material
        para ING 3 o ING 7, mantenemos
        un placeholder limpio.
    */

    if (!media) {

        contenedorVideo.innerHTML = `
            <div class="mediaPendiente">
                <span class="mediaPendienteIcono">▶</span>

                <strong>
                    Video demostración
                </strong>

                <small>
                    Próximamente colocaremos aquí
                    la demostración real de
                    ${lineaING[productoActual].codigo}.
                </small>
            </div>
        `;


        galeria.innerHTML = `
            <div class="galeriaPendiente">
                Próximamente: imágenes reales de
                ${lineaING[productoActual].codigo}.
            </div>
        `;


        if (nota) {
            nota.textContent =
                "Las imágenes serán reemplazadas por muestras reales del producto.";
        }


        return;
    }


    contenedorVideo.innerHTML = `
        <div class="demoVideoTexto">

            <span>
                DEMOSTRACIÓN REAL
            </span>

            <h3>
                ${media.videoTitulo}
            </h3>

            <p>
                ${media.videoTexto}
            </p>

        </div>


        <div class="videoRealWrap">

            <video
                class="videoReal"
                controls
                playsinline
                preload="metadata"
            >
                <source
                    src="${media.video}"
                    type="video/mp4"
                >

                Tu navegador no puede reproducir este video.
            </video>

        </div>
    `;


    galeria.innerHTML =
        media.imagenes
            .map(
                (imagen, index) => `
                    <button
                        type="button"
                        class="laminaProducto"
                        data-imagen="${index}"
                    >

                        <div class="laminaImagenWrap">

                            <img
                                src="${imagen.src}"
                                alt="${imagen.titulo}"
                                loading="lazy"
                            >

                            <span class="ampliarLamina">
                                Ver en grande
                            </span>

                        </div>


                        <div class="laminaTexto">

                            <strong>
                                ${imagen.titulo}
                            </strong>

                            <span>
                                ${imagen.texto}
                            </span>

                        </div>

                    </button>
                `
            )
            .join("");


    if (nota) {

        nota.textContent =
            `${media.notaGaleria || `Muestras reales del contenido de ${lineaING[productoActual].codigo}. Toca cualquier lámina para verla en detalle.`}`;

    }


    galeria
        .querySelectorAll(
            ".laminaProducto"
        )
        .forEach(
            boton => {

                boton.addEventListener(
                    "click",
                    function () {

                        const index =
                            Number(
                                boton.dataset.imagen
                            );


                        abrirLightbox(
                            media.imagenes[index]
                        );

                    }
                );

            }
        );

}


function abrirLightbox(imagen) {

    const modal =
        document.getElementById(
            "lightboxMedia"
        );


    const img =
        document.getElementById(
            "imagenLightbox"
        );


    const caption =
        document.getElementById(
            "captionLightbox"
        );


    if (
        !modal ||
        !img
    ) {
        return;
    }


    img.src =
        imagen.src;


    img.alt =
        imagen.titulo;


    if (caption) {

        caption.innerHTML = `
            <strong>
                ${imagen.titulo}
            </strong>

            <span>
                ${imagen.texto}
            </span>
        `;

    }


    modal.classList.remove(
        "oculto"
    );


    document.body.classList.add(
        "sinScroll"
    );

}


function cerrarLightboxMedia() {

    const modal =
        document.getElementById(
            "lightboxMedia"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "oculto"
    );


    document.body.classList.remove(
        "sinScroll"
    );

}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const cerrar =
            document.getElementById(
                "cerrarLightbox"
            );


        const modal =
            document.getElementById(
                "lightboxMedia"
            );


        if (cerrar) {

            cerrar.addEventListener(
                "click",
                cerrarLightboxMedia
            );

        }


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        cerrarLightboxMedia();

                    }

                }
            );

        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key ===
                    "Escape"
                ) {

                    cerrarLightboxMedia();

                }

            }
        );

    }
);

/* === V5 MEDIA PRODUCTOS END === */


iniciar();









