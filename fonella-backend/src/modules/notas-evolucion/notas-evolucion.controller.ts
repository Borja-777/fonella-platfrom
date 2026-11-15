import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { NotasEvolucionService } from './notas-evolucion.service';
import { CrearNotaEvolucionDto } from './dto/crear-nota-evolucion.dto';
import { CrearAddendumDto } from './dto/crear-addendum.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller(['historias/:historiaId/evoluciones', 'historias-clinicas/:historiaId/evoluciones'])
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA)
export class NotasEvolucionController {
  constructor(private readonly notasEvolucionService: NotasEvolucionService) {}

  @Get()
  listarPorHistoria(@Param('historiaId', ParseUUIDPipe) historiaId: string) {
    return this.notasEvolucionService.listarPorHistoria(historiaId);
  }

  @Post()
  crear(
    @Param('historiaId', ParseUUIDPipe) historiaId: string,
    @Req() req: any,
    @Body() dto: CrearNotaEvolucionDto,
  ) {
    const usuarioId = req.user.id || req.user.sub;
    const firma = `${req.user.nombreCompleto || 'Especialista'} (${req.user.email || 'Fonoaudiología'})`;
    return this.notasEvolucionService.crear(historiaId, usuarioId, firma, dto);
  }

  @Post(':notaId/addendum')
  agregarAddendum(
    @Param('notaId', ParseUUIDPipe) notaId: string,
    @Req() req: any,
    @Body() dto: CrearAddendumDto,
  ) {
    const profesional = req.user.nombreCompleto || req.user.email || 'Especialista';
    return this.notasEvolucionService.agregarAddendum(notaId, profesional, dto);
  }
}
