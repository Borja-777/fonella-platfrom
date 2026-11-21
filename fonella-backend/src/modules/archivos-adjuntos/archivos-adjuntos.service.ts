import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export const MAX_ADJUNTO_BYTES = 10 * 1024 * 1024; // 10 MB estricto (Escenario 2)
export interface ArchivoMulterSubido {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const MIME_TYPES_PERMITIDOS = [
  'application/pdf',
  'image/png',
  'image/jpeg',
];

@Injectable()
export class ArchivosAdjuntosService {
  private readonly storageRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Almacenamiento desacoplado fuera de la raíz pública web
    this.storageRoot = path.resolve(
      process.cwd(),
      'storage',
      'adjuntos-clinicos',
    );
  }

  private getSigningSecret(): string {
    return (
      this.configService.get<string>('JWT_SECRET') ||
      'fonella-signed-url-secret-key'
    );
  }

  private validarFirmasBinarias(buffer: Buffer, mimeType: string): boolean {
    if (!buffer || buffer.length < 4) return false;
    if (mimeType === 'application/pdf') {
      // %PDF
      return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46
      );
    }
    if (mimeType === 'image/png') {
      // 89 50 4E 47
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
      );
    }
    if (mimeType === 'image/jpeg') {
      // FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    return false;
  }

  private obtenerExtensionSegura(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return '.pdf';
      case 'image/png':
        return '.png';
      case 'image/jpeg':
        return '.jpg';
      default:
        return '';
    }
  }

  /**
   * Serializa título descriptivo, fecha de estudio y nombre real del archivo en nombreOriginal
   * sin alterar la estructura relacional existente.
   */
  private serializarMetadatosNombre(
    titulo: string,
    fechaEstudio: string,
    nombreArchivo: string,
  ): string {
    const tituloLimpio = titulo.trim();
    const fechaLimpia = fechaEstudio.trim();
    return `${tituloLimpio} || ${fechaLimpia} || ${nombreArchivo}`;
  }

  private deserializarMetadatosNombre(registro: {
    id: string;
    historiaClinicaId: string;
    nombreOriginal: string;
    archivoUuid: string;
    mimeType: string;
    tamanoBytes: number;
    createdAt: Date;
    subidoPor?: { nombreCompleto: string };
  }) {
    const partes = registro.nombreOriginal.split(' || ');
    const titulo = partes[0] || registro.nombreOriginal;
    const fechaEstudio =
      partes[1] || registro.createdAt.toISOString().split('T')[0];
    const nombreArchivo = partes[2] || registro.nombreOriginal;

    return {
      id: registro.id,
      historiaClinicaId: registro.historiaClinicaId,
      titulo,
      fechaEstudio,
      nombreArchivo,
      archivoUuid: registro.archivoUuid,
      mimeType: registro.mimeType,
      tamanoBytes: registro.tamanoBytes,
      tamanoMb: Number((registro.tamanoBytes / (1024 * 1024)).toFixed(2)),
      subidoPor: registro.subidoPor?.nombreCompleto || 'Dra. Bárbara Ccucho',
      createdAt: registro.createdAt,
    };
  }

  async listarPorHistoria(historiaId: string) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaId },
      select: { id: true },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    const adjuntos = await this.prisma.archivoAdjunto.findMany({
      where: { historiaClinicaId: historiaId },
      include: {
        subidoPor: { select: { nombreCompleto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return adjuntos.map((a) => this.deserializarMetadatosNombre(a));
  }

  async listarPorPaciente(pacienteId: string) {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { pacienteId },
      select: { id: true },
    });

    if (!historia) {
      return [];
    }

    return this.listarPorHistoria(historia.id);
  }

  async subirAdjunto(params: {
    historiaId: string;
    subidoPorId: string;
    file?: ArchivoMulterSubido;
    titulo?: string;
    fechaEstudio?: string;
  }) {
    const { historiaId, subidoPorId, file, titulo, fechaEstudio } = params;

    if (!file) {
      throw new BadRequestException(
        'Debes seleccionar un archivo médico en formato PDF, PNG, JPG o JPEG.',
      );
    }

    // Validación estricta de tamaño (10 MB) - Escenario 2
    if (file.size > MAX_ADJUNTO_BYTES) {
      throw new BadRequestException(
        'El archivo supera el límite máximo permitido de 10 MB. Por favor reduzca la resolución o el tamaño del PDF o imagen antes de subirlo',
      );
    }

    // Validación estricta de MIME - Escenario 3
    if (!MIME_TYPES_PERMITIDOS.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato no compatible: Solo se admiten documentos en formato PDF e imágenes médicas (PNG, JPG, JPEG)',
      );
    }

    if (!this.validarFirmasBinarias(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        'Formato no compatible: Solo se admiten documentos en formato PDF e imágenes médicas (PNG, JPG, JPEG)',
      );
    }

    if (!titulo?.trim()) {
      throw new BadRequestException(
        'El título descriptivo del examen o estudio es obligatorio.',
      );
    }

        if (!fechaEstudio?.trim()) {
      throw new BadRequestException('La fecha del estudio es obligatoria.');
    }

    const hoyCol = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    if (fechaEstudio.trim() > hoyCol) {
      throw new BadRequestException(
        'La fecha del examen médico no puede ser posterior a la fecha actual.',
      );
    }

    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaId },
      select: {
        id: true,
        paciente: { select: { fechaNacimiento: true } },
      },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada');
    }

    if (historia.paciente?.fechaNacimiento) {
      const fechaNacStr = historia.paciente.fechaNacimiento
        .toISOString()
        .split('T')[0];
      if (fechaEstudio.trim() < fechaNacStr) {
        throw new BadRequestException(
          `La fecha del examen (${fechaEstudio.trim()}) no puede ser anterior al nacimiento del paciente (${fechaNacStr}).`,
        );
      }
    }

    // Sanitización de nombre en disco mediante UUIDv4 (DoD)
    const archivoUuid = crypto.randomUUID();
    const extension = this.obtenerExtensionSegura(file.mimetype);
    const nombreFisico = `${archivoUuid}${extension}`;
    const carpetaHistoria = path.join(this.storageRoot, historiaId);
    const storageKey = path.join(historiaId, nombreFisico);
    const rutaAbsoluta = path.join(this.storageRoot, storageKey);

    await fs.mkdir(carpetaHistoria, { recursive: true });
    await fs.writeFile(rutaAbsoluta, file.buffer);

    const nombreSanitizadoOriginal = path.basename(file.originalname || nombreFisico);
    const metadataNombre = this.serializarMetadatosNombre(
      titulo,
      fechaEstudio,
      nombreSanitizadoOriginal,
    );

    const creado = await this.prisma.archivoAdjunto.create({
      data: {
        historiaClinicaId: historiaId,
        subidoPorId,
        nombreOriginal: metadataNombre,
        archivoUuid,
        storageKey,
        mimeType: file.mimetype,
        tamanoBytes: file.size,
      },
      include: {
        subidoPor: { select: { nombreCompleto: true } },
      },
    });

    return this.deserializarMetadatosNombre(creado);
  }

  /**
   * Genera una Signed URL efímera con vigencia estricta de 300 segundos (5 minutos) - Escenario 4 & DoD
   */
  async generarSignedUrl(adjuntoId: string, baseUrlBackend: string) {
    const adjunto = await this.prisma.archivoAdjunto.findUnique({
      where: { id: adjuntoId },
    });

    if (!adjunto) {
      throw new NotFoundException('Archivo médico adjunto no encontrado');
    }

    const expiresIn = 300; // 5 minutos exactos
    const exp = Math.floor(Date.now() / 1000) + expiresIn;
    const payload = JSON.stringify({
      id: adjunto.id,
      uuid: adjunto.archivoUuid,
      exp,
    });
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const firma = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(payloadB64)
      .digest('base64url');

    const token = `${payloadB64}.${firma}`;
    const cleanBase = baseUrlBackend.replace(/\/$/, '');
    const signedUrl = `${cleanBase}/api/v1/historias/adjuntos/signed/${token}`;

    return {
      signedUrl,
      expiresIn,
      expiraEn: new Date(exp * 1000).toISOString(),
      mimeType: adjunto.mimeType,
      meta: this.deserializarMetadatosNombre(adjunto),
    };
  }

  async obtenerArchivoPorSignedToken(token: string) {
    const partes = (token || '').split('.');
    if (partes.length !== 2) {
      throw new UnauthorizedException('Enlace temporal inválido o alterado.');
    }

    const [payloadB64, firmaRecibida] = partes;
    const firmaEsperada = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(payloadB64)
      .digest('base64url');

    const bufRecibida = Buffer.from(firmaRecibida);
    const bufEsperada = Buffer.from(firmaEsperada);
    if (
      bufRecibida.length !== bufEsperada.length ||
      !crypto.timingSafeEqual(bufRecibida, bufEsperada)
    ) {
      throw new UnauthorizedException('Firma de seguridad del enlace inválida.');
    }

    let decoded: { id: string; uuid: string; exp: number };
    try {
      decoded = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString('utf8'),
      );
    } catch {
      throw new UnauthorizedException('Token de enlace corrupto.');
    }

    const ahoraSeg = Math.floor(Date.now() / 1000);
    if (!decoded.exp || ahoraSeg > decoded.exp) {
      throw new ForbiddenException(
        'El enlace temporal de acceso (5 minutos) ha expirado. Genere una nueva vista previa.',
      );
    }

    const adjunto = await this.prisma.archivoAdjunto.findUnique({
      where: { id: decoded.id },
    });

    if (!adjunto || adjunto.archivoUuid !== decoded.uuid) {
      throw new NotFoundException('El archivo solicitado ya no existe.');
    }

    const rutaAbsoluta = path.resolve(this.storageRoot, adjunto.storageKey);
    if (!rutaAbsoluta.startsWith(this.storageRoot)) {
      throw new ForbiddenException('Ruta de almacenamiento no autorizada.');
    }

    let buffer: Buffer;
    try {
      buffer = await fs.readFile(rutaAbsoluta);
    } catch {
      throw new NotFoundException(
        'El archivo binario no se encontró en el almacenamiento seguro.',
      );
    }

    const meta = this.deserializarMetadatosNombre(adjunto);
    return {
      buffer,
      mimeType: adjunto.mimeType,
      filename: meta.nombreArchivo,
    };
  }
}