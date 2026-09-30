# ING 1: verificación de correo para Google Drive

Este bloque valida el correo antes del futuro pago. No cobra, no guarda pedidos y no comparte carpetas.

## Flujo

`/comprar/ing1/` envía únicamente `{ "email": "..." }` a `POST /api/drive/verify-email`. La Pages Function valida y normaliza el correo, llama al Web App de Apps Script con `action: "verify_email"` y devuelve solo `ok`, `compatible` y el correo normalizado o un código de error genérico. La URL del Web App y el secreto permanecen en el servidor.

## Variables

En local, agregar a `.dev.vars` (archivo ignorado por Git):

```text
MM_DRIVE_WEBAPP_URL=<URL del Web App de Apps Script>
MM_SHARED_SECRET=<secreto compartido>
```

En Cloudflare Pages, configurar ambos como **Secrets** de runtime en los entornos de Preview y Production. No incluirlos en archivos públicos ni en variables de compilación expuestas al cliente. `.dev.vars.example` contiene solo los nombres.

## Prueba local

```powershell
node scripts/build-public.mjs
npx.cmd --yes wrangler pages dev dist --port 8788
```

Abrir `http://127.0.0.1:8788/comprar/ing1/`, elegir un paquete y pulsar **Comprar ahora**. El correo se comprueba en el segundo paso del modal. El botón **Continuar al pago** solo muestra un aviso de preparación.

Pruebas automatizadas del endpoint y las reglas de pedidos:

```powershell
node --test tests/drive-block2.test.mjs
```

## Límites de este bloque

La función limita el cuerpo a 1 KiB y corta la llamada a Apps Script tras 12 segundos. La UI evita solicitudes simultáneas. El Bloque 3 añadió un límite persistente de 10 intentos por 10 minutos e IP cuando D1 está enlazado. La vista local sin D1 usa memoria del proceso solo para permitir probar la verificación, sin garantía de persistencia. El checkout reconstruye precio en céntimos e items con `server/ing1-order.js` y entrega desde el webhook validado. Consulta `docs/CHECKOUT_ING1_BLOCK3_SETUP.md`.
