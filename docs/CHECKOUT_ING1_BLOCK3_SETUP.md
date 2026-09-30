# Bloque 3 · Checkout Pro de ING 1 (entorno de prueba)

Esta rama implementa Checkout Pro mediante **Orders API**. La tienda carga sin D1, pero `POST /api/checkout/create-order` responde `ORDER_STORE_NOT_CONFIGURED` y no contacta a Mercado Pago si falta `env.DB`. El código acepta únicamente `MM_ENV=test` y un token de prueba; producción requiere una revisión y cambio posterior.

## Variables privadas

Copiar los **nombres** de `.dev.vars.example` a `.dev.vars` local y completar allí los valores privados. No versionar ni imprimir ese archivo.

| Variable | Uso |
| --- | --- |
| `MM_DRIVE_WEBAPP_URL` | URL HTTPS de Apps Script existente |
| `MM_SHARED_SECRET` | Secreto compartido con Apps Script; también se usa como sal del hash de IP |
| `MP_ACCESS_TOKEN` | Access Token **de prueba** de la aplicación Mercado Pago |
| `MP_WEBHOOK_SECRET` | Secret signature de Webhooks de la misma aplicación |
| `MP_TEST_PAYER_EMAIL` | Email ficticio `@testuser.com` de la cuenta **Comprador de prueba** de Mercado Pago; obligatorio solo en Preview/Test |
| `MM_PUBLIC_BASE_URL` | Origen HTTPS público, sin ruta, para las tres URLs de retorno |
| `MM_ENV` | `test` en este bloque |
| `MM_ADMIN_SECRET` | Secreto nuevo y exclusivo, de al menos 32 caracteres, para la reconciliación administrativa manual |

Las credenciales APS existentes permanecen independientes. No se necesita `MP_PUBLIC_KEY`: Checkout Pro redirige a `checkout_url` alojada por Mercado Pago.

En Preview/Test, `MP_TEST_PAYER_EMAIL` se normaliza y se envía únicamente como `payer.email` a Mercado Pago. El email real introducido por el comprador sigue guardado en D1, se verifica con Drive y es el destinatario de la entrega. No configures `MP_TEST_PAYER_EMAIL` como sustituto del email real de entrega.

## Crear y enlazar D1 manualmente

El working tree contiene `wrangler.jsonc` para D1/local con la base `mente-y-manos-orders` y su `database_id`. Ese archivo no tiene `pages_build_output_dir`; por ello no se adopta como configuración de despliegue de Pages. Confirma que el ID corresponde a la base de prueba prevista antes de ejecutar comandos remotos. No uses la base de Production. En PowerShell, desde la raíz del proyecto:

```powershell
npx.cmd --yes wrangler d1 info mente-y-manos-orders
```

Compara el `database_id` devuelto con `wrangler.jsonc`. Vincular esa base al proyecto de Cloudflare Pages en **Preview** con nombre de binding **`DB`** requiere un paso externo posterior, fuera de este cambio. Ruta del panel: Workers & Pages → proyecto Pages → Settings → Bindings → D1 database bindings. No conectar una base productiva.

Para una base local, aplicar el esquema y abrir Pages con el ID real:

```powershell
npx.cmd --yes wrangler d1 migrations apply mente-y-manos-orders --local
node scripts/build-public.mjs
npx.cmd --yes wrangler pages dev dist --port 8788 --ip 0.0.0.0 --d1 DB=<DATABASE_ID_REAL>
```

Para la base remota **de prueba**, una vez revisada y enlazada:

```powershell
npx.cmd --yes wrangler d1 migrations apply mente-y-manos-orders --remote
```

`migrations/0002_checkout_claims.sql` añade tokens de claim y el último intento de reconciliación. Aplicar ambas migraciones en orden; la segunda también actualiza una base local que ya recibió `0001`. Antes de adoptar una configuración Wrangler para despliegue, descargar y revisar la configuración real del proyecto Pages con `npx.cmd --yes wrangler pages download config`; ese comando puede sobrescribir el archivo local existente. Para inspección, usar `npx.cmd --yes wrangler d1 execute mente-y-manos-orders --local --command="SELECT id,payment_status,delivery_status,delivery_attempts FROM orders LIMIT 10"` (usar `--remote` solo en la base de prueba remota verificada).

## Mercado Pago en prueba

En el panel de la aplicación Mercado Pago, usar las credenciales de **prueba** y configurar un Webhook HTTPS con tema **Order (Mercado Pago)** para:

```text
https://<dominio-publico-de-prueba>/api/mercadopago/webhook
```

