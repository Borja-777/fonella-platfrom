'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { apiService } from '@/services/api';

function ConfirmarCuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('No se proporcionó un token de confirmación válido.');
      setLoading(false);
      return;
    }

    const confirmar = async () => {
      try {
        const res = await apiService.confirmarCuenta(token);
        setExito(true);
        if (res.usuario?.nombreCompleto) {
          setNombreUsuario(res.usuario.nombreCompleto);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'El enlace de confirmación es inválido o ha expirado.');
      } finally {
        setLoading(false);
      }
    };

    confirmar();
  }, [token]);

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fotografía de Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ backgroundImage: `url('/images/login-bg.jpg')` }}
      />

      {/* Capa de Tinte Clínico y Difuminado */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-[#136A7B]/35 to-[#0AA896]/25 backdrop-blur-[3px]" />

      {/* Tarjeta Flotante */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-300">
        {/* Cabecera Institucional FONELLA */}
        <div className="bg-gradient-to-br from-[#136A7B] via-[#0E5B6A] to-[#0AA896] p-7 text-center relative shadow-inner">
          <div className="bg-[#FAF6F0] px-5 py-1.5 rounded-2xl shadow-md inline-flex items-center gap-0.5 border border-[#DF9B78]/40 mb-3">
            <span className="text-[#0AA896] font-black text-xl tracking-wider">F</span>
            <span className="text-[#5A96C8] font-black text-xl tracking-wider">O</span>
            <span className="text-[#0AA896] font-black text-xl tracking-wider">N</span>
            <span className="text-[#DF9B78] font-black text-xl tracking-wider">E</span>
            <span className="text-[#0AA896] font-black text-xl tracking-wider">L</span>
            <span className="text-[#5A96C8] font-black text-xl tracking-wider">L</span>
            <span className="text-[#0AA896] font-black text-xl tracking-wider">A</span>
          </div>

          <h1 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
            Confirmación de Cuenta
          </h1>
          <p className="text-xs text-teal-100 font-medium tracking-wide mt-1 opacity-90">
            Activación oficial de Especialista Titular y Administradora
          </p>
        </div>

        {/* Cuerpo */}
        <div className="p-7 space-y-5">
          {loading ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#136A7B]">
                Verificando correo y activando cuenta...
              </p>
              <p className="text-xs text-slate-500">
                Por favor espera un instante mientras validamos tu enlace seguro.
              </p>
            </div>
          ) : exito ? (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  ¡Cuenta Activada con Éxito!
                </h2>
                {nombreUsuario && (
                  <p className="text-sm font-bold text-[#136A7B] mt-0.5">
                    Bienvenida, {nombreUsuario}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Tu correo electrónico ha sido verificado correctamente. Tu perfil como <strong>Especialista Titular</strong> ya se encuentra activo en la base de datos de FONELLA.
                </p>
              </div>

              <div className="p-3 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/40 text-[11.5px] text-slate-600 flex items-center gap-2 text-left">
                <ShieldCheck className="w-5 h-5 text-[#0AA896] shrink-0" />
                <span>
                  Ya puedes ingresar al Portal Clínico utilizando tu correo y la contraseña que creaste.
                </span>
              </div>

              <Link
                href="/login"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#136A7B] to-[#0AA896] hover:from-[#0E5B6A] hover:to-[#088677] text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Ir al Inicio de Sesión</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 bg-red-100 border-2 border-red-300 rounded-full flex items-center justify-center mx-auto shadow-md">
                <AlertTriangle className="w-9 h-9 text-red-600" />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-800">
                  Enlace No Válido o Expirado
                </h2>
                <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 mt-2 leading-relaxed">
                  {errorMsg}
                </p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Los enlaces de confirmación tienen una vigencia de 24 horas por motivos de seguridad clínica. Si ya confirmaste tu cuenta, puedes iniciar sesión directamente.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#136A7B] hover:underline transition-colors mt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al inicio de sesión</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarCuentaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConfirmarCuentaContent />
    </Suspense>
  );
}
