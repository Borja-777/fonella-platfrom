
'use client';

import { useState } from 'react';

const productos = [
  {
    nombre: 'Kit de Soplo y Motricidad Orofacial',
    categoria: 'MIOFUNCIONAL',
    edad: '3+ años',
    precio: '$42.000 COP',
    stock: 8,
    icono: '🎺',
    descripcion:
      'Ejercitador respiratorio y de tonicidad labial para terapia miofuncional en casa.',
  },
  {
    nombre: 'Tarjetas Fonológicas Ilustradas (Fonemas /R/ y /S/)',
    categoria: 'HABLA',
    edad: '4 a 9 años',
    precio: '$55.000 COP',
    stock: 12,
    icono: '🃏',
    descripcion:
      'Mazo de 64 tarjetas para trabajar articulación y vocabulario.',
  },
  {
    nombre: 'Tablero Sensorial de Secuencias ABA',
    categoria: 'ABA',
    edad: '2 a 8 años',
    precio: '$68.000 COP',
    stock: 5,
    icono: '🧩',
    descripcion:
      'Apoyo visual estructurado para rutinas, contacto visual y tolerancia a la espera.',
  },
  {
    nombre: 'Lotería Silábica y Fonológica',
    categoria: 'HABLA',
    edad: '5 a 10 años',
    precio: '$48.000 COP',
    stock: 0,
    icono: '🔤',
    descripcion:
      'Juego didáctico para segmentación silábica y lectoescritura inicial.',
  },
];

const filtros = [
  { valor: 'TODOS', texto: 'Todos' },
  { valor: 'HABLA', texto: 'Habla y Lenguaje' },
  { valor: 'MIOFUNCIONAL', texto: 'Miofuncional' },
  { valor: 'ABA', texto: 'ABA' },
];

export default function CatalogoDidacticos() {
  const [filtroActivo, setFiltroActivo] = useState('TODOS');

  const productosFiltrados =
    filtroActivo === 'TODOS'
      ? productos
      : productos.filter(
          (producto) => producto.categoria === filtroActivo
        );

  return (
    <section
      id="seccion-juguetes"
      className="border-y border-fonella-secundario/30 bg-fonella-crema/60 py-16"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Encabezado con Cápsula Cristalina iOS */}
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-xl border border-white/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#DF9B78] shadow-[0_4px_14px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <span className="w-2 h-2 rounded-full bg-[#DF9B78] animate-pulse" />
            <span>Apoyo Terapéutico en Casa</span>
          </span>

          <h2 className="mt-4 text-2xl font-black text-[#094A57] md:text-4xl tracking-tight">
            Vitrina de Juguetes Didácticos
          </h2>

          <p className="mt-2 text-sm text-gray-600 font-medium max-w-2xl leading-relaxed">
            Material seleccionado para reforzar las terapias de habla,
            lenguaje y neurodesarrollo.
          </p>
        </div>

        {/* Filtros en Cápsulas Flotantes */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          {filtros.map((filtro) => (
            <button
              key={filtro.valor}
              type="button"
              onClick={() => setFiltroActivo(filtro.valor)}
              className={`rounded-full px-4 py-2 text-xs font-black transition-all active:scale-95 cursor-pointer ${
                filtroActivo === filtro.valor
                  ? 'bg-[#094A57] text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-[#094A57] border border-[#136A7B]/15 shadow-xs hover:shadow-sm'
              }`}
            >
              {filtro.texto}
            </button>
          ))}
        </div>

        {/* Cuadrícula de Juguetes con Tarjetas Cristalinas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {productosFiltrados.map((producto) => (
            <article
              key={producto.nombre}
              className="group flex flex-col justify-between rounded-3xl bg-white/85 backdrop-blur-xl border border-[#136A7B]/20 hover:border-[#0AA896]/60 p-5 shadow-[0_12px_30px_-6px_rgba(19,106,123,0.12),0_4px_12px_-2px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] hover:bg-white hover:shadow-[0_20px_42px_-6px_rgba(19,106,123,0.18)] hover:-translate-y-1.5 transition-all duration-300"
            >
              <div>
                <div className="relative mb-3.5 flex h-32 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF9F5] to-[#F7ECE4] border border-[#DF9B78]/25 text-5xl group-hover:scale-102 transition-transform duration-300">
                  {producto.icono}

                  <span
                    className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-black shadow-xs ${
                      producto.stock > 0
                        ? 'bg-[#0AA896] text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {producto.stock > 0
                      ? `Disponible (${producto.stock})`
                      : 'Agotado'}
                  </span>
                </div>

                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#DF9B78]">
                  Edad: {producto.edad}
                </span>

                <h3 className="mt-1 text-sm font-black leading-snug text-[#094A57] group-hover:text-[#0AA896] transition-colors">
                  {producto.nombre}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-gray-600 font-medium">
                  {producto.descripcion}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-[#094A57]/10 pt-3.5">
                <span className="text-base font-black text-[#094A57]">
                  {producto.precio}
                </span>

                <a
                  href="#contacto"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#5A96C8] to-[#4580B2] hover:from-[#4b88bc] hover:to-[#3a72a0] px-4 py-2 text-xs font-black text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Consultar
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
