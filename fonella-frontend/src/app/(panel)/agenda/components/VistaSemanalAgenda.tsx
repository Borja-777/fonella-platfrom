'use client';

import React from 'react';
import { Coffee, Plus } from 'lucide-react';
import { Cita } from '@/services/api';
import {
  formatearHoraColombia,
  obtenerHoyColombia,
  obtenerSemanaLunesASabado,
} from './agendaUtils';

interface VistaSemanalAgendaProps {
  fechaReferencia: string;
  citasSemana: Cita[];
  onSeleccionarDia: (fecha: string) => void;
  onAgendarEnCelda: (fecha: string, hora: string) => void;
  onVerDetalle: (cita: Cita) => void;
}

const FRANJAS_MANANA = ['09:00', '10:00', '11:00'];
const FRANJAS_TARDE = ['14:00', '15:00', '16:00', '17:00'];

/**
 * Cuadrícula semanal (Lunes a Sábado) con franjas de 45 minutos y receso clínico 12:00–14:00.
 * Permite alternar con la vista diaria (Escenario 5 - HU Agenda 002).
 */
export default function VistaSemanalAgenda({
  fechaReferencia,
  citasSemana,
  onSeleccionarDia,
  onAgendarEnCelda,
  onVerDetalle,
}: VistaSemanalAgendaProps) {
  const dias = obtenerSemanaLunesASabado(fechaReferencia);
  const hoy = obtenerHoyColombia();

  // Busca si existe una cita activa (CONFIRMADA o ATENDIDA) en una celda (fecha, hora)
  const buscarCitaEnCelda = (fecha: string, hora: string): Cita | undefined =>
    citasSemana.find(
      (c) =>
        c.fecha.slice(0, 10) === fecha &&
        formatearHoraColombia(c.horaInicio) === hora &&
        (c.estado === 'CONFIRMADA' || c.estado === 'ATENDIDA'),
    );

  const renderFilaHora = (hora: string) => (
    <tr key={hora} className="border-b border-slate-100">
      <td className="py-2.5 px-3 text-xs font-extrabold text-slate-600 bg-slate-50/70 whitespace-nowrap w-24">
        {hora}
      </td>
      {dias.map((d) => {
        if (d.festivo) {
          return (
            <td
              key={`${d.fecha}-${hora}`}
              title={`Festivo: ${d.festivo}`}
              className="p-2 bg-rose-50/40 text-center text-[10px] font-semibold text-rose-500"
            >
              Festivo
            </td>
          );
        }

        const esTardeSabado = d.esSabado && FRANJAS_TARDE.includes(hora);
        if (esTardeSabado) {
          return (
            <td
              key={`${d.fecha}-${hora}`}
              className="p-2 bg-slate-50/80 text-center text-[10px] text-slate-400"
            >
              Cerrado
            </td>
          );
        }

        const cita = buscarCitaEnCelda(d.fecha, hora);
        if (cita) {
          const esAtendida = cita.estado === 'ATENDIDA';
          return (
            <td key={`${d.fecha}-${hora}`} className="p-1.5 align-top">
              <button
                type="button"
                onClick={() => onVerDetalle(cita)}
                className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all ${
                  esAtendida
                    ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400 text-emerald-900'
                    : 'bg-sky-50 border-sky-200 hover:border-teal-400 text-sky-900'
                }`}
              >
                <p className="font-extrabold truncate">
                  {cita.paciente.nombres} {cita.paciente.apellidos}
                </p>
                <p className="text-[10px] opacity-80 truncate">
                  {cita.servicio.nombre}
                </p>
              </button>
            </td>
          );
        }

        return (
          <td key={`${d.fecha}-${hora}`} className="p-1.5 align-top">
            <button
              type="button"
              onClick={() => onAgendarEnCelda(d.fecha, hora)}
              className="w-full h-12 rounded-xl border border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-slate-400 hover:text-teal-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Libre
            </button>
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="py-3 px-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Hora
            </th>
            {dias.map((d) => {
              const esHoy = d.fecha === hoy;
              const esSeleccionado = d.fecha === fechaReferencia;
              return (
                <th key={d.fecha} className="py-2.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => onSeleccionarDia(d.fecha)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                      d.festivo
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : esHoy
                          ? 'bg-teal-600 text-white shadow-sm'
                          : esSeleccionado
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d.etiqueta}
                    {d.festivo && (
                      <span className="block text-[9px] font-bold text-rose-600">
                        Festivo
                      </span>
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FRANJAS_MANANA.map(renderFilaHora)}

          {/* Fila visual del Receso Clínico Obligatorio 12:00 – 14:00 */}
          <tr className="bg-amber-50/70 border-y border-amber-200">
            <td className="py-2.5 px-3 text-xs font-extrabold text-amber-800 whitespace-nowrap">
              12:00 – 14:00
            </td>
            <td colSpan={6} className="py-2.5 px-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800">
                <Coffee className="w-3.5 h-3.5" />
                Receso Clínico y Almuerzo (Bloqueado Lunes a Viernes)
              </span>
            </td>
          </tr>

          {FRANJAS_TARDE.map(renderFilaHora)}
        </tbody>
      </table>
    </div>
  );
}
