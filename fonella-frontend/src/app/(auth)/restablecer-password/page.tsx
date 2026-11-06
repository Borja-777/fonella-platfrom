'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Check, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { apiService } from '@/services/api';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

function RestablecerPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Verificadores de complejidad en tiempo real
  const passLongitudOk = password.length >= 8;
  const passMayusculaOk = /[A-Z]/.test(password);
  const passMinusculaOk = /[a-z]/.test(password);
  const passNumeroOk = /\d/.test(password);
  const passEspecialOk = /[^a-zA-Z0-9]/.test(password);
  const passCoinciden = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('El enlace no contiene un token de recuperación válido. Solicita un nuevo enlace.');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setErrorMsg('La contraseña no cumple con los 5 requisitos de seguridad obligatorios.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      await apiService.restablecerPassword(token, password);
      setExito(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al restablecer la contraseña. El enlace pudo haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fotografía Oficial de Fonella de Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ backgroundImage: `url('/images/login-bg.jpg')` }}
      />

      {/* Capa de Difuminado y Tinte Cálido */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-[#136A7B]/35 to-[#0AA896]/25 backdrop-blur-[3px]" />

      {/* Tarjeta de Restablecimiento Flotante */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-300">
        {/* Cabecera Azul Fonella */}
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
            Restablecer Contraseña
          </h1>
          <p className="text-xs text-teal-100 font-medium tracking-wide mt-1 opacity-90">
            Define una nueva clave segura para acceder al Portal Clínico
          </p>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-7 space-y-5">
          {/* Alerta de Éxito con Redirección */}
          {exito ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-700/90 border border-emerald-400 text-white shadow-xl text-center space-y-2 animate-fade-in backdrop-blur-md">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-100" />
              </div>
              <h3 className="font-extrabold text-base">¡Contraseña Actualizada!</h3>
              <p className="text-xs text-emerald-50 leading-relaxed">
                Tu clave ha sido reconfigurada exitosamente en la base de datos segura.
              </p>
              <p className="text-[11px] text-emerald-100 font-semibold pt-1">
                Redirigiendo automáticamente a la pantalla de inicio de sesión...
              </p>
            </div>
          ) : (
            <>
              {/* Alerta de Token Ausente */}
              {!token && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Token de seguridad no detectado</p>
                    <p className="mt-0.5 text-[11px]">
                      Este enlace no es válido. Debes solicitar un enlace de restablecimiento desde la pantalla de login.
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Error */}
              {errorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">No fue posible actualizar</p>
                    <p className="mt-0.5 opacity-90 text-[11px]">{errorMsg}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] uppercase tracking-wider mb-1.5">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ej: Fonella2026*"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#136A7B] focus:ring-2 focus:ring-[#136A7B]/20 transition text-sm bg-gray-50/70 hover:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist visual de requisitos */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#136A7B]" />
                    <span>Requisitos de seguridad obligatorios:</span>
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-slate-600">
                    <div className={`flex items-center gap-1.5 ${passLongitudOk ? 'text-emerald-700 font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passLongitudOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passMayusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passMayusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 letra Mayúscula</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passMinusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passMinusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 letra Minúscula</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${passNumeroOk ? 'text-emerald-700 font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passNumeroOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 Número</span>
                    </div>
                    <div className={`col-span-2 flex items-center gap-1.5 ${passEspecialOk ? 'text-emerald-700 font-semibold' : ''}`}>
                      <Check className={`w-3.5 h-3.5 ${passEspecialOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>1 Carácter especial (!@#$%^&*...)</span>
                    </div>
                  </div>
                </div>

                {/* Campo Confirmar Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] uppercase tracking-wider mb-1.5">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#136A7B] focus:ring-2 focus:ring-[#136A7B]/20 transition text-sm bg-gray-50/70 hover:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-[10.5px] mt-1 font-semibold flex items-center gap-1 ${passCoinciden ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {passCoinciden ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                    </p>
                  )}
                </div>

                {/* Botón Guardar Nueva Contraseña */}
                <button
                  type="submit"
                  disabled={loading || !token || !passCoinciden || !passLongitudOk}
                  className="w-full py-3.5 rounded-xl bg-[#136A7B] hover:bg-[#0AA896] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Actualizando credenciales...</span>
                    </>
                  ) : (
                    <span>Guardar Nueva Contraseña</span>
                  )}
                </button>
              </form>

              {/* Enlace para Regresar al Login */}
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#136A7B] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RestablecerPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RestablecerPasswordContent />
    </Suspense>
  );
}
