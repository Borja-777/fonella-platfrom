import Link from 'next/link';
import { Calendar, Lock } from 'lucide-react';

export default function HeaderPublico() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#136A7B]/25 shadow-[0_4px_20px_-2px_rgba(19,106,123,0.08)] transition-all">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">

        {/* 1. Logotipo Oficial con Cápsula Institucional FONELLA */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-[#FAF6F0] border border-[#DF9B78]/40 group-hover:border-[#0AA896]/50 shadow-xs px-3.5 py-1.5 rounded-2xl flex items-center transition-all">
            <span className="text-2xl font-black tracking-wider text-[#0AA896]">F</span>

            {/* Isotipo Oficial de la Oreja Fonella */}
            <svg
              className="mx-0.5 h-7 w-6 transition-transform group-hover:scale-105"
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

            <span className="text-2xl font-black tracking-wider text-[#0AA896]">N</span>
            <span className="text-2xl font-black tracking-wider text-[#5A96C8]">E</span>
            <span className="text-2xl font-black tracking-wider text-[#DF9B78]">L</span>
            <span className="text-2xl font-black tracking-wider text-[#0AA896]">L</span>
            <span className="text-2xl font-black tracking-wider text-[#5A96C8]">A</span>
          </div>

          <div className="hidden border-l-2 border-[#0AA896]/30 pl-3 sm:block">
            <p className="text-xs font-black text-[#094A57] leading-tight">
              Dra. Bárbara Ccucho Delgado
            </p>
            <p className="text-[10px] font-bold tracking-wider text-[#0AA896] uppercase mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Fonoaudióloga</span>
            </p>
          </div>
        </Link>

        {/* 2. Menú de Navegación y Botones de Acción */}
        <nav className="flex flex-wrap items-center gap-2 sm:gap-3">
          <a
            href="#seccion-servicios"
            className="px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#0AA896] hover:bg-teal-50/70 rounded-xl transition-all"
          >
            Servicios Clínicos
          </a>

          <a
            href="#seccion-juguetes"
            className="px-3 py-2 text-xs font-bold text-gray-700 hover:text-[#0AA896] hover:bg-teal-50/70 rounded-xl transition-all"
          >
            Juguetes Didácticos
          </a>

          {/* CTA Principal: Agendar Cita */}
          <Link
            href="/solicitar-cita"
            className="rounded-full bg-gradient-to-r from-[#0AA896] to-[#136A7B] hover:from-[#099787] hover:to-[#0f5462] px-4 py-2 text-xs font-black text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Agendar Cita</span>
          </Link>

          {/* CTA Secundario: Portal Administrativo / Especialista */}
          <Link
            href="/login"
            className="rounded-full bg-white/90 border border-[#136A7B]/25 hover:border-[#136A7B]/50 px-3.5 py-2 text-xs font-bold text-[#094A57] hover:bg-teal-50/70 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-[#0AA896]" />
            <span>Portal Especialista</span>
          </Link>
        </nav>

      </div>
    </header>
  );
}
