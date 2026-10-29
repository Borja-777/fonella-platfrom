// ============================================================================
// PRISMA SEED — DATOS INICIALES PARA EL SPRINT 1 (PROYECTO FONELLA)
// Ejecución: npx prisma db seed
// ============================================================================
import { PrismaClient, RolUsuario, EstadoRegistro } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos semilla (Sprint 1 - Fonella)...');

  const passwordHashFono = await bcrypt.hash('BarbaraFonella2026*', 10);
  const passwordHashSecre = await bcrypt.hash('SecretariaFonella2026*', 10);

  // 1. Crear cuenta de la Dra. Bárbara Ccucho Delgado (HU-01)
  await prisma.usuario.upsert({
    where: { email: 'barbara.ccucho@fonella.co' },
    update: {},
    create: {
      nombreCompleto: 'Dra. Bárbara Ccucho Delgado',
      email: 'barbara.ccucho@fonella.co',
      passwordHash: passwordHashFono,
      rol: RolUsuario.FONOAUDIOLOGA,
      registroRethus: 'RETHUS-760014829',
      estado: EstadoRegistro.ACTIVO,
    },
  });

  // 2. Crear cuenta de Secretaria inicial (HU-02 / HU-03)
  await prisma.usuario.upsert({
    where: { email: 'recepcion@fonella.co' },
    update: {},
    create: {
      nombreCompleto: 'Laura Gómez (Secretaria Fonella)',
      email: 'recepcion@fonella.co',
      passwordHash: passwordHashSecre,
      rol: RolUsuario.ASISTENTE,
      estado: EstadoRegistro.ACTIVO,
    },
  });

  // 3. Crear Catálogo de Servicios Clínicos de 45 min (HU-06 / HU-09)
  const servicios = [
    {
      codigo: 'VAL-INI-45',
      nombre: 'Valoración Fonoaudiológica Integral',
      descripcion: 'Evaluación diagnóstica inicial del lenguaje, habla, voz y órganos fonoarticulatorios (OFA).',
      publicoObjetivo: 'Niños, adolescentes y adultos',
      duracionMinutos: 45,
      precioReferencia: 95000,
    },
    {
      codigo: 'TER-LENG-45',
      nombre: 'Terapia del Lenguaje y Estimulación Temprana',
      descripcion: 'Intervención especializada para retrasos del lenguaje comprensivo y expresivo.',
      publicoObjetivo: 'Niños de 2 a 8 años',
      duracionMinutos: 45,
      precioReferencia: 75000,
    },
    {
      codigo: 'TER-HABLA-45',
      nombre: 'Terapia Miofuncional y de Habla (Articulación)',
      descripcion: 'Rehabilitación de trastornos de los sonidos del habla (TSH), deglución atípica y respiración oral.',
      publicoObjetivo: 'Niños y adolescentes',
      duracionMinutos: 45,
      precioReferencia: 75000,
    },
    {
      codigo: 'TER-VOZ-45',
      nombre: 'Rehabilitación Vocal y Terapia para Adultos',
      descripcion: 'Tratamiento de disfonías, fatiga vocal para docentes/profesionales y rehabilitación neurológica.',
      publicoObjetivo: 'Jóvenes y adultos',
      duracionMinutos: 45,
      precioReferencia: 80000,
    },
  ];

  for (const s of servicios) {
    await prisma.servicioTerapeutico.upsert({
      where: { codigo: s.codigo },
      update: {},
      create: s,
    });
  }

  // 4. Crear Juguetes Didácticos de muestra para la Galería Pública (HU-07)
  const juguetes = [
    {
      codigoSku: 'JUG-SOPLO-001',
      nombre: 'Kit de Soplo y Control Respiratorio (Flautas y Pompones)',
      descripcionTerapeutica: 'Fortalece el cierre velofaríngeo, la coordinación fonorrespiratoria y el tono labial.',
      areaEstimulacion: 'Habla y Motricidad Orofacial',
      edadSugerida: '3 a 7 años',
      imagenUrl: '/juguetes/kit-soplo.jpg',
      stockDisponible: 12,
      stockMinimoAlerta: 3,
      costoUnitario: 18000,
      precioVenta: 35000,
      publicadoCatalogo: true,
    },
    {
      codigoSku: 'JUG-FONO-002',
      nombre: 'Lotería Fonológica de Pares Mínimos (/r/, /s/, /l/)',
      descripcionTerapeutica: 'Estimula la conciencia fonológica y la discriminación auditiva mediante asociación visual.',
      areaEstimulacion: 'Lenguaje y Conciencia Fonológica',
      edadSugerida: '4 a 8 años',
      imagenUrl: '/juguetes/loteria-fonologica.jpg',
      stockDisponible: 8,
      stockMinimoAlerta: 3,
      costoUnitario: 25000,
      precioVenta: 48000,
      publicadoCatalogo: true,
    },
    {
      codigoSku: 'JUG-VOCAB-003',
      nombre: 'Tarjetas Secuenciales de Historias y Verbos en Acción',
      descripcionTerapeutica: 'Desarrolla la estructuración morfosintáctica, narración coherente y vocabulario activo.',
      areaEstimulacion: 'Lenguaje Expresivo y Pragmático',
      edadSugerida: '3 a 9 años',
      imagenUrl: '/juguetes/tarjetas-secuencias.jpg',
      stockDisponible: 0, // Ejemplo Agotado para probar filtro HU-07
      stockMinimoAlerta: 3,
      costoUnitario: 22000,
      precioVenta: 42000,
      publicadoCatalogo: true,
    },
  ];

  for (const j of juguetes) {
    await prisma.jugueteDidactico.upsert({
      where: { codigoSku: j.codigoSku },
      update: {},
      create: j,
    });
  }

  console.log('✅ Datos semilla del Sprint 1 creados con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
