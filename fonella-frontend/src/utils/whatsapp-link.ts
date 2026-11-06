// ============================================================================
// GENERADOR DE DEEP LINKS DE WHATSAPP (HU-06, HU-07, HU-08, HU-09)
// Sanitiza y construye enlaces https://wa.me/ sin costo de API
// ============================================================================

const WHATSAPP_FONELLA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';

export interface DatosSolicitudCita {
  esMenorEdad: boolean;
  nombrePaciente: string;
  edadPaciente: string;
  telefono: string;
  nombreAcudiente?: string;
  parentescoAcudiente?: string;
  servicioInteres: string;
  duracionMinutos: number;
  motivoBreve: string;
  jornadaPreferida:
    | 'Mañana (8:00 a.m. - 12:00 m.)'
    | 'Tarde (2:00 p.m. - 6:00 p.m.)';
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
export function generarLinkSolicitudCitaAsistida(
  datos: DatosSolicitudCita
): string {
  const tipoPaciente = datos.esMenorEdad
    ? 'Paciente Pediátrico'
    : 'Paciente Adulto';

  const lineaAcudiente =
    datos.esMenorEdad && datos.nombreAcudiente
      ? `• *Acudiente:* ${datos.nombreAcudiente}${
          datos.parentescoAcudiente
            ? ` (${datos.parentescoAcudiente})`
            : ''
        }\n`
      : '';

  const mensaje =
    `Hola Consultorio FONELLA 👋.\n` +
    `Deseo agendar una cita fonoaudiológica:\n\n` +
    `• *Tipo:* ${tipoPaciente}\n` +
    `• *Teléfono de contacto:* ${datos.telefono}\n` +
    lineaAcudiente +
    `• *Paciente:* ${datos.nombrePaciente} (${datos.edadPaciente})\n` +
    `• *Servicio:* ${datos.servicioInteres} (${datos.duracionMinutos} min)\n` +
    `• *Jornada preferida:* ${datos.jornadaPreferida}\n` +
    `• *Motivo:* ${datos.motivoBreve}\n\n` +
    `Quedo atento(a) a la disponibilidad en agenda. ¡Gracias!`;

  return `https://wa.me/${WHATSAPP_FONELLA}?text=${encodeURIComponent(mensaje)}`;
}