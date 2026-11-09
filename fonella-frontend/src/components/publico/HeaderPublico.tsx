
import Link from 'next/link';

export default function HeaderPublico() {
  return (
    <header className="relative z-50 border-b border-fonella-secundario/30 bg-fonella-crema">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">

        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center text-3xl font-extrabold tracking-wider">
            <span className="text-fonella-turquesa">F</span>

            {/* Isotipo de oreja */}
            <svg
              className="mx-0.5 h-8 w-7"
              viewBox="0 0 28 32"
              fill="none"
              stroke="#5A96C8"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M8 12C8 6.5 12.5 3 17.5 3C22.5 3 25 7 25 12.5C25 18.5 20 20.5 18 24.5C16.8 26.8 14.5 29 11.5 29C8.5 29 7 26.5 7 24" />
              <path d="M12 12.5C12 9.5 14.5 7.5 17.5 7.5C20 7.5 21.5 9.5 21.5 12C21.5 15 18.5 16.5 16.5 19" />
              <circle cx="13.5" cy="16.5" r="2" fill="#5A96C8" />
            </svg>

            <span className="text-fonella-turquesa">N</span>
            <span className="text-fonella-cielo">E</span>
            <span className="text-fonella-secundario">L</span>
            <span className="text-fonella-turquesa">L</span>
            <span className="text-fonella-cielo">A</span>
          </div>

          <div className="hidden border-l-2 border-fonella-turquesa/40 pl-3 sm:block">
            <p className="text-xs font-bold text-fonella-primario">
              Dra. Bárbara Ccucho Delgado
            </p>
            <p className="text-xs font-semibold tracking-wide text-fonella-turquesa">
              FONOAUDIÓLOGA
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a href="#seccion-servicios" className="px-2 py-2 text-xs font-semibold text-fonella-primario hover:text-fonella-turquesa">
            Servicios Clínicos
          </a>

          <a href="#seccion-juguetes" className="px-2 py-2 text-xs font-semibold text-fonella-primario hover:text-fonella-turquesa">
            Juguetes Didácticos
          </a>

          <Link href="/solicitar-cita" className="rounded-full bg-fonella-turquesa px-4 py-2 text-xs font-bold text-white hover:bg-fonella-primario">
            Agendar Cita
          </Link>

          <Link href="/login" className="rounded-full border border-fonella-primario/30 px-4 py-2 text-xs font-semibold text-fonella-primario transition hover:bg-fonella-primario hover:text-white">
            Acceso Personal
          </Link>
        </nav>

      </div>
    </header>
  );
}
