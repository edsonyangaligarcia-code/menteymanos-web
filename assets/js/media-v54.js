(function () {
    "use strict";

    const MEDIA = {

        ing1: {
            codigo: "ING 1",
            titulo: "Mira el contenido real de ING 1",
            descripcion:
                "Planos, expedientes y documentación técnica mostrados directamente desde el tipo de material incluido.",

            video:
                "assets/media/ing1/video.mp4",

            imagenes: [
                {
                    src: "assets/media/ing1/01-arquitectura.jpg",
                    titulo: "Planos de Arquitectura",
                    texto: "Distribuciones, plantas, cotas y documentación arquitectónica."
                },
                {
                    src: "assets/media/ing1/02-sanitarias.jpg",
                    titulo: "Instalaciones Sanitarias",
                    texto: "Redes, desagüe, detalles y especificaciones técnicas."
                },
                {
                    src: "assets/media/ing1/03-electricas.jpg",
                    titulo: "Instalaciones Eléctricas",
                    texto: "Distribución eléctrica, circuitos, leyendas y detalles."
                },
                {
                    src: "assets/media/ing1/04-estructuras.jpg",
                    titulo: "Estructuras y Detalles",
                    texto: "Vigas, aligerados, refuerzo y detalles constructivos."
                }
            ]
        },


        ing3: {
            codigo: "ING 3",
            titulo: "Mira el contenido real de ING 3",
            descripcion:
                "Modelado BIM, documentación desde Revit, proyectos y recursos digitales del pack.",

            video:
                "assets/media/ing3/video.mp4",

            imagenes: [
                {
                    src: "assets/media/ing3/01-documentacion-revit.jpg",
                    titulo: "Documentación desde Revit",
                    texto: "Plantas, elevaciones, láminas y vistas dentro de un flujo BIM."
                },
                {
                    src: "assets/media/ing3/02-visualizacion-revit.jpg",
                    titulo: "Visualización de Proyecto en Revit",
                    texto: "Representación arquitectónica y presentación visual de proyectos BIM."
                },
                {
                    src: "assets/media/ing3/03-modelo-arquitectonico.jpg",
                    titulo: "Proyectos y Modelos Revit",
                    texto: "Vistas isométricas, distribución interior y modelos digitales."
                }
            ]
        },


        ing7: {
            codigo: "ING 7",
            titulo: "Mira el contenido real de ING 7",
            descripcion:
                "Análisis estructural, SAP2000, modelado metálico y recursos técnicos de Cálculo Estructural PRO.",

            video:
                "assets/media/ing7/video.mp4",

            imagenes: [
                {
                    src: "assets/media/ing7/01-sap2000.png",
                    titulo: "Análisis Estructural en SAP2000",
                    texto: "Visualización de modelos estructurales y superficies dentro del entorno de análisis."
                },
                {
                    src: "assets/media/ing7/02-estructura-metalica.png",
                    titulo: "Modelado Estructural Metálico 3D",
                    texto: "Estructuras de acero, plataformas, arriostres y elementos metálicos en un modelo técnico."
                }
            ]
        }

    };


    function productoActual() {

        const coincidenciaRuta =
            window.location.pathname.match(
                /\/(ing1|ing3|ing7)(?:\/index\.html|\/)?$/i
            );


        const desdeRuta =
            coincidenciaRuta
                ? coincidenciaRuta[1].toLowerCase()
                : null;


        if (
            desdeRuta &&
            MEDIA[desdeRuta]
        ) {
            return desdeRuta;
        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const desdeUrl =
            params.get("producto");


        if (MEDIA[desdeUrl]) {
            return desdeUrl;
        }


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (
            selector &&
            MEDIA[selector.value]
        ) {
            return selector.value;
        }


        return "ing1";
    }


    function abrirImagen(imagen) {

        let modal =
            document.getElementById(
                "mediaV54Lightbox"
            );


        if (!modal) {

            modal =
                document.createElement(
                    "div"
                );

            modal.id =
                "mediaV54Lightbox";

            modal.className =
                "mediaV54Lightbox";

            modal.innerHTML = `
                <button
                    type="button"
                    class="mediaV54Cerrar"
                    aria-label="Cerrar"
                >
                    ×
                </button>

                <img
                    class="mediaV54LightboxImg"
                    alt=""
                >

                <div
                    class="mediaV54LightboxCaption"
                ></div>
            `;


            document.body.appendChild(
                modal
            );


            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal ||
                        event.target.classList.contains(
                            "mediaV54Cerrar"
                        )
                    ) {
                        modal.classList.remove(
                            "abierto"
                        );

                        document.body.classList.remove(
                            "mediaV54SinScroll"
                        );
                    }
                }
            );
        }


        const img =
            modal.querySelector(
                ".mediaV54LightboxImg"
            );

        const caption =
            modal.querySelector(
                ".mediaV54LightboxCaption"
            );


        img.src =
            imagen.src;

        img.alt =
            imagen.titulo;


        caption.innerHTML = `
            <strong>${imagen.titulo}</strong>
            <span>${imagen.texto}</span>
        `;


        modal.classList.add(
            "abierto"
        );

        document.body.classList.add(
            "mediaV54SinScroll"
        );
    }


    function render() {

        const clave =
            productoActual();

        const media =
            MEDIA[clave];


        const titulo =
            document.getElementById(
                "mediaV54Titulo"
            );

        const descripcion =
            document.getElementById(
                "mediaV54Descripcion"
            );

        const videoWrap =
            document.getElementById(
                "mediaV54Video"
            );

        const galeria =
            document.getElementById(
                "mediaV54Galeria"
            );

        const nota =
            document.getElementById(
                "mediaV54Nota"
            );


        if (
            !titulo ||
            !descripcion ||
            !videoWrap ||
            !galeria
        ) {
            return;
        }


        titulo.textContent =
            media.titulo;

        descripcion.textContent =
            media.descripcion;


        videoWrap.innerHTML = `
            <video
                class="mediaV54Video"
                controls
                playsinline
                preload="metadata"
            >
                <source
                    src="${media.video}"
                    type="video/mp4"
                >
            </video>
        `;


        galeria.innerHTML =
            media.imagenes
                .map(
                    (imagen, index) => `
                        <button
                            type="button"
                            class="mediaV54Card"
                            data-index="${index}"
                        >

                            <div class="mediaV54ImgWrap">

                                <img
                                    src="${imagen.src}"
                                    alt="${imagen.titulo}"
                                    loading="lazy"
                                >

                                <span class="mediaV54Zoom">
                                    Ver en grande
                                </span>

                            </div>

                            <div class="mediaV54CardTexto">
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


        galeria
            .querySelectorAll(
                ".mediaV54Card"
            )
            .forEach(
                boton => {

                    boton.addEventListener(
                        "click",
                        function () {

                            const index =
                                Number(
                                    boton.dataset.index
                                );

                            abrirImagen(
                                media.imagenes[index]
                            );
                        }
                    );
                }
            );


        if (nota) {
            nota.textContent =
                `Muestras visuales de ${media.codigo}. Toca una imagen para verla en detalle.`;
        }
    }


    function iniciar() {

        /*
            Lo ejecutamos después de los scripts anteriores
            para que el selector ya tenga su valor correcto.
        */

        setTimeout(
            render,
            0
        );


        const selector =
            document.getElementById(
                "selectorProducto"
            );


        if (selector) {

            selector.addEventListener(
                "change",
                function () {

                    setTimeout(
                        render,
                        0
                    );
                }
            );
        }


        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape"
                ) {

                    const modal =
                        document.getElementById(
                            "mediaV54Lightbox"
                        );


                    if (modal) {
                        modal.classList.remove(
                            "abierto"
                        );
                    }


                    document.body.classList.remove(
                        "mediaV54SinScroll"
                    );
                }
            }
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


