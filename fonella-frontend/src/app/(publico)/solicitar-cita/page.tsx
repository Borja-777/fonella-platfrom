
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { generarLinkSolicitudCitaAsistida } from '@/utils/whatsapp-link';

type FormularioCita = {
  esMenorEdad: boolean;
  nombrePaciente: string;
  edadPaciente: string;
  telefono: string;
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
    nombreAcudiente: '',
    parentescoAcudiente: 'Madre',
    servicioInteres: 'Evaluación e intervención del lenguaje y del habla',
    duracionMinutos: 45,
    motivoBreve: '',
    jornadaPreferida: 'Mañana (8:00 a.m. - 12:00 m.)',
  });

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const enlace = generarLinkSolicitudCitaAsistida(formData);
    window.open(enlace, '_blank', 'noopener,noreferrer');
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0AA896] focus:ring-2 focus:ring-[#0AA896]/15';

  const labelClass = 'block text-xs font-semibold text-slate-700';

  return (
    <main className="min-h-screen bg-[#F5ECDD] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">

        {/* Navegación */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#136A7B] transition hover:text-[#0AA896]"
        >
          <span>←</span> Volver al inicio
        </Link>

        {/* Encabezado */}
        <header className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0AA896]/20 bg-white/70 px-3 py-1.5 text-xs font-bold text-[#136A7B]">
            <span className="h-2 w-2 rounded-full bg-[#0AA896]" />
            ATENCIÓN FONOAUDIOLÓGICA
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#136A7B] sm:text-3xl">
                Solicitud de cita
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Cuéntanos un poco sobre el paciente y el servicio que necesitas.
                Prepararemos tu solicitud para que puedas enviarla por WhatsApp.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-[#136A7B] shadow-sm">
              ⏱️ Sesiones de 45 minutos
            </span>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">

          {/* FORMULARIO */}
          <section className="rounded-2xl border border-[#136A7B]/10 bg-white p-5 shadow-sm sm:p-7 lg:col-span-7">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0AA896]/10 text-xl">
                📋
              </div>
              <div>
                <h2 className="font-extrabold text-[#136A7B]">
                  Datos de la solicitud
                </h2>
                <p className="text-xs text-slate-500">
                  Completa los campos para continuar
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tipo de paciente */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#136A7B]">
                  1. ¿Para quién es la valoración o terapia?
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => actualizarCampo('esMenorEdad', true)}
                    aria-pressed={formData.esMenorEdad}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      formData.esMenorEdad
                        ? 'border-[#0AA896] bg-[#0AA896]/10 text-[#136A7B]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#0AA896]/50'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">
                      👶 Niño / Adolescente
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Requiere datos del acudiente
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => actualizarCampo('esMenorEdad', false)}
                    aria-pressed={!formData.esMenorEdad}
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      !formData.esMenorEdad
                        ? 'border-[#0AA896] bg-[#0AA896]/10 text-[#136A7B]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#0AA896]/50'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">
                      🧑 Paciente adulto
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Agenda a nombre propio
                    </span>
                  </button>
                </div>
              </div>

              {/* Datos del acudiente */}
              {formData.esMenorEdad && (
                <div className="space-y-3 rounded-xl border border-[#DF9B78]/40 bg-[#F5ECDD]/50 p-4">
                  <h3 className="text-xs font-bold text-[#136A7B]">
                    👨‍👩‍👧 Datos del acudiente responsable
                  </h3>

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

                <label className={labelClass}>
                  Edad *
                  <input
                    type="text"
                    required
                    value={formData.edadPaciente}
                    onChange={(e) =>
                      actualizarCampo('edadPaciente', e.target.value)
                    }
                    placeholder="Ej. 4 años"
                    className={inputClass}
                  />
                </label>
              </div>

              {/* Teléfono */}
              <label className={labelClass}>
                Teléfono de contacto *
                <input
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) =>
                    actualizarCampo('telefono', e.target.value)
                  }
                  placeholder="Ej. 3001234567"
                  className={inputClass}
                />
              </label>

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
              <div className="flex items-center justify-between rounded-xl border border-[#0AA896]/20 bg-[#0AA896]/5 px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-[#136A7B]">
                    Duración de la sesión
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Todas las citas tienen la misma duración
                  </p>
                </div>
                <span className="rounded-full bg-[#F5ECDD] px-3 py-1.5 text-xs font-extrabold text-[#136A7B]">
                  ⏱️ 45 min
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

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0AA896] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#078F80] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#0AA896]/20"
                >
                  📲 Enviar solicitud por WhatsApp
                </button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Tu solicitud se preparará para enviarla a recepción.
                </p>
              </div>
            </form>
          </section>

          {/* VISTA PREVIA DE WHATSAPP */}
          <aside className="flex flex-col overflow-hidden rounded-2xl border border-slate-300 bg-[#ECE5DD] shadow-sm lg:col-span-5">
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0AA896] text-sm font-extrabold">
                FN
              </div>
              <div>
                <h2 className="text-sm font-extrabold">
                  Consultorio FONELLA
                </h2>
                <p className="text-xs text-emerald-200">
                  Recepción · Respuesta asistida
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <div className="mb-4 rounded-lg border border-slate-300/70 bg-white/60 p-3">
                <p className="text-xs font-bold text-slate-700">
                  Vista previa del mensaje
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Así se verá la información cuando decidas enviarla por WhatsApp.
                </p>
              </div>

              <div className="flex-1 rounded-xl bg-[#DCF8C6] p-4 text-xs leading-relaxed text-slate-800 shadow-sm ring-1 ring-emerald-200">
                <p className="whitespace-pre-wrap break-words">
                  {mensajePreview}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#0AA896]/20 bg-white/70 p-3">
                <span className="text-base">🔒</span>
                <p className="text-xs leading-relaxed text-slate-600">
                  Esta es solamente una vista previa. El mensaje no se envía
                  mientras completas el formulario.
                </p>
              </div>

              <div className="mt-4 border-t border-slate-300/80 pt-3 text-center">
                <span className="text-xs font-semibold text-slate-600">
                  FONELLA · Atención fonoaudiológica
                </span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-6 text-center text-xs text-slate-500">
          La solicitud estará sujeta a confirmación de disponibilidad por recepción.
        </footer>
      </div>
    </main>
  );
}
