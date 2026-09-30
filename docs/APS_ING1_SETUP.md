# ING 1: muestras CAD con Autodesk APS

La tienda está en `/comprar/ing1/`. Los cuatro DWG fuente permanecen en `private/cad-samples/`, ignorado por Git. El navegador recibe solo URN de modelos traducidos y un token temporal `viewables:read`; nunca recibe el Client Secret ni una URL de descarga del DWG. Un visor público permite inspeccionar geometría, por lo que estas muestras no deben tratarse como contenido confidencial.

## Configuración local (PowerShell)

```powershell
cd C:\Users\yanga\Documents\MenteYManos-Web
# Conserva el .dev.vars existente; crea uno solo si falta.
if (!(Test-Path .dev.vars)) { Copy-Item .dev.vars.example .dev.vars }
notepad .dev.vars
```

Variables: `APS_CLIENT_ID`, `APS_CLIENT_SECRET`; `APS_BUCKET_KEY` es opcional. El script genera una clave de bucket estable a partir de un hash del Client ID si no se define. `.dev.vars` y `private/` deben seguir ignorados por Git. No copies credenciales a Pages como variables públicas: configura `APS_CLIENT_ID` como variable de entorno y `APS_CLIENT_SECRET` como secreto cifrado de Cloudflare Pages para que la Function pueda emitir tokens.

## Preparar los cuatro DWG

```powershell
cd C:\Users\yanga\Documents\MenteYManos-Web
node scripts/aps-preparar-muestras.mjs
```

El script valida los cuatro archivos, crea o reutiliza un bucket privado `persistent`, omite cargas de objetos con el mismo hash, traduce a SVF2 y espera el estado final de cada manifest. Puedes volver a ejecutarlo si una traducción sigue pendiente o falla temporalmente. Solo escribe los URN en `comprar/ing1/aps-manifest.json`; revisa ese archivo antes de desplegar. Una nueva versión del DWG genera un nuevo objeto identificado por hash; los objetos anteriores no se eliminan automáticamente.

## Probar en local

```powershell
node scripts/build-public.mjs
npx wrangler pages dev dist --port 8788
```

Abre `http://localhost:8788/comprar/ing1/`. Sin URN o sin credenciales, el área CAD presenta un placeholder. Con traducciones listas, permite cambiar de especialidad en el mismo Viewer. En Cloudflare Pages, usa `node scripts/build-public.mjs` como comando de build y `dist` como directorio de salida. Pages Functions se toman de `functions/` en el repositorio. El build usa una lista explícita de rutas públicas; `private/` y `.dev.vars` no se copian.

## Referencias APS

- [Token OAuth 2.0 de cliente](https://aps.autodesk.com/en/docs/oauth/v2/tutorials/get-2-legged-token/)
- [Carga directa a S3 desde OSS](https://aps.autodesk.com/blog/direct-s3-nodejs-samples)
- [Model Derivative API](https://aps.autodesk.com/developer/overview/model-derivative-api)
- [Versionar el Viewer](https://aps.autodesk.com/blog/always-use-versioning-viewer)

El checkout, la entrega y las páginas legales siguen pendientes del Bloque 2.
