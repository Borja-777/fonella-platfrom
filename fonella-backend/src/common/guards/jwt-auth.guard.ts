import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.["fonella_token"];

    if (!token) {
      throw new UnauthorizedException(
        "Sesión no iniciada o expirada por inactividad.",
      );
    }

    try {
      // 1. Verificamos la firma criptográfica del token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || "fonella_secret_key_2026",
      });

      // 2. Verificamos en BD que la cuenta siga en estado ACTIVO (Revocación inmediata)
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          rol: true,
          estado: true,
          nombreCompleto: true,
          fotoPerfilUrl: true,
        },
      });

      if (!usuario || usuario.estado !== "ACTIVO") {
        throw new UnauthorizedException(
          "Tu cuenta ha sido desactivada o no existe. Contacta a la administradora.",
        );
      }

      // Adjuntamos el usuario autenticado a la petición
      request.user = usuario;
      request.usuario = usuario;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Token de sesión inválido o expirado.");
    }
  }
}
