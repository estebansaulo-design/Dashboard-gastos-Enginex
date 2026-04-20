import DashboardGastosInteractivo from "../dashboard";
import { fetchFacturasRows } from "../lib/googleSheets";
import { buildDashboardData } from "../lib/dashboardData";

export const metadata = {
  title: "Dashboard de Gastos | Compras Empresa",
  description:
    "Visualización ejecutiva de gastos, facturas y proveedores conectada a Google Sheets.",
};

export default async function Page() {
  try {
    const rows = await fetchFacturasRows();
    const initialData = buildDashboardData(rows);

    return <DashboardGastosInteractivo initialData={initialData} />;
  } catch (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0f172a",
          color: "#e2e8f0",
          padding: "24px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            width: "100%",
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
            Error al cargar Google Sheets
          </h1>
          <p style={{ marginBottom: "10px", color: "#cbd5e1" }}>
            Revisá estas variables en Vercel:
          </p>
          <ul style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
            <li>GOOGLE_SHEET_ID</li>
            <li>GOOGLE_SHEETS_API_KEY</li>
            <li>GOOGLE_SHEET_FACTURAS_RANGE</li>
          </ul>
          <pre
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#020617",
              borderRadius: "12px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              color: "#fca5a5",
            }}
          >
            {String(error?.message || error)}
          </pre>
        </div>
      </main>
    );
  }
}
