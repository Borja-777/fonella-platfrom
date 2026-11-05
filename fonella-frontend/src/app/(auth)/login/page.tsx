'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  KeyRound,
  Send,
  CheckCircle2,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiService, RecuperacionResponse } from '@/services/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Estados del Modal de Recuperación de Contraseña
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState('');
  const [loadingRecuperar, setLoadingRecuperar] = useState(false);
  const [resultadoRecuperacion, setResultadoRecuperacion] = useState<RecuperacionResponse | null>(null);
  const [errorRecuperar, setErrorRecuperar] = useState<string | null>(null);

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

  const handleSolicitarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRecuperar(null);
    setLoadingRecuperar(true);

    try {
      const data = await apiService.solicitarRecuperacion(emailRecuperar);
      setResultadoRecuperacion(data);
    } catch (err: any) {
      setErrorRecuperar(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoadingRecuperar(false);
    }
  };

  const abrirModalRecuperar = () => {
    setEmailRecuperar(email || '');
    setErrorRecuperar(null);
    setResultadoRecuperacion(null);
    setModalRecuperar(true);
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
            <span className="text-[#DF9B78] font-black text-2xl tracking-wider">E</span>
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
        <form onSubmit={handleSubmit} className="p-7 space-y-4">
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

          {/* Enlace para Recuperar Contraseña */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              onClick={abrirModalRecuperar}
              className="text-xs font-bold text-[#136A7B] hover:text-[#0AA896] hover:underline transition-colors cursor-pointer"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#136A7B] hover:bg-[#0AA896] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
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

      {/* Modal Interactivo: Recuperar Contraseña */}
      {modalRecuperar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/60">
            {/* Cabecera Naranja Terracota con Botón Rojo de Cerrar */}
            <div className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] px-6 py-4 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Recuperación de Contraseña
                  </h3>
                  <p className="text-[11px] text-white/90">
                    Restablece tu acceso clínico de forma segura
                  </p>
                </div>
              </div>

              {/* Botón Rojo Bonito de Cerrar */}
              <button
                type="button"
                onClick={() => setModalRecuperar(false)}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✕</span>
                <span>Cerrar</span>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {resultadoRecuperacion ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white shadow-md border border-emerald-400/50 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm">
                        Instrucciones generadas con éxito
                      </p>
                      <p className="text-xs text-emerald-50 mt-0.5 leading-relaxed">
                        {resultadoRecuperacion.mensaje}
                      </p>
                    </div>
                  </div>

                  {/* Previsualización Inmediata del Correo en Entorno Local */}
                  {resultadoRecuperacion.enlaceSimulado && (
                    <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#136A7B] flex items-center gap-1.5">
                          <span>📧</span>
                          <span>Previsualización del Correo Clínico (Modo Local)</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DF9B78]/20 text-[#B86E47]">
                          Token: 15 min
                        </span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                        <p className="text-slate-600">
                          <strong>Para:</strong> {resultadoRecuperacion.nombreCompleto || 'Colaborador FONELLA'} ({resultadoRecuperacion.email})
                        </p>
                        <p className="text-slate-600">
                          <strong>Asunto:</strong> Recuperación de Contraseña - FONELLA Portal Clínico
                        </p>
                        <p className="text-[11.5px] text-slate-500 leading-relaxed">
                          Se ha generado el enlace seguro de restablecimiento de un solo uso.
                        </p>
                      </div>

                      {/* Botón directo para probar inmediatamente */}
                      <a
                        href={resultadoRecuperacion.enlaceSimulado}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#136A7B] to-[#0AA896] hover:from-[#0E5B6A] hover:to-[#088677] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 text-center"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Abrir Pantalla de Restablecimiento Ahora</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalRecuperar(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSolicitarRecuperacion} className="space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ingresa tu correo institucional registrado. Te enviaremos un enlace seguro y temporal para que puedas definir una nueva contraseña.
                  </p>

                  {errorRecuperar && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{errorRecuperar}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Correo Institucional *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="email"
                        required
                        value={emailRecuperar}
                        onChange={(e) => setEmailRecuperar(e.target.value)}
                        placeholder="barbara.ccucho@fonella.co"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalRecuperar(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loadingRecuperar}
                      className="bg-[#136A7B] hover:bg-[#0AA896] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                    >
                      {loadingRecuperar ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generando enlace...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Instrucciones</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
