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
  ShieldCheck,
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
      <div className="min-h-screen bg-fonella-fondo flex items-center justify-center">
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
    <div className="min-h-screen relative flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* 1. Fotografía Oficial de Fondo Expandida (Sesión de Terapia DSC_6219) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 filter brightness-95"
        style={{ backgroundImage: "url('/images/panel-bg.jpg')" }}
      />
      {/* 2. Capa de Difuminado Pastel Cálido Oficial de Fonella */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#FAF6F0]/80 via-[#F5ECDD]/70 to-[#FAF6F0]/85 backdrop-blur-[2.5px] -z-10" />

      {/* 3. Grid de Distribución 2 Columnas (Estilo Prototipo) */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SIDEBAR ADMINISTRATIVO OFICIAL (Izquierda) */}
        <aside className="lg:col-span-4 xl:col-span-3 bg-[#136A7B]/95 backdrop-blur-md text-white rounded-3xl p-6 flex flex-col justify-between shadow-2xl border border-white/20 min-h-[580px]">
          <div className="space-y-6">
            {/* Header Marca FONELLA */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/20">
              <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
                <img
                  src="/images/barbara-avatar.jpg"
                  alt="Dra. Bárbara Ccucho"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight text-white">
                    FONELLA
                  </span>
                  <span className="text-[10px] font-bold bg-[#0AA896] text-white px-2 py-0.5 rounded-full uppercase">
                    Sprint 1
                  </span>
                </div>
                <p className="text-[10px] text-[#F5ECDD]/90">
                  Centro Integral de Fonoaudiología
                </p>
              </div>
            </div>

            {/* Badge y Perfil de la Especialista */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#0AA896] text-[10px] font-black uppercase tracking-wider text-white inline-block">
                ROL: {usuario?.rol || 'FONOAUDIÓLOGA'}
              </span>
              <h3 className="text-base font-black tracking-tight text-white mt-2">
                {usuario?.nombreCompleto || 'Dra. Bárbara Ccucho Delgado'}
              </h3>
              <p className="text-xs text-[#F5ECDD]/80 font-medium mt-0.5">
                {esFonoaudiologa ? 'Administradora Principal' : 'Personal Operativo'}
              </p>
            </div>

            {/* Menú de Navegación Vertical con Iconos Lucide */}
            <nav className="space-y-2 text-xs font-bold">
              {esFonoaudiologa && (
                <Link
                  href="/personal"
                  className={`px-3.5 py-3 rounded-2xl flex items-center justify-between transition-all ${
                    pathname.startsWith('/personal')
                      ? 'bg-[#0AA896] text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-white" />
                    <span>Gestión de Personal (HU-02)</span>
                  </span>
                  <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                </Link>
              )}

              <div className="px-3.5 py-3 rounded-2xl text-white/50 hover:bg-white/5 cursor-not-allowed flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-white/40" />
                <span>Agenda Clínica (Sprint 2)</span>
              </div>
              <div className="px-3.5 py-3 rounded-2xl text-white/50 hover:bg-white/5 cursor-not-allowed flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4 text-white/40" />
                <span>Historias Clínicas (Sprint 2)</span>
              </div>
              <div className="px-3.5 py-3 rounded-2xl text-white/50 hover:bg-white/5 cursor-not-allowed flex items-center gap-2.5">
                <Package className="w-4 h-4 text-white/40" />
                <span>Inventario Juguetes (Sprint 3)</span>
              </div>
            </nav>
          </div>

          {/* Footer Inactividad y Logout */}
          <div className="mt-8 pt-5 border-t border-white/20">
            <div className="flex items-center gap-2 text-[11px] text-[#F5ECDD]/90 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#0AA896] animate-pulse" />
              <span>Cierre automático por inactividad: 30m (HU-04)</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-white/15 hover:bg-rose-600 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión Segura</span>
            </button>
          </div>
        </aside>

        {/* ÁREA PRINCIPAL (Derecha) */}
        <main className="lg:col-span-8 xl:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}
