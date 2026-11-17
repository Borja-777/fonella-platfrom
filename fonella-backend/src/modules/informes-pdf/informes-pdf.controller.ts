import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { RolUsuario } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  InformesPdfService,
  TipoInformeClinico,
} from './informes-pdf.service';

@Controller('historias')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.FONOAUDIOLOGA)
export class InformesPdfController {
  constructor(private readonly informesPdfService: InformesPdfService) {}

  @Get('informes/:id/pdf')
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
}
