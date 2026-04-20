# Dashboard de Gastos

Proyecto Next.js para desplegar en Vercel y leer automáticamente la Google Sheet de compras.

## 1) Crear repositorio
Subí el contenido de esta carpeta a un repositorio nuevo de GitHub.

## 2) Variables en Vercel
En `Project Settings > Environment Variables` cargá:

- `GOOGLE_SHEET_ID`
- `GOOGLE_SHEETS_API_KEY`
- `GOOGLE_SHEET_FACTURAS_RANGE` = `Facturas!A:Q`
- `NEXT_PUBLIC_APP_TITLE` = `Dashboard de Gastos`

## 3) Permisos de la Sheet
La API key debe tener habilitada la Google Sheets API. La hoja debe ser accesible para la API que uses.

## 4) Deploy
- Importar repositorio en Vercel
- Framework: Next.js
- Build command: `next build`
- Output: automático

## 5) Cómo se actualiza
La app relee la hoja con `revalidate: 300`, o sea, aproximadamente cada 5 minutos.
Si querés cambiar eso, modificá `lib/googleSheets.js`.

## 6) Qué grafica
- Gasto acumulado
- Gasto del último mes visible
- Cantidad de facturas
- Ticket promedio
- Evolución mensual
- Acumulado
- Gasto por categoría
- Top 10 proveedores
- Distribución por moneda
- Ranking ampliado de categorías

## 7) Columnas esperadas en la hoja Facturas
La app busca estas columnas, tolerando espacios y mayúsculas/minúsculas:

- Fecha emisión / Fecha carga
- Razón social
- Categoría
- Neto
- IVA 21%
- IVA 10.5%
- Otros impuestos
- Retenciones
- Total
- Moneda
- URL Drive

Si `Total` viene vacío, intenta reconstruirlo con:
`Neto + IVA 21 + IVA 10.5 + Otros impuestos - Retenciones`
