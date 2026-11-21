'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import { apiService, Cita, DisponibilidadDia } from '@/services/api';
import { formatearHoraColombia } from './agendaUtils';

interface ModalAccionCitaProps {
  cita: Cita | null;
  accion: 'CANCELAR' | 'REPROGRAMAR' | 'ATENDIDA' | 'INASISTENCIA' | null;
  onCerrar: () => void;
  onCompletado: (mensaje: string) => void;
}

/**
 * Modal para ejecutar Cancelación o Reprogramación sobre una cita CONFIRMADA (HU - Agenda - 003).
 * En cancelación advierte si faltan menos de 24 horas (penalización en totalFaltasTardias).
 */
export default function ModalAccionCita({
  cita,
  accion,
  onCerrar,
  onCompletado,
}: ModalAccionCitaProps) {
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDia | null>(null);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializa valores al abrir el modal
  useEffect(() => {
    if (!cita || !accion) return;
    setErrorMsg(null);
    setMotivoCancelacion('');
    setNuevaFecha(cita.fecha.slice(0, 10));
    setNuevaHora('');
  }, [cita, accion]);

  // Carga franjas disponibles cuando el modo es REPROGRAMAR
  useEffect(() => {
    if (!cita || accion !== 'REPROGRAMAR' || !nuevaFecha) return;
    let cancelado = false;

    async function cargar() {
      setCargandoFranjas(true);
      try {
        const data = await apiService.obtenerDisponibilidadAgenda(nuevaFecha);
        if (!cancelado) setDisponibilidad(data);
      } catch (err) {
        if (!cancelado) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Error consultando franjas disponibles.',
          );
        }
      } finally {
        if (!cancelado) setCargandoFranjas(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [cita, accion, nuevaFecha]);

  if (!cita || !accion) return null;

  // Calcula si la cancelación actual incumple la ventana de 24 horas
  const horasRestantes =
    (new Date(cita.horaInicio).getTime() - Date.now()) / (1000 * 60 * 60);
  const seraTardia = horasRestantes < 24;

  const handleConfirmarCancelacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!motivoCancelacion.trim()) {
      setErrorMsg('Debes indicar el motivo de la cancelación.');
      return;
    }

    setGuardando(true);
    try {
      const resp = await apiService.cancelarCita(cita.id, motivoCancelacion.trim());
      onCompletado(
        resp.cancelacionTardia
          ? `Cita cancelada tardíamente (<24h). Se sumó +1 al historial de faltas de ${cita.paciente.nombres}.`
          : `Cita de ${cita.paciente.nombres} cancelada a tiempo (sin penalización).`,
      );
      onCerrar();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo cancelar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmarReprogramacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!nuevaFecha || !nuevaHora) {
      setErrorMsg('Selecciona una nueva fecha y una franja disponible.');
      return;
    }

    setGuardando(true);
    try {
      await apiService.reprogramarCita(cita.id, {
        fecha: nuevaFecha,
        horaInicio: nuevaHora,
      });
      onCompletado(
        `Cita de ${cita.paciente.nombres} reprogramada para el ${nuevaFecha} a las ${nuevaHora}.`,
      );
      onCerrar();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo reprogramar la cita.',
      );
    } finally {
      setGuardando(false);
    }
  };

  /** Confirma el cambio de estado de la cita a ATENDIDA o INASISTENCIA. */
  const handleConfirmarEstado = async () => {
    if (accion !== 'ATENDIDA' && accion !== 'INASISTENCIA') return;
    setErrorMsg(null);
    setGuardando(true);
    try {
      await apiService.actualizarEstadoCita(cita.id, accion);
      onCompletado(
        accion === 'ATENDIDA'
          ? `Cita de ${cita.paciente.nombres} marcada como atendida.`
          : `Inasistencia registrada para ${cita.paciente.nombres} (+1 falta tardía).`,
      );
      onCerrar();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error al actualizar el estado de la cita.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const claseCabecera =
    accion === 'CANCELAR'
      ? 'bg-gradient-to-r from-rose-600 to-rose-500'
      : accion === 'INASISTENCIA'
        ? 'bg-gradient-to-r from-amber-600 to-amber-500'
        : accion === 'ATENDIDA'
          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
          : 'bg-gradient-to-r from-[#0F766E] to-[#14B8A6]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden">
        <div className={`p-5 text-white flex items-center justify-between ${claseCabecera}`}>
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              {accion === 'CANCELAR' ? (
                <>
                  <XCircle className="w-5 h-5" />
                  Cancelar Cita
                </>
              ) : accion === 'INASISTENCIA' ? (
                <>
                  <AlertTriangle className="w-5 h-5" />
                  Registrar Inasistencia (Falta)
                </>
              ) : accion === 'ATENDIDA' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirmar Cita Atendida
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Reprogramar Cita
                </>
              )}
            </h3>
            <p className="text-xs text-white/85 mt-0.5">
              {cita.paciente.nombres} {cita.paciente.apellidos} ·{' '}
              {formatearHoraColombia(cita.horaInicio)} ({cita.servicio.nombre})
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {accion === 'ATENDIDA' || accion === 'INASISTENCIA' ? (
            <div className="space-y-4">
              {accion === 'ATENDIDA' ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold leading-relaxed">
                  ¿Confirmas que <strong>{cita.paciente.nombres} {cita.paciente.apellidos}</strong> asistió a su sesión de <strong>{cita.servicio.nombre}</strong> y deseas registrarla como <strong>Atendida</strong>?
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    ¿Confirmas registrar una <strong>Inasistencia (Falta)</strong> para{' '}
                    <strong>{cita.paciente.nombres} {cita.paciente.apellidos}</strong>? Esta acción sumará{' '}
                    <strong>+1 falta</strong> al historial del paciente.
                  </span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={handleConfirmarEstado}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-white text-xs flex items-center justify-center gap-2 disabled:opacity-60 ${
                    accion === 'ATENDIDA'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  {accion === 'ATENDIDA' ? 'Confirmar Atendida' : 'Confirmar Falta'}
                </button>
              </div>
            </div>
          ) : accion === 'CANCELAR' ? (
            <form onSubmit={handleConfirmarCancelacion} className="space-y-4">
              {seraTardia ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Faltan menos de 24 horas para esta cita. Se registrará como{' '}
                    <strong>Cancelación Tardía</strong> y sumará{' '}
                    <strong>+1 falta</strong> al historial del paciente.
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  Cancelación con más de 24 horas de anticipación: se registrará{' '}
                  <strong>a tiempo</strong> y no sumará faltas.
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Motivo de cancelación *
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoCancelacion}
                  onChange={(e) => setMotivoCancelacion(e.target.value)}
                  placeholder="Ej. Incapacidad médica, cruce escolar, solicitud del acudiente..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar Cancelación
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmarReprogramacion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  Nueva fecha *
                </label>
                <input
                  type="date"
                  required
                  value={nuevaFecha}
                  onChange={(e) => {
                    setNuevaFecha(e.target.value);
                    setNuevaHora('');
                  }}
                  className="input-fecha-animado w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Franjas de 45 min disponibles *
                  </span>
                  {disponibilidad?.bloqueReceso && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      Receso {disponibilidad.bloqueReceso.inicio}–{disponibilidad.bloqueReceso.fin}
                    </span>
                  )}
                </div>

                {cargandoFranjas ? (
                  <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                    Cargando franjas...
                  </div>
                ) : !disponibilidad?.abierto ? (
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold text-center">
                    {disponibilidad?.motivoCierre || 'Consultorio cerrado.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {disponibilidad.franjas.map((f) => (
                      <button
                        key={f.horaInicio}
                        type="button"
                        disabled={!f.disponible}
                        onClick={() => setNuevaHora(f.horaInicio)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                          nuevaHora === f.horaInicio
                            ? 'bg-teal-600 text-white border-teal-600'
                            : f.disponible
                              ? 'bg-white text-slate-700 border-slate-200 hover:border-teal-400'
                              : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed line-through'
                        }`}
                      >
                        {f.horaInicio}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || !nuevaHora}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar Reprogramación
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
