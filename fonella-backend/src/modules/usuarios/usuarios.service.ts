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
import { ActualizarPersonalDto } from "./dto/actualizar-personal.dto";

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una nueva cuenta de personal (asistente o fonoaudióloga)
   */
  async crearPersonal(dto: CrearPersonalDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Validar que no exista otro usuario con el mismo email (409 Conflict)
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (usuarioExistente) {
      throw new ConflictException(
        "Ya existe un usuario registrado con este correo electrónico.",
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
        fotoPerfilUrl: dto.fotoPerfilUrl || null,
        ocultoEnPanel: false,
        estado: EstadoRegistro.ACTIVO,
      },
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        registroRethus: true,
        fotoPerfilUrl: true,
        ocultoEnPanel: true,
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
   */
  async listarPersonal() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        registroRethus: true,
        fotoPerfilUrl: true,
        ocultoEnPanel: true,
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
   * Actualiza la información de una cuenta de personal (incluyendo foto de perfil y visibilidad)
   */
  async actualizarPersonal(id: string, dto: ActualizarPersonalDto) {
    // 1. Verificar si el usuario existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException("El usuario especificado no existe.");
    }

    // 2. Si se cambia el email, validar que no esté en uso por otro usuario
    let emailNormalizado: string | undefined = undefined;
    if (dto.email) {
      emailNormalizado = dto.email.toLowerCase().trim();
      if (emailNormalizado !== usuario.email) {
        const usuarioConMismoEmail = await this.prisma.usuario.findUnique({
          where: { email: emailNormalizado },
        });
        if (usuarioConMismoEmail && usuarioConMismoEmail.id !== id) {
          throw new ConflictException(
            "El correo electrónico especificado ya se encuentra en uso por otro colaborador.",
          );
        }
      }
    }

    // 3. Regla de seguridad: Si es la Dra. Bárbara, no se le puede degradar el rol, ocultar ni cambiar su correo oficial
    if (usuario.email === "barbara.ccucho@fonella.co") {
      if (dto.rol && dto.rol !== "FONOAUDIOLOGA") {
        throw new BadRequestException(
          "La cuenta principal de la Dra. Bárbara Ccucho debe mantener el rol de FONOAUDIOLOGA.",
        );
      }
      if (dto.ocultoEnPanel === true) {
        throw new BadRequestException(
          "No es posible ocultar la cuenta titular de la dirección clínica.",
        );
      }
      if (emailNormalizado && emailNormalizado !== "barbara.ccucho@fonella.co") {
        throw new BadRequestException(
          "El correo institucional de la cuenta titular (barbara.ccucho@fonella.co) no puede ser modificado.",
        );
      }
    }

    // 4. Preparar datos a actualizar
    const datosActualizacion: any = {};

    if (dto.nombreCompleto) {
      datosActualizacion.nombreCompleto = dto.nombreCompleto.trim();
    }
    if (emailNormalizado) {
      datosActualizacion.email = emailNormalizado;
    }
    if (dto.rol) {
      datosActualizacion.rol = dto.rol;
    }
    if (dto.registroRethus !== undefined) {
      datosActualizacion.registroRethus = dto.registroRethus ? dto.registroRethus.trim() : null;
    }
    if (dto.fotoPerfilUrl !== undefined) {
      datosActualizacion.fotoPerfilUrl = dto.fotoPerfilUrl;
    }
    if (dto.ocultoEnPanel !== undefined) {
      datosActualizacion.ocultoEnPanel = dto.ocultoEnPanel;
    }
    if (dto.password && dto.password.trim().length >= 8) {
      datosActualizacion.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // 5. Ejecutar la actualización en PostgreSQL
    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        nombreCompleto: true,
        email: true,
        rol: true,
        registroRethus: true,
        fotoPerfilUrl: true,
        ocultoEnPanel: true,
        estado: true,
        updatedAt: true,
      },
    });

    return {
      mensaje: `La información de ${usuarioActualizado.nombreCompleto} ha sido actualizada exitosamente.`,
      usuario: usuarioActualizado,
    };
  }

  /**
   * Activa o desactiva una cuenta (Soft-delete)
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
        fotoPerfilUrl: true,
        ocultoEnPanel: true,
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
