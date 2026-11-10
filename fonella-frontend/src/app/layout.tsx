import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FONELLA | Centro Integral de Fonoaudiología",
  description:
    "Plataforma clínica y administrativa de Fonella - Dra. Bárbara Ccucho Delgado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-fonella-fondo text-gray-800 antialiased selection:bg-fonella-turquesa selection:text-white">
        {children}
      </body>
    </html>
  );
}
