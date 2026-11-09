
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
      className="border-y border-fonella-secundario/30 bg-fonella-crema/60 py-12"
    >
      <div className="mx-auto max-w-6xl px-4">

        <div className="mb-6">
          <span className="rounded-full bg-fonella-secundario/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-fonella-primario">
            Apoyo Terapéutico en Casa
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-fonella-primario md:text-3xl">
            Vitrina de Juguetes Didácticos
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            Material seleccionado para reforzar las terapias de habla,
            lenguaje y neurodesarrollo.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filtros.map((filtro) => (
            <button
              key={filtro.valor}
              type="button"
              onClick={() => setFiltroActivo(filtro.valor)}
              className={`rounded-lg border px-4 py-2 text-xs font-bold transition ${
                filtroActivo === filtro.valor
                  ? 'border-fonella-primario bg-fonella-primario text-white'
                  : 'border-fonella-primario/20 bg-white text-fonella-primario hover:bg-fonella-turquesa/10'
              }`}
            >
              {filtro.texto}
            </button>
          ))}
        </div>

        {/* Productos */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productosFiltrados.map((producto) => (
            <article
              key={producto.nombre}
              className="flex flex-col justify-between rounded-2xl border border-fonella-primario/15 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div>
                <div className="relative mb-3 flex h-28 items-center justify-center rounded-xl bg-fonella-crema text-5xl">
                  {producto.icono}

                  <span
                    className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-bold ${
                      producto.stock > 0
                        ? 'bg-fonella-turquesa text-white'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {producto.stock > 0
                      ? `Disponible (${producto.stock})`
                      : 'Agotado'}
                  </span>
                </div>

                <span className="text-xs font-bold uppercase text-fonella-secundario">
                  Edad: {producto.edad}
                </span>

                <h3 className="mt-1 text-sm font-extrabold leading-snug text-fonella-primario">
                  {producto.nombre}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  {producto.descripcion}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <span className="text-sm font-extrabold text-fonella-primario">
                  {producto.precio}
                </span>

                <a
                  href="#contacto"
                  className="rounded-lg bg-fonella-primario px-3 py-2 text-xs font-bold text-white transition hover:bg-fonella-turquesa"
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
