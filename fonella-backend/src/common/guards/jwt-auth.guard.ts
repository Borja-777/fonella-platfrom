import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['fonella_token'];

    if (!token) {
      throw new UnauthorizedException('Sesión no iniciada o expirada por inactividad (HU-01 / HU-04).');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request['usuario'] = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token de sesión inválido o expirado.');
    }
  }
}
