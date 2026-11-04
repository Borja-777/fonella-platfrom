import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RolUsuario } from "@prisma/client";
import { UsuariosService } from "./usuarios.service";
import { CrearPersonalDto } from "./dto/crear-personal.dto";
import { ActualizarEstadoDto } from "./dto/actualizar-estado.dto";
import { ActualizarPersonalDto } from "./dto/actualizar-personal.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("usuarios")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Endpoint para registrar personal (asistente o fonoaudióloga)
   * Ruta: POST /api/v1/usuarios/personal
   * Acceso: Solo FONOAUDIOLOGA
   */
  @Post("personal")
  @HttpCode(HttpStatus.CREATED)
  crearPersonal(@Body() dto: CrearPersonalDto) {
    return this.usuariosService.crearPersonal(dto);
  }

  /**
   * Endpoint para listar todo el personal clínico y administrativo
   * Ruta: GET /api/v1/usuarios/personal
   * Acceso: Solo FONOAUDIOLOGA
   */
  @Get("personal")
  listarPersonal() {
    return this.usuariosService.listarPersonal();
  }

  /**
   * Endpoint para actualizar datos del personal y foto de perfil
   * Ruta: PATCH /api/v1/usuarios/personal/:id
   * Acceso: Solo FONOAUDIOLOGA
   */
  @Patch("personal/:id")
  actualizarPersonal(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ActualizarPersonalDto,
  ) {
    return this.usuariosService.actualizarPersonal(id, dto);
  }

  /**
   * Endpoint para activar o desactivar una cuenta (Soft-delete)
   * Ruta: PATCH /api/v1/usuarios/personal/:id/estado
   * Acceso: Solo FONOAUDIOLOGA
   */
  @Patch("personal/:id/estado")
  cambiarEstado(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ActualizarEstadoDto,
  ) {
    return this.usuariosService.cambiarEstado(id, dto);
  }
}
