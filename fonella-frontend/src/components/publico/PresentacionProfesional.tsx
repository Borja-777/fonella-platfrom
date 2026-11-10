
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CalendarHeart,
  Shapes,
  MessageSquareHeart,
  Baby,
  BookOpenCheck,
  AudioLines,
  Smile,
  BrainCircuit,
  BadgeCheck,
  Building2,
} from 'lucide-react';

const especialidades = [
  {
    nombre: 'Habla y lenguaje',
    Icono: MessageSquareHeart,
    colorIcono: 'text-[#0AA896]',
    bgIcono: 'bg-teal-50',
  },
  {
    nombre: 'Estimulación temprana',
    Icono: Baby,
    colorIcono: 'text-[#DF9B78]',
    bgIcono: 'bg-amber-50',
  },
  {
    nombre: 'Lectoescritura',
    Icono: BookOpenCheck,
    colorIcono: 'text-[#5A96C8]',
    bgIcono: 'bg-sky-50',
  },
  {
    nombre: 'Voz y comunicación',
    Icono: AudioLines,
    colorIcono: 'text-[#0AA896]',
    bgIcono: 'bg-teal-50',
  },
  {
    nombre: 'Terapia miofuncional',
    Icono: Smile,
    colorIcono: 'text-[#DF9B78]',
    bgIcono: 'bg-amber-50',
  },
  {
    nombre: 'Terapia ABA',
    Icono: BrainCircuit,
    colorIcono: 'text-[#5A96C8]',
    bgIcono: 'bg-sky-50',
  },
];

const fotografias = [
  {
    src: '/images/terapia-fonoaudiologica.jpg',
    titulo: 'Atención Fonoaudiológica Personalizada',
    descripcion:
      'Acompañamiento cercano y especializado durante cada proceso terapéutico.',
  },
  {
    src: '/images/evaluacion-clinica.jpg',
    titulo: 'Evaluación Fonoaudiológica',
    descripcion:
      'Valoración profesional para identificar necesidades y orientar la intervención.',
  },
  {
    src: '/images/material-didactico.jpg',
    titulo: 'Material Didáctico Propio',
    descripcion:
      'Estimulación sensorial y lúdica mediante materiales de apoyo terapéutico.',
  },
];

