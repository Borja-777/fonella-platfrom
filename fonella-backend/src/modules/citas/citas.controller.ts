import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RolUsuario } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CitasService } from "./citas.service";
import {
  ActualizarEstadoCitaDto,
  CancelarCitaDto,
  CrearCitaDto,
  ReprogramarCitaDto,
} from "./dto/citas.dto";

/**
 * Controlador de agenda clínica y citas (/api/v1/citas).
 * Cubre HU - Agenda - 001 (registro), 002 (franjas 45m y receso) y 003 (cancelación/reprogramación).
 */
@Controller("citas")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA, RolUsuario.ASISTENTE)
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  /** GET /api/v1/citas/servicios — Catálogo de servicios terapéuticos activos. */
  @Get("servicios")
  listarServicios() {
    return this.citasService.listarServicios();
  }

  /** GET /api/v1/citas/disponibilidad?fecha=YYYY-MM-DD — Franjas de 45 min y receso del día. */
  @Get("disponibilidad")
  obtenerDisponibilidad(@Query("fecha") fecha?: string) {
    if (!fecha) {
      throw new BadRequestException(
        "El parámetro de consulta 'fecha' (YYYY-MM-DD) es obligatorio.",
      );
    }
    return this.citasService.obtenerDisponibilidad(fecha);
  }

  /** GET /api/v1/citas?fecha=...&desde=...&hasta=... — Lista citas por día o rango de fechas. */
  @Get()
  listarCitas(
    @Query("fecha") fecha?: string,
    @Query("desde") desde?: string,
    @Query("hasta") hasta?: string,
  ) {
    return this.citasService.listarCitas(fecha, desde, hasta);
  }

  /** POST /api/v1/citas — Agenda una nueva cita asociando al usuario autenticado como creador. */
  @Post()
  crear(@Body() dto: CrearCitaDto, @Req() req: { user: { id: string } }) {
    return this.citasService.crear(dto, req.user.id);
  }

  /** PATCH /api/v1/citas/:id/reprogramar — Cambia fecha/hora de una cita CONFIRMADA. */
  @Patch(":id/reprogramar")
  reprogramar(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ReprogramarCitaDto,
  ) {
    return this.citasService.reprogramar(id, dto);
  }

  /** PATCH /api/v1/citas/:id/cancelar — Cancela una cita aplicando regla de 24h y faltas tardías. */
  @Patch(":id/cancelar")
  cancelar(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: CancelarCitaDto,
  ) {
    return this.citasService.cancelar(id, dto);
  }

  /** PATCH /api/v1/citas/:id/estado — Marca una cita CONFIRMADA como ATENDIDA o INASISTENCIA. */
  @Patch(":id/estado")
  actualizarEstado(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ActualizarEstadoCitaDto,
  ) {
    return this.citasService.actualizarEstado(id, dto);
  }
}
