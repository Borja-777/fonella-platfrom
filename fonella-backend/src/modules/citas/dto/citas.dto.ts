import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

/**
 * Payload para agendar una nueva cita en consultorio (HU - Agenda - 001).
 */
export class CrearCitaDto {
  // Identificador UUID del paciente previamente registrado
  @IsUUID("4", { message: "El identificador del paciente no es válido." })
  pacienteId: string;

  // Identificador UUID del servicio terapéutico del catálogo
  @IsUUID("4", { message: "El identificador del servicio no es válido." })
  servicioId: string;

  // Fecha de la cita en formato ISO corto (YYYY-MM-DD)
  @IsDateString(
    {},
    { message: "La fecha debe tener formato válido (YYYY-MM-DD)." },
  )
  fecha: string;

  // Hora de inicio en formato 24h (HH:mm), por ejemplo "08:00" o "14:45"
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "La hora de inicio debe tener formato HH:mm (ej. 08:00 o 14:45).",
  })
  horaInicio: string;
}

/**
 * Payload para reprogramar fecha u hora de una cita confirmada (HU - Agenda - 003).
 */
export class ReprogramarCitaDto {
  @IsDateString(
    {},
    { message: "La nueva fecha debe tener formato válido (YYYY-MM-DD)." },
  )
  fecha: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message:
      "La nueva hora de inicio debe tener formato HH:mm (ej. 08:00 o 14:45).",
  })
  horaInicio: string;
}

/**
 * Payload para cancelar una cita registrando el motivo obligatorio (HU - Agenda - 003).
 */
export class CancelarCitaDto {
  @IsString()
  @IsNotEmpty({ message: "El motivo de cancelación es obligatorio." })
  @MaxLength(500, {
    message: "El motivo de cancelación no puede superar los 500 caracteres.",
  })
  motivoCancelacion: string;
}

/**
 * Payload para registrar el desenlace de una cita confirmada (asistencia o inasistencia).
 */
export class ActualizarEstadoCitaDto {
  @IsIn(["ATENDIDA", "INASISTENCIA"], {
    message: "El estado solo puede actualizarse a ATENDIDA o INASISTENCIA.",
  })
  estado: "ATENDIDA" | "INASISTENCIA";
}
