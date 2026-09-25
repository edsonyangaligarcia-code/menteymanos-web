# Mente & Manos — Panel de ventas V1

Este panel fue generado a partir de `MyM.xlsx`.

## Migración
- Ventas importadas: 277
- Filas de Ads importadas: 123
- Período: 2026-08-20 a 2026-09-24
- Incidencias corregidas/controladas: 5
- Facturación base reconstruida: S/ 3951.30
- Gasto Ads importado: S/ 1706.60

## Qué corrige
- Convierte horas `12;06` y `8;28` a horas válidas.
- Normaliza `9,,90` a `9.90`.
- Completa el precio original faltante de ING 2 e ING 3 usando la hoja INFO.
- Separa descuento real de incremento/upsell.
- Las métricas se recalculan desde VENTAS + Ads, ya no desde fórmulas repetidas.
- Preserva los nombres históricos de campaña y agrega las campañas actuales ING 1, ING 3 e ING 7.

## Persistencia
El panel guarda siempre una copia local en el navegador. Para que también quede en la nube y puedas abrirlo desde otro equipo, configura Cloudflare D1:

1. En Cloudflare crea una base D1, por ejemplo `menteymanos-panel`.
2. Abre tu proyecto Pages `menteymanos`.
3. En Settings / Bindings agrega una D1 database binding:
   - Variable name: `DB`
   - Database: la base que acabas de crear.
4. En Variables and Secrets agrega:
   - `PANEL_KEY` = una clave privada larga que solo tú conozcas.
5. Haz un nuevo deploy.
6. Abre `/panel/` > Ajustes.
7. Escribe la misma `PANEL_KEY`.
8. Pulsa **Guardar clave y conectar**.
9. La primera vez el panel subirá las 277 ventas y los datos históricos a D1.

La clave no está dentro del código ni del JSON histórico.

## URL
Después de desplegar:
`https://menteymanos.pages.dev/panel/`

## Actualizaciones
El panel es local-first:
- cualquier registro se guarda inmediatamente en el navegador;
- si D1 está conectado, se sincroniza en segundo plano;
- puedes exportar un respaldo JSON y un CSV cuando quieras.
