import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolUsuario } from '@prisma/client';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ArchivosAdjuntosService,
  ArchivoMulterSubido,
  MAX_ADJUNTO_BYTES,
  MIME_TYPES_PERMITIDOS,
} from './archivos-adjuntos.service';

@Controller()
export class ArchivosAdjuntosController {
  constructor(
    private readonly archivosAdjuntosService: ArchivosAdjuntosService,
  ) {}

  @Get([
    'historias/:historiaId/adjuntos',
    'historias-clinicas/:historiaId/adjuntos',
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  listarPorHistoria(
    @Param('historiaId', ParseUUIDPipe) historiaId: string,
  ) {
    return this.archivosAdjuntosService.listarPorHistoria(historiaId);
  }

  @Get('admin/pacientes/:pacienteId/adjuntos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  listarPorPacienteAdmin(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
  ) {
    return this.archivosAdjuntosService.listarPorPaciente(pacienteId);
  }

  @Post([
    'historias/:historiaId/adjuntos',
    'historias-clinicas/:historiaId/adjuntos',
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  @UseInterceptors(
    FileInterceptor('archivo', {
      limits: { fileSize: MAX_ADJUNTO_BYTES + 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!MIME_TYPES_PERMITIDOS.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              'Formato no compatible: Solo se admiten documentos en formato PDF e imágenes médicas (PNG, JPG, JPEG)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  subirAdjunto(
    @Param('historiaId', ParseUUIDPipe) historiaId: string,
    @Req() req: any,
    @UploadedFile() file: ArchivoMulterSubido,
    @Body('titulo') titulo?: string,
    @Body('fechaEstudio') fechaEstudio?: string,
  ) {
    const usuarioId = req.user?.id || req.user?.sub;
    return this.archivosAdjuntosService.subirAdjunto({
      historiaId,
      subidoPorId: usuarioId,
      file,
      titulo,
      fechaEstudio,
    });
  }

  @Get([
    'historias/adjuntos/:adjuntoId/signed-url',
    'historias-clinicas/adjuntos/:adjuntoId/signed-url',
  ])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  obtenerSignedUrl(
    @Param('adjuntoId', ParseUUIDPipe) adjuntoId: string,
    @Req() req: Request,
  ) {
    const protocol =
      (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const baseUrl = `${protocol}://${host}`;
    return this.archivosAdjuntosService.generarSignedUrl(adjuntoId, baseUrl);
  }

  @Get([
    'historias/adjuntos/signed/:token',
    'historias-clinicas/adjuntos/signed/:token',
  ])
  async descargarPorSignedUrl(
    @Param('token') token: string,
    @Query('download') download: string | undefined,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, filename } =
      await this.archivosAdjuntosService.obtenerArchivoPorSignedToken(token);

    const dispositionType = download === '1' ? 'attachment' : 'inline';

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `${dispositionType}; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    });

    res.end(buffer);
  }
}