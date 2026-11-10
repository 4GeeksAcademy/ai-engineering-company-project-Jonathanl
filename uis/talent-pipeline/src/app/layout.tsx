import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Candidaturas | Nexova People & Talent",
  description: "Pipeline interno de selección de Nexova.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><AuthGuard>{children}</AuthGuard></body>
    </html>
  );
}
