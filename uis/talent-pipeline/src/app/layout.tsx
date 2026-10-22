import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candidaturas | Nexova People & Talent",
  description: "Pipeline interno de selección de Nexova.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
