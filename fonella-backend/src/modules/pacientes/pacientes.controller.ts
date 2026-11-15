import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PacientesService } from './pacientes.service';
import { CrearPacienteDto } from './dto/crear-paciente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  @Roles(RolUsuario.FONOAUDIOLOGA, RolUsuario.ASISTENTE)
  listar(@Query('q') q?: string) {
    return this.pacientesService.listar(q);
  }

  @Get(':id')
  @Roles(RolUsuario.FONOAUDIOLOGA, RolUsuario.ASISTENTE)
  obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.obtenerPorId(id);
  }

  @Post()
  @Roles(RolUsuario.FONOAUDIOLOGA, RolUsuario.ASISTENTE)
  crear(@Body() dto: CrearPacienteDto) {
    return this.pacientesService.crear(dto);
  }
}
