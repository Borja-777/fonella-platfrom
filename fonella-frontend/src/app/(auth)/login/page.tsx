'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Clock } from 'lucide-react';
import { apiService } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLocked(false);
    setLoading(true);

    try {
      const data = await apiService.login(email, password);

      // Guardamos la cookie de rol para el middleware de Next.js
      document.cookie = `fonella_rol=${data.usuario.rol}; path=/; max-age=86400; SameSite=Strict`;

      // Redirigir según el rol
      if (data.usuario.rol === 'FONOAUDIOLOGA') {
        router.push('/personal');
      } else {
        router.push('/agenda');
      }
    } catch (err: any) {
      const mensaje = err.message || 'Error inesperado al iniciar sesión';
      setErrorMsg(mensaje);

      if (mensaje.includes('bloqueada temporalmente') || mensaje.includes('15 minutos')) {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fotografía Oficial de Fonella de Fondo (Dra. Bárbara en Sesión Clínica DSC_6249) */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
        style={{ backgroundImage: `url('/images/login-bg.jpg')` }}
      />

      {/* Capa de Difuminado y Tinte Cálido para Garantizar Legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-[#136A7B]/30 to-[#0AA896]/20 backdrop-blur-[3px]" />

      {/* Tarjeta de Login Centrada Flotante */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 overflow-hidden transition-all duration-300">
        {/* Cabecera Azul Fonella con Cápsula del Logo Multicolor */}
        <div className="bg-gradient-to-br from-[#136A7B] via-[#0E5B6A] to-[#0AA896] p-7 text-center relative shadow-inner">
          {/* Cápsula Marfil que hace resaltar las letras multicolores de FONELLA */}
          <div className="bg-[#FAF6F0] px-5 py-2 rounded-2xl shadow-md inline-flex items-center gap-0.5 border border-[#DF9B78]/40 mb-3 transform hover:scale-105 transition-transform duration-200">
            <span className="text-[#0AA896] font-black text-2xl tracking-wider">F</span>
            <span className="text-[#5A96C8] font-black text-2xl tracking-wider">O</span>
            <span className="text-[#0AA896] font-black text-2xl tracking-wider">N</span>
            <span className="text-[#5A96C8] font-black text-2xl tracking-wider">E</span>
            <span className="text-[#DF9B78] font-black text-2xl tracking-wider">L</span>
            <span className="text-[#0AA896] font-black text-2xl tracking-wider">L</span>
            <span className="text-[#5A96C8] font-black text-2xl tracking-wider">A</span>
          </div>

          <h1 className="text-xl font-black text-white tracking-tight drop-shadow-xs">
            Portal Clínico y Administrativo
          </h1>
          <p className="text-xs text-teal-100 font-medium tracking-wide mt-1 opacity-90">
            Centro Integral de Fonoaudiología
          </p>
        </div>

        {/* Formulario Limpio con Iconos */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Alertas de Error / Bloqueo */}
          {errorMsg && (
            <div
              className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs animate-fade-in ${
                isLocked
                  ? 'bg-amber-50 border border-amber-300 text-amber-900'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {isLocked ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{isLocked ? 'Cuenta Bloqueada (15 min)' : 'Error de Autenticación'}</p>
                <p className="mt-0.5 opacity-90">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Campo Email */}
          <div>
            <label className="block text-xs font-bold text-[#136A7B] uppercase tracking-wider mb-1.5">
              Correo Institucional
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@fonella.co"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#136A7B] focus:ring-2 focus:ring-[#136A7B]/20 transition text-sm bg-gray-50/70 hover:bg-white"
              />
            </div>
          </div>

          {/* Campo Contraseña con Toggle */}
          <div>
            <label className="block text-xs font-bold text-[#136A7B] uppercase tracking-wider mb-1.5">
              Contraseña
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
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#136A7B] focus:ring-2 focus:ring-[#136A7B]/20 transition text-sm bg-gray-50/70 hover:bg-white"
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

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#136A7B] hover:bg-[#0AA896] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <span>Iniciar Sesión Segura</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
