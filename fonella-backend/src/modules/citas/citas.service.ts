import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EstadoCita, EstadoRegistro } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { obtenerFestivoColombia } from "./colombia-festivos";
import {
  ActualizarEstadoCitaDto,
  CancelarCitaDto,
  CrearCitaDto,
  ReprogramarCitaDto,
} from "./dto/citas.dto";

// Constantes de horario clínico en minutos desde medianoche (hora Colombia UTC-5)
const DURACION_FRANJA_MIN = 45;
const PASO_FRANJA_MIN = 60; // Sesiones de 45 min cada hora (15 min de transición)
const MANANA_INICIO_MIN = 9 * 60; // 09:00
const MANANA_FIN_MIN = 12 * 60; // 12:00 (inicio de receso)
const TARDE_INICIO_MIN = 14 * 60; // 14:00 (fin de receso)
const TARDE_FIN_MIN = 18 * 60; // 18:00
const HORAS_ANTICIPACION_CANCELACION = 24;

@Injectable()
export class CitasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Convierte "HH:mm" a minutos desde medianoche para validar franjas sin depender de zonas horarias.
   */
  private aMinutos(hora: string): number {
    const [hh, mm] = hora.split(":").map(Number);
    return hh * 60 + mm;
  }

  /**
   * Formatea minutos desde medianoche a cadena "HH:mm".
   */
  private minutosAHora(totalMin: number): string {
    const hh = String(Math.floor(totalMin / 60)).padStart(2, "0");
    const mm = String(totalMin % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /**
   * Formatea un Date a "HH:mm" en hora de Colombia (UTC-5) de forma determinista.
   */
  private formatearHoraColombia(fecha: Date): string {
    const col = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
    const hh = String(col.getUTCHours()).padStart(2, "0");
    const mm = String(col.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  /**
   * Obtiene el día de la semana (0 = Domingo .. 6 = Sábado) para una fecha YYYY-MM-DD.
   */
  private obtenerDiaSemana(fechaStr: string): number {
    return new Date(`${fechaStr}T12:00:00.000Z`).getUTCDay();
  }

  /**
   * Construye y valida el rango horario de una cita (fecha, horaInicio, horaFin)
   * aplicando horario laboral, bloqueo de receso (12:00–14:00) y restricción de pasado.
   */
  private construirRangoCita(
    fechaStr: string,
    horaInicioStr: string,
    duracionMinutos: number,
  ) {
    const soloFecha = fechaStr.slice(0, 10);
    const fechaDate = new Date(`${soloFecha}T00:00:00.000Z`);
    if (Number.isNaN(fechaDate.getTime())) {
      throw new BadRequestException("La fecha proporcionada no es válida.");
    }

    const diaSemana = this.obtenerDiaSemana(soloFecha);
    if (diaSemana === 0) {
      throw new BadRequestException(
        "El consultorio no atiende los días domingo.",
      );
    }

    const festivo = obtenerFestivoColombia(soloFecha);
    if (festivo) {
      throw new BadRequestException(
        `El consultorio no atiende en días festivos de Colombia (${festivo}).`,
      );
    }

    const inicioMin = this.aMinutos(horaInicioStr);
    const finMin = inicioMin + duracionMinutos;
    const esSabado = diaSemana === 6;

    // Validar franja dentro de jornada mañana (08:00-12:00) o tarde L-V (14:00-18:00)
    const enManana =
      inicioMin >= MANANA_INICIO_MIN && finMin <= MANANA_FIN_MIN;
    const enTarde =
      !esSabado && inicioMin >= TARDE_INICIO_MIN && finMin <= TARDE_FIN_MIN;

    if (!enManana && !enTarde) {
      // Mensaje específico si la franja invade el receso de almuerzo (12:00–14:00)
      if (!esSabado && inicioMin < TARDE_INICIO_MIN && finMin > MANANA_FIN_MIN) {
        throw new BadRequestException(
          "No es posible agendar durante el receso clínico de 12:00 a 14:00 (HU-Agenda-002).",
        );
      }
      throw new BadRequestException(
        esSabado
          ? "Los sábados el horario de atención es de 09:00 a 12:00 (franjas 09:00, 10:00 y 11:00)."
          : "El horario de atención es de 09:00 a 12:00 y de 14:00 a 18:00.",
      );
    }

    // Validar que el inicio coincida con las franjas en punto (09:00, 10:00, 11:00 / 14:00..17:00)
    if (inicioMin % PASO_FRANJA_MIN !== 0) {
      throw new BadRequestException(
        "Las sesiones de 45 minutos inician en punto cada hora (09:00, 10:00, 11:00 y 14:00 a 17:00).",
      );
    }

    // Anclar fecha y hora a Colombia (UTC-5) para persistir instante exacto en BD
    const horaInicio = new Date(`${soloFecha}T${horaInicioStr}:00-05:00`);
    const horaFin = new Date(horaInicio.getTime() + duracionMinutos * 60_000);

    if (horaInicio <= new Date()) {
      throw new BadRequestException(
        "No es posible agendar o reprogramar una cita en una fecha u hora pasada.",
      );
    }

    return { soloFecha, fechaDate, horaInicio, horaFin };
  }

  /**
   * Verifica que no exista cruce de horario con otra cita activa (CONFIRMADA o ATENDIDA).
   */
  private async verificarCruceHorario(
    fechaDate: Date,
    horaInicio: Date,
    horaFin: Date,
    excluirCitaId?: string,
  ) {
    const cruce = await this.prisma.cita.findFirst({
      where: {
        fecha: fechaDate,
        estado: { in: [EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA] },
        ...(excluirCitaId ? { id: { not: excluirCitaId } } : {}),
        horaInicio: { lt: horaFin },
        horaFin: { gt: horaInicio },
      },
      select: { id: true, horaInicio: true, horaFin: true },
    });

    if (cruce) {
      throw new ConflictException(
        `Ya existe una cita agendada entre ${this.formatearHoraColombia(cruce.horaInicio)} y ${this.formatearHoraColombia(cruce.horaFin)}.`,
      );
    }
  }

  /**
   * Retorna la inclusión estándar de relaciones para respuestas de citas.
   */
  private readonly includeCita = {
    paciente: {
      include: {
        acudientes: {
          include: { acudiente: true },
          orderBy: { esPrincipal: "desc" as const },
        },
      },
    },
    servicio: true,
    creadoPor: {
      select: {
        id: true,
        nombreCompleto: true,
        rol: true,
      },
    },
  };

  /**
   * Lista los servicios terapéuticos activos disponibles para agendar (HU - Agenda - 001).
   */
  async listarServicios() {
    return this.prisma.servicioTerapeutico.findMany({
      where: { estado: EstadoRegistro.ACTIVO },
      orderBy: { nombre: "asc" },
    });
  }

  /**
   * Calcula las franjas de 45 minutos disponibles y el receso clínico para una fecha (HU - Agenda - 002).
   */
  async obtenerDisponibilidad(fechaStr: string) {
    const soloFecha = fechaStr.slice(0, 10);
    const fechaDate = new Date(`${soloFecha}T00:00:00.000Z`);
    if (Number.isNaN(fechaDate.getTime())) {
      throw new BadRequestException("La fecha proporcionada no es válida.");
    }

    const diaSemana = this.obtenerDiaSemana(soloFecha);
    if (diaSemana === 0) {
      return {
        fecha: soloFecha,
        abierto: false,
        motivoCierre: "Domingo — consultorio cerrado",
        bloqueReceso: null,
        franjas: [],
      };
    }

    const festivo = obtenerFestivoColombia(soloFecha);
    if (festivo) {
      return {
        fecha: soloFecha,
        abierto: false,
        motivoCierre: `Festivo en Colombia (${festivo}) — consultorio cerrado`,
        bloqueReceso: null,
        franjas: [],
      };
    }

    const esSabado = diaSemana === 6;
    const citasDelDia = await this.prisma.cita.findMany({
      where: {
        fecha: fechaDate,
        estado: { in: [EstadoCita.CONFIRMADA, EstadoCita.ATENDIDA] },
      },
      include: this.includeCita,
      orderBy: { horaInicio: "asc" },
    });

    // Construye bloques de 45 min cada hora en punto: mañana (09:00–12:00) y tarde L-V (14:00–18:00)
    const bloques = esSabado
      ? [[MANANA_INICIO_MIN, MANANA_FIN_MIN]]
      : [
          [MANANA_INICIO_MIN, MANANA_FIN_MIN],
          [TARDE_INICIO_MIN, TARDE_FIN_MIN],
        ];

    const ahora = new Date();
    const franjas: Array<{
      horaInicio: string;
      horaFin: string;
      jornada: "MANANA" | "TARDE";
      disponible: boolean;
      motivoNoDisponible: "OCUPADA" | "PASADA" | null;
      cita: (typeof citasDelDia)[number] | null;
    }> = [];

    for (const [inicioBloque, finBloque] of bloques) {
      const jornada = inicioBloque === MANANA_INICIO_MIN ? "MANANA" : "TARDE";
      for (
        let min = inicioBloque;
        min + DURACION_FRANJA_MIN <= finBloque;
        min += PASO_FRANJA_MIN
      ) {
        const horaInicioStr = this.minutosAHora(min);
        const horaFinStr = this.minutosAHora(min + DURACION_FRANJA_MIN);
        const slotInicio = new Date(`${soloFecha}T${horaInicioStr}:00-05:00`);
        const slotFin = new Date(`${soloFecha}T${horaFinStr}:00-05:00`);

        const citaOcupante =
          citasDelDia.find(
            (c) => c.horaInicio < slotFin && c.horaFin > slotInicio,
          ) ?? null;

        const yaPaso = slotInicio <= ahora;
        const motivoNoDisponible = citaOcupante
          ? "OCUPADA"
          : yaPaso
            ? "PASADA"
            : null;

        franjas.push({
          horaInicio: horaInicioStr,
          horaFin: horaFinStr,
          jornada,
          disponible: !citaOcupante && !yaPaso,
          motivoNoDisponible,
          cita: citaOcupante,
        });
      }
    }

    return {
      fecha: soloFecha,
      abierto: true,
      duracionFranjaMinutos: DURACION_FRANJA_MIN,
      bloqueReceso: esSabado ? null : { inicio: "12:00", fin: "14:00" },
      franjas,
    };
  }

  /**
   * Lista las citas de una fecha puntual o un rango de fechas para la agenda operativa.
   */
  async listarCitas(fecha?: string, desde?: string, hasta?: string) {
    const where: Record<string, unknown> = {};

    if (fecha) {
      where.fecha = new Date(`${fecha.slice(0, 10)}T00:00:00.000Z`);
    } else if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(`${desde.slice(0, 10)}T00:00:00.000Z`) } : {}),
        ...(hasta ? { lte: new Date(`${hasta.slice(0, 10)}T00:00:00.000Z`) } : {}),
      };
    }

    return this.prisma.cita.findMany({
      where,
      include: this.includeCita,
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    });
  }

  /**
   * Agenda una nueva cita validando paciente, servicio, franja clínica y ausencia de cruces (HU - Agenda - 001).
   */
  async crear(dto: CrearCitaDto, usuarioId: string) {
    const [paciente, servicio] = await Promise.all([
      this.prisma.paciente.findUnique({
        where: { id: dto.pacienteId },
        select: { id: true, estado: true },
      }),
      this.prisma.servicioTerapeutico.findUnique({
        where: { id: dto.servicioId },
        select: { id: true, estado: true, duracionMinutos: true },
      }),
    ]);

    if (!paciente || paciente.estado !== EstadoRegistro.ACTIVO) {
      throw new NotFoundException(
        "El paciente seleccionado no existe o está inactivo.",
      );
    }

    if (!servicio || servicio.estado !== EstadoRegistro.ACTIVO) {
      throw new NotFoundException(
        "El servicio terapéutico seleccionado no existe o está inactivo.",
      );
    }

    const { fechaDate, horaInicio, horaFin } = this.construirRangoCita(
      dto.fecha,
      dto.horaInicio,
      servicio.duracionMinutos,
    );

    await this.verificarCruceHorario(fechaDate, horaInicio, horaFin);

    return this.prisma.cita.create({
      data: {
        pacienteId: paciente.id,
        servicioId: servicio.id,
        creadoPorId: usuarioId,
        fecha: fechaDate,
        horaInicio,
        horaFin,
        estado: EstadoCita.CONFIRMADA,
      },
      include: this.includeCita,
    });
  }

  /**
   * Reprograma fecha y hora de una cita CONFIRMADA respetando franjas y cruces (HU - Agenda - 003).
   */
  async reprogramar(id: string, dto: ReprogramarCitaDto) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: { servicio: { select: { duracionMinutos: true } } },
    });

    if (!cita) {
      throw new NotFoundException("La cita solicitada no existe.");
    }

    if (cita.estado !== EstadoCita.CONFIRMADA) {
      throw new BadRequestException(
        "Solo se pueden reprogramar citas en estado CONFIRMADA.",
      );
    }

    const { fechaDate, horaInicio, horaFin } = this.construirRangoCita(
      dto.fecha,
      dto.horaInicio,
      cita.servicio.duracionMinutos,
    );

    await this.verificarCruceHorario(fechaDate, horaInicio, horaFin, cita.id);

    return this.prisma.cita.update({
      where: { id: cita.id },
      data: {
        fecha: fechaDate,
        horaInicio,
        horaFin,
        // Al mover la cita, se reinician los flags para que vuelvan a enviarse recordatorios
        recordatorio24hEnviado: false,
        recordatorio2hEnviado: false,
      },
      include: this.includeCita,
    });
  }

  /**
   * Cancela una cita CONFIRMADA aplicando la regla de 24 horas (HU - Agenda - 003):
   * - >= 24h de anticipación: CANCELADA_A_TIEMPO (no suma falta).
   * - < 24h de anticipación: CANCELADA_TARDIA (+1 en totalFaltasTardias del paciente).
   */
  async cancelar(id: string, dto: CancelarCitaDto) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      select: { id: true, estado: true, horaInicio: true, pacienteId: true },
    });

    if (!cita) {
      throw new NotFoundException("La cita solicitada no existe.");
    }

    if (cita.estado !== EstadoCita.CONFIRMADA) {
      throw new BadRequestException(
        "Solo se pueden cancelar citas en estado CONFIRMADA.",
      );
    }

    const ahora = new Date();
    const horasRestantes =
      (cita.horaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    const esTardia = horasRestantes < HORAS_ANTICIPACION_CANCELACION;
    const nuevoEstado = esTardia
      ? EstadoCita.CANCELADA_TARDIA
      : EstadoCita.CANCELADA_A_TIEMPO;

    return this.prisma.$transaction(async (tx) => {
      const citaActualizada = await tx.cita.update({
        where: { id: cita.id },
        data: {
          estado: nuevoEstado,
          motivoCancelacion: dto.motivoCancelacion.trim(),
          fechaCancelacion: ahora,
        },
        include: this.includeCita,
      });

      if (esTardia) {
        await tx.paciente.update({
          where: { id: cita.pacienteId },
          data: { totalFaltasTardias: { increment: 1 } },
        });
      }

      return {
        ...citaActualizada,
        cancelacionTardia: esTardia,
      };
    });
  }

  /**
   * Registra asistencia (ATENDIDA) o falta (INASISTENCIA) de una cita CONFIRMADA (HU - Agenda - 003).
   * Si es INASISTENCIA, incrementa el contador histórico totalFaltasTardias del paciente.
   */
  async actualizarEstado(id: string, dto: ActualizarEstadoCitaDto) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      select: { id: true, estado: true, pacienteId: true },
    });

    if (!cita) {
      throw new NotFoundException("La cita solicitada no existe.");
    }

    if (cita.estado !== EstadoCita.CONFIRMADA) {
      throw new BadRequestException(
        "Solo se puede cambiar el estado de citas en estado CONFIRMADA.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const citaActualizada = await tx.cita.update({
        where: { id: cita.id },
        data: { estado: dto.estado },
        include: this.includeCita,
      });

      if (dto.estado === "INASISTENCIA") {
        await tx.paciente.update({
          where: { id: cita.pacienteId },
          data: { totalFaltasTardias: { increment: 1 } },
        });
      }

      return citaActualizada;
    });
  }
}
