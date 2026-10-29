import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { usuario } = context.switchToHttp().getRequest();
    if (!usuario || !requiredRoles.includes(usuario.rol)) {
      throw new ForbiddenException(
        'Acceso denegado: Su rol no tiene permisos para acceder a este módulo clínico o administrativo (HU-03 / RN-05).',
      );
    }
    return true;
  }
}
