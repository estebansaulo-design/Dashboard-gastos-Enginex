import DashboardClient from "../dashboard";
import { fetchFacturasRows } from "../lib/googleSheets";
import { buildDashboardData } from "../lib/googleSheets";

export const metadata = {
  title: "Dashboard de Gastos | Compras Empresa",
  description:
    "Visualización ejecutiva de gastos, facturas y proveedores conectada a Google Sheets.",
};

export const revalidate = 300;

export default async function Page() {
  const values = await fetchFacturasRows();
  const initialData = buildDashboardData(values);

  return <DashboardClient initialData={initialData} />;
}
