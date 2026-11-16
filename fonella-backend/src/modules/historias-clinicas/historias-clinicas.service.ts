import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoHistoria } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearHistoriaClinicaDto } from './dto/crear-historia-clinica.dto';
import { ActualizarHistoriaClinicaDto } from './dto/actualizar-historia-clinica.dto';

@Injectable()
export class HistoriasClinicasService {
  constructor(private readonly prisma: PrismaService) {}

  private async generarNumeroExpediente(): Promise<string> {
    const anio = new Date().getFullYear();
    const total = await this.prisma.historiaClinica.count();
    const consecutivo = String(total + 1).padStart(4, '0');
    return `HC-${anio}-${consecutivo}`;
  }

  private enriquecerHitoTrimestral<T extends { fechaApertura: Date }>(historia: T) {
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasDesdeApertura = Math.max(
      0,
      Math.floor((Date.now() - new Date(historia.fechaApertura).getTime()) / msPorDia),
    );
    return {
      ...historia,
      diasDesdeApertura,
      requiereReevaluacion: diasDesdeApertura >= 90,
    };
  }

  async listarTodas(busqueda?: string) {
    const lista = await this.prisma.historiaClinica.findMany({
      where: busqueda
        ? {
            OR: [
              { numeroExpediente: { contains: busqueda, mode: 'insensitive' } },
              { diagnosticoCie10Codigo: { contains: busqueda, mode: 'insensitive' } },
              {
                paciente: {
                  OR: [
                    { numeroDocumento: { contains: busqueda, mode: 'insensitive' } },
                    { nombres: { contains: busqueda, mode: 'insensitive' } },
                    { apellidos: { contains: busqueda, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : undefined,
      include: {
        paciente: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
        _count: {
          select: { notasEvolucion: true, archivosAnexos: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return lista.map((hc) => this.enriquecerHitoTrimestral(hc));
  }

  async obtenerPorPaciente(pacienteId: string) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { pacienteId },
      include: {
        paciente: {
          include: {
            acudientes: { include: { acudiente: true } },
          },
        },
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
        notasEvolucion: {
          orderBy: { numeroSesion: 'desc' },
        },
        archivosAnexos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!historia) {
      throw new NotFoundException('El paciente aún no tiene una historia clínica abierta');
    }

    return this.enriquecerHitoTrimestral(historia);
  }

  async obtenerPorId(id: string) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id },
      include: {
        paciente: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
        notasEvolucion: { orderBy: { numeroSesion: 'desc' } },
        archivosAnexos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    return this.enriquecerHitoTrimestral(historia);
  }

  async crear(creadoPorId: string, dto: CrearHistoriaClinicaDto) {
    const paciente = await this.prisma.paciente.findUnique({
      where: { id: dto.pacienteId },
    });
    if (!paciente) {
      throw new NotFoundException('El paciente especificado no existe');
    }

    const yaTieneHistoria = await this.prisma.historiaClinica.findUnique({
      where: { pacienteId: dto.pacienteId },
    });
    if (yaTieneHistoria) {
      throw new ConflictException(
        `Este paciente ya cuenta con la historia clínica ${yaTieneHistoria.numeroExpediente}`,
      );
    }

    const numeroExpediente = await this.generarNumeroExpediente();

    const creada = await this.prisma.historiaClinica.create({
      data: {
        numeroExpediente,
        pacienteId: dto.pacienteId,
        creadoPorId,
        motivoConsulta: dto.motivoConsulta ?? '',
        antecedentesPerinatales: dto.antecedentesPerinatales,
        evaluacionOfa: dto.evaluacionOfa ?? {},
        evaluacionHabla: dto.evaluacionHabla,
        evaluacionLenguaje: dto.evaluacionLenguaje,
        evaluacionVoz: dto.evaluacionVoz,
        diagnosticoCie10Codigo: (dto.diagnosticoCie10Codigo ?? 'PENDIENTE').toUpperCase(),
        diagnosticoCie10Desc: dto.diagnosticoCie10Desc ?? 'Evaluación en curso (Borrador)',
        planTratamiento: dto.planTratamiento ?? '',
        estado: dto.estado ?? EstadoHistoria.BORRADOR,
      },
      include: {
        paciente: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
      },
    });

    return this.enriquecerHitoTrimestral(creada);
  }

  async actualizar(id: string, dto: ActualizarHistoriaClinicaDto) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    if (historia.estado === EstadoHistoria.CERRADA) {
      throw new BadRequestException(
        'La historia clínica ya está CERRADA y firmada; por normatividad clínica (Resolución 1995 de 1999) no puede editarse.',
      );
    }

    const nuevoEstado = dto.estado ?? historia.estado;
    if (nuevoEstado === EstadoHistoria.CERRADA) {
      const motivoFinal = dto.motivoConsulta ?? historia.motivoConsulta;
      const cieCodigoFinal = dto.diagnosticoCie10Codigo ?? historia.diagnosticoCie10Codigo;
      const cieDescFinal = dto.diagnosticoCie10Desc ?? historia.diagnosticoCie10Desc;
      const planFinal = dto.planTratamiento ?? historia.planTratamiento;

      if (
        !motivoFinal?.trim() ||
        !cieCodigoFinal?.trim() ||
        cieCodigoFinal.toUpperCase() === 'PENDIENTE' ||
        !cieDescFinal?.trim() ||
        !planFinal?.trim()
      ) {
        throw new BadRequestException(
          'Para firmar y cerrar la historia clínica debes completar Motivo de Consulta, Diagnóstico CIE-10 y Plan de Tratamiento.',
        );
      }
    }

    const actualizada = await this.prisma.historiaClinica.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.diagnosticoCie10Codigo
          ? { diagnosticoCie10Codigo: dto.diagnosticoCie10Codigo.toUpperCase() }
          : {}),
      },
      include: {
        paciente: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
      },
    });

    return this.enriquecerHitoTrimestral(actualizada);
  }
}
