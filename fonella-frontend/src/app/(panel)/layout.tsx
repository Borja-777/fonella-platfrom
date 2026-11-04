'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Calendar,
  ClipboardList,
  Package,
  LogOut,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { apiService, Usuario } from '@/services/api';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarSesion() {
      try {
        const data = await apiService.getMe();
        setUsuario(data.usuario);
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    cargarSesion();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
      document.cookie = 'fonella_rol=; path=/; max-age=0';
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#136A7B]">
            Verificando credenciales clínicas...
          </p>
        </div>
      </div>
    );
  }

  const esFonoaudiologa = usuario?.rol === 'FONOAUDIOLOGA';

  return (
    <div className="min-h-screen w-full flex overflow-x-hidden bg-[#FAF6F0]">
      {/* 1. SIDEBAR ADMINISTRATIVO: Pegado a la izquierda, full height */}
      <aside className="w-72 lg:w-80 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-[#094A57] via-[#106A7C] via-65% to-[#EAF5F6] text-white flex flex-col justify-between p-6 border-r border-[#136A7B]/20 shadow-2xl z-30">
        <div className="space-y-6">
          {/* Header Marca FONELLA con Cápsula Crema Oficial */}
          <div className="flex flex-col items-center pb-4 border-b border-white/20">
            <div className="bg-[#F5ECDD] border border-[#DF9B78]/40 shadow-sm px-5 py-2 rounded-2xl flex items-center justify-center gap-1">
              <span className="font-black text-xl tracking-wider">
                <span className="text-[#0AA896]">F</span>
                <span className="text-[#5A96C8]">O</span>
                <span className="text-[#0AA896]">N</span>
                <span className="text-[#DF9B78]">E</span>
                <span className="text-[#0AA896]">L</span>
                <span className="text-[#5A96C8]">L</span>
                <span className="text-[#0AA896]">A</span>
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-medium tracking-wide mt-2 text-center">
              Centro Integral de Fonoaudiología
            </p>
          </div>

          {/* Perfil de la Especialista */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/20 shadow-xs">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white/80 shrink-0">
              <img
                src="/images/barbara-avatar.jpg"
                alt="Dra. Bárbara Ccucho Delgado"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white leading-tight truncate">
                {usuario?.nombreCompleto || 'Dra. Bárbara Ccucho Delgado'}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 truncate">
                  {usuario?.rol || 'FONOAUDIÓLOGA'}
                </span>
              </div>
            </div>
          </div>

          {/* Menú de Navegación Vertical */}
          <nav className="space-y-2.5 text-xs font-bold">
            {esFonoaudiologa && (
              <Link
                href="/personal"
                className={`px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all ${
                  pathname.startsWith('/personal')
                    ? 'bg-white text-[#0E5666] shadow-lg border border-white font-extrabold'
                    : 'text-white hover:bg-white/15'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#0AA896]" />
                  <span>Gestión de Personal</span>
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#0AA896] shadow-xs" />
              </Link>
            )}

            <div className="px-4 py-3.5 rounded-2xl bg-white/15 text-white/85 flex items-center justify-between border border-white/10 cursor-not-allowed">
              <span className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-white/70" />
                <span>Agenda Clínica</span>
              </span>
              <span className="text-[9px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                Próx.
              </span>
            </div>

            <div className="px-4 py-3.5 rounded-2xl bg-white/15 text-white/85 flex items-center justify-between border border-white/10 cursor-not-allowed">
              <span className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-white/70" />
                <span>Historias Clínicas</span>
              </span>
              <span className="text-[9px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                Próx.
              </span>
            </div>

            <div className="px-4 py-3.5 rounded-2xl bg-white/15 text-white/85 flex items-center justify-between border border-white/10 cursor-not-allowed">
              <span className="flex items-center gap-3">
                <Package className="w-4 h-4 text-white/70" />
                <span>Inventario Juguetes</span>
              </span>
              <span className="text-[9px] font-semibold bg-white/20 px-2 py-0.5 rounded-full text-white/90">
                Próx.
              </span>
            </div>
          </nav>
        </div>

        {/* Footer del Sidebar */}
        <div className="mt-8 pt-5 border-t border-[#136A7B]/20">
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-[#0E5666] mb-3">
            <Clock className="w-3.5 h-3.5 text-[#0AA896] animate-pulse" />
            <span>Cierre automático por inactividad: 30m</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-white" />
            <span>Cerrar Sesión Segura</span>
          </button>
        </div>
      </aside>

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL: Fondo visible y perfectamente encuadrado */}
      <div className="flex-1 min-w-0 relative flex flex-col min-h-screen">
        {/* Capa de Fotografía Clínica Oficial con Bárbara y la Niña enfrente */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none filter brightness-95"
          style={{
            backgroundImage: "url('/images/panel-bg.jpg')",
            backgroundPosition: "center 12%",
          }}
        />

        {/* Capa de Difuminado Suave que permite ver con claridad la sesión */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F0]/75 via-[#F5ECDD]/60 to-[#FAF6F0]/80 backdrop-blur-[1.5px] pointer-events-none" />

        {/* Contenido por encima de las capas con z-10 */}
        <main className="relative z-10 flex-1 w-full p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
