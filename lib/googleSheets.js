const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const RANGE = process.env.GOOGLE_SHEET_FACTURAS_RANGE || "Facturas!A:Q";

function buildUrl() {
  if (!SHEET_ID || !API_KEY) {
    throw new Error("Faltan GOOGLE_SHEET_ID o GOOGLE_SHEETS_API_KEY en las variables de entorno.");
  }

  const encodedRange = encodeURIComponent(RANGE);
  return `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedRange}?key=${API_KEY}`;
}

export async function fetchFacturasRows() {
  const url = buildUrl();
  const response = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`No se pudo leer Google Sheets: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.values || [];
}
