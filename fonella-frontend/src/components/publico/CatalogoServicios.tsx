
import Link from 'next/link';

const servicios = [
  {
    icono: '💬',
    color: 'bg-fonella-primario',
    nombre: 'Evaluación e intervención del lenguaje y del habla',
    publico: 'Niños y Adultos',
    descripcion:
      'Diagnóstico clínico y rehabilitación de trastornos fonológicos, retraso del lenguaje y articulación.',
    precio: '$95.000 COP',
  },
  {
    icono: '✨',
    color: 'bg-fonella-turquesa',
    nombre: 'Estimulación temprana',
    publico: 'Primera Infancia (0 a 5 años)',
    descripcion:
      'Potenciación de habilidades comunicativas, atención conjunta, intención comunicativa y juego simbólico.',
    precio: '$85.000 COP',
  },
  {
    icono: '📖',
    color: 'bg-fonella-cielo',
    nombre: 'Lectoescritura y aprendizaje escolar',
    publico: 'Edad Escolar',
    descripcion:
      'Intervención en conciencia fonológica, dislexia, velocidad comprensiva y procesos lectoescritores.',
    precio: '$90.000 COP',
  },
  {
    icono: '🗣️',
    color: 'bg-fonella-secundario',
    nombre: 'Voz y comunicación',
    publico: 'Docentes, Cantantes y Adultos',
    descripcion:
      'Rehabilitación de disfonías, higiene vocal, proyección, respiración costo-diafragmática y fluidez.',
    precio: '$95.000 COP',
  },
  {
    icono: '👄',
    color: 'bg-fonella-primario',
    nombre: 'Terapia Miofuncional',
    publico: 'Ortodoncia, Niños y Adultos',
    descripcion:
      'Equilibrio muscular orofacial, deglución atípica, respiración oral y motricidad fina orofacial.',
    precio: '$95.000 COP',
  },
  {
    icono: '🧠',
    color: 'bg-fonella-turquesa',
    nombre: 'Terapia ABA y neurodesarrollo',
    publico: 'TEA, TDAH y Neurodesarrollo',
    descripcion:
      'Intervención conductual y comunicativa estructurada basada en evidencia para el desarrollo funcional.',
    precio: '$110.000 COP',
  },
];

export default function CatalogoServicios() {
  return (
    <section
      id="seccion-servicios"
      className="mx-auto max-w-6xl px-4 py-12"
    >
      <div className="mb-8">
        <span className="rounded-full bg-fonella-turquesa/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fonella-turquesa">
          Nuestros Servicios Profesionales
        </span>

        <h2 className="mt-3 text-2xl font-extrabold text-fonella-primario md:text-3xl">
          Servicios Terapéuticos FONELLA
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          Atención especializada para acompañar cada etapa del desarrollo.
          Todas nuestras sesiones tienen una duración de 45 minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {servicios.map((servicio) => (
          <article
            key={servicio.nombre}
            className="flex flex-col justify-between rounded-2xl border border-fonella-primario/15 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl text-white shadow-sm ${servicio.color}`}>
                  {servicio.icono}
                </span>

                <span className="rounded-full bg-fonella-crema px-3 py-1 text-xs font-extrabold text-fonella-primario">
                  ⏱️ 45 min
                </span>
              </div>

              <h3 className="text-base font-extrabold leading-snug text-fonella-primario">
                {servicio.nombre}
              </h3>

              <p className="mt-1 text-xs font-semibold text-fonella-turquesa">
                {servicio.publico}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                {servicio.descripcion}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
              <span className="text-sm font-extrabold text-fonella-primario">
                {servicio.precio}
              </span>

              <Link
                href="/solicitar-cita"
                className="rounded-lg bg-fonella-turquesa px-3 py-2 text-xs font-bold text-white transition hover:bg-fonella-primario"
              >
                Solicitar cita →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
