'use client';
import React from 'react';
import { generarLinkContactoGeneral } from '../../utils/whatsapp-link';

/**
 * HU-08: Botón Flotante Permanente de Contacto a WhatsApp Business (Sprint 1)
 */
export const BotonFlotanteWhatsApp: React.FC = () => {
  return (
    <a
      href={generarLinkContactoGeneral()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a Fonella por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
    >
      <span className="text-lg font-semibold">WhatsApp Fonella</span>
    </a>
  );
};
