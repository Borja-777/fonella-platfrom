"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { apiService, Usuario } from "@/services/api";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    cargarSesion();
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
      document.cookie = "fonella_rol=; path=/; max-age=0";
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fonella-fondo flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-fonella-turquesa border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-fonella-primario">
            Verificando sesión clínica...
          </p>
        </div>
      </div>
    );
  }

  const esFonoaudiologa = usuario?.rol === "FONOAUDIOLOGA";

  return (
    <div className="min-h-screen relative flex flex-col overflow-x-hidden">
      {/* Fotografía Oficial de Fondo Expandida (Sesión de Terapia DSC_6219) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-20 filter brightness-95"
        style={{ backgroundImage: "url('/images/panel-bg.jpg')" }}
      />
      {/* Capa de Difuminado Suave con Tonalidad Pastel Cálida Fonella */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#FAF6F0]/75 via-[#F5ECDD]/65 to-[#FAF6F0]/80 backdrop-blur-[2px] -z-10" />

      {/* Top Navigation Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E8DFC8] sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo y Marca con Avatar Oficial de la Especialista */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-[#0AA896]/40 shrink-0 ring-2 ring-emerald-50">
              <img
                src="/images/barbara-avatar.jpg"
                alt="Dra. Bárbara Ccucho Delgado"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-fonella-primario">
                  FONELLA
                </span>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                  Sprint 1
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">
                Centro Integral de Fonoaudiología
              </p>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="hidden md:flex items-center gap-1">
            {esFonoaudiologa && (
              <Link
                href="/personal"
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                  pathname.startsWith("/personal")
                    ? "bg-fonella-primario text-white shadow-sm"
                    : "text-gray-600 hover:text-fonella-primario hover:bg-gray-100"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gestión de Personal</span>
              </Link>
            )}

            <div className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 flex items-center gap-2 cursor-not-allowed">
              <Calendar className="w-4 h-4" />
              <span>Agenda (S2)</span>
            </div>
            <div className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 flex items-center gap-2 cursor-not-allowed">
              <ClipboardList className="w-4 h-4" />
              <span>Pacientes (S2)</span>
            </div>
            <div className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 flex items-center gap-2 cursor-not-allowed">
              <FileText className="w-4 h-4" />
              <span>Historias (S3)</span>
            </div>
            <div className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 flex items-center gap-2 cursor-not-allowed">
              <Package className="w-4 h-4" />
              <span>Juguetes (S3)</span>
            </div>
          </nav>

          {/* Perfil del Usuario y Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-800">
                {usuario?.nombreCompleto}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-fonella-turquesa" />
                <span className="text-[10px] uppercase font-semibold text-fonella-primario">
                  {usuario?.rol}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión Segura"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
