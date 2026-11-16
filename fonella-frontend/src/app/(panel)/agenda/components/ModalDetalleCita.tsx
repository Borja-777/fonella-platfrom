'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Phone,
  RefreshCw,
  Stethoscope,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { Cita } from '@/services/api';
import { calcularEdadDesdeFecha, formatearHoraColombia } from './agendaUtils';

interface ModalDetalleCitaProps {
  cita: Cita | null;
  rolUsuario?: 'FONOAUDIOLOGA' | 'ASISTENTE';
  onCerrar: () => void;
  onReprogramar: (cita: Cita) => void;
  onCancelar: (cita: Cita) => void;
}

/**
 * Tarjeta modal flotante de detalle rápido al hacer clic sobre un bloque de cita
 * en el calendario (Escenario 4 - HU Agenda 002).
 */
export default function ModalDetalleCita({
  cita,
  rolUsuario,
  onCerrar,
  onReprogramar,
  onCancelar,
}: ModalDetalleCitaProps) {
  if (!cita) return null;

  const edad = calcularEdadDesdeFecha(cita.paciente.fechaNacimiento);
  const acudienteRel = cita.paciente.acudientes?.[0];
  const acudiente = acudienteRel?.acudiente;
  const esConfirmada = cita.estado === 'CONFIRMADA';
  const esAsistente = rolUsuario === 'ASISTENTE';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-100 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {cita.fecha.slice(0, 10)} · {formatearHoraColombia(cita.horaInicio)} –{' '}
              {formatearHoraColombia(cita.horaFin)}
            </p>
            <h3 className="text-lg font-extrabold mt-0.5">
              Detalle Rápido de Cita
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resumen clínico y de contacto */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            {/* Paciente y edad */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Paciente
                </p>
                <p className="text-sm font-extrabold text-slate-800">
                  {cita.paciente.nombres} {cita.paciente.apellidos}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {edad !== null ? `${edad} años` : 'Edad no registrada'} ·{' '}
                  {cita.paciente.tipoDocumento} {cita.paciente.numeroDocumento}
                </p>
              </div>
            </div>

            {/* Acudiente */}
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Acudiente / Responsable
                </p>
                {acudiente ? (
                  <>
                    <p className="text-sm font-bold text-slate-800">
                      {acudiente.nombres} {acudiente.apellidos}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {acudienteRel.parentesco} · Tel: {acudiente.telefonoPrincipal}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    No aplica (paciente mayor de edad / contacto directo)
                  </p>
                )}
              </div>
            </div>

            {/* Teléfono de contacto y tipo de terapia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-teal-600" />
                  Teléfono
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {acudiente?.telefonoPrincipal || cita.paciente.telefonoContacto}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-teal-600" />
                  Duración
                </p>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {cita.servicio.duracionMinutos} minutos
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-start gap-2.5">
              <Stethoscope className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Tipo de Terapia
                </p>
                <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                  {cita.servicio.nombre}
                </p>
              </div>
            </div>

            {cita.paciente.totalFaltasTardias > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Historial: {cita.paciente.totalFaltasTardias} falta(s) previa(s)
              </div>
            )}
          </div>

          {/* Botones de acción rápida del Escenario 4 */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {Boolean(cita.paciente.historiaClinica) &&
              (esAsistente ? (
                <button
                  type="button"
                  disabled
                  title="Acceso restringido a Fonoaudióloga Titular"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Ir a Historia Clínica (Solo Fonoaudióloga)
                </button>
              ) : (
                <Link
                  href={`/historias-clinicas?pacienteId=${cita.paciente.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Ir a Historia Clínica
                </Link>
              ))}

            {esConfirmada && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCerrar();
                    onReprogramar(cita);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reprogramar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCerrar();
                    onCancelar(cita);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelar Cita
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
