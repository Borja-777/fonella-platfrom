import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { Response } from "express";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Valida credenciales, controla fuerza bruta (5 intentos) y verifica estado ACTIVO
   */
  async validarUsuario(email: string, contrasenaPlana: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
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
          statusCode: 423, // Código HTTP 423
          message: `Cuenta bloqueada temporalmente por seguridad. Intenta nuevamente en ${minutosRestantes} minuto(s).`,
          error: "Locked",
        },
        423,
      );
    }

    // 3. ¿La cuenta está inactiva? (Soft Delete de HU-02)
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
      // Si llega a 5 intentos fallidos, bloqueamos por 15 minutos
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
      // Si aún no llega a 5, sumamos 1 al contador
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
    // Retornamos el usuario seguro (sin exponer el hash de la contraseña)
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

    // Emisión de Cookie HttpOnly segura (DoD de HU-01)
    res.cookie("fonella_token", token, {
      httpOnly: true, // Inmune a robo por JavaScript malicioso (XSS)
      secure: process.env.NODE_ENV === "production", // HTTPS en producción
      sameSite: "strict", // Mitiga CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 horas de vigencia
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
}
