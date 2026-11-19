import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RolUsuario } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CanalEnvioInforme,
  InformesPdfService,
  TipoInformeClinico,
} from './informes-pdf.service';

@Controller('historias')
export class InformesPdfController {
  constructor(private readonly informesPdfService: InformesPdfService) {}

  @Get('informes/pdf/:codigo')
  async descargarConCodigoTemporal(
    @Param('codigo') codigo: string,
    @Res() res: Response,
  ) {
    const { historiaId, tipo } =
      this.informesPdfService.validarCodigoTemporalDescarga(codigo);
    const { buffer, filename } = await this.informesPdfService.generarInformePdf(
      historiaId,
      tipo,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });

    res.end(buffer);
  }

  @Get('informes/:id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  async descargarInformePdf(
    @Param('id') id: string,
    @Query('tipo') tipo: TipoInformeClinico = 'VALORACION_INICIAL',
    @Query('inline') inline: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.informesPdfService.generarInformePdf(
      id,
      tipo,
    );

    const disposition = inline === 'true' ? 'inline' : 'attachment';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    });

    res.end(buffer);
  }

  @Post('informes/:id/enviar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  async enviarInforme(
    @Param('id') id: string,
    @Body() body: { canal: CanalEnvioInforme; tipo?: TipoInformeClinico },
    @Req() req: Request & { user?: { id?: string; sub?: string } },
  ) {
    const usuarioId = req.user?.id || req.user?.sub || '';
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:4000';
    const baseUrlBackend = `${protocol}://${host}`;

    return this.informesPdfService.prepararYRegistrarEnvioInforme(
      id,
      body.canal,
      body.tipo || 'VALORACION_INICIAL',
      usuarioId,
      baseUrlBackend,
    );
  }

  @Get('informes/:id/bitacora-envios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.FONOAUDIOLOGA)
  async obtenerBitacoraEnvios(@Param('id') id: string) {
    return this.informesPdfService.listarBitacoraEnvios(id);
  }
}