export default function PresentacionProfesional() {
  const [fotografiaActual, setFotografiaActual] = useState(0);

  const anterior = () => {
    setFotografiaActual(
      (actual) => (actual - 1 + fotografias.length) % fotografias.length
    );
  };

  const siguiente = () => {
    setFotografiaActual((actual) => (actual + 1) % fotografias.length);
  };

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFotografiaActual((actual) => (actual + 1) % fotografias.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <section
      id="inicio"
      className="relative border-b border-[#DF9B78]/20 bg-[#FAF6F0] overflow-hidden"
    >
      {/* SUTIL LUZ AMBIENTAL TRASERA */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-[#0AA896]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/4 h-80 w-80 rounded-full bg-[#5A96C8]/10 blur-3xl" />

      {/* PRESENTACIÓN PRINCIPAL */}
      <div className="relative z-10 px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 lg:grid-cols-7">

          {/* INFORMACIÓN PRINCIPAL */}
          <div className="flex h-full flex-col justify-between gap-8 lg:col-span-4">

            {/* BLOQUE DE PRESENTACIÓN */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#0AA896] shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]">
                <span className="w-2 h-2 rounded-full bg-[#0AA896] animate-pulse" />
                <span>Consultorio Fonoaudiológico Especializado</span>
              </span>

              <div className="mt-5">
                <h1 className="text-3xl font-black leading-tight text-[#094A57] md:text-5xl tracking-tight">
                  Bárbara Ccucho Delgado
                </h1>

                <p className="mt-3 text-lg font-black uppercase tracking-wide text-[#0AA896]">
                  Fonoaudióloga clínica y neurodesarrollo
                </p>

                <p className="mt-2 text-xl font-bold italic text-[#DF9B78]">
                  "Comunicación que Transforma"
                </p>
              </div>

              {/* SEPARADOR DECORATIVO CON CORAZÓN CRISTALINO */}
              <div className="mt-6 flex items-center gap-3">
                <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-transparent via-[#0AA896]/35 to-[#0AA896]/65" />
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-md border border-white/90 text-xs text-[#0AA896] shadow-2xs font-black">
                  ♥
                </span>
                <span className="h-0.5 flex-1 rounded-full bg-gradient-to-l from-transparent via-[#0AA896]/35 to-[#0AA896]/65" />
              </div>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-700 font-medium">
                Acompañamiento integral y cálido en evaluación, diagnóstico e
                intervención del lenguaje, habla, voz, deglución y
                neurodesarrollo infantil y adulto.{' '}
                <strong className="text-[#094A57] font-bold">
                  Hablamos contigo en cada etapa de tu vida.
                </strong>
              </p>
            </div>

            {/* BLOQUE DE INFORMACIÓN DE ATENCIÓN (iOS GLASS TILES) */}
            <div>
              <div className="mb-3">
                <p className="text-xs font-black uppercase tracking-widest text-[#094A57]/60">
                  Atención profesional
                </p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-3">
                <div className="group rounded-2xl bg-white/75 backdrop-blur-xl border border-[#136A7B]/20 hover:border-[#0AA896]/60 p-3.5 shadow-[0_8px_20px_-4px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_12px_28px_-6px_rgba(19,106,123,0.12)] hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#0AA896]">
                    Duración
                  </p>
                  <p className="mt-1 text-base font-black text-[#094A57]">
                    45 minutos
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Por sesión</p>
                </div>

                <div className="group rounded-2xl bg-white/75 backdrop-blur-xl border border-[#136A7B]/20 hover:border-[#0AA896]/60 p-3.5 shadow-[0_8px_20px_-4px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_12px_28px_-6px_rgba(19,106,123,0.12)] hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#DF9B78]">
                    Atención
                  </p>
                  <p className="mt-1 text-base font-black text-[#094A57]">
                    Pediátrica
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Atención infantil</p>
                </div>

                <div className="group rounded-2xl bg-white/75 backdrop-blur-xl border border-[#136A7B]/20 hover:border-[#0AA896]/60 p-3.5 shadow-[0_8px_20px_-4px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_12px_28px_-6px_rgba(19,106,123,0.12)] hover:-translate-y-1 transition-all duration-300">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#5A96C8]">
                    Atención
                  </p>
                  <p className="mt-1 text-base font-black text-[#094A57]">
                    Adultos
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    Atención personalizada
                  </p>
                </div>
              </div>
            </div>

            {/* BLOQUE DE BOTONES (CTAs CRISTALINOS CON METÁFORAS MODERNAS) */}
            <div className="flex flex-wrap items-center gap-3.5 border-t border-[#094A57]/10 pt-5">
              <Link
                href="/solicitar-cita"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0AA896] via-[#0E8A85] to-[#136A7B] px-6 py-3.5 text-sm font-black text-white shadow-[0_10px_25px_-4px_rgba(10,168,150,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] hover:shadow-[0_14px_32px_-6px_rgba(10,168,150,0.5)] transition-all active:scale-95 cursor-pointer"
              >
                <CalendarHeart className="w-4 h-4 text-white" />
                <span>Solicitar cita asistida</span>
              </Link>

              <a
                href="#seccion-juguetes"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/85 backdrop-blur-xl border-2 border-[#136A7B]/25 hover:border-[#136A7B]/60 hover:bg-white px-6 py-3.5 text-sm font-black text-[#094A57] shadow-[0_4px_14px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] transition-all active:scale-95 cursor-pointer"
              >
                <Shapes className="w-4 h-4 text-[#DF9B78]" />
                <span>Ver didácticos</span>
              </a>
            </div>
          </div>

          {/* TARJETA PROFESIONAL DE BÁRBARA (CRISTAL ULTRA-PULIDO iOS 27) */}
          <div className="relative lg:col-span-3">

            {/* CÍRCULOS GEOMÉTRICOS TERRACOTA ORIGINALES */}
            <div className="pointer-events-none absolute -right-12 top-12 z-0 h-80 w-80 rounded-full bg-[#DF9B78]/65" />
            <div className="pointer-events-none absolute -bottom-5 -left-7 z-0 h-28 w-28 rounded-full bg-[#DF9B78]/35" />

            {/* TARJETA DE CRISTAL TRANSLÚCIDO (GLASSMORPHISM) */}
            <div className="relative z-10 mx-auto max-w-md rounded-[2.5rem] bg-white/70 backdrop-blur-2xl border border-white/90 p-5 sm:p-6 shadow-[0_25px_60px_-12px_rgba(19,106,123,0.18),inset_0_1px_2px_0_rgba(255,255,255,0.95)]">

              {/* FOTOGRAFÍA PRINCIPAL */}
              <div className="relative">
                <div className="relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-b from-white/40 to-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.06)] border border-white/70">
                  <Image
                    src="/images/barbara-avatar.jpg"
                    alt="Dra. Bárbara Ccucho Delgado"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 450px"
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* IDENTIFICACIÓN PROFESIONAL */}
              <div className="px-2 pb-3 pt-4 text-center">
                <h2 className="text-xl font-black text-[#094A57] tracking-tight">
                  Dra. Bárbara Ccucho Delgado
                </h2>

                <p className="mt-0.5 text-xs font-bold text-[#0AA896] uppercase tracking-wider">
                  Fonoaudiología y neurodesarrollo
                </p>
              </div>

              {/* SEPARADOR CRISTALINO */}
              <div className="mx-2 my-1 border-t border-[#0AA896]/15" />

              {/* ESPECIALIDADES COMPACTAS (iOS GLASS WIDGETS) */}
              <div className="px-1 pb-1 pt-3">
                <div className="mb-3 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0AA896]">
                    Nuestras áreas de atención
                  </span>

                  <h3 className="mt-0.5 text-base font-black text-[#094A57]">
                    Especialidades Clínicas
                  </h3>

                  <div className="mx-auto mt-1.5 h-1 w-12 rounded-full bg-gradient-to-r from-[#0AA896] to-[#DF9B78]" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {especialidades.map(({ nombre, Icono, colorIcono, bgIcono }) => (
                    <div
                      key={nombre}
                      className="group flex min-h-[56px] items-center gap-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#136A7B]/20 hover:border-[#0AA896]/60 hover:bg-white px-3 py-2 transition-all duration-200 shadow-xs hover:shadow-sm hover:-translate-y-0.5 cursor-default"
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${bgIcono} ${colorIcono} shadow-2xs border border-[#136A7B]/10`}>
                        <Icono className="w-4 h-4" />
                      </span>

                      <span className="text-xs font-bold leading-tight text-[#094A57]">
                        {nombre}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NUESTRO TRABAJO Y CONOCE A TU ESPECIALISTA */}
      <div className="px-5 pb-16 pt-4">
        <div className="mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-2">

          {/* NUESTRO TRABAJO */}
          <div className="flex flex-col rounded-3xl border border-fonella-secundario/30 bg-white p-5 shadow-lg sm:p-7">
            <div className="mb-5">
              <span className="inline-flex rounded-full bg-fonella-secundario/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-fonella-secundario">
                Nuestro Trabajo
              </span>

              <h2 className="mt-3 text-2xl font-extrabold text-fonella-primario">
                Un espacio para crecer y comunicarnos
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Conoce cómo acompañamos cada proceso terapéutico.
              </p>
            </div>

            {/* CARRUSEL */}
            <div className="relative mt-auto overflow-hidden rounded-2xl bg-fonella-crema shadow-md">
              <div className="relative aspect-[4/3]">
                {fotografias.map((foto, indice) => (
                  <div
                    key={foto.src}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      fotografiaActual === indice
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0'
                    }`}
                    aria-hidden={fotografiaActual !== indice}
                  >
                    <Image
                      src={foto.src}
                      alt={foto.titulo}
                      fill
                      sizes="(max-width: 1024px) 90vw, 550px"
                      className="object-cover"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={anterior}
                  aria-label="Fotografía anterior"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-fonella-primario shadow-md transition hover:bg-fonella-turquesa hover:text-white"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={siguiente}
                  aria-label="Fotografía siguiente"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-fonella-primario shadow-md transition hover:bg-fonella-turquesa hover:text-white"
                >
                  ›
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-12">
                  <p className="text-sm font-bold text-white">
                    {fotografias[fotografiaActual].titulo}
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 min-h-10 text-center text-sm leading-relaxed text-gray-600">
              {fotografias[fotografiaActual].descripcion}
            </p>

            {/* INDICADORES DEL CARRUSEL */}
            <div className="mt-3 flex justify-center gap-3">
              {fotografias.map((foto, indice) => (
                <button
                  key={foto.src}
                  type="button"
                  onClick={() => setFotografiaActual(indice)}
                  aria-label={`Ver fotografía ${indice + 1}: ${foto.titulo}`}
                  aria-current={fotografiaActual === indice}
                  className={`h-3 rounded-full transition-all ${
                    fotografiaActual === indice
                      ? 'w-8 bg-fonella-turquesa'
                      : 'w-3 bg-fonella-secundario/40 hover:bg-fonella-turquesa/60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CONOCE A TU ESPECIALISTA */}
          <div className="flex flex-col rounded-3xl border border-fonella-turquesa/20 bg-white p-6 shadow-lg sm:p-8">
            <div>
              <span className="inline-flex rounded-full bg-fonella-turquesa/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-fonella-turquesa">
                Conoce a tu Especialista
              </span>

              <h2 className="mt-4 text-2xl font-extrabold leading-tight text-fonella-primario md:text-3xl">
                Acompañamiento Terapéutico Cercano, Basado en Evidencia y con Amor
              </h2>

              <div className="my-5 h-1 w-20 rounded-full bg-fonella-secundario" />

              <p className="leading-relaxed text-gray-600">
                En el consultorio FONELLA, la Dra. Bárbara Ccucho Delgado
                integra evaluación científica con un enfoque lúdico y
                empático. Creemos firmemente que cada persona tiene un ritmo
                único de comunicación, y por ello trabajamos en estrecha
                alianza con padres de familia, acudientes y colegios para
                potenciar el neurodesarrollo integral.
              </p>
            </div>

            {/* ACREDITACIONES */}
            <div className="mt-auto grid gap-4 pt-8 sm:grid-cols-2">
              <div className="group rounded-2xl border border-fonella-secundario/30 bg-fonella-secundario/10 p-5 hover:bg-white hover:border-[#DF9B78]/60 hover:shadow-md transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#DF9B78]/30 text-[#DF9B78] shadow-xs group-hover:scale-105 transition-transform">
                  <BadgeCheck className="w-6 h-6 text-[#DF9B78]" />
                </div>

                <h3 className="mt-3 font-bold text-fonella-primario">
                  Habilitación RETHUS
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Registro oficial nacional en talento humano en salud.
                </p>
              </div>

              <div className="group rounded-2xl border border-fonella-turquesa/25 bg-fonella-turquesa/10 p-5 hover:bg-white hover:border-[#0AA896]/60 hover:shadow-md transition-all duration-300">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#0AA896]/30 text-[#0AA896] shadow-xs group-hover:scale-105 transition-transform">
                  <Building2 className="w-6 h-6 text-[#0AA896]" />
                </div>

                <h3 className="mt-3 font-bold text-fonella-primario">
                  Espacio Habilitado MinSalud
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Atención en un espacio habilitado para brindar servicios
                  profesionales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
