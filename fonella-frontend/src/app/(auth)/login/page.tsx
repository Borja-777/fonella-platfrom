'use client';

import React, { useState, useRef } from 'react';
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
  User,
  Camera,
  Trash2,
  Award,
  Check,
  ShieldCheck,
  UserPlus,
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

  // Estados del Modal de Registro de Administrador
  const [modalRegistroAdmin, setModalRegistroAdmin] = useState(false);
  const [adminNombre, setAdminNombre] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [adminRethus, setAdminRethus] = useState('');
  const [adminFotoPreview, setAdminFotoPreview] = useState('');
  const [adminMostrarPassword, setAdminMostrarPassword] = useState(false);
  const [adminMostrarConfirmPassword, setAdminMostrarConfirmPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminExito, setAdminExito] = useState<{ email: string; mensaje: string } | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Verificadores de complejidad de contraseña del administrador
  const adminPassLongitudOk = adminPassword.length >= 8;
  const adminPassMayusculaOk = /[A-Z]/.test(adminPassword);
  const adminPassMinusculaOk = /[a-z]/.test(adminPassword);
  const adminPassNumeroOk = /\d/.test(adminPassword);
  const adminPassEspecialOk = /[^a-zA-Z0-9]/.test(adminPassword);
  const adminPassValida =
    adminPassLongitudOk &&
    adminPassMayusculaOk &&
    adminPassMinusculaOk &&
    adminPassNumeroOk &&
    adminPassEspecialOk;
  const adminPassCoinciden =
    adminPassword.length > 0 && adminPassword === adminConfirmPassword;

  const abrirModalRegistroAdmin = () => {
    setAdminNombre('');
    setAdminEmail('');
    setAdminPassword('');
    setAdminConfirmPassword('');
    setAdminRethus('');
    setAdminFotoPreview('');
    setAdminMostrarPassword(false);
    setAdminMostrarConfirmPassword(false);
    setAdminError(null);
    setAdminExito(null);
    setModalRegistroAdmin(true);
  };

  const handleSeleccionarFotoAdmin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formatosValidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!formatosValidos.includes(file.type.toLowerCase())) {
      setAdminError('Formato no compatible. Solo se permiten imágenes JPG o PNG.');
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }

    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setAdminError(`La fotografía seleccionada supera el límite máximo de ${MAX_MB} MB.`);
      if (adminFileInputRef.current) adminFileInputRef.current.value = '';
      return;
    }

    setAdminError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const formatoSalida = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(formatoSalida, 0.9);
          setAdminFotoPreview(dataUrl);
        } else {
          setAdminFotoPreview(reader.result as string);
        }
      };
      img.onerror = () => {
        setAdminError('No se pudo procesar la imagen seleccionada.');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRegistroAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);

    if (!adminPassValida) {
      setAdminError('La contraseña no cumple con los 5 requisitos de seguridad obligatorios.');
      return;
    }

    if (!adminPassCoinciden) {
      setAdminError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setAdminLoading(true);

    try {
      const res = await apiService.registroAdministrador({
        nombreCompleto: adminNombre,
        email: adminEmail,
        password: adminPassword,
        registroRethus: adminRethus || undefined,
        fotoPerfilUrl: adminFotoPreview || undefined,
      });

      setAdminExito({
        email: res.email,
        mensaje: res.mensaje,
      });
    } catch (err: any) {
      setAdminError(err.message || 'Error al procesar el registro de la administradora.');
    } finally {
      setAdminLoading(false);
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

          {/* Divisor Decorativo */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10.5px] uppercase">
              <span className="bg-white/90 px-3 text-slate-400 font-semibold tracking-wider">
                o
              </span>
            </div>
          </div>

          {/* Enlace para Crear Cuenta de Administrador */}
          <div className="text-center pt-0.5">
            <p className="text-xs text-slate-500">
              ¿Primera vez en el sistema?{' '}
              <button
                type="button"
                onClick={abrirModalRegistroAdmin}
                className="font-bold text-[#136A7B] hover:text-[#0AA896] hover:underline transition-colors cursor-pointer"
              >
                Crear cuenta de Administrador
              </button>
            </p>
          </div>
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
                        Instrucciones enviadas con éxito
                      </p>
                      <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                        {resultadoRecuperacion.mensaje}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#136A7B]">
                      <span>📬</span>
                      <span>¿Qué debes hacer ahora?</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Abre tu bandeja de entrada en tu proveedor de correo ({resultadoRecuperacion.email}).</li>
                      <li>Busca el correo con el asunto <strong>"Recuperación de Contraseña - FONELLA Portal Clínico"</strong>.</li>
                      <li>Haz clic en el enlace para definir tu nueva clave de acceso.</li>
                      <li>Si no lo ves en tu bandeja principal, revisa la carpeta de <strong>spam o correo no deseado</strong>.</li>
                    </ul>
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 mt-2">
                      ⏱️ <strong>Nota de seguridad:</strong> El enlace de recuperación es de un solo uso y expirará automáticamente en <strong>15 minutos</strong>.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalRecuperar(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#136A7B] hover:bg-[#0AA896] transition-all shadow-md cursor-pointer"
                    >
                      Entendido
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

      {/* Modal Interactivo: Crear Cuenta de Administrador */}
      {modalRegistroAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/60">
            {/* Cabecera Azul Fonella con Botón Rojo de Cerrar */}
            <div className="bg-gradient-to-r from-[#136A7B] via-[#0E5B6A] to-[#0AA896] px-6 py-4 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Crear Cuenta de Administrador
                  </h3>
                  <p className="text-[11px] text-teal-100">
                    Registro de Especialista Titular para la administración de FONELLA
                  </p>
                </div>
              </div>

              {/* Botón Rojo Bonito de Cerrar */}
              <button
                type="button"
                onClick={() => setModalRegistroAdmin(false)}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✕</span>
                <span>Cerrar</span>
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {adminExito ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 to-teal-700/90 text-white shadow-md border border-emerald-400/50 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-xs sm:text-sm">
                        ¡Cuenta Registrada con Éxito!
                      </p>
                      <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                        {adminExito.mensaje}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#136A7B]">
                      <span>📬</span>
                      <span>Confirmación de Correo Obligatoria</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>
                        Hemos enviado un mensaje de verificación a <strong>{adminExito.email}</strong>.
                      </li>
                      <li>
                        Abre el correo con asunto <strong>"Confirma tu cuenta de Administradora - FONELLA Portal Clínico"</strong>.
                      </li>
                      <li>
                        Haz clic en el botón <strong>"Confirmar y Activar mi Cuenta"</strong> para verificar que el correo te pertenece.
                      </li>
                      <li>
                        Una vez verificado, podrás iniciar sesión de inmediato con tu contraseña.
                      </li>
                    </ul>
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 mt-2">
                      🔒 <strong>Seguridad Clínica:</strong> Este enlace de confirmación tiene una vigencia de <strong>24 horas</strong>.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setModalRegistroAdmin(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-[#136A7B] hover:bg-[#0AA896] transition-all shadow-md cursor-pointer"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegistroAdmin} className="space-y-4">
                  {adminError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{adminError}</span>
                    </div>
                  )}

                  {/* 1. Sección para Subir Fotografía de Perfil */}
                  <div className="flex items-center gap-4 p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/30">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border-2 border-[#136A7B]/40 bg-white flex items-center justify-center">
                        {adminFotoPreview ? (
                          <img
                            src={adminFotoPreview}
                            alt="Foto Perfil Administrador"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8 text-[#136A7B]/50" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => adminFileInputRef.current?.click()}
                        className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#136A7B] hover:bg-[#0AA896] text-white rounded-xl shadow-md transition-all cursor-pointer"
                        title="Subir fotografía (JPG o PNG, máx. 10 MB)"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <input
                        ref={adminFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleSeleccionarFotoAdmin}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#136A7B]">
                        Fotografía de Perfil
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Formatos: <span className="font-bold text-slate-700">JPG o PNG</span>. Máximo: <span className="font-bold text-[#136A7B]">10 MB</span>.
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Haz clic en la cámara para seleccionar la imagen.
                      </p>
                      {adminFotoPreview && (
                        <button
                          type="button"
                          onClick={() => setAdminFotoPreview('')}
                          className="text-[11px] text-rose-600 hover:underline font-semibold mt-1 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Quitar fotografía</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Nombre Completo */}
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={adminNombre}
                        onChange={(e) => setAdminNombre(e.target.value)}
                        placeholder="Ej: Dra. Bárbara Ccucho Delgado"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                    </div>
                  </div>

                  {/* 3. Correo Electrónico */}
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="barbara.ccucho@fonella.co"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                    </div>
                  </div>

                  {/* 4. Contraseña Segura con Reglas */}
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Contraseña Segura *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type={adminMostrarPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Ej: Fonella2026*"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setAdminMostrarPassword(!adminMostrarPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {adminMostrarPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Checklist visual de requisitos de contraseña */}
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                      <p className="font-bold text-slate-700">Requisitos de contraseña:</p>
                      <div className="grid grid-cols-2 gap-1 text-slate-600">
                        <div className={`flex items-center gap-1.5 ${adminPassLongitudOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${adminPassLongitudOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Mínimo 8 caracteres</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${adminPassMayusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${adminPassMayusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 letra Mayúscula</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${adminPassMinusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${adminPassMinusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 letra Minúscula</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${adminPassNumeroOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${adminPassNumeroOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 Número</span>
                        </div>
                        <div className={`col-span-2 flex items-center gap-1.5 ${adminPassEspecialOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${adminPassEspecialOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 Carácter especial (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Confirmar Contraseña */}
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type={adminMostrarConfirmPassword ? 'text' : 'password'}
                        required
                        value={adminConfirmPassword}
                        onChange={(e) => setAdminConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setAdminMostrarConfirmPassword(!adminMostrarConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {adminMostrarConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {adminConfirmPassword && (
                      <p className={`text-[10.5px] mt-1 font-semibold flex items-center gap-1 ${adminPassCoinciden ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {adminPassCoinciden ? '✓ Las contraseñas coinciden' : '✕ Las contraseñas no coinciden'}
                      </p>
                    )}
                  </div>

                  {/* 6. Rol en el Sistema (Inmutable) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-[#136A7B]">
                        Rol en el Sistema *
                      </label>
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-[#136A7B]">
                        🔒 Inmutable: Administradora
                      </span>
                    </div>
                    <select
                      disabled
                      value="FONOAUDIOLOGA"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
                    >
                      <option value="FONOAUDIOLOGA">Fonoaudióloga Colega</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      El Rol en el Sistema es inmutable para garantizar la administración clínica y titularidad.
                    </p>
                  </div>

                  {/* 7. Código ReTHUS (Salud Colombia) */}
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Código ReTHUS (Salud Colombia)
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={adminRethus}
                        onChange={(e) => setAdminRethus(e.target.value)}
                        placeholder="RETHUS-760014829"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                    </div>
                  </div>

                  {/* Acciones del Modal */}
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setModalRegistroAdmin(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={adminLoading || !adminPassCoinciden || !adminPassValida}
                      className="bg-[#136A7B] hover:bg-[#0AA896] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                    >
                      {adminLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Registrando y enviando correo...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Crear Cuenta y Verificar Correo</span>
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
