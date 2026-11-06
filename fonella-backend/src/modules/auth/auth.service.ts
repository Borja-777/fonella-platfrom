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
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import { Response } from "express";
import { SolicitarRecuperacionDto } from "./dto/solicitar-recuperacion.dto";
import { RestablecerPasswordDto } from "./dto/restablecer-password.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
   * Genera plantilla HTML corporativa de correo para recuperación de contraseña
   */
  private generarPlantillaHtml(nombre: string, enlace: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF6F0; border-radius: 20px; overflow: hidden; border: 1px solid #DF9B78; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #136A7B, #0AA896); padding: 30px 20px; text-align: center; color: white;">
          <div style="background-color: #FAF6F0; display: inline-block; padding: 6px 20px; border-radius: 14px; margin-bottom: 12px; border: 1px solid rgba(223, 155, 120, 0.4);">
            <span style="font-size: 22px; font-weight: 900; letter-spacing: 2px;">
              <span style="color: #0AA896;">F</span><span style="color: #5A96C8;">O</span><span style="color: #0AA896;">N</span><span style="color: #DF9B78;">E</span><span style="color: #0AA896;">L</span><span style="color: #5A96C8;">L</span><span style="color: #0AA896;">A</span>
            </span>
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Recuperación de Contraseña</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #EAF5F6; opacity: 0.9;">Centro Integral de Fonoaudiología</p>
        </div>
        <div style="padding: 32px 28px; background-color: #FFFFFF;">
          <p style="font-size: 15px; color: #1E293B; margin-top: 0;">Estimada/o <strong>${nombre}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta en el <strong>Portal Clínico de FONELLA</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Para definir tu nueva clave de acceso seguro, haz clic en el siguiente botón:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" target="_blank" style="background: linear-gradient(to right, #136A7B, #0AA896); color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(19, 106, 123, 0.3);">
              Restablecer mi Contraseña
            </a>
          </div>
          <div style="background-color: #FAF6F0; border-left: 4px solid #DF9B78; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
              ⏱️ <strong>Seguridad Clínica:</strong> Este enlace es de un solo uso y expirará automáticamente en <strong>15 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
            </p>
          </div>
        </div>
        <div style="background-color: #F5ECDD; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          © 2026 FONELLA • Centro Integral de Fonoaudiología • Portal Clínico Seguro
        </div>
      </div>
    `;
  }

  /**
   * Envía el correo de recuperación utilizando Nodemailer (SMTP / Gmail)
   */
  private async enviarEmailRecuperacion(
    destinatario: string,
    nombre: string,
    enlace: string,
  ): Promise<void> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      this.logger.error(
        "❌ [Nodemailer] Credenciales SMTP no configuradas en el archivo .env (SMTP_USER, SMTP_PASS no definidos).",
      );
      throw new HttpException(
        "El servicio de envío de correos no está configurado en el servidor (faltan credenciales SMTP en el archivo .env).",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const plantillaHtml = this.generarPlantillaHtml(nombre, enlace);

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"FONELLA Portal Clínico" <${smtpUser}>`,
        to: destinatario,
        subject: "Recuperación de Contraseña - FONELLA Portal Clínico",
        html: plantillaHtml,
      });

      this.logger.log(
        `✅ [Nodemailer] Correo de recuperación enviado con éxito a: ${destinatario}`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ [Nodemailer] Error al despachar correo a ${destinatario}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error al enviar el correo de recuperación: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Solicita la recuperación de contraseña generando un token seguro
   */
  async solicitarRecuperacion(dto: SolicitarRecuperacionDto) {
    const emailNormalizado = dto.email.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    // Validar si el usuario existe en el sistema
    if (!usuario) {
      throw new NotFoundException(
        "El correo electrónico no se encuentra registrado en el sistema.",
      );
    }

    // 1. Generar token criptográfico único
    const token = crypto.randomBytes(32).toString("hex");
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // 2. Almacenar token en base de datos
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        resetToken: token,
        resetTokenExpira: expiracion,
      },
    });

    // 3. Crear enlace de restablecimiento
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const enlaceRecuperacion = `${frontendUrl}/restablecer-password?token=${token}`;

    // 4. Enviar correo real vía Nodemailer
    await this.enviarEmailRecuperacion(
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
}
