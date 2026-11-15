import {
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
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { HistoriasClinicasService } from './historias-clinicas.service';
import { CrearHistoriaClinicaDto } from './dto/crear-historia-clinica.dto';
import { ActualizarHistoriaClinicaDto } from './dto/actualizar-historia-clinica.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller(['historias-clinicas', 'historias'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA)
export class HistoriasClinicasController {
  constructor(
    private readonly historiasClinicasService: HistoriasClinicasService,
  ) {}

  @Get()
  listarTodas(@Query('q') q?: string) {
    return this.historiasClinicasService.listarTodas(q);
  }

  @Get('paciente/:pacienteId')
  obtenerPorPaciente(@Param('pacienteId', ParseUUIDPipe) pacienteId: string) {
    return this.historiasClinicasService.obtenerPorPaciente(pacienteId);
  }

  @Get(':id')
  obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.historiasClinicasService.obtenerPorId(id);
  }

  @Post()
  crear(@Req() req: any, @Body() dto: CrearHistoriaClinicaDto) {
    const usuarioId = req.user.id || req.user.sub;
    return this.historiasClinicasService.crear(usuarioId, dto);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarHistoriaClinicaDto,
  ) {
    return this.historiasClinicasService.actualizar(id, dto);
  }
}
