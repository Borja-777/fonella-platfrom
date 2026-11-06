import { Controller, Post, Body } from '@nestjs/common';
import { CitasService } from './citas.service';
import { CrearSolicitudPublicaDto } from './dto/crear-solicitud-publica.dto';

@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  @Post('solicitud-publica')
  async crearSolicitudPublica(@Body() dto: CrearSolicitudPublicaDto) {
    return await this.citasService.registrarSolicitudPublica(dto);
  }
}
