import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint oficial de Login (HU-01)
   * Ruta: POST /api/v1/auth/login
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    // 1. Validamos credenciales y bloqueos en el servicio
    const usuario = await this.authService.validarUsuario(
      loginDto.email,
      loginDto.password,
    );

    // 2. Generamos el token y emitimos la Cookie HttpOnly
    return this.authService.login(usuario, res);
  }

  /**
   * Endpoint oficial de Logout
   * Ruta: POST /api/v1/auth/logout
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: false }) res: Response) {
    return this.authService.logout(res);
  }

  /**
   * Endpoint para verificar quién está logueado en la sesión activa
   * Ruta: GET /api/v1/auth/me
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getPerfilActual(@Req() req: any) {
    return {
      usuario: req.user,
    };
  }
}
