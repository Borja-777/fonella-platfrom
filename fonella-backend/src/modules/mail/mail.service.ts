import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import * as nodemailer from "nodemailer";
import * as dns from "dns";
import * as net from "net";
import { RolUsuario } from "@prisma/client";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /**
   * Valida sintaxis, verifica que el dominio tenga registros MX y comprueba mediante
   * protocolo SMTP (handshake RCPT TO) si la cuenta de correo realmente existe en el servidor destinatario.
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

    let mxRecords: dns.MxRecord[] = [];

    // 1. Verificar registros MX en DNS
    try {
      const records = await Promise.race([
        dns.promises.resolveMx(dominio),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT_DNS")), 4000),
        ),
      ]);

      if (!records || records.length === 0) {
        throw new BadRequestException(
          `El dominio del correo ("@${dominio}") no cuenta con servidores de correo (registros MX) válidos para recibir mensajes.`,
        );
      }
      mxRecords = records;
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

      this.logger.warn(`Advertencia al verificar MX de ${dominio}: ${error.message}`);
      return;
    }

    // 2. Verificación directa de existencia del buzón vía SMTP (RCPT TO)
    mxRecords.sort((a, b) => a.priority - b.priority);
    const mxHost = mxRecords[0].exchange;

    try {
      await this.verificarBuzonDirectoSmtp(emailLimpio, dominio, mxHost);
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`SMTP handshake no concluyente para ${emailLimpio}: ${error.message}`);
    }
  }

  /**
   * Conecta con el servidor MX en el puerto 25 y ejecuta handshake SMTP para validar la existencia de la casilla
   */
  private verificarBuzonDirectoSmtp(
    email: string,
    dominio: string,
    mxHost: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection(25, mxHost);
      let paso = 0;
      let finalizado = false;

      socket.setEncoding("utf-8");
      socket.setTimeout(4500);

      const terminar = (err?: any) => {
        if (!finalizado) {
          finalizado = true;
          try {
            socket.write("QUIT\r\n");
            socket.end();
          } catch (_) {}
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      };

      socket.on("data", (data: string) => {
        const respuesta = data.trim();
        const codigo = respuesta.slice(0, 3);

        if (paso === 0 && (codigo === "220" || respuesta.startsWith("220"))) {
          paso = 1;
          socket.write("HELO fonella.co\r\n");
        } else if (paso === 1 && (codigo === "250" || respuesta.startsWith("250"))) {
          paso = 2;
          socket.write("MAIL FROM:<soporte@fonella.co>\r\n");
        } else if (paso === 2 && (codigo === "250" || respuesta.startsWith("250"))) {
          paso = 3;
          socket.write(`RCPT TO:<${email}>\r\n`);
        } else if (paso === 3) {
          // Evaluar respuesta al destinatario (RCPT TO)
          if (codigo === "250" || respuesta.startsWith("250")) {
            this.logger.log(`✅ Casilla validada con éxito en ${mxHost}: ${email}`);
            terminar();
          } else {
            // Cualquier respuesta distinta de 250 (550 inexistente, 452 buzón lleno, etc.) indica que no puede recibir correos
            this.logger.warn(`❌ Casilla no apta o rechazada por servidor ${mxHost}: ${respuesta}`);
            let mensajeError = `El correo electrónico "${email}" no existe o no ha sido creado en el servidor de correo (${dominio}).`;

            if (
              respuesta.includes("452") ||
              respuesta.toLowerCase().includes("storage space") ||
              respuesta.toLowerCase().includes("quota")
            ) {
              mensajeError = `El correo electrónico "${email}" no puede recibir mensajes (su buzón de entrada no tiene espacio de almacenamiento disponible o no es válido).`;
            } else if (
              respuesta.includes("550") ||
              respuesta.includes("NoSuchUser") ||
              respuesta.toLowerCase().includes("does not exist") ||
              respuesta.toLowerCase().includes("user unknown")
            ) {
              mensajeError = `El correo electrónico "${email}" no existe en ${dominio}. Por favor verifica que esté bien escrito.`;
            }

            terminar(new BadRequestException(mensajeError));
          }
        }
      });

      socket.on("error", (err) => {
        this.logger.warn(`Error de socket en verificación SMTP para ${email}: ${err.message}`);
        terminar(); // Fallback silencioso si el puerto 25 está restringido
      });

      socket.on("timeout", () => {
        this.logger.warn(`Timeout en verificación SMTP para ${email}`);
        socket.destroy();
        terminar();
      });
    });
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
