import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FONELLA | Centro Integral de FonoaudiologÃ­a",
  description:
    "Plataforma clÃ­nica y administrativa de Fonella - Dra. BÃ¡rbara Ccucho Delgado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-fonella-fondo text-gray-800 antialiased selection:bg-fonella-turquesa selection:text-white">
        {children}
      </body>
    </html>
  );
}

