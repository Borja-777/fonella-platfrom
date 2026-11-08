import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as dns from "dns";
import { RolUsuario } from "@prisma/client";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Valida sintaxis y verifica si el dominio del correo electrónico realmente existe en internet
   * mediante la resolución de registros MX (Mail Exchange) de DNS.
   */
  async validarDominioEmail(email: string): Promise<void> {
    const emailLimpio = email.trim().toLowerCase();
    const partes = emailLimpio.split("@");

    if (partes.length !== 2 || !partes[0] || !partes[1]) {
      throw new BadRequestException("El formato del correo electrónico ingresado no es válido.");
    }

    const dominio = partes[1];

    // Dominios internos o simulados permitidos para desarrollo
    const dominiosPermitidosDev = ["fonella.co", "fonella.com", "localhost"];
    if (dominiosPermitidosDev.includes(dominio)) {
      return;
    }

    try {
      // Timeout de 4 segundos para evitar que la solicitud se cuelgue si el DNS está lento
      const mxRecords = await Promise.race([
        dns.promises.resolveMx(dominio),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT_DNS")), 4000),
        ),
      ]);

      if (!mxRecords || mxRecords.length === 0) {
        throw new BadRequestException(
          `El dominio del correo ("@${dominio}") no cuenta con servidores de correo (registros MX) válidos para recibir mensajes.`,
        );
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (
        error.code === "ENOTFOUND" ||
        error.code === "ENODATA" ||
        error.code === "SERVFAIL"
      ) {
        throw new BadRequestException(
          `El correo ingresado no es válido: el dominio "@${dominio}" no existe en internet o no está habilitado para recibir correos.`,
        );
      }

      // Si es un timeout o error de red temporal, registramos advertencia pero no bloqueamos
      this.logger.warn(`Advertencia al verificar MX de ${dominio}: ${error.message}`);
    }
  }

  /**
   * Crea y retorna el transportador de correo Nodemailer
   */
  private obtenerTransporter(): nodemailer.Transporter {
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "").trim();

    if (!smtpUser || !smtpPass) {
      this.logger.error(
        "❌ [Nodemailer] Credenciales SMTP no configuradas en el archivo .env (SMTP_USER o SMTP_PASS ausentes).",
      );
      throw new HttpException(
        "El servicio de envío de correos no está configurado en el servidor.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = port === 465;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  /**
   * Envía el correo electrónico con enlace de confirmación y activación de cuenta
   */
  async enviarEmailConfirmacion(
    destinatario: string,
    nombre: string,
    enlace: string,
    rol: RolUsuario = RolUsuario.FONOAUDIOLOGA,
  ): Promise<void> {
    const transporter = this.obtenerTransporter();
    const smtpUser = process.env.SMTP_USER?.trim();

    const esFono = rol === RolUsuario.FONOAUDIOLOGA;
    const etiquetaRol = esFono
      ? "Especialista Titular y Administradora"
      : "Asistente de Recepción y Coordinación";

    const asunto = esFono
      ? "Confirma tu cuenta de Administradora - FONELLA Portal Clínico"
      : "Activa tu cuenta de Colaborador(a) - FONELLA Portal Clínico";

    const plantillaHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF6F0; border-radius: 20px; overflow: hidden; border: 1px solid #DF9B78; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #136A7B, #0AA896); padding: 30px 20px; text-align: center; color: white;">
          <div style="background-color: #FAF6F0; display: inline-block; padding: 6px 20px; border-radius: 14px; margin-bottom: 12px; border: 1px solid rgba(223, 155, 120, 0.4);">
            <span style="font-size: 22px; font-weight: 900; letter-spacing: 2px;">
              <span style="color: #0AA896;">F</span><span style="color: #5A96C8;">O</span><span style="color: #0AA896;">N</span><span style="color: #DF9B78;">E</span><span style="color: #0AA896;">L</span><span style="color: #5A96C8;">L</span><span style="color: #0AA896;">A</span>
            </span>
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Confirmación y Activación de Cuenta</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #EAF5F6; opacity: 0.9;">Centro Integral de Fonoaudiología</p>
        </div>
        <div style="padding: 32px 28px; background-color: #FFFFFF;">
          <p style="font-size: 15px; color: #1E293B; margin-top: 0;">¡Hola, <strong>${nombre}</strong>!</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Se ha creado una cuenta para ti en el <strong>Portal Clínico de FONELLA</strong> con el rol de <strong>${etiquetaRol}</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Para verificar tu dirección de correo electrónico y activar de forma segura tu acceso al sistema, por favor haz clic en el siguiente botón:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" target="_blank" style="background: linear-gradient(to right, #136A7B, #0AA896); color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(19, 106, 123, 0.3);">
              Confirmar y Activar mi Cuenta
            </a>
          </div>
          <div style="background-color: #FAF6F0; border-left: 4px solid #DF9B78; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
              🔒 <strong>Seguridad Clínica:</strong> Este enlace estará disponible durante <strong>24 horas</strong>. Una vez confirmado tu correo, tu cuenta quedará activa de inmediato para iniciar sesión.
            </p>
          </div>
          <p style="font-size: 11px; color: #94A3B8; margin-top: 20px; line-height: 1.4;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br />
            <a href="${enlace}" style="color: #0AA896; word-break: break-all;">${enlace}</a>
          </p>
        </div>
        <div style="background-color: #F5ECDD; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          © 2026 FONELLA • Centro Integral de Fonoaudiología • Portal Clínico Seguro
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"FONELLA Portal Clínico" <${smtpUser}>`,
        to: destinatario,
        subject: asunto,
        html: plantillaHtml,
      });

      this.logger.log(`✅ [Nodemailer] Correo de activación enviado con éxito a: ${destinatario}`);
    } catch (error: any) {
      this.logger.error(
        `❌ [Nodemailer] Error al despachar correo a ${destinatario}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error al enviar el correo de activación: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envía el correo de recuperación de contraseña
   */
  async enviarEmailRecuperacion(
    destinatario: string,
    nombre: string,
    enlace: string,
  ): Promise<void> {
    const transporter = this.obtenerTransporter();
    const smtpUser = process.env.SMTP_USER?.trim();

    const plantillaHtml = `
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
          <p style="font-size: 15px; color: #1E293B; margin-top: 0;">Hola, <strong>${nombre}</strong></p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta en el <strong>Portal Clínico de FONELLA</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" target="_blank" style="background: linear-gradient(to right, #136A7B, #0AA896); color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(19, 106, 123, 0.3);">
              Restablecer mi Contraseña
            </a>
          </div>
          <div style="background-color: #FAF6F0; border-left: 4px solid #DF9B78; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
              ⏱️ <strong>Seguridad Clínica:</strong> Este enlace es de un solo uso y expirará en <strong>15 minutos</strong>. Si tú no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
          </div>
        </div>
        <div style="background-color: #F5ECDD; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          © 2026 FONELLA • Centro Integral de Fonoaudiología • Portal Clínico Seguro
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"FONELLA Portal Clínico" <${smtpUser}>`,
        to: destinatario,
        subject: "Recuperación de Contraseña - FONELLA Portal Clínico",
        html: plantillaHtml,
      });

      this.logger.log(`✅ [Nodemailer] Correo de recuperación enviado con éxito a: ${destinatario}`);
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
}
