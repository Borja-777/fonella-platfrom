import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearPacienteDto } from './dto/crear-paciente.dto';

@Injectable()
export class PacientesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(busqueda?: string) {
    return this.prisma.paciente.findMany({
      where: busqueda
        ? {
            OR: [
              { numeroDocumento: { contains: busqueda, mode: 'insensitive' } },
              { nombres: { contains: busqueda, mode: 'insensitive' } },
              { apellidos: { contains: busqueda, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        historiaClinica: {
          select: {
            id: true,
            numeroExpediente: true,
            estado: true,
            diagnosticoCie10Codigo: true,
            diagnosticoCie10Desc: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerPorId(id: string) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id },
      include: {
        historiaClinica: true,
        acudientes: { include: { acudiente: true } },
      },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return paciente;
  }

  async crear(dto: CrearPacienteDto) {
    const existe = await this.prisma.paciente.findUnique({
      where: { numeroDocumento: dto.numeroDocumento },
    });
    if (existe) {
      throw new ConflictException('Ya existe un paciente registrado con ese número de documento');
    }

    return this.prisma.paciente.create({
      data: {
        ...dto,
        fechaNacimiento: new Date(dto.fechaNacimiento),
      },
    });
  }
}
