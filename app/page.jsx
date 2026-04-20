import DashboardGastosInteractivo from "../dashboard";

export const metadata = {
  title: "Dashboard de Gastos | Compras Empresa",
  description: "Visualización ejecutiva de gastos, facturas y proveedores conectada a Google Sheets.",
};

export default function Page() {
  return <DashboardGastosInteractivo />;
}
