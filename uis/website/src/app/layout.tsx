import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova Solutions | Consultora de Recursos Humanos y Talento",
  description:
    "Consultora de recursos humanos fundada en 2011 con sedes en Valencia y Miami. Headhunting de mandos medios y directivos, outsourcing de soporte al cliente y formación corporativa.",
};

export default function RootLayout({
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
