
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Clock,
  Baby,
  UserCheck,
  ClipboardList,
  Users,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { generarLinkSolicitudCitaAsistida } from '@/utils/whatsapp-link';
import { api } from '@/services/api';

type FormularioCita = {
  esMenorEdad: boolean;
  nombrePaciente: string;
  edadPaciente: string;
  telefono: string;
  email: string;
  nombreAcudiente: string;
  parentescoAcudiente: string;
  servicioInteres: string;
  duracionMinutos: number;
  motivoBreve: string;
  jornadaPreferida:
    | 'Mañana (8:00 a.m. - 12:00 m.)'
    | 'Tarde (2:00 p.m. - 6:00 p.m.)';
};

export default function SolicitarCitaPage() {
  const [formData, setFormData] = useState<FormularioCita>({
    esMenorEdad: true,
    nombrePaciente: '',
    edadPaciente: '',
    telefono: '',
    email: '',
    nombreAcudiente: '',
    parentescoAcudiente: 'Madre',
    servicioInteres: 'Evaluación e intervención del lenguaje y del habla',
    duracionMinutos: 45,
    motivoBreve: '',
    jornadaPreferida: 'Mañana (8:00 a.m. - 12:00 m.)',
  });

  const [errorEdad, setErrorEdad] = useState<string | null>(null);
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [validandoEmail, setValidandoEmail] = useState(false);
  const [emailVerificado, setEmailVerificado] = useState<string | null>(null);

  const PREFIJOS_OPERADOR_VALIDOS = ['300', '310', '315', '320'];

  const validarTelefono = (valor: string): string | null => {
    const trimmed = valor.trim();
    if (!trimmed) {
      return null;
    }

    if (!/^\d+$/.test(trimmed)) {
      return 'El número de teléfono solo debe contener dígitos numéricos.';
    }

    // Validar prefijo del operador (debe iniciar con 300, 310, 315 o 320)
    if (trimmed.length >= 3) {
      const prefijo = trimmed.slice(0, 3);
      if (!PREFIJOS_OPERADOR_VALIDOS.includes(prefijo)) {
        return `El prefijo (${prefijo}) no es válido. Debe iniciar con 300, 310, 315 o 320.`;
      }
    }

    if (trimmed.length !== 10) {
      return 'El número de teléfono debe contener exactamente 10 dígitos.';
    }

    return null;
  };

  const manejarCambioTelefono = (nuevoValor: string) => {
    const soloDigitos = nuevoValor.replace(/\D/g, '').slice(0, 10);
    actualizarCampo('telefono', soloDigitos);

    if (nuevoValor !== soloDigitos && !/^\d*$/.test(nuevoValor)) {
      setErrorTelefono('El número de teléfono solo debe contener dígitos numéricos.');
    } else if (soloDigitos.length >= 3) {
      const prefijo = soloDigitos.slice(0, 3);
      if (!PREFIJOS_OPERADOR_VALIDOS.includes(prefijo)) {
        setErrorTelefono(
          `El prefijo (${prefijo}) no es válido. Debe iniciar con 300, 310, 315 o 320.`,
        );
      } else if (soloDigitos.length === 10) {
        setErrorTelefono(null);
      } else if (errorTelefono && errorTelefono.includes('prefijo')) {
        setErrorTelefono(null);
      }
    } else {
      if (errorTelefono && errorTelefono.includes('prefijo')) {
        setErrorTelefono(null);
      }
    }
  };

  const manejarBlurTelefono = () => {
    if (formData.telefono.trim()) {
      setErrorTelefono(validarTelefono(formData.telefono));
    }
  };

  const validarEdad = (valor: string, esMenor: boolean): string | null => {
    const trimmed = valor.trim();
    if (!trimmed) {
      return null;
    }

    // 1. Validar que no contenga decimales (punto o coma)
    if (trimmed.includes('.') || trimmed.includes(',')) {
      return 'La edad debe ser un número entero sin decimales.';
    }

    // 2. Extraer sufijo "años" si el usuario lo escribe
    const soloDigitos = trimmed.replace(/\s*(años|año|anios|anio)\s*$/i, '');
    if (!/^\d+$/.test(soloDigitos)) {
      return 'La edad debe ser un número entero válido.';
    }

    const num = parseInt(soloDigitos, 10);
    if (isNaN(num) || num < 0) {
      return 'Ingresa una edad válida en años cumplidos.';
    }

    // 3. Reglas específicas por tipo de paciente
    if (esMenor) {
      if (num >= 18) {
        return 'Para paciente pediátrico, la edad debe ser menor a 18 años.';
      }
    } else {
      if (num < 18) {
        return 'Para paciente adulto, la edad debe ser mayor o igual a 18 años.';
      }
      if (num > 125) {
        return 'Ingresa una edad válida.';
      }
    }

    return null;
  };

  const cambiarModoPaciente = (esMenor: boolean) => {
    setFormData((actual) => ({
      ...actual,
      esMenorEdad: esMenor,
    }));
    if (formData.edadPaciente) {
      setErrorEdad(validarEdad(formData.edadPaciente, esMenor));
    }
  };

  const manejarCambioEdad = (nuevoValor: string) => {
    actualizarCampo('edadPaciente', nuevoValor);
    setErrorEdad(validarEdad(nuevoValor, formData.esMenorEdad));
  };

  const manejarCambioEmail = (nuevoEmail: string) => {
    actualizarCampo('email', nuevoEmail);
    if (errorEmail) setErrorEmail(null);
    if (emailVerificado && emailVerificado !== nuevoEmail.trim().toLowerCase()) {
      setEmailVerificado(null);
    }
  };

  const verificarExistenciaEmail = async (
    emailAValidar: string,
  ): Promise<boolean> => {
    const emailLimpio = emailAValidar.trim().toLowerCase();
    if (!emailLimpio) {
      setErrorEmail('El correo electrónico es obligatorio.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
      setErrorEmail('Ingresa un correo electrónico con formato válido.');
      return false;
    }

    if (emailVerificado === emailLimpio) {
      return true;
    }

    setValidandoEmail(true);
    setErrorEmail(null);

    try {
      await api.validarEmail(emailLimpio);
      setEmailVerificado(emailLimpio);
      return true;
    } catch (err: any) {
      setErrorEmail(
        err.message ||
          'El correo electrónico ingresado no existe en el servidor o no puede recibir mensajes.',
      );
      return false;
    } finally {
      setValidandoEmail(false);
    }
  };

  const actualizarCampo = <K extends keyof FormularioCita>(
    campo: K,
    valor: FormularioCita[K]
  ) => {
    setFormData((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // Genera la vista previa utilizando exactamente el mismo mensaje
  // que se preparará para WhatsApp, sin enviarlo.
  const mensajePreview = useMemo(() => {
    const enlace = generarLinkSolicitudCitaAsistida(formData);
    return new URL(enlace).searchParams.get('text') ?? '';
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const err = validarEdad(formData.edadPaciente, formData.esMenorEdad);
    if (err) {
      setErrorEdad(err);
      return;
    }

    const errTelefono = validarTelefono(formData.telefono);
    if (errTelefono || formData.telefono.trim().length !== 10) {
      setErrorTelefono(
        errTelefono || 'El número de teléfono debe contener exactamente 10 dígitos.',
      );
      return;
    }

    // Validar existencia real del correo electrónico vía backend
    const correoEsValido = await verificarExistenciaEmail(formData.email);
    if (!correoEsValido) {
      return;
    }

    const enlace = generarLinkSolicitudCitaAsistida(formData);
    window.open(enlace, '_blank', 'noopener,noreferrer');
  };

  const inputClass =
    'mt-1 w-full rounded-xl border border-[#136A7B]/20 bg-white/95 px-3.5 py-2.5 text-sm text-[#094A57] font-medium outline-none transition focus:border-[#0AA896] focus:ring-2 focus:ring-[#0AA896]/20 shadow-2xs';

  const labelClass = 'block text-xs font-bold text-[#094A57]';

  return (
    <main className="min-h-screen bg-[#F5ECDD] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">

        {/* Navegación */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 hover:bg-white text-xs font-black text-[#094A57] border border-[#136A7B]/20 shadow-xs px-4 py-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0AA896]" />
          <span>Volver al inicio</span>
        </Link>

        {/* Encabezado */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0AA896]/20 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#136A7B]">
            <span className="h-2 w-2 rounded-full bg-[#0AA896]" />
            <span>ATENCIÓN FONOAUDIOLÓGICA</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#08424E] sm:text-4xl">
                Solicitud de cita
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-[#136A7B] font-medium">
                Cuéntanos un poco sobre el paciente y el servicio que necesitas.
                Prepararemos tu solicitud para que puedas enviarla directamente por WhatsApp.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/80 border border-[#136A7B]/15 px-3.5 py-2 text-xs font-black text-[#094A57] shadow-xs">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-50 text-[#0AA896]">
                <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
              </span>
              <span>Sesiones de 45 minutos</span>
            </span>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">

          {/* FORMULARIO */}
          <section className="rounded-3xl border border-[#136A7B]/20 bg-white/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_12px_30px_-6px_rgba(19,106,123,0.12),0_4px_12px_-2px_rgba(19,106,123,0.06),inset_0_1px_1px_0_rgba(255,255,255,0.95)] lg:col-span-7">
            <div className="mb-6 flex items-center gap-3.5 border-b border-[#094A57]/10 pb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 border border-[#0AA896]/30 text-[#0AA896] shadow-2xs">
                <ClipboardList className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black text-[#094A57]">
                  Datos de la solicitud
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Completa los campos para preparar tu cita
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tipo de paciente - METÁFORAS CLÍNICAS REDISEÑADAS */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#094A57]">
                  1. ¿Para quién es la valoración o terapia?
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => cambiarModoPaciente(true)}
                    aria-pressed={formData.esMenorEdad}
                    className={`group rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                      formData.esMenorEdad
                        ? 'border-2 border-[#0AA896] bg-teal-50/70 shadow-sm ring-2 ring-[#0AA896]/15'
                        : 'border border-[#136A7B]/20 bg-white/75 hover:bg-white hover:border-[#0AA896]/50 shadow-2xs'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${
                        formData.esMenorEdad
                          ? 'bg-[#0AA896] text-white shadow-xs'
                          : 'bg-amber-50 border border-amber-200/80 text-amber-700'
                      }`}
                    >
                      <Baby className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block text-sm font-black text-[#094A57]">
                          Niño / Adolescente
                        </span>
                        {formData.esMenorEdad && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0AA896] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block text-xs text-gray-500 font-medium">
                        Requiere datos del acudiente
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => cambiarModoPaciente(false)}
                    aria-pressed={!formData.esMenorEdad}
                    className={`group rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                      !formData.esMenorEdad
                        ? 'border-2 border-[#0AA896] bg-teal-50/70 shadow-sm ring-2 ring-[#0AA896]/15'
                        : 'border border-[#136A7B]/20 bg-white/75 hover:bg-white hover:border-[#0AA896]/50 shadow-2xs'
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 ${
                        !formData.esMenorEdad
                          ? 'bg-[#0AA896] text-white shadow-xs'
                          : 'bg-teal-50 border border-[#0AA896]/30 text-[#0AA896]'
                      }`}
                    >
                      <UserCheck className="h-5 w-5" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="block text-sm font-black text-[#094A57]">
                          Paciente Adulto
                        </span>
                        {!formData.esMenorEdad && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0AA896] text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span className="mt-1 block text-xs text-gray-500 font-medium">
                        Agenda a nombre propio
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Datos del acudiente */}
              {formData.esMenorEdad && (
                <div className="space-y-3.5 rounded-2xl border border-[#DF9B78]/40 bg-gradient-to-br from-[#FFF9F5] via-[#FFF3EC] to-[#FBECE3] p-4 sm:p-5 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#DF9B78]/25 text-[#8C4320]">
                      <Users className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#8C4320]">
                      Datos del acudiente responsable
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className={labelClass}>
                      Nombre del acudiente *
                      <input
                        type="text"
                        required
                        value={formData.nombreAcudiente}
                        onChange={(e) =>
                          actualizarCampo('nombreAcudiente', e.target.value)
                        }
                        placeholder="Nombre completo"
                        className={inputClass}
                      />
                    </label>

                    <label className={labelClass}>
                      Parentesco *
                      <select
                        value={formData.parentescoAcudiente}
                        onChange={(e) =>
                          actualizarCampo('parentescoAcudiente', e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="Madre">Madre</option>
                        <option value="Padre">Padre</option>
                        <option value="Abuelo/a">Abuelo/a</option>
                        <option value="Tutor Legal">Tutor legal</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </label>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Correo electrónico del acudiente *
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          manejarCambioEmail(e.target.value)
                        }
                        onBlur={() => {
                          if (formData.email.trim()) {
                            verificarExistenciaEmail(formData.email);
                          }
                        }}
                        placeholder="acudiente@ejemplo.com"
                        className={`${inputClass} ${
                          errorEmail
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : emailVerificado === formData.email.trim().toLowerCase()
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200'
                            : ''
                        }`}
                      />
                    </label>
                    {validandoEmail && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-sky-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verificando existencia del correo...</span>
                      </p>
                    )}
                    {errorEmail && !validandoEmail && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorEmail}</span>
                      </p>
                    )}
                    {emailVerificado &&
                      emailVerificado === formData.email.trim().toLowerCase() &&
                      !validandoEmail &&
                      !errorEmail && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Correo existente y verificado</span>
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Paciente y edad */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className={`sm:col-span-2 ${labelClass}`}>
                  {formData.esMenorEdad
                    ? 'Nombre del niño/a (paciente) *'
                    : 'Nombre completo del paciente *'}
                  <input
                    type="text"
                    required
                    value={formData.nombrePaciente}
                    onChange={(e) =>
                      actualizarCampo('nombrePaciente', e.target.value)
                    }
                    placeholder="Nombre completo"
                    className={inputClass}
                  />
                </label>

                <div>
                  <label className={labelClass}>
                    Edad *
                    <input
                      type="text"
                      required
                      value={formData.edadPaciente}
                      onChange={(e) =>
                        manejarCambioEdad(e.target.value)
                      }
                      placeholder={formData.esMenorEdad ? 'Ej. 4' : 'Ej. 28'}
                      className={`${inputClass} ${
                        errorEdad
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                          : ''
                      }`}
                    />
                  </label>
                  {errorEdad && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errorEdad}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Teléfono y Correo */}
              {formData.esMenorEdad ? (
                <div>
                  <label className={labelClass}>
                    Teléfono de contacto *
                    <input
                      type="tel"
                      required
                      value={formData.telefono}
                      onChange={(e) =>
                        manejarCambioTelefono(e.target.value)
                      }
                      onBlur={manejarBlurTelefono}
                      placeholder="Ej. 3001234567"
                      maxLength={10}
                      className={`${inputClass} ${
                        errorTelefono
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                          : ''
                      }`}
                    />
                  </label>
                  {errorTelefono && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{errorTelefono}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Teléfono de contacto *
                      <input
                        type="tel"
                        required
                        value={formData.telefono}
                        onChange={(e) =>
                          manejarCambioTelefono(e.target.value)
                        }
                        onBlur={manejarBlurTelefono}
                        placeholder="Ej. 3001234567"
                        maxLength={10}
                        className={`${inputClass} ${
                          errorTelefono
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : ''
                        }`}
                      />
                    </label>
                    {errorTelefono && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorTelefono}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Correo electrónico *
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          manejarCambioEmail(e.target.value)
                        }
                        onBlur={() => {
                          if (formData.email.trim()) {
                            verificarExistenciaEmail(formData.email);
                          }
                        }}
                        placeholder="paciente@ejemplo.com"
                        className={`${inputClass} ${
                          errorEmail
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-200'
                            : emailVerificado === formData.email.trim().toLowerCase()
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-200'
                            : ''
                        }`}
                      />
                    </label>
                    {validandoEmail && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-sky-700">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Verificando existencia del correo...</span>
                      </p>
                    )}
                    {errorEmail && !validandoEmail && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errorEmail}</span>
                      </p>
                    )}
                    {emailVerificado &&
                      emailVerificado === formData.email.trim().toLowerCase() &&
                      !validandoEmail &&
                      !errorEmail && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span>Correo existente y verificado</span>
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Servicio y jornada */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  2. Servicio clínico de interés *
                  <select
                    value={formData.servicioInteres}
                    onChange={(e) =>
                      actualizarCampo('servicioInteres', e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="Evaluación e intervención del lenguaje y del habla">
                      Evaluación e intervención del lenguaje y del habla
                    </option>
                    <option value="Terapia de deglución y motricidad orofacial">
                      Terapia de deglución y motricidad orofacial
                    </option>
                    <option value="Terapia de voz">Terapia de voz</option>
                    <option value="Control y seguimiento">
                      Control y seguimiento
                    </option>
                  </select>
                </label>

                <label className={labelClass}>
                  3. Jornada preferida *
                  <select
                    value={formData.jornadaPreferida}
                    onChange={(e) =>
                      actualizarCampo(
                        'jornadaPreferida',
                        e.target.value as FormularioCita['jornadaPreferida']
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Mañana (8:00 a.m. - 12:00 m.)">
                      Mañana (8:00 a.m. - 12:00 m.)
                    </option>
                    <option value="Tarde (2:00 p.m. - 6:00 p.m.)">
                      Tarde (2:00 p.m. - 6:00 p.m.)
                    </option>
                  </select>
                </label>
              </div>

              {/* Duración fija */}
              <div className="flex items-center justify-between rounded-2xl border border-[#0AA896]/20 bg-teal-50/50 px-4 py-3 shadow-2xs">
                <div>
                  <p className="text-xs font-black text-[#094A57]">
                    Duración de la sesión
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 font-medium">
                    Todas las citas tienen la misma duración clínica
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#136A7B]/15 px-3 py-1.5 text-xs font-black text-[#094A57] shadow-2xs">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-50 border border-[#0AA896]/30 text-[#0AA896]">
                    <Clock className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </span>
                  <span>45 min</span>
                </span>
              </div>

              {/* Motivo */}
              <label className={labelClass}>
                4. Breve motivo de consulta *
                <textarea
                  required
                  rows={3}
                  value={formData.motivoBreve}
                  onChange={(e) =>
                    actualizarCampo('motivoBreve', e.target.value)
                  }
                  placeholder="Describe brevemente la razón de la consulta..."
                  className={`${inputClass} resize-y`}
                />
              </label>

              <div className="border-t border-[#094A57]/10 pt-5">
                <button
                  type="submit"
                  disabled={validandoEmail}
                  className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] px-6 py-4 text-sm font-black text-white shadow-[0_10px_25px_-4px_rgba(37,211,102,0.5),0_4px_10px_-2px_rgba(37,211,102,0.3)] hover:shadow-[0_14px_30px_-4px_rgba(37,211,102,0.6)] transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {validandoEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Verificando correo en el servidor...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 fill-white shrink-0"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                      </svg>
                      <span>Enviar solicitud por WhatsApp</span>
                    </>
                  )}
                </button>
                <p className="mt-2.5 text-center text-xs text-gray-500 font-medium">
                  Tu solicitud se preparará para enviarla directamente a recepción.
                </p>
              </div>
            </form>
          </section>

          {/* VISTA PREVIA DE WHATSAPP (MOCKUP PROFESIONAL) */}
          <aside className="flex flex-col overflow-hidden rounded-3xl border border-[#136A7B]/20 bg-[#ECE5DD] shadow-[0_12px_30px_-6px_rgba(19,106,123,0.12),0_4px_12px_-2px_rgba(19,106,123,0.06)] lg:col-span-5">
            <div className="flex items-center gap-3 bg-[#075E54] px-5 py-4 text-white shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0AA896] to-[#136A7B] text-xs font-black shadow-inner border border-white/20">
                FN
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight leading-tight">
                  Consultorio FONELLA
                </h2>
                <p className="text-[11px] text-teal-200/90 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Recepción · En línea</span>
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="mb-4 rounded-2xl border border-slate-300/80 bg-white/75 backdrop-blur-md p-3.5 shadow-2xs">
                <p className="text-xs font-black text-[#094A57]">
                  Vista previa del mensaje
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500 font-medium">
                  Así se estructurará tu mensaje cuando abras WhatsApp.
                </p>
              </div>

              <div className="flex-1 rounded-2xl rounded-tr-xs bg-[#DCF8C6] p-4 text-xs leading-relaxed text-gray-800 shadow-sm border border-emerald-300/50">
                <p className="whitespace-pre-wrap break-words font-medium">
                  {mensajePreview}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#0AA896]/20 bg-white/80 backdrop-blur-md p-3 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-[#0AA896] shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-gray-600 font-medium">
                  Esta es solamente una vista previa. El mensaje no se envía
                  hasta que lo confirmes en WhatsApp.
                </p>
              </div>

              <div className="mt-4 border-t border-slate-300/60 pt-3 text-center">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#094A57]/70">
                  FONELLA · Dra. Bárbara Ccucho Delgado
                </span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-8 text-center text-xs text-[#136A7B]/70 font-medium">
          La solicitud estará sujeta a confirmación de disponibilidad por recepción.
        </footer>
      </div>
    </main>
  );
}
