import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova Backoffice | Panel de Operaciones Internas",
  description:
    "Aplicación interna de Nexova Solutions para seguimiento de incidencias, proveedores, inventario y estado del backend.",
};

export default function BackofficeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
