import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { EstadoRegistro } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CrearPersonalDto } from "./dto/crear-personal.dto";
import { ActualizarEstadoDto } from "./dto/actualizar-estado.dto";

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una nueva cuenta de personal (asistente o fonoaudióloga)
   * HU-02: Creación de Cuentas de Personal
   */
  async crearPersonal(dto: CrearPersonalDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Validar que no exista otro usuario con el mismo email (409 Conflict)
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        "Ya existe un usuario registrado con este correo electrónico (HU-02).",
      );
    }

    // 2. Hashear la contraseña con bcrypt (10 rondas de salt)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // 3. Crear el registro en PostgreSQL
    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombreCompleto: dto.nombreCompleto.trim(),
        email: emailNormalizado,
        passwordHash,
        rol: dto.rol,
        registroRethus: dto.registroRethus?.trim() || null,
        estado: EstadoRegistro.ACTIVO,
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        registroRethus: true,
        estado: true,
        createdAt: true,
      },
    });

    return {
      mensaje: "Personal registrado exitosamente en el sistema Fonella.",
      usuario: nuevoUsuario,
    };
  }

  /**
   * Obtiene la lista completa de personal administrativo y clínico
   * HU-02: Listado sin exponer hashes de contraseñas
   */
  async listarPersonal() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        registroRethus: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Activa o desactiva una cuenta (Soft-delete)
   * HU-02: Desactivación de Asistentes
   */
  async cambiarEstado(id: string, dto: ActualizarEstadoDto) {
    // 1. Verificar si el usuario existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException("El usuario especificado no existe.");
    }

    // 2. Regla de seguridad: Proteger la cuenta principal de la clínica
    if (
      usuario.email === "barbara.ccucho@fonella.co" &&
      dto.estado === EstadoRegistro.INACTIVO
    ) {
      throw new BadRequestException(
        "No es posible desactivar la cuenta principal de la dirección clínica.",
      );
    }

    // 3. Actualizar el estado en PostgreSQL
    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        estado: dto.estado,
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        estado: true,
        updatedAt: true,
      },
    });

    return {
      mensaje: `La cuenta de personal ha sido cambiada a estado ${dto.estado} exitosamente.`,
      usuario: usuarioActualizado,
    };
  }
}
