
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const especialidades = [
  { nombre: 'Habla y lenguaje', icono: '💬', color: 'border-fonella-turquesa' },
  { nombre: 'Estimulación temprana', icono: '🌱', color: 'border-fonella-secundario' },
  { nombre: 'Lectoescritura', icono: '📖', color: 'border-fonella-cielo' },
  { nombre: 'Voz y comunicación', icono: '🗣️', color: 'border-fonella-turquesa' },
  { nombre: 'Terapia miofuncional', icono: '👄', color: 'border-fonella-secundario' },
  { nombre: 'Terapia ABA', icono: '🧩', color: 'border-fonella-cielo' },
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
      className="border-b border-fonella-secundario/30 bg-fonella-crema"
    >
      {/* PRESENTACIÓN PRINCIPAL */}
      <div className="px-5 py-12 md:py-16">
        <div className="mx-auto grid max-w-6xl items-stretch gap-10 lg:grid-cols-7">

          {/* INFORMACIÓN PRINCIPAL */}
          <div className="flex h-full flex-col justify-between gap-8 lg:col-span-4">

            {/* BLOQUE DE PRESENTACIÓN */}
            <div>
              <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-fonella-turquesa shadow-sm">
                Consultorio Fonoaudiológico Especializado
              </span>

              <div className="mt-5">
                <h1 className="text-3xl font-extrabold leading-tight text-fonella-primario md:text-5xl">
                  Bárbara Ccucho Delgado
                </h1>

                <p className="mt-3 text-lg font-bold uppercase tracking-wide text-fonella-turquesa">
                  Fonoaudióloga clínica y neurodesarrollo
                </p>

                <p className="mt-2 text-xl font-semibold italic text-fonella-secundario">
                  "Comunicación que Transforma"
                </p>
              </div>

              {/* SEPARADOR DECORATIVO */}
              <div className="mt-6 flex items-center gap-3">
                <span className="h-1 flex-1 rounded-full bg-fonella-turquesa/50" />
                <span className="text-fonella-turquesa">♥</span>
                <span className="h-1 flex-1 rounded-full bg-fonella-turquesa/50" />
              </div>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-700">
                Acompañamiento integral y cálido en evaluación, diagnóstico e
                intervención del lenguaje, habla, voz, deglución y
                neurodesarrollo infantil y adulto.
                <strong className="text-fonella-primario">
                  {' '}Hablamos contigo en cada etapa de tu vida.
                </strong>
              </p>
            </div>

            {/* BLOQUE DE INFORMACIÓN DE ATENCIÓN */}
            <div>
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-fonella-primario/60">
                  Atención profesional
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-fonella-primario/15 bg-white p-3 shadow-sm transition hover:-translate-y-1">
                  <p className="text-xs font-bold uppercase text-fonella-turquesa">
                    Duración
                  </p>
                  <p className="mt-1 font-extrabold text-fonella-primario">
                    45 minutos
                  </p>
                  <p className="text-xs text-gray-500">Por sesión</p>
                </div>

                <div className="rounded-xl border border-fonella-primario/15 bg-white p-3 shadow-sm transition hover:-translate-y-1">
                  <p className="text-xs font-bold uppercase text-fonella-secundario">
                    Atención
                  </p>
                  <p className="mt-1 font-extrabold text-fonella-primario">
                    Pediátrica
                  </p>
                  <p className="text-xs text-gray-500">Atención infantil</p>
                </div>

                <div className="rounded-xl border border-fonella-primario/15 bg-white p-3 shadow-sm transition hover:-translate-y-1">
                  <p className="text-xs font-bold uppercase text-fonella-cielo">
                    Atención
                  </p>
                  <p className="mt-1 font-extrabold text-fonella-primario">
                    Adultos
                  </p>
                  <p className="text-xs text-gray-500">
                    Atención personalizada
                  </p>
                </div>
              </div>
            </div>

            {/* BLOQUE DE BOTONES */}
            <div className="flex flex-wrap items-center gap-3 border-t border-fonella-primario/10 pt-5">
              <Link
                href="/solicitar-cita"
                className="rounded-xl bg-fonella-primario px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-fonella-turquesa"
              >
                📅 Solicitar cita asistida
              </Link>

              <a
                href="#seccion-juguetes"
                className="rounded-xl border border-fonella-primario/20 bg-white px-5 py-3 text-sm font-bold text-fonella-primario transition hover:bg-fonella-secundario/20"
              >
                🧸 Ver didácticos
              </a>
            </div>
          </div>

          {/* TARJETA PROFESIONAL DE BÁRBARA */}
          <div className="relative lg:col-span-3">

            {/* MANCHA TERRACOTA PRINCIPAL */}
            <div className="pointer-events-none absolute -right-12 top-12 z-0 h-80 w-80 rounded-full bg-[#DF9B78]/65" />

            {/* SEGUNDA FIGURA DECORATIVA */}
            <div className="pointer-events-none absolute -bottom-5 -left-7 z-0 h-28 w-28 rounded-full bg-[#DF9B78]/35" />

            {/* TARJETA BLANCA */}
            <div className="relative z-10 mx-auto max-w-md rounded-3xl border border-fonella-turquesa/20 bg-white p-4 shadow-xl sm:p-5">

              {/* FOTOGRAFÍA PRINCIPAL */}
              <div className="relative">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-fonella-crema shadow-sm">
                  <Image
                    src="/images/barbara-avatar.jpg"
                    alt="Dra. Bárbara Ccucho Delgado"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 450px"
                    className="object-cover object-top"
                  />
                </div>

                {/* DISTINTIVO RETHUS */}
                <div className="absolute left-0 top-5 rounded-r-full bg-white px-4 py-2 text-xs font-bold text-fonella-primario shadow-md">
                  ✓ RETHUS · MinSalud
                </div>

                {/* DISTINTIVO ESPACIO HABILITADO */}
                <div className="absolute bottom-4 right-0 rounded-l-full bg-fonella-turquesa px-4 py-2 text-xs font-bold text-white shadow-md">
                  Espacio habilitado
                </div>
              </div>

              {/* IDENTIFICACIÓN PROFESIONAL */}
              <div className="px-2 pb-4 pt-4 text-center">
                <h2 className="text-lg font-extrabold text-fonella-primario">
                  Dra. Bárbara Ccucho Delgado
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Fonoaudiología y neurodesarrollo
                </p>
              </div>

              {/* SEPARADOR */}
              <div className="mx-2 border-t border-fonella-turquesa/15" />

              {/* ESPECIALIDADES COMPACTAS */}
              <div className="px-1 pb-1 pt-4">
                <div className="mb-3 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fonella-turquesa">
                    Nuestras áreas de atención
                  </span>

                  <h3 className="mt-1 text-lg font-extrabold text-fonella-primario">
                    Especialidades Clínicas
                  </h3>

                  <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-fonella-secundario" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {especialidades.map((especialidad) => (
                    <div
                      key={especialidad.nombre}
                      className={`flex min-h-[55px] items-center gap-2 rounded-xl border-l-4 ${especialidad.color} bg-fonella-crema/60 px-2.5 py-2 transition duration-200 hover:bg-fonella-crema`}
                    >
                      <span className="shrink-0 text-lg">
                        {especialidad.icono}
                      </span>

                      <span className="text-xs font-semibold leading-tight text-fonella-primario">
                        {especialidad.nombre}
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
              <div className="rounded-2xl border border-fonella-secundario/30 bg-fonella-secundario/10 p-5">
                <div className="text-3xl">🏅</div>

                <h3 className="mt-3 font-bold text-fonella-primario">
                  Habilitación RETHUS
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Registro oficial nacional en talento humano en salud.
                </p>
              </div>

              <div className="rounded-2xl border border-fonella-turquesa/25 bg-fonella-turquesa/10 p-5">
                <div className="text-3xl">🏥</div>

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
