import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EstadoRegistro, TipoDocumento, TipoRemision } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import {
  ActualizarPacienteDto,
  AcudienteInputDto,
  CrearPacienteDto,
} from "./dto/crear-paciente.dto";

/** Reglas de formato y longitud por tipo de documento en Colombia. */
const REGLAS_DOCUMENTO: Record<
  TipoDocumento,
  { soloNumeros: boolean; min: number; max: number; nombre: string }
> = {
  CC: { soloNumeros: true, min: 6, max: 10, nombre: "Cédula de Ciudadanía (CC)" },
  TI: { soloNumeros: true, min: 10, max: 11, nombre: "Tarjeta de Identidad (TI)" },
  RC: { soloNumeros: true, min: 10, max: 11, nombre: "Registro Civil (RC)" },
  CE: { soloNumeros: true, min: 6, max: 10, nombre: "Cédula de Extranjería (CE)" },
  PA: { soloNumeros: false, min: 5, max: 16, nombre: "Pasaporte (PA)" },
};

/** Prefijos móviles válidos en Colombia. */
const PREFIJOS_TELEFONO_CO = new Set([
  "300", "301", "302", "303", "304", "305",
  "310", "311", "312", "313", "314", "315", "316", "317", "318", "319",
  "320", "321", "322", "323", "324",
  "333",
  "350", "351",
]);

