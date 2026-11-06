import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CrearSolicitudPublicaDto } from './dto/crear-solicitud-publica.dto';

@Injectable()
export class CitasService {
  private prisma = new PrismaClient();

  async registrarSolicitudPublica(dto: CrearSolicitudPublicaDto) {
    try {
      // Intentamos acceder usando el modelo generado por Prisma
      return await (this.prisma as any).solicitudCitaPublica.create({
        data: {
          tipoPaciente: dto.tipoPaciente,
          acudiente: dto.acudiente || null,
          parentesco: dto.parentesco || null,
          paciente: dto.paciente,
          edad: dto.edad,
          servicio: dto.servicio,
          jornada: dto.jornada,
          motivo: dto.motivo || null,
          estado: 'PENDIENTE',
        },
      });
    } catch (error) {
      console.error('DETALLE DEL ERROR DE PRISMA:', error);
      throw new InternalServerErrorException(error.message || 'Error al guardar la solicitud');
    }
  }
}
