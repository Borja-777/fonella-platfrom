
import Link from 'next/link';
import {
  MessageSquareHeart,
  Baby,
  BookOpenCheck,
  AudioLines,
  Smile,
  BrainCircuit,
  Clock,
} from 'lucide-react';

const servicios = [
  {
    Icono: MessageSquareHeart,
    color: 'bg-gradient-to-br from-[#0AA896] to-[#0E8A85]',
    nombre: 'Evaluación e intervención del lenguaje y del habla',
    publico: 'Niños y Adultos',
    descripcion:
      'Diagnóstico clínico y rehabilitación de trastornos fonológicos, retraso del lenguaje y articulación.',
    precio: '$95.000 COP',
  },
  {
    Icono: Baby,
    color: 'bg-gradient-to-br from-[#DF9B78] to-[#D47E53]',
    nombre: 'Estimulación temprana',
    publico: 'Primera Infancia (0 a 5 años)',
    descripcion:
      'Potenciación de habilidades comunicativas, atención conjunta, intención comunicativa y juego simbólico.',
    precio: '$85.000 COP',
  },
  {
    Icono: BookOpenCheck,
    color: 'bg-gradient-to-br from-[#5A96C8] to-[#4580B2]',
    nombre: 'Lectoescritura y aprendizaje escolar',
    publico: 'Edad Escolar',
    descripcion:
      'Intervención en conciencia fonológica, dislexia, velocidad comprensiva y procesos lectoescritores.',
    precio: '$90.000 COP',
  },
  {
    Icono: AudioLines,
    color: 'bg-gradient-to-br from-[#0AA896] to-[#136A7B]',
    nombre: 'Voz y comunicación',
    publico: 'Docentes, Cantantes y Adultos',
    descripcion:
      'Rehabilitación de disfonías, higiene vocal, proyección, respiración costo-diafragmática y fluidez.',
    precio: '$95.000 COP',
  },
  {
    Icono: Smile,
    color: 'bg-gradient-to-br from-[#DF9B78] to-[#C96B3E]',
    nombre: 'Terapia Miofuncional',
    publico: 'Ortodoncia, Niños y Adultos',
    descripcion:
      'Equilibrio muscular orofacial, deglución atípica, respiración oral y motricidad fina orofacial.',
    precio: '$95.000 COP',
  },
  {
    Icono: BrainCircuit,
    color: 'bg-gradient-to-br from-[#5A96C8] to-[#3B729E]',
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
      className="mx-auto max-w-6xl px-4 py-16"
    >
      {/* Encabezado con Cápsula Cristalina iOS */}
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0AA896] shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <span className="w-2 h-2 rounded-full bg-[#0AA896] animate-pulse" />
          <span>Nuestros Servicios Profesionales</span>
        </span>

        <h2 className="mt-4 text-2xl font-black text-[#094A57] md:text-4xl tracking-tight">
          Servicios Terapéuticos FONELLA
        </h2>

        <p className="mt-2 text-sm text-gray-600 font-medium max-w-2xl leading-relaxed">
          Atención especializada para acompañar cada etapa del desarrollo.
          Todas nuestras sesiones tienen una duración de 45 minutos.
        </p>
      </div>

      {/* Cuadrícula de Tarjetas Cristalinas (Glassmorphism) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {servicios.map((servicio) => (
          <article
            key={servicio.nombre}
            className="group flex flex-col justify-between rounded-3xl bg-white/85 backdrop-blur-xl border border-[#136A7B]/20 hover:border-[#0AA896]/60 p-6 shadow-[0_12px_30px_-6px_rgba(19,106,123,0.12),0_4px_12px_-2px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_20px_42px_-6px_rgba(19,106,123,0.18)] hover:-translate-y-1.5 transition-all duration-300"
          >
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm ${servicio.color} group-hover:scale-105 transition-transform duration-200`}>
                  <servicio.Icono className="w-6 h-6 text-white" />
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 border border-[#136A7B]/15 px-2.5 py-1 text-[11px] font-black text-[#094A57] shadow-2xs group-hover:border-[#0AA896]/40 group-hover:bg-[#FAF6F0] transition-all">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-50 border border-[#0AA896]/30 text-[#0AA896]">
                    <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </span>
                  <span>45 min</span>
                </span>
              </div>

              <h3 className="text-base font-black leading-snug text-[#094A57] group-hover:text-[#0AA896] transition-colors">
                {servicio.nombre}
              </h3>

              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[#0AA896]">
                {servicio.publico}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-gray-600 font-medium">
                {servicio.descripcion}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#094A57]/10 pt-4">
              <span className="text-base font-black text-[#094A57]">
                {servicio.precio}
              </span>

              <Link
                href="/solicitar-cita"
                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#5A96C8] to-[#4580B2] hover:from-[#4b88bc] hover:to-[#3a72a0] px-4 py-2 text-xs font-black text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>Solicitar cita</span>
                <span>→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