@Injectable()
export class PacientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Calcula la edad cronológica en años usando los componentes UTC de la fecha
   * de nacimiento (@db.Date) para evitar desfases por zona horaria.
   */
  private calcularEdad(fechaNacimiento: Date): number {
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getUTCFullYear();
    const diffMes = hoy.getMonth() - fechaNacimiento.getUTCMonth();
    if (
      diffMes < 0 ||
      (diffMes === 0 && hoy.getDate() < fechaNacimiento.getUTCDate())
    ) {
      edad--;
    }
    return edad;
  }

  /**
   * Búsqueda predictiva de pacientes activos por nombres, apellidos o número de documento.
   */
  async buscar(q?: string) {
    const termino = q?.trim();

    const pacientes = await this.prisma.paciente.findMany({
      where: {
        estado: EstadoRegistro.ACTIVO,
        ...(termino
          ? {
              OR: [
                { nombres: { contains: termino, mode: "insensitive" } },
                { apellidos: { contains: termino, mode: "insensitive" } },
                { numeroDocumento: { contains: termino, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        acudientes: {
          include: {
            acudiente: true,
          },
          orderBy: { esPrincipal: "desc" },
        },
      },
      orderBy: [{ apellidos: "asc" }, { nombres: "asc" }],
      take: 20,
    });

    return pacientes.map((paciente) => ({
      ...paciente,
      edad: this.calcularEdad(paciente.fechaNacimiento),
    }));
  }

  /**
   * Consulta un acudiente existente por su número de documento para reutilizarlo
   * al registrar hermanos u otros pacientes a su cargo.
   */
  async buscarAcudientePorDocumento(numeroDocumento: string) {
    const documento = numeroDocumento.trim();
    const acudiente = await this.prisma.acudiente.findUnique({
      where: { numeroDocumento: documento },
    });

    if (!acudiente) {
      throw new NotFoundException(
        `No se encontró un acudiente registrado con el documento ${documento}.`,
      );
    }

    return acudiente;
  }

  /**
   * Valida formato de fecha de nacimiento, que no sea futura y retorna fecha + edad.
   */
  private parsearYValidarFechaNacimiento(fechaStr: string) {
    const fechaNacimiento = new Date(fechaStr);
    if (Number.isNaN(fechaNacimiento.getTime())) {
      throw new BadRequestException("La fecha de nacimiento no es válida.");
    }
    if (fechaNacimiento > new Date()) {
      throw new BadRequestException(
        "La fecha de nacimiento no puede ser una fecha futura.",
      );
    }
    return { fechaNacimiento, edad: this.calcularEdad(fechaNacimiento) };
  }

  /**
   * Valida la existencia real de los correos proporcionados (paciente y/o acudiente).
   */
  private async validarCorreos(
    emailPaciente?: string,
    emailAcudiente?: string,
  ) {
    if (emailPaciente?.trim()) {
      await this.authService.validarExistenciaEmail(emailPaciente);
    }
    if (emailAcudiente?.trim()) {
      await this.authService.validarExistenciaEmail(emailAcudiente);
    }
  }

  /**
   * Crea o actualiza el acudiente por documento y asegura su vínculo principal con el paciente.
   */
  private async vincularAcudienteEnTx(
    tx: Parameters<Parameters<PrismaService["$transaction"]>[0]>[0],
    pacienteId: string,
    acudienteDto: AcudienteInputDto,
  ) {
    const docAcudiente = acudienteDto.numeroDocumento.trim();
    const acudiente = await tx.acudiente.upsert({
      where: { numeroDocumento: docAcudiente },
      update: {
        tipoDocumento: acudienteDto.tipoDocumento,
        nombres: acudienteDto.nombres.trim(),
        apellidos: acudienteDto.apellidos.trim(),
        telefonoPrincipal: acudienteDto.telefonoPrincipal.trim(),
        telefonoRespaldo: acudienteDto.telefonoRespaldo?.trim() || null,
        email: acudienteDto.email?.trim().toLowerCase() || null,
      },
      create: {
        tipoDocumento: acudienteDto.tipoDocumento,
        numeroDocumento: docAcudiente,
        nombres: acudienteDto.nombres.trim(),
        apellidos: acudienteDto.apellidos.trim(),
        telefonoPrincipal: acudienteDto.telefonoPrincipal.trim(),
        telefonoRespaldo: acudienteDto.telefonoRespaldo?.trim() || null,
        email: acudienteDto.email?.trim().toLowerCase() || null,
      },
    });

    await tx.pacienteAcudiente.upsert({
      where: {
        pacienteId_acudienteId: {
          pacienteId,
          acudienteId: acudiente.id,
        },
      },
      update: {
        parentesco: acudienteDto.parentesco.trim(),
        esPrincipal: true,
      },
      create: {
        pacienteId,
        acudienteId: acudiente.id,
        parentesco: acudienteDto.parentesco.trim(),
        esPrincipal: true,
      },
    });
  }

  /** Valida caracteres y longitud mínima/máxima de un documento colombiano según su tipo. */
  private validarDocumentoFormato(
    tipo: TipoDocumento,
    numero: string,
    etiqueta: string,
  ): void {
    const limpio = numero.trim();
    const regla = REGLAS_DOCUMENTO[tipo];
    if (!regla) return;

    if (regla.soloNumeros && !/^\d+$/.test(limpio)) {
      throw new BadRequestException(
        `${etiqueta} (${regla.nombre}) solo puede contener números.`,
      );
    }
    if (!regla.soloNumeros && !/^[A-Za-z0-9]+$/.test(limpio)) {
      throw new BadRequestException(
        `${etiqueta} (${regla.nombre}) solo puede contener letras y números sin espacios ni símbolos.`,
      );
    }
    if (limpio.length < regla.min || limpio.length > regla.max) {
      throw new BadRequestException(
        `${etiqueta} (${regla.nombre}) debe tener entre ${regla.min} y ${regla.max} ${regla.soloNumeros ? "dígitos" : "caracteres"}.`,
      );
    }
  }

  /** Valida que un menor de edad colombiano no registre CC ni CE y que el documento sea válido. */
  private validarDocumentoYEdad(
    tipo: TipoDocumento,
    numero: string,
    edad: number,
  ): void {
    if (edad < 18 && (tipo === TipoDocumento.CC || tipo === TipoDocumento.CE)) {
      throw new BadRequestException(
        "Un paciente menor de edad solo puede registrarse con Registro Civil (RC), Tarjeta de Identidad (TI) o Pasaporte (PA).",
      );
    }
    this.validarDocumentoFormato(tipo, numero, "El documento del paciente");
  }

  /** Valida que el número tenga 10 dígitos y comience con un prefijo móvil válido en Colombia. */
  private validarTelefonoColombia(telefono: string, etiqueta: string): void {
    const limpio = telefono.trim();
    if (!/^\d{10}$/.test(limpio)) {
      throw new BadRequestException(
        `${etiqueta} debe tener exactamente 10 dígitos numéricos.`,
      );
    }
    const prefijo = limpio.slice(0, 3);
    if (!PREFIJOS_TELEFONO_CO.has(prefijo)) {
      throw new BadRequestException(
        `${etiqueta} debe iniciar con un prefijo móvil válido en Colombia.`,
      );
    }
  }

  /**
   * Registra un nuevo paciente validando unicidad de documento, correos y RN-06
   * (acudiente obligatorio para menores de 18 años).
   */
  async crear(dto: CrearPacienteDto) {
    // 1. Validar fecha de nacimiento y calcular edad
    const { fechaNacimiento, edad } = this.parsearYValidarFechaNacimiento(
      dto.fechaNacimiento,
    );

    // 2. Aplicar regla de negocio RN-06: todo menor de 18 años requiere acudiente
    if (edad < 18 && !dto.acudiente) {
      throw new BadRequestException(
        "Todo paciente menor de 18 años debe tener un acudiente o responsable registrado (RN-06).",
      );
    }

    // 2b. Validar reglas colombianas de documento, edad y teléfonos

    this.validarDocumentoYEdad(dto.tipoDocumento, dto.numeroDocumento, edad);

    if (!dto.genero?.trim()) {
      throw new BadRequestException(
        "El género del paciente es obligatorio.",
      );
    }

    if (!dto.telefonoContacto?.trim()) {
      throw new BadRequestException(
        "El teléfono de contacto del paciente es obligatorio.",
      );
    }

    if (!dto.ciudad?.trim()) {
      throw new BadRequestException(
        "La ciudad del paciente es obligatoria.",
      );
    }

    this.validarTelefonoColombia(
      dto.telefonoContacto,
      "El teléfono de contacto",
    );

    if (dto.acudiente) {
      this.validarDocumentoFormato(
        dto.acudiente.tipoDocumento,
        dto.acudiente.numeroDocumento,
        "El documento del acudiente",
      );

      this.validarTelefonoColombia(
        dto.acudiente.telefonoPrincipal,
        "El teléfono principal del acudiente",
      );
    }


    // 3. Validar existencia real de los correos si fueron suministrados
    await this.validarCorreos(dto.email, dto.acudiente?.email);

    // 4. Evitar duplicados por número de documento antes de abrir la transacción
    const numeroDocumento = dto.numeroDocumento.trim();
    const existente = await this.prisma.paciente.findUnique({
      where: { numeroDocumento },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un paciente registrado con el documento ${numeroDocumento}.`,
      );
    }

    // 5. Transacción atómica: paciente + acudiente + vínculo
    const pacienteCreado = await this.prisma.$transaction(async (tx) => {
      const paciente = await tx.paciente.create({
        data: {
          tipoDocumento: dto.tipoDocumento,
          numeroDocumento,
          nombres: dto.nombres.trim(),
          apellidos: dto.apellidos.trim(),
          fechaNacimiento,
          genero: dto.genero.trim(),
          telefonoContacto: dto.telefonoContacto.trim(),
          email: dto.email?.trim().toLowerCase() || null,
          ciudad: dto.ciudad.trim(),
          direccion: dto.direccion?.trim() || null,
          tipoRemision: dto.tipoRemision ?? TipoRemision.PARTICULAR,
          institucionRemitente: dto.institucionRemitente?.trim() || null,
          profesionalRemitente: dto.profesionalRemitente?.trim() || null,
        },
      });

      if (dto.acudiente) {
        await this.vincularAcudienteEnTx(tx, paciente.id, dto.acudiente);
      }

      return tx.paciente.findUniqueOrThrow({
        where: { id: paciente.id },
        include: {
          acudientes: {
            include: { acudiente: true },
            orderBy: { esPrincipal: "desc" },
          },
        },
      });
    });

    return {
      ...pacienteCreado,
      edad,
    };
  }

  /**
   * Actualiza los datos de un paciente existente (y su acudiente si se envía).
   * Valida unicidad de documento, correos reales y cumplimiento de RN-06.
   */
  async actualizar(id: string, dto: ActualizarPacienteDto) {
    const actual = await this.prisma.paciente.findUnique({
      where: { id },
      include: { acudientes: true },
    });

    if (!actual) {
      throw new NotFoundException("El paciente solicitado no existe.");
    }

    // 1. Validar nueva fecha de nacimiento si cambia, o conservar la actual
    const { fechaNacimiento, edad } = dto.fechaNacimiento
      ? this.parsearYValidarFechaNacimiento(dto.fechaNacimiento)
      : {
          fechaNacimiento: actual.fechaNacimiento,
          edad: this.calcularEdad(actual.fechaNacimiento),
        };

    // 2. Validar RN-06: si queda menor de 18 años, debe tener acudiente nuevo o previo
    if (edad < 18 && !dto.acudiente && actual.acudientes.length === 0) {
      throw new BadRequestException(
        "Todo paciente menor de 18 años debe tener un acudiente o responsable registrado (RN-06).",
      );
    }

    // 2b. Validar reglas colombianas de documento, edad y teléfonos

    const tipoDocEfectivo = dto.tipoDocumento ?? actual.tipoDocumento;
    const numDocEfectivo = dto.numeroDocumento ?? actual.numeroDocumento;
    this.validarDocumentoYEdad(tipoDocEfectivo, numDocEfectivo, edad);

    if (dto.genero !== undefined && !dto.genero.trim()) {
      throw new BadRequestException(
        "El género del paciente no puede estar vacío.",
      );
    }

    if (
      dto.telefonoContacto !== undefined &&
      !dto.telefonoContacto.trim()
    ) {
      throw new BadRequestException(
        "El teléfono de contacto del paciente no puede estar vacío.",
      );
    }

    if (dto.ciudad !== undefined && !dto.ciudad.trim()) {
      throw new BadRequestException(
        "La ciudad del paciente no puede estar vacía.",
      );
    }

    if (dto.telefonoContacto?.trim()) {
      this.validarTelefonoColombia(
        dto.telefonoContacto,
        "El teléfono de contacto",
      );
    }

    if (dto.acudiente) {
      this.validarDocumentoFormato(
        dto.acudiente.tipoDocumento,
        dto.acudiente.numeroDocumento,
        "El documento del acudiente",
      );

      this.validarTelefonoColombia(
        dto.acudiente.telefonoPrincipal,
        "El teléfono principal del acudiente",
      );
    }


    // 3. Validar existencia real de correos si se enviaron en la edición
    await this.validarCorreos(dto.email, dto.acudiente?.email);

    // 4. Si cambia el número de documento, verificar que no pertenezca a otro paciente
    const nuevoDocumento = dto.numeroDocumento?.trim();
    if (nuevoDocumento && nuevoDocumento !== actual.numeroDocumento) {
      const duplicado = await this.prisma.paciente.findUnique({
        where: { numeroDocumento: nuevoDocumento },
        select: { id: true },
      });
      if (duplicado) {
        throw new ConflictException(
          `Ya existe otro paciente registrado con el documento ${nuevoDocumento}.`,
        );
      }
    }

    // 5. Actualizar en transacción atómica
    const pacienteActualizado = await this.prisma.$transaction(async (tx) => {
      await tx.paciente.update({
        where: { id },
        data: {
          ...(dto.tipoDocumento !== undefined && {
            tipoDocumento: dto.tipoDocumento,
          }),
          ...(nuevoDocumento !== undefined && {
            numeroDocumento: nuevoDocumento,
          }),
          ...(dto.nombres !== undefined && { nombres: dto.nombres.trim() }),
          ...(dto.apellidos !== undefined && {
            apellidos: dto.apellidos.trim(),
          }),
          ...(dto.fechaNacimiento !== undefined && { fechaNacimiento }),
          ...(dto.genero !== undefined && {
            genero: dto.genero.trim(),
          }),
          ...(dto.telefonoContacto !== undefined && {
            telefonoContacto: dto.telefonoContacto.trim(),
          }),
          ...(dto.email !== undefined && {
            email: dto.email.trim().toLowerCase() || null,
          }),
          ...(dto.ciudad !== undefined && {
            ciudad: dto.ciudad.trim(),
          }),
          ...(dto.direccion !== undefined && {
            direccion: dto.direccion.trim() || null,
          }),
          ...(dto.tipoRemision !== undefined && {
            tipoRemision: dto.tipoRemision,
          }),
          ...(dto.institucionRemitente !== undefined && {
            institucionRemitente: dto.institucionRemitente.trim() || null,
          }),
          ...(dto.profesionalRemitente !== undefined && {
            profesionalRemitente: dto.profesionalRemitente.trim() || null,
          }),
        },
      });

      if (dto.acudiente) {
        await this.vincularAcudienteEnTx(tx, id, dto.acudiente);
      }

      return tx.paciente.findUniqueOrThrow({
        where: { id },
        include: {
          acudientes: {
            include: { acudiente: true },
            orderBy: { esPrincipal: "desc" },
          },
        },
      });
    });

    return {
      ...pacienteActualizado,
      edad,
    };
  }
}
