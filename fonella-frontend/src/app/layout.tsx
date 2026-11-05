import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Consultorio Fonoaudiológico FONELLA',
  description: 'Plataforma Web de Gestión Clínica y Agendamiento',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#FAF6F0] text-gray-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}