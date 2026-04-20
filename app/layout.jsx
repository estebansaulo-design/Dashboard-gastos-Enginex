import "./globals.css";

export const metadata = {
  title: "Dashboard de Gastos",
  description: "Seguimiento visual de gastos de la empresa conectado a Google Sheets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
