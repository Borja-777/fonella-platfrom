// ============================================================================
// GENERADOR DE DEEP LINKS DE WHATSAPP (HU-06, HU-07, HU-08, HU-09)
// Sanitiza y construye enlaces https://wa.me/ sin costo de API
// ============================================================================

const WHATSAPP_FONELLA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';

export interface DatosSolicitudCita {
  esMenorEdad: boolean;
  nombrePaciente: string;
  edadPaciente: string;
  nombreAcudiente?: string;
  servicioInteres: string;
  motivoBreve: string;
  jornadaPreferida: 'Mañana' | 'Tarde';
}

/**
 * HU-08: Enlace para el Botón Flotante Permanente
 */
export function generarLinkContactoGeneral(): string {
  const mensaje = 'Hola Fonella, deseo recibir orientación general sobre sus servicios de fonoaudiología.';
  return `https://wa.me/${WHATSAPP_FONELLA}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * HU-06: Enlace para consultar un Servicio Clínico específico
 */
export function generarLinkConsultaServicio(nombreServicio: string): string {
  const mensaje = `Hola Fonella, estoy interesado(a) en recibir información y tarifas sobre el servicio: *${nombreServicio}*.`;
  return `https://wa.me/${WHATSAPP_FONELLA}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * HU-07: Enlace para consultar disponibilidad de un Juguete Didáctico
 */
export function generarLinkConsultaJuguete(nombreJuguete: string, codigoSku: string): string {
  const mensaje = `Hola Fonella, me interesa adquirir el juguete didáctico *${nombreJuguete}* (Ref: ${codigoSku}). ¿Tienen unidades disponibles?`;
  return `https://wa.me/${WHATSAPP_FONELLA}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * HU-09: Generador estructurado del Formulario Dinámico Asistido para Cita
 */
export function generarLinkSolicitudCitaAsistida(datos: DatosSolicitudCita): string {
  const lineaAcudiente = datos.esMenorEdad && datos.nombreAcudiente
    ? `• *Acudiente:* ${datos.nombreAcudiente}\n`
    : '';

  const mensaje =
    `Hola Fonella, deseo solicitar una cita fonoaudiológica:\n\n` +
    `• *Paciente:* ${datos.nombrePaciente} (${datos.edadPaciente})\n` +
    lineaAcudiente +
    `• *Servicio de interés:* ${datos.servicioInteres}\n` +
    `• *Motivo de consulta:* ${datos.motivoBreve}\n` +
    `• *Jornada preferida:* ${datos.jornadaPreferida}`;

  return `https://wa.me/${WHATSAPP_FONELLA}?text=${encodeURIComponent(mensaje)}`;
}
