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
      throw new BadRequestException("El formato del correo electrÃ³nico ingresado no es vÃ¡lido.");
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
          `El dominio del correo ("@${dominio}") no cuenta con servidores de correo (registros MX) vÃ¡lidos para recibir mensajes.`,
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
          `El correo ingresado no es vÃ¡lido: el dominio "@${dominio}" no existe en internet o no estÃ¡ habilitado para recibir correos.`,
        );
      }

      this.logger.warn(`Advertencia al verificar MX de ${dominio}: ${error.message}`);
      return;
    }

    // 2. VerificaciÃ³n directa de existencia del buzÃ³n vÃ­a SMTP (RCPT TO)
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
            this.logger.log(`âœ… Casilla validada con Ã©xito en ${mxHost}: ${email}`);
            terminar();
          } else {
            // Cualquier respuesta distinta de 250 (550 inexistente, 452 buzÃ³n lleno, etc.) indica que no puede recibir correos
            this.logger.warn(`âŒ Casilla no apta o rechazada por servidor ${mxHost}: ${respuesta}`);
            let mensajeError = `El correo electrÃ³nico "${email}" no existe o no ha sido creado en el servidor de correo (${dominio}).`;

            if (
              respuesta.includes("452") ||
              respuesta.toLowerCase().includes("storage space") ||
              respuesta.toLowerCase().includes("quota")
            ) {
              mensajeError = `El correo electrÃ³nico "${email}" no puede recibir mensajes (su buzÃ³n de entrada no tiene espacio de almacenamiento disponible o no es vÃ¡lido).`;
            } else if (
              respuesta.includes("550") ||
              respuesta.includes("NoSuchUser") ||
              respuesta.toLowerCase().includes("does not exist") ||
              respuesta.toLowerCase().includes("user unknown")
            ) {
              mensajeError = `El correo electrÃ³nico "${email}" no existe en ${dominio}. Por favor verifica que estÃ© bien escrito.`;
            }

            terminar(new BadRequestException(mensajeError));
          }
        }
      });

      socket.on("error", (err) => {
        this.logger.warn(`Error de socket en verificaciÃ³n SMTP para ${email}: ${err.message}`);
        terminar(); // Fallback silencioso si el puerto 25 estÃ¡ restringido
      });

      socket.on("timeout", () => {
        this.logger.warn(`Timeout en verificaciÃ³n SMTP para ${email}`);
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
        "âŒ [Nodemailer] Credenciales SMTP no configuradas en el archivo .env (SMTP_USER o SMTP_PASS ausentes).",
      );
      throw new HttpException(
        "El servicio de envÃ­o de correos no estÃ¡ configurado en el servidor.",
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
   * EnvÃ­a el correo electrÃ³nico con enlace de confirmaciÃ³n y activaciÃ³n de cuenta
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
      : "Asistente de RecepciÃ³n y CoordinaciÃ³n";

    const asunto = esFono
      ? "Confirma tu cuenta de Administradora - FONELLA Portal ClÃ­nico"
      : "Activa tu cuenta de Colaborador(a) - FONELLA Portal ClÃ­nico";

    const plantillaHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF6F0; border-radius: 20px; overflow: hidden; border: 1px solid #DF9B78; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #136A7B, #0AA896); padding: 30px 20px; text-align: center; color: white;">
          <div style="background-color: #FAF6F0; display: inline-block; padding: 6px 20px; border-radius: 14px; margin-bottom: 12px; border: 1px solid rgba(223, 155, 120, 0.4);">
            <span style="font-size: 22px; font-weight: 900; letter-spacing: 2px;">
              <span style="color: #0AA896;">F</span><span style="color: #5A96C8;">O</span><span style="color: #0AA896;">N</span><span style="color: #DF9B78;">E</span><span style="color: #0AA896;">L</span><span style="color: #5A96C8;">L</span><span style="color: #0AA896;">A</span>
            </span>
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">ConfirmaciÃ³n y ActivaciÃ³n de Cuenta</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #EAF5F6; opacity: 0.9;">Centro Integral de FonoaudiologÃ­a</p>
        </div>
        <div style="padding: 32px 28px; background-color: #FFFFFF;">
          <p style="font-size: 15px; color: #1E293B; margin-top: 0;">Â¡Hola, <strong>${nombre}</strong>!</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Se ha creado una cuenta para ti en el <strong>Portal ClÃ­nico de FONELLA</strong> con el rol de <strong>${etiquetaRol}</strong>.
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Para verificar tu direcciÃ³n de correo electrÃ³nico y activar de forma segura tu acceso al sistema, por favor haz clic en el siguiente botÃ³n:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" target="_blank" style="background: linear-gradient(to right, #136A7B, #0AA896); color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(19, 106, 123, 0.3);">
              Confirmar y Activar mi Cuenta
            </a>
          </div>
          <div style="background-color: #FAF6F0; border-left: 4px solid #DF9B78; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
              ðŸ”’ <strong>Seguridad ClÃ­nica:</strong> Este enlace estarÃ¡ disponible durante <strong>24 horas</strong>. Una vez confirmado tu correo, tu cuenta quedarÃ¡ activa de inmediato para iniciar sesiÃ³n.
            </p>
          </div>
          <p style="font-size: 11px; color: #94A3B8; margin-top: 20px; line-height: 1.4;">
            Si el botÃ³n no funciona, copia y pega el siguiente enlace en tu navegador:<br />
            <a href="${enlace}" style="color: #0AA896; word-break: break-all;">${enlace}</a>
          </p>
        </div>
        <div style="background-color: #F5ECDD; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          Â© 2026 FONELLA â€¢ Centro Integral de FonoaudiologÃ­a â€¢ Portal ClÃ­nico Seguro
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"FONELLA Portal ClÃ­nico" <${smtpUser}>`,
        to: destinatario,
        subject: asunto,
        html: plantillaHtml,
      });

      this.logger.log(`âœ… [Nodemailer] Correo de activaciÃ³n enviado con Ã©xito a: ${destinatario}`);
    } catch (error: any) {
      this.logger.error(
        `âŒ [Nodemailer] Error al despachar correo a ${destinatario}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error al enviar el correo de activaciÃ³n: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * EnvÃ­a el correo de recuperaciÃ³n de contraseÃ±a
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
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">RecuperaciÃ³n de ContraseÃ±a</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #EAF5F6; opacity: 0.9;">Centro Integral de FonoaudiologÃ­a</p>
        </div>
        <div style="padding: 32px 28px; background-color: #FFFFFF;">
          <p style="font-size: 15px; color: #1E293B; margin-top: 0;">Hola, <strong>${nombre}</strong></p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Hemos recibido una solicitud para restablecer la contraseÃ±a de acceso a tu cuenta en el <strong>Portal ClÃ­nico de FONELLA</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlace}" target="_blank" style="background: linear-gradient(to right, #136A7B, #0AA896); color: #FFFFFF; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(19, 106, 123, 0.3);">
              Restablecer mi ContraseÃ±a
            </a>
          </div>
          <div style="background-color: #FAF6F0; border-left: 4px solid #DF9B78; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
            <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
              â±ï¸ <strong>Seguridad ClÃ­nica:</strong> Este enlace es de un solo uso y expirarÃ¡ en <strong>15 minutos</strong>. Si tÃº no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
          </div>
        </div>
        <div style="background-color: #F5ECDD; padding: 16px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          Â© 2026 FONELLA â€¢ Centro Integral de FonoaudiologÃ­a â€¢ Portal ClÃ­nico Seguro
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          `"FONELLA Portal ClÃ­nico" <${smtpUser}>`,
        to: destinatario,
        subject: "RecuperaciÃ³n de ContraseÃ±a - FONELLA Portal ClÃ­nico",
        html: plantillaHtml,
      });

      this.logger.log(`âœ… [Nodemailer] Correo de recuperaciÃ³n enviado con Ã©xito a: ${destinatario}`);
    } catch (error: any) {
      this.logger.error(
        `âŒ [Nodemailer] Error al despachar correo a ${destinatario}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Error al enviar el correo de recuperaciÃ³n: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async enviarInformeClinicoPdf(params: {
    destinatario: string;
    nombrePaciente: string;
    numeroExpediente: string;
    nombreTipoInforme: string;
    diagnosticoCie10: string;
    urlDescargaTemporal: string;
    pdfBuffer: Buffer;
    pdfFilename: string;
  }): Promise<{ enviadoPorSmtp: boolean }> {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      this.logger.warn(
        `SMTP no configurado; se usará fallback mailto para ${params.destinatario}`,
      );
      return { enviadoPorSmtp: false };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const plantillaHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 16px; overflow: hidden; border: 1px solid #E5E7EB; background-color: #FFFFFF;">
        <div style="background-color: #136A7B; padding: 24px 28px; border-bottom: 4px solid #DF9B78;">
          <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; letter-spacing: 1px;">FONELLA</h1>
          <p style="margin: 4px 0 0; color: #D1FAE5; font-size: 12px;">Consultorio Especializado en Fonoaudiología Integral</p>
        </div>
        <div style="padding: 28px; color: #1F2937; line-height: 1.6; font-size: 14px;">
          <p style="margin-top: 0;">Estimada familia de <strong>${params.nombrePaciente}</strong>,</p>
          <p>Adjunto a este correo encontrará el <strong>${params.nombreTipoInforme}</strong> oficial emitido por Fonella.</p>
          <div style="background-color: #FBF8F2; border-left: 4px solid #19AF9C; padding: 14px 16px; border-radius: 8px; margin: 18px 0; font-size: 13px;">
            <div><strong>Expediente Clínico:</strong> ${params.numeroExpediente}</div>
            <div><strong>Diagnóstico CIE-10:</strong> ${params.diagnosticoCie10}</div>
            <div><strong>Archivo Adjunto:</strong> ${params.pdfFilename}</div>
          </div>
          <p style="font-size: 12.5px; color: #4B5563;">
            También puede descargarlo directamente mediante este enlace seguro (válido por 15 minutos):<br/>
            <a href="${params.urlDescargaTemporal}" style="color: #136A7B; font-weight: bold;">Descargar Informe Oficial PDF</a>
          </p>
          <p style="margin-bottom: 0; margin-top: 22px;">
            Quedo atenta a cualquier inquietud.<br/>
            Cordialmente,<br/>
            <strong style="color: #136A7B;">Dra. Bárbara Ccucho Delgado</strong><br/>
            <span style="font-size: 12px; color: #6B7280;">Fonoaudióloga Especialista • RETHUS 760014829</span>
          </p>
        </div>
        <div style="background-color: #F5ECDD; padding: 14px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #DF9B78;">
          © 2026 FONELLA • Documento Clínico Confidencial • Ley 1581 de 2012
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"FONELLA Portal Clínico" <${smtpUser}>`,
      to: params.destinatario,
      subject: `Informe Fonoaudiológico - ${params.nombrePaciente} - Fonella`,
      html: plantillaHtml,
      attachments: [
        {
          filename: params.pdfFilename,
          content: params.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    this.logger.log(
      `✅ Informe PDF (${params.pdfFilename}) enviado por correo a ${params.destinatario}`,
    );
    return { enviadoPorSmtp: true };
  }
}
