import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
const PDFDocument = require('pdfkit');
import { PrismaService } from '../../prisma/prisma.service';

export type TipoInformeClinico =
  | 'VALORACION_INICIAL'
  | 'PROGRESO_TRIMESTRAL'
  | 'ALTA';

@Injectable()
export class InformesPdfService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularEdadTexto(fechaNacimiento: Date): string {
    const hoy = new Date();
    let anios = hoy.getFullYear() - fechaNacimiento.getFullYear();
    let meses = hoy.getMonth() - fechaNacimiento.getMonth();
    if (hoy.getDate() < fechaNacimiento.getDate()) meses--;
    if (meses < 0) {
      anios--;
      meses += 12;
    }
    if (anios < 1) return `${Math.max(meses, 0)} meses`;
    return meses > 0 ? `${anios} años, ${meses} meses` : `${anios} años`;
  }

  private sanitizarNombreArchivo(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  async generarInformePdf(
    historiaId: string,
    tipo: TipoInformeClinico = 'VALORACION_INICIAL',
  ): Promise<{ buffer: Buffer; filename: string }> {
    const historia = await this.prisma.historiaClinica.findUnique({
      where: { id: historiaId },
      include: {
        paciente: true,
        creadoPor: {
          select: {
            nombreCompleto: true,
            registroRethus: true,
          },
        },
        notasEvolucion: {
          orderBy: { numeroSesion: 'asc' },
        },
      },
    });

    if (!historia) {
      throw new NotFoundException('Historia clínica no encontrada.');
    }

    // Escenario 3: Bloqueo de generación si no hay diagnóstico clínico registrado
    if (
      !historia.diagnosticoCie10Codigo?.trim() ||
      !historia.diagnosticoCie10Desc?.trim()
    ) {
      throw new BadRequestException(
        'No es posible generar el informe: El paciente no cuenta con diagnóstico clínico registrado',
      );
    }

    const tituloTipoMap: Record<TipoInformeClinico, string> = {
      VALORACION_INICIAL: 'INFORME DE VALORACIÓN FONOAUDIOLÓGICA INICIAL',
      PROGRESO_TRIMESTRAL: 'INFORME DE PROGRESO TERAPÉUTICO TRIMESTRAL (RN-05)',
      ALTA: 'INFORME CLÍNICO DE ALTA FONOAUDIOLÓGICA',
    };
    const tituloInforme =
      tituloTipoMap[tipo] || tituloTipoMap.VALORACION_INICIAL;

    const fechaHoy = new Date();
    const fechaIso = fechaHoy.toISOString().split('T')[0];
    const apellidoLimpio = this.sanitizarNombreArchivo(
      historia.paciente.apellidos,
    );
    const nombreLimpio = this.sanitizarNombreArchivo(historia.paciente.nombres);
    const filename = `Informe_Fonella_${apellidoLimpio}_${nombreLimpio}_${fechaIso}.pdf`;

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 45, bottom: 55, left: 50, right: 50 },
        info: {
          Title: `${tituloInforme} - ${historia.paciente.nombres} ${historia.paciente.apellidos}`,
          Author: 'Dra. Bárbara Ccucho Delgado - Fonella',
          Subject: 'Informe Clínico Fonoaudiológico Oficial',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Paleta Oficial Fonella
      const PETROLEO = '#136A7B';
      const TURQUESA = '#19AF9C';
      const TERRACOTA = '#DF9B78';
      const CREMA = '#FBF8F2';
      const TEXTO = '#1F2937';
      const GRIS = '#4B5563';

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;

      // 1. MEMBRETE OFICIAL FONELLA
      doc.rect(0, 0, pageWidth, 92).fill(PETROLEO);
      doc.rect(0, 92, pageWidth, 5).fill(TERRACOTA);

      // Isotipo geométrico vectorial Fonella
      doc.circle(74, 46, 22).fill(TURQUESA);
      doc.circle(74, 46, 13).fill(CREMA);
      doc
        .fillColor(PETROLEO)
        .font('Helvetica-Bold')
        .fontSize(15)
        .text('F', 69, 39, { lineBreak: false });

      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('FONELLA', 108, 26);

      doc
        .fillColor('#D1FAE5')
        .font('Helvetica')
        .fontSize(9.5)
        .text('Consultorio Especializado en Fonoaudiología Integral', 108, 50);

      doc
        .fillColor('#F3F4F6')
        .fontSize(8.5)
        .text(
          `Expediente: ${historia.numeroExpediente}  •  Emisión: ${fechaHoy.toLocaleDateString('es-CO')}`,
          108,
          65,
        );

      doc.y = 114;

      // Banda de Título del Informe
      doc.roundedRect(50, doc.y, contentWidth, 28, 5).fill(CREMA);
      doc
        .roundedRect(50, doc.y, contentWidth, 28, 5)
        .lineWidth(1)
        .stroke(TERRACOTA);

      doc
        .fillColor(PETROLEO)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(tituloInforme, 50, doc.y + 8, {
          width: contentWidth,
          align: 'center',
        });

      doc.y += 40;

      const dibujarEncabezadoSeccion = (titulo: string) => {
        if (doc.y > 670) doc.addPage();
        doc.moveDown(0.3);
        const yActual = doc.y;
        doc.rect(50, yActual, 4, 15).fill(TURQUESA);
        doc
          .fillColor(PETROLEO)
          .font('Helvetica-Bold')
          .fontSize(11)
          .text(titulo, 60, yActual + 1);
        doc
          .moveTo(50, yActual + 18)
          .lineTo(50 + contentWidth, yActual + 18)
          .lineWidth(0.6)
          .stroke('#D1D5DB');
        doc.y = yActual + 24;
      };

      // 2. IDENTIFICACIÓN DEL PACIENTE Y ACUDIENTE
      dibujarEncabezadoSeccion('1. IDENTIFICACIÓN DEL PACIENTE Y ACUDIENTE');

      const edadTexto = this.calcularEdadTexto(
        new Date(historia.paciente.fechaNacimiento),
      );
      const fechaNacStr = new Date(
        historia.paciente.fechaNacimiento,
      ).toLocaleDateString('es-CO');

      const yDatos = doc.y;
      doc.roundedRect(50, yDatos, contentWidth, 74, 4).fill(CREMA);

      doc.fillColor(TEXTO).fontSize(9.5);
      doc
        .font('Helvetica-Bold')
        .text('Paciente: ', 62, yDatos + 10, { continued: true })
        .font('Helvetica')
        .text(
          `${historia.paciente.nombres} ${historia.paciente.apellidos}`,
        );

      doc
        .font('Helvetica-Bold')
        .text('Documento: ', 62, yDatos + 26, { continued: true })
        .font('Helvetica')
        .text(
          `${historia.paciente.tipoDocumento} ${historia.paciente.numeroDocumento}`,
        );

      doc
        .font('Helvetica-Bold')
        .text('Fecha Nacimiento / Edad: ', 62, yDatos + 42, { continued: true })
        .font('Helvetica')
        .text(`${fechaNacStr} (${edadTexto})`);

      doc
        .font('Helvetica-Bold')
        .text('Contacto / Ciudad: ', 62, yDatos + 58, { continued: true })
        .font('Helvetica')
        .text(
          `${historia.paciente.telefonoContacto}${historia.paciente.ciudad ? ' • ' + historia.paciente.ciudad : ''}`,
        );

      doc
        .font('Helvetica-Bold')
        .text('Remisión: ', 330, yDatos + 10, { continued: true })
        .font('Helvetica')
        .text(historia.paciente.tipoRemision.replace('_', ' '));

      if (historia.paciente.institucionRemitente) {
        doc
          .font('Helvetica-Bold')
          .text('Entidad / Acudiente: ', 330, yDatos + 26, { continued: true })
          .font('Helvetica')
          .text(historia.paciente.institucionRemitente);
      }

      doc
        .font('Helvetica-Bold')
        .text('Fecha Valoración Inicial: ', 330, yDatos + 42, {
          continued: true,
        })
        .font('Helvetica')
        .text(new Date(historia.fechaApertura).toLocaleDateString('es-CO'));

      doc
        .font('Helvetica-Bold')
        .text('Sesiones Registradas: ', 330, yDatos + 58, { continued: true })
        .font('Helvetica')
        .text(`${historia.notasEvolucion.length} sesiones`);

      doc.y = yDatos + 84;

      // 3. MOTIVO DE CONSULTA Y VALORACIÓN CLÍNICA
      dibujarEncabezadoSeccion('2. MOTIVO DE CONSULTA Y VALORACIÓN CLÍNICA');

      doc
        .fillColor(TEXTO)
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text('Motivo de consulta:');
      doc
        .font('Helvetica')
        .fillColor(GRIS)
        .text(historia.motivoConsulta, { align: 'justify' });
      doc.moveDown(0.5);

      if (historia.antecedentesPerinatales) {
        doc
          .fillColor(TEXTO)
          .font('Helvetica-Bold')
          .text('Antecedentes relevantes:');
        doc
          .font('Helvetica')
          .fillColor(GRIS)
          .text(historia.antecedentesPerinatales, { align: 'justify' });
        doc.moveDown(0.5);
      }

      const ofa = (historia.evaluacionOfa as Record<string, string>) || {};
      const resumenOfa = [
        ofa.labios ? `Labios: ${ofa.labios}` : null,
        ofa.lengua ? `Lengua: ${ofa.lengua}` : null,
        ofa.paladar ? `Paladar: ${ofa.paladar}` : null,
        ofa.dientesOclusion ? `Oclusión: ${ofa.dientesOclusion}` : null,
        ofa.respiracion ? `Respiración: ${ofa.respiracion}` : null,
        ofa.deglucion ? `Deglución: ${ofa.deglucion}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      if (resumenOfa) {
        doc
          .fillColor(TEXTO)
          .font('Helvetica-Bold')
          .text('Evaluación de Órganos Fonoarticulatorios (OFA):');
        doc
          .font('Helvetica')
          .fillColor(GRIS)
          .text(resumenOfa, { align: 'justify' });
        doc.moveDown(0.5);
      }

      const procesos = [
        historia.evaluacionHabla ? `Habla: ${historia.evaluacionHabla}` : null,
        historia.evaluacionLenguaje
          ? `Lenguaje: ${historia.evaluacionLenguaje}`
          : null,
        historia.evaluacionVoz ? `Voz: ${historia.evaluacionVoz}` : null,
      ].filter(Boolean);

      if (procesos.length > 0) {
        doc
          .fillColor(TEXTO)
          .font('Helvetica-Bold')
          .text('Procesos Comunicativos Evaluados:');
        procesos.forEach((p) => {
          doc.font('Helvetica').fillColor(GRIS).text(`• ${p}`);
        });
        doc.moveDown(0.5);
      }

      // 4. SÍNTESIS DIAGNÓSTICA (CIE-10)
      dibujarEncabezadoSeccion('3. SÍNTESIS DIAGNÓSTICA FONOAUDIOLÓGICA (CIE-10)');

      const yDiag = doc.y;
      doc.roundedRect(50, yDiag, contentWidth, 34, 4).fill('#ECFDF5');
      doc
        .fillColor(PETROLEO)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `Código CIE-10: ${historia.diagnosticoCie10Codigo} — ${historia.diagnosticoCie10Desc}`,
          62,
          yDiag + 11,
          { width: contentWidth - 24 },
        );
      doc.y = yDiag + 44;

      // 5. EVOLUCIÓN TERAPÉUTICA (Si existen sesiones registradas)
      if (historia.notasEvolucion.length > 0) {
        dibujarEncabezadoSeccion('4. SÍNTESIS DE EVOLUCIÓN TERAPÉUTICA');

        const notasMostrar = historia.notasEvolucion.slice(-5);
        notasMostrar.forEach((nota) => {
          if (doc.y > 660) doc.addPage();
          const fechaNota = new Date(nota.fechaHoraSesion).toLocaleDateString(
            'es-CO',
          );
          doc
            .fillColor(PETROLEO)
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .text(`Sesión #${nota.numeroSesion} (${fechaNota}): `, {
              continued: true,
            })
            .fillColor(TEXTO)
            .font('Helvetica')
            .text(nota.objetivoSesion);

          doc
            .fillColor(GRIS)
            .fontSize(9)
            .text(`Respuesta y logros: ${nota.desempenoObservado}`, {
              indent: 12,
              align: 'justify',
            });
          doc.moveDown(0.35);
        });
      }

      // 6. PLAN DE INTERVENCIÓN Y RECOMENDACIONES FAMILIA / ESCUELA
      dibujarEncabezadoSeccion(
        historia.notasEvolucion.length > 0
          ? '5. CONCLUSIONES, PLAN DE INTERVENCIÓN Y RECOMENDACIONES'
          : '4. CONCLUSIONES, PLAN DE INTERVENCIÓN Y RECOMENDACIONES',
      );

      doc
        .fillColor(TEXTO)
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .text('Plan de Intervención Terapéutica:');
      doc
        .font('Helvetica')
        .fillColor(GRIS)
        .text(historia.planTratamiento, { align: 'justify' });
      doc.moveDown(0.5);

      const ultimaNotaConPlan = [...historia.notasEvolucion]
        .reverse()
        .find((n) => n.planCaseroTareas?.trim());

      doc
        .fillColor(TEXTO)
        .font('Helvetica-Bold')
        .text('Recomendaciones para la Familia y el Entorno Escolar:');
      doc
        .font('Helvetica')
        .fillColor(GRIS)
        .text(
          ultimaNotaConPlan?.planCaseroTareas ||
            'Continuar con el acompañamiento terapéutico periódico, reforzar en casa las estrategias comunicativas indicadas en sesión y mantener articulación con el entorno escolar.',
          { align: 'justify' },
        );

      // 7. PIE DE FIRMA PROFESIONAL DIGITALIZADA Y REGISTRO RETHUS
      if (doc.y > 630) doc.addPage();
      doc.moveDown(1.8);
      const yFirma = doc.y;

      // Trazo caligráfico digitalizado de firma profesional
      doc
        .save()
        .moveTo(68, yFirma + 18)
        .bezierCurveTo(88, yFirma - 4, 108, yFirma + 28, 132, yFirma + 6)
        .bezierCurveTo(148, yFirma - 6, 165, yFirma + 22, 198, yFirma + 10)
        .lineWidth(1.6)
        .stroke(PETROLEO)
        .restore();

      doc
        .moveTo(50, yFirma + 26)
        .lineTo(265, yFirma + 26)
        .lineWidth(1)
        .stroke(PETROLEO);

      const nombreProfesional =
        historia.creadoPor?.nombreCompleto || 'Dra. Bárbara Ccucho Delgado';
      const rethus = historia.creadoPor?.registroRethus || '760014829';

      doc
        .fillColor(PETROLEO)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(nombreProfesional, 50, yFirma + 32);

      doc
        .fillColor(TEXTO)
        .font('Helvetica')
        .fontSize(9)
        .text('Fonoaudióloga Especialista • Directora Clínica Fonella', 50, yFirma + 45);

      doc
        .fillColor(TURQUESA)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Registro Nacional: ${rethus}`, 50, yFirma + 58);

      // Sello de validez clínica
      doc.roundedRect(330, yFirma + 10, 230, 56, 5).fill(CREMA);
      doc
        .roundedRect(330, yFirma + 10, 230, 56, 5)
        .lineWidth(0.8)
        .stroke(TERRACOTA);
      doc
        .fillColor(PETROLEO)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text('DOCUMENTO CLÍNICO OFICIAL', 342, yFirma + 18);
      doc
        .fillColor(GRIS)
        .font('Helvetica')
        .fontSize(8)
        .text(
          'Emitido conforme a la Resolución 1995 de 1999 y Ley 1581 de 2012 de Protección de Datos Personales.',
          342,
          yFirma + 31,
          { width: 206 },
        );

      doc.end();
    });

    return { buffer, filename };
  }
}



