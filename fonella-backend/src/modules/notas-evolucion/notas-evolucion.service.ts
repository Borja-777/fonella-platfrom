import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearNotaEvolucionDto } from './dto/crear-nota-evolucion.dto';
import { CrearAddendumDto } from './dto/crear-addendum.dto';

@Injectable()
export class NotasEvolucionService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularHitoTrimestral(fechaApertura: Date) {
    const ahora = new Date();
    const msPorDia = 1000 * 60 * 60 * 24;
    const diasTranscurridos = Math.floor(
      (ahora.getTime() - new Date(fechaApertura).getTime()) / msPorDia,
    );
    return {
      diasDesdeApertura: Math.max(0, diasTranscurridos),
      requiereReevaluacion: diasTranscurridos >= 90,
    };
  }

  private mapearNotaFrontend(nota: any) {
    return {
      id: nota.id,
      historiaClinicaId: nota.historiaClinicaId,
      profesionalId: nota.creadoPorId,
      numeroSesion: nota.numeroSesion,
      fechaSesion: nota.fechaHoraSesion,
      objetivosTrabajados: nota.objetivoSesion,
      descripcionEvolucion: nota.desempenoObservado,
      planSiguienteSesion: nota.planCaseroTareas,
      firmaProfesionalSnapshot: nota.firmaProfesionalSnapshot,
      createdAt: nota.createdAt,
    };
  }

  async listarPorHistoria(historiaClinicaId: string) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaClinicaId },
      include: {
        paciente: true,
        creadoPor: {
          select: { id: true, nombreCompleto: true, registroRethus: true },
        },
      },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    const notas = await this.prisma.notaEvolucion.findMany({
      where: { historiaClinicaId },
      orderBy: [{ fechaHoraSesion: 'desc' }, { numeroSesion: 'desc' }],
    });

    const hito = this.calcularHitoTrimestral(historia.fechaApertura);

    return {
      historia: {
        ...historia,
        ...hito,
      },
      siguienteNumeroSesion: notas.length + 1,
      notas: notas.map((n) => this.mapearNotaFrontend(n)),
    };
  }

  async crear(
    historiaClinicaId: string,
    creadoPorId: string,
    firmaProfesionalSnapshot: string,
    dto: CrearNotaEvolucionDto,
  ) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaClinicaId },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    const totalPrevias = await this.prisma.notaEvolucion.count({
      where: { historiaClinicaId },
    });

    const numeroSesion = totalPrevias + 1;

    const creada = await this.prisma.notaEvolucion.create({
      data: {
        historiaClinicaId,
        creadoPorId,
        numeroSesion,
        fechaHoraSesion: dto.fechaSesion ? new Date(dto.fechaSesion) : new Date(),
        objetivoSesion: dto.objetivosTrabajados.trim(),
        actividadesDesarrolladas: dto.objetivosTrabajados.trim(),
        desempenoObservado: dto.descripcionEvolucion.trim(),
        planCaseroTareas: dto.planSiguienteSesion?.trim() || 'Continuar plan terapéutico vigente.',
        firmaProfesionalSnapshot,
      },
    });

    return this.mapearNotaFrontend(creada);
  }

  async agregarAddendum(
    notaId: string,
    profesionalNombre: string,
    dto: CrearAddendumDto,
  ) {
    const nota = await this.prisma.notaEvolucion.findUnique({
      where: { id: notaId },
    });

    if (!nota) {
      throw new NotFoundException('Nota de evolución no encontrada');
    }

    if (!dto.textoAddendum?.trim()) {
      throw new BadRequestException('El texto del addendum no puede estar vacío');
    }

    const marcaTemporal = new Date().toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const bloqueAddendum = `\n\n--- ADDENDUM LEGAL (${marcaTemporal} | ${profesionalNombre}) ---\n${dto.textoAddendum.trim()}`;

    const actualizada = await this.prisma.notaEvolucion.update({
      where: { id: notaId },
      data: {
        desempenoObservado: `${nota.desempenoObservado}${bloqueAddendum}`,
      },
    });

    return this.mapearNotaFrontend(actualizada);
  }
}
