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
import { SolicitarRecuperacionDto } from "./dto/solicitar-recuperacion.dto";
import { RestablecerPasswordDto } from "./dto/restablecer-password.dto";
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
    const usuario = await this.authService.validarUsuario(
      loginDto.email,
      loginDto.password,
    );
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
   * Endpoint para solicitar restablecimiento de contraseña
   * Ruta: POST /api/v1/auth/recuperar-password
   */
  @Post("recuperar-password")
  @HttpCode(HttpStatus.OK)
  async solicitarRecuperacion(@Body() dto: SolicitarRecuperacionDto) {
    return this.authService.solicitarRecuperacion(dto);
  }

  /**
   * Endpoint para confirmar nueva contraseña con token temporal
   * Ruta: POST /api/v1/auth/restablecer-password
   */
  @Post("restablecer-password")
  @HttpCode(HttpStatus.OK)
  async restablecerPassword(@Body() dto: RestablecerPasswordDto) {
    return this.authService.restablecerPassword(dto);
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
