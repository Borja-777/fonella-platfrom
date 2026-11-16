import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { RolUsuario } from "@prisma/client";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import {
  ActualizarPacienteDto,
  CrearPacienteDto,
} from "./dto/crear-paciente.dto";
import { PacientesService } from "./pacientes.service";

/**
 * Controlador del módulo de pacientes (/api/v1/pacientes).
 * Permite a la fonoaudióloga y a la asistente buscar y registrar pacientes y acudientes.
 */
@Controller("pacientes")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA, RolUsuario.ASISTENTE)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /** GET /api/v1/pacientes?q=... — Búsqueda predictiva por nombre, apellido o documento. */
  @Get()
  buscar(@Query("q") q?: string) {
    return this.pacientesService.buscar(q);
  }

  /** GET /api/v1/pacientes/acudiente/:numeroDocumento — Consulta un acudiente para reutilizarlo. */
  @Get("acudiente/:numeroDocumento")
  buscarAcudiente(@Param("numeroDocumento") numeroDocumento: string) {
    return this.pacientesService.buscarAcudientePorDocumento(numeroDocumento);
  }

  /** POST /api/v1/pacientes — Registra un paciente nuevo y su acudiente si aplica. */
  @Post()
  crear(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crear(dto);
  }

  /** PATCH /api/v1/pacientes/:id — Actualiza datos de un paciente y su acudiente. */
  @Patch(":id")
  actualizar(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: ActualizarPacienteDto,
  ) {
    return this.pacientesService.actualizar(id, dto);
  }
}
