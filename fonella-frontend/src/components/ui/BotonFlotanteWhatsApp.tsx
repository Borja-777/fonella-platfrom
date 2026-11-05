'use client';

import React from 'react';
import Link from 'next/link';

export default function BotonFlotanteWhatsApp() {
  return (
    <Link
      href="/solicitar-cita"
      title="Solicitar Cita Asistida"
      className="fixed bottom-6 right-6 z-50 p-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-full shadow-lg hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white group"
    >
      <svg
        className="w-7 h-7 fill-current transition-transform group-hover:rotate-12"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.999 1.594-1.053 3.847 3.797-.974 1.598.995z"/>
      </svg>
    </Link>
  );
}