import Link from 'next/link';
import { ArrowLeft, Calendar, Home } from 'lucide-react';

/**
 * Vista personalizada para errores 404 (página no encontrada) en Fonella.
 * Muestra la caricatura de Bárbara y su hija con botones de regreso seguro.
 */
export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Decoración sutil de fondo acorde a la paleta de Fonella */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#DF8A6B]/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[2rem] shadow-[0_20px_50px_rgba(15,118,110,0.10)] border border-white p-6 sm:p-10 text-center space-y-6">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-extrabold tracking-wider uppercase">
          Error 404 · Página no encontrada
        </div>

        {/* Ilustración estilo caricatura de Bárbara y su hija */}
        <div className="mx-auto w-full max-w-sm rounded-3xl overflow-hidden bg-[#FAF7F2] border border-teal-100/80 shadow-inner">
          <img
            src="/images/404-barbara-hija.jpg"
            alt="Caricatura de la Dra. Bárbara y su hija tristes buscando la página"
            className="w-full h-auto object-cover"
          />
        </div>

        {/* Mensaje amigable */}
        <div className="space-y-2 max-w-lg mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            ¡Uy! No encontramos esta página
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            La ruta que intentaste abrir no existe o fue movida. Volvamos al
            consultorio para continuar sin perder el ritmo.
          </p>
        </div>

        {/* Botones de navegación segura */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </Link>

          <Link
            href="/agenda"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Ir a Agenda Clínica
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Portal Especialista
          </Link>
        </div>
      </div>
    </main>
  );
}
