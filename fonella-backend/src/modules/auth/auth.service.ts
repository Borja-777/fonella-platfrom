import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Response } from "express";
import { RolUsuario } from "@prisma/client";
import { SolicitarRecuperacionDto } from "./dto/solicitar-recuperacion.dto";
import { RestablecerPasswordDto } from "./dto/restablecer-password.dto";
import { RegistroAdministradorDto } from "./dto/registro-administrador.dto";
import { ConfirmarCuentaDto } from "./dto/confirmar-cuenta.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Valida credenciales, controla fuerza bruta (5 intentos) y verifica estado ACTIVO
   */
  async validarUsuario(email: string, contrasenaPlana: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // 1. Si no existe el usuario, lanzamos error genérico por seguridad
    if (!usuario) {
      throw new UnauthorizedException("Usuario o contraseña incorrectos");
    }

    // 2. ¿Está bloqueado por exceso de intentos fallidos?
    const ahora = new Date();
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > ahora) {
      const minutosRestantes = Math.ceil(
        (usuario.bloqueadoHasta.getTime() - ahora.getTime()) / (1000 * 60),
      );
      throw new HttpException(
        {
          statusCode: 423,
          message: `Cuenta bloqueada temporalmente por seguridad. Intenta nuevamente en ${minutosRestantes} minuto(s).`,
          error: "Locked",
        },
        423,
      );
    }

    // 3. ¿La cuenta está inactiva?
    if (usuario.estado !== "ACTIVO") {
      if (usuario.resetToken && usuario.resetTokenExpira && usuario.resetTokenExpira > ahora) {
        throw new UnauthorizedException(
          "Tu cuenta aún no ha sido activada. Por favor revisa tu correo electrónico y haz clic en el enlace de confirmación para activarla.",
        );
      }
      throw new UnauthorizedException(
        "Tu cuenta se encuentra inactiva. Contacta a la administradora.",
      );
    }

    // 4. Comparar contraseña plana con el hash de la BD usando bcrypt
    const contrasenaValida = await bcrypt.compare(
      contrasenaPlana,
      usuario.passwordHash,
    );
    if (!contrasenaValida) {
      const nuevosIntentos = usuario.intentosFallidos + 1;
      if (nuevosIntentos >= 5) {
        const bloqueo = new Date(Date.now() + 15 * 60 * 1000); // +15 minutos
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: nuevosIntentos,
            bloqueadoHasta: bloqueo,
          },
        });
        throw new HttpException(
          {
            statusCode: 423,
            message:
              "Has superado el límite de 5 intentos fallidos. Tu cuenta ha sido bloqueada por 15 minutos.",
            error: "Locked",
          },
          423,
        );
      }
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: nuevosIntentos },
      });
      throw new UnauthorizedException("Usuario o contraseña incorrectos");
    }

    // 5. Credenciales válidas: reiniciamos el contador de intentos y desbloqueamos
    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidos: 0,
          bloqueadoHasta: null,
        },
      });
    }

    const { passwordHash, ...usuarioSeguro } = usuario;
    return usuarioSeguro;
  }

  /**
   * Genera el JWT y lo adjunta como Cookie HttpOnly segura en la respuesta
   */
  async login(usuario: any, res: Response) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      nombreCompleto: usuario.nombreCompleto,
    };
    const token = this.jwtService.sign(payload);

    res.cookie("fonella_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(HttpStatus.OK).json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  }

  /**
   * Cierra sesión destruyendo la Cookie HttpOnly
   */
  async logout(res: Response) {
    res.clearCookie("fonella_token");
    return res.status(HttpStatus.OK).json({
      mensaje: "Sesión cerrada exitosamente",
    });
  }

  /**
   * Solicita la recuperación de contraseña generando un token seguro
   */
  async solicitarRecuperacion(dto: SolicitarRecuperacionDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Validar que el dominio del correo exista en internet (MX)
    await this.mailService.validarDominioEmail(emailNormalizado);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    // Validar si el usuario existe en el sistema
    if (!usuario) {
      throw new NotFoundException(
        "El correo electrónico no se encuentra registrado en el sistema.",
      );
    }

    // 2. Generar token criptográfico único
    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 3. Almacenar token en base de datos
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetToken: token,
        resetTokenExpira: expiracion,
      },
    });

    // 4. Crear enlace de restablecimiento
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const enlaceRecuperacion = `${frontendUrl}/restablecer-password?token=${token}`;

    // 5. Enviar correo real vía MailService
    await this.mailService.enviarEmailRecuperacion(
      usuario.email,
      usuario.nombreCompleto,
      enlaceRecuperacion,
    );

    return {
      mensaje: `Hemos enviado las instrucciones para restablecer tu contraseña al correo ${usuario.email}. Revisa tu bandeja de entrada o carpeta de spam.`,
      email: usuario.email,
      nombreCompleto: usuario.nombreCompleto,
    };
  }

  /**
   * Restablece la contraseña validando el token y su vigencia temporal
   */
  async restablecerPassword(dto: RestablecerPasswordDto) {
    const ahora = new Date();

    // 1. Buscar usuario con token activo no expirado
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpira: {
          gt: ahora,
        },
      },
    });

    if (!usuario) {
      throw new BadRequestException(
        "El enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo desde la pantalla de login.",
      );
    }

    // 2. Hashear nueva contraseña con bcrypt
    const nuevoHash = await bcrypt.hash(dto.nuevaPassword, 10);

    // 3. Actualizar contraseña, limpiar token e invalidar bloqueos
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        passwordHash: nuevoHash,
        resetToken: null,
        resetTokenExpira: null,
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    });

    this.logger.log(
      `🔑 Contraseña restablecida exitosamente para usuario: ${usuario.email}`,
    );

    return {
      mensaje:
        "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.",
    };
  }

  /**
   * Registra una nueva cuenta de administradora clínica titular (FONOAUDIOLOGA)
   * Valida existencia real del correo y envía confirmación/activación vía email
   */
  async registroAdministrador(dto: RegistroAdministradorDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();

    // 1. Validar que el dominio del correo exista en internet (registros MX)
    await this.mailService.validarDominioEmail(emailNormalizado);

    // 2. Verificar si ya existe un usuario con este correo
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Si ya existe pero está inactivo, reenviar activación
    if (usuarioExistente) {
      if (usuarioExistente.estado === "ACTIVO") {
        throw new BadRequestException(
          "Ya existe una cuenta activa registrada con este correo electrónico. Por favor inicia sesión o utiliza la opción de recuperación de contraseña.",
        );
      }

      // Reenviar nuevo token de activación
      const token = crypto.randomBytes(32).toString("hex");
      const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          resetToken: token,
          resetTokenExpira: expiracion,
        },
      });

      const enlaceConfirmacion = `${frontendUrl}/confirmar-cuenta?token=${token}`;
      await this.mailService.enviarEmailConfirmacion(
        usuarioExistente.email,
        usuarioExistente.nombreCompleto,
        enlaceConfirmacion,
        RolUsuario.FONOAUDIOLOGA,
      );

      return {
        mensaje: `Ya existía un registro pendiente para este correo. Hemos reenviado un nuevo enlace de activación a ${usuarioExistente.email}.`,
        email: usuarioExistente.email,
        nombreCompleto: usuarioExistente.nombreCompleto,
      };
    }

    // 3. Hashear la contraseña con bcrypt
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. Generar token de confirmación criptográfico
    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // 5. Crear usuario en estado INACTIVO (pendiente de confirmar correo)
    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombreCompleto: dto.nombreCompleto.trim(),
        email: emailNormalizado,
        passwordHash,
        rol: RolUsuario.FONOAUDIOLOGA,
        registroRethus: dto.registroRethus?.trim() || null,
        fotoPerfilUrl: dto.fotoPerfilUrl || null,
        estado: "INACTIVO",
        resetToken: token,
        resetTokenExpira: expiracion,
      },
    });

    // 6. Enlace seguro de confirmación
    const enlaceConfirmacion = `${frontendUrl}/confirmar-cuenta?token=${token}`;

    // 7. Enviar correo de confirmación mediante MailService
    await this.mailService.enviarEmailConfirmacion(
      nuevoUsuario.email,
      nuevoUsuario.nombreCompleto,
      enlaceConfirmacion,
      RolUsuario.FONOAUDIOLOGA,
    );

    this.logger.log(
      `👩‍⚕️ Cuenta administradora registrada (pendiente confirmación): ${nuevoUsuario.email}`,
    );

    return {
      mensaje: `Hemos enviado un correo de confirmación a ${nuevoUsuario.email}. Por favor verifica tu bandeja de entrada o spam para activar tu cuenta.`,
      email: nuevoUsuario.email,
      nombreCompleto: nuevoUsuario.nombreCompleto,
    };
  }

  /**
   * Confirma y activa la cuenta del usuario validando el token enviado por correo
   */
  async confirmarCuenta(dto: ConfirmarCuentaDto) {
    const ahora = new Date();

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpira: {
          gt: ahora,
        },
      },
    });

    if (!usuario) {
      throw new BadRequestException(
        "El enlace de confirmación es inválido o ha expirado. Por favor solicita un nuevo registro o contacta a soporte.",
      );
    }

    // Activar usuario y limpiar token
    const usuarioActivo = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        estado: "ACTIVO",
        resetToken: null,
        resetTokenExpira: null,
      },
    });

    this.logger.log(
      `🎉 Cuenta activada exitosamente tras confirmar correo: ${usuarioActivo.email} (${usuarioActivo.rol})`,
    );

    return {
      mensaje: "¡Tu cuenta ha sido confirmada y activada con éxito!",
      usuario: {
        id: usuarioActivo.id,
        email: usuarioActivo.email,
        nombreCompleto: usuarioActivo.nombreCompleto,
        rol: usuarioActivo.rol,
      },
    };
  }
}
