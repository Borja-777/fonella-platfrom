import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { RolUsuario } from "@prisma/client";
import { InventarioService } from "./inventario.service";
import { CrearJugueteDto } from "./dto/crear-juguete.dto";
import { ActualizarJugueteDto } from "./dto/actualizar-juguete.dto";
import { RegistrarVentaDto } from "./dto/registrar-venta.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("inventario")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Endpoint para listar inventario de juguetes
   * Ruta: GET /api/v1/inventario/juguetes
   * Acceso: FONOAUDIOLOGA y ASISTENTE (con filtrado RBAC de columnas financieras)
   */
  @Get("juguetes")
  listarJuguetes(@Req() req: any) {
    const rolUsuario: RolUsuario = req.usuario.rol;
    return this.inventarioService.listarJuguetes(rolUsuario);
  }

  /**
   * Endpoint para listar historial de ventas de juguetes
   * Ruta: GET /api/v1/inventario/ventas
   * Acceso: FONOAUDIOLOGA y ASISTENTE
   */
  @Get("ventas")
  listarVentas(@Req() req: any) {
    const rolUsuario: RolUsuario = req.usuario.rol;
    return this.inventarioService.listarVentas(rolUsuario);
  }

  /**
   * Endpoint para registrar nuevo juguete didáctico con cálculo de margen
   * Ruta: POST /api/v1/inventario/juguetes
   * Acceso: Exclusivo FONOAUDIOLOGA
   */
  @Post("juguetes")
  @Roles(RolUsuario.FONOAUDIOLOGA)
  @HttpCode(HttpStatus.CREATED)
  crearJuguete(@Body() dto: CrearJugueteDto, @Req() req: any) {
    return this.inventarioService.crearJuguete(dto, req.usuario.id);
  }

  /**
   * Endpoint para registrar venta directa de un juguete
   * Ruta: POST /api/v1/inventario/juguetes/:id/venta
   * Acceso: FONOAUDIOLOGA y ASISTENTE
   */
  @Post("juguetes/:id/venta")
  @HttpCode(HttpStatus.OK)
  registrarVenta(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: RegistrarVentaDto,
    @Req() req: any,
  ) {
    return this.inventarioService.registrarVenta(id, dto, req.usuario.id);
  }

  /**
   * Endpoint para actualizar datos o precios de un juguete
   * Ruta: PATCH /api/v1/inventario/juguetes/:id
   * Acceso: Exclusivo FONOAUDIOLOGA
   */
  @Patch("juguetes/:id")
  @Roles(RolUsuario.FONOAUDIOLOGA)
  actualizarJuguete(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ActualizarJugueteDto,
  ) {
    return this.inventarioService.actualizarJuguete(id, dto);
  }

  /**
   * Endpoint para eliminar un juguete (Soft Delete)
   * Ruta: DELETE /api/v1/inventario/juguetes/:id
   * Acceso: Exclusivo FONOAUDIOLOGA
   */
  @Delete("juguetes/:id")
  @Roles(RolUsuario.FONOAUDIOLOGA)
  eliminarJuguete(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.inventarioService.eliminarJuguete(id);
  }
}