Guardar la secret signature del webhook solo en la variable privada `MP_WEBHOOK_SECRET`. Usar un origen HTTPS público para `MM_PUBLIC_BASE_URL`; `localhost` no sirve como URL de retorno pública. El webhook verifica `x-signature` mediante HMAC-SHA256 y luego consulta `GET /v1/orders/{id}`. El retorno del navegador jamás confirma un pago.

Abrir `http://localhost:8788/comprar/ing1/`, elegir una oferta, seleccionar los adicionales, verificar el correo y pulsar **Continuar al pago**. Con las variables de prueba y D1 configuradas, se redirige al Checkout Pro. Usar un comprador y una operación **de prueba**. La página `.../comprar/ing1/resultado/?ref=<UUID>` consulta D1 y solo muestra accesos después de la entrega. Sin configuración, la tienda y el paso de validación de correo siguen disponibles, y el pago informa que aún no está configurado.

## Contrato de entrega y límites

Apps Script recibe únicamente `{secret, action:"deliver", email, items:["ING1",...], orderId}` desde el servidor. Debe responder `{ok:true}`. Para mostrar botones individuales en la página de resultado, debe incluir `items` o `links` como arreglo de `{code:"ING1",url:"https://drive.google.com/..."}`. El backend solo conserva enlaces HTTPS de `drive.google.com` o `docs.google.com` para códigos comprados. Si Apps Script devuelve solo `{ok:true}`, la entrega queda marcada como completada, pero no habrá botones de enlace; el acceso compartido en Drive será el mecanismo de entrega. Confirmar el formato real del Apps Script antes de una prueba completa.

El registro D1 `orders` guarda la orden local, snapshot canónico, mapeo MP, estado de pago, estado de entrega, claims e intentos. `webhook_events` evita repetir una notificación completada y permite reintentar fallos. `rate_limits` cuenta ventanas por hash de IP y sal privada. No se guardan secretos. Un fallo de Drive devuelve 503 al webhook y permite un reintento posterior. Los claims de entrega identifican cada intento, pero **Apps Script debe garantizar idempotencia de `deliver` por `orderId`**: su código no está en este repositorio, así que falta verificarlo o implementarlo allí.

En Preview/Test, el webhook real de Mercado Pago continúa devolviendo **401** porque su firma no pasa el HMAC estricto; el simulador oficial sí pasa. No se debilitó la validación HMAC. `/api/checkout/status` continúa como reconciliación interactiva, con claim y backoff persistentes, y consulta pedidos entregados para detectar reembolsos sin repetir Drive.

`POST /api/checkout/reconcile-admin` está habilitado solo con `MM_ENV=test`, D1 y `Authorization: Bearer <MM_ADMIN_SECRET>`. Procesa hasta 5 pedidos por invocación y devuelve únicamente contadores. El Worker separado `workers/reconcile-cron.js` es el fallback automático previsto si el comprador abandona la página: `wrangler.reconcile.jsonc` configura **solo el environment `preview`** para invocar ese endpoint cada 5 minutos (`*/5 * * * *`). El Worker no tiene binding D1 ni credenciales de Mercado Pago. **Este Worker todavía no se ha desplegado; Production no está configurado.**

| Variable del Worker Preview | Uso |
| --- | --- |
| `RECONCILE_URL` | URL HTTPS de `/api/checkout/reconcile-admin` del Pages Preview; está en `wrangler.reconcile.jsonc` |
| `RECONCILE_SECRET` | Secret del Worker, mínimo 32 caracteres; debe tener el mismo valor que `MM_ADMIN_SECRET` del Pages Preview |

Guardar `RECONCILE_SECRET` y `MM_ADMIN_SECRET` como secrets de sus respectivos servicios, nunca en Git. El Worker envía el primero solo en `Authorization: Bearer` al endpoint de Preview. Su timeout de 150 segundos permite procesar hasta cinco pedidos con llamadas secuenciales a Mercado Pago y Drive, sin esperar al siguiente Cron de cinco minutos.

Para producción quedan pendientes: revisión de credenciales productivas, binding D1 de producción y migración, webhook público productivo, prueba completa con comprador de prueba, confirmación del contrato de respuesta de Apps Script, supervisión de webhooks y política de reembolsos. Este bloque no activa producción, no hace despliegue y no realiza cobros reales.

Documentación oficial: [Orders API de Checkout Pro](https://www.mercadopago.com.pe/developers/en/docs/checkout-pro-orders/create-order), [URLs de retorno](https://www.mercadopago.com.pe/developers/en/docs/checkout-pro-orders/web-integration/configure-back-urls), [Webhooks de Checkout Pro](https://www.mercadopago.com.pe/developers/en/docs/checkout-pro-orders/notifications?scope=prod), [bindings D1 en Pages](https://developers.cloudflare.com/pages/functions/bindings/) y [comandos D1](https://developers.cloudflare.com/d1/wrangler-commands/).
