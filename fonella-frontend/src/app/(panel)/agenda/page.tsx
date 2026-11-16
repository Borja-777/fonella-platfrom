'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  UserCheck,
  XCircle,
} from 'lucide-react';
import {
  apiService,
  Cita,
  DisponibilidadDia,
  EstadoCita,
  ServicioTerapeutico,
  Usuario,
} from '@/services/api';
import ModalAccionCita from './components/ModalAccionCita';
import ModalAgendarCita from './components/ModalAgendarCita';
import ModalDetalleCita from './components/ModalDetalleCita';
import VistaSemanalAgenda from './components/VistaSemanalAgenda';
import {
  calcularEdadDesdeFecha,
  desplazarFecha,
  formatearHoraColombia,
  obtenerHoraActualColombia,
  obtenerHoyColombia,
  obtenerSemanaLunesASabado,
} from './components/agendaUtils';

/** Etiquetas y estilos visuales por estado de cita en BD. */
const ESTILOS_ESTADO: Record<
  EstadoCita,
  { label: string; badgeClass: string }
> = {
  CONFIRMADA: {
    label: 'Confirmada',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  ATENDIDA: {
    label: 'Atendida',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CANCELADA_A_TIEMPO: {
    label: 'Cancelada a tiempo',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  CANCELADA_TARDIA: {
    label: 'Cancelación tardía',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  INASISTENCIA: {
    label: 'Inasistencia',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export default function AgendaPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [alertaForbidden, setAlertaForbidden] = useState(false);

  // Fecha activa en el calendario y pestaña visual (Semana, Día o Lista operativa)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(obtenerHoyColombia);
  const [vistaActiva, setVistaActiva] = useState<'DIA' | 'SEMANA' | 'LISTA'>('DIA');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [horaActual, setHoraActual] = useState(obtenerHoraActualColombia);

  // Datos reales cargados desde el backend
  const [servicios, setServicios] = useState<ServicioTerapeutico[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [citasSemana, setCitasSemana] = useState<Cita[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modales de agendamiento y acciones (Cancelar / Reprogramar)
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [fechaPreseleccionada, setFechaPreseleccionada] = useState<string | undefined>(
    undefined,
  );
  const [horaPreseleccionada, setHoraPreseleccionada] = useState<string | undefined>(
    undefined,
  );
  const [citaAccion, setCitaAccion] = useState<Cita | null>(null);
  const [tipoAccion, setTipoAccion] = useState<
    'CANCELAR' | 'REPROGRAMAR' | 'ATENDIDA' | 'INASISTENCIA' | null
  >(null);
  const [citaDetalle, setCitaDetalle] = useState<Cita | null>(null);
  const [citaMotivoModal, setCitaMotivoModal] = useState<Cita | null>(null);
  const [resumenCitasVista, setResumenCitasVista] = useState<
    'INICIO' | 'DIA' | 'SEMANA'
  >('INICIO');
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  // Carga inicial de perfil, catálogo de servicios y parámetro ?error=forbidden
  useEffect(() => {
    async function cargarInicial() {
      try {
        const [meData, serviciosData] = await Promise.all([
          apiService.getMe(),
          apiService.listarServiciosCitas(),
        ]);
        setUsuario(meData.usuario);
        setServicios(serviciosData);
      } catch (err) {
        console.error('Error inicializando agenda:', err);
      }
    }
    cargarInicial();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'forbidden') {
        setAlertaForbidden(true);
      }
    }
  }, []);

  /** Actualiza la línea roja de hora_actual cada 30 segundos en tiempo real. */
  useEffect(() => {
    const intervalo = setInterval(() => {
      setHoraActual(obtenerHoraActualColombia());
    }, 30_000);
    return () => clearInterval(intervalo);
  }, []);

  /** Recarga citas del día, semana y disponibilidad de franjas de 45 minutos. */
  const recargarDia = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const semana = obtenerSemanaLunesASabado(fechaSeleccionada);
      const [citasData, dispData, semanaData] = await Promise.all([
        apiService.listarCitas({ fecha: fechaSeleccionada }),
        apiService.obtenerDisponibilidadAgenda(fechaSeleccionada),
        apiService.listarCitas({
          desde: semana[0].fecha,
          hasta: semana[semana.length - 1].fecha,
        }),
      ]);
      setCitas(citasData);
      setDisponibilidad(dispData);
      setCitasSemana(semanaData);
    } catch (err) {
      setErrorCarga(
        err instanceof Error ? err.message : 'No se pudo cargar la agenda del día.',
      );
    } finally {
      setCargando(false);
    }
  }, [fechaSeleccionada]);

  useEffect(() => {
    recargarDia();
  }, [recargarDia]);

  /** Muestra notificación temporal de éxito y recarga el día. */
  const notificarYRecargar = (mensaje: string) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(null), 5500);
    recargarDia();
  };

  /** Abre el modal de confirmación para marcar asistencia (ATENDIDA) o falta (INASISTENCIA). */
  const handleCambiarEstado = (
    cita: Cita,
    nuevoEstado: 'ATENDIDA' | 'INASISTENCIA',
  ) => {
    setCitaAccion(cita);
    setTipoAccion(nuevoEstado);
  };

  const abrirModalConHora = (hora?: string, fechaOverride?: string) => {
    setFechaPreseleccionada(fechaOverride);
    setHoraPreseleccionada(hora);
    setModalAgendarAbierto(true);
  };

  const citasFiltradas = citas.filter((c) => {
    const q = filtroBusqueda.trim().toLowerCase();
    if (!q) return true;
    const nombrePaciente = `${c.paciente.nombres} ${c.paciente.apellidos}`.toLowerCase();
    const doc = c.paciente.numeroDocumento.toLowerCase();
    const acudiente = c.paciente.acudientes?.[0]?.acudiente;
    const nombreAcudiente = acudiente
      ? `${acudiente.nombres} ${acudiente.apellidos}`.toLowerCase()
      : '';
    return (
      nombrePaciente.includes(q) ||
      doc.includes(q) ||
      nombreAcudiente.includes(q) ||
      c.paciente.telefonoContacto.includes(q)
    );
  });

  // Contadores KPI del día seleccionado
  const totalConfirmadas = citas.filter((c) => c.estado === 'CONFIRMADA').length;
  const totalAtendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;
  const totalCanceladasOFaltas = citas.filter((c) =>
    ['CANCELADA_A_TIEMPO', 'CANCELADA_TARDIA', 'INASISTENCIA'].includes(c.estado),
  ).length;

  // Contadores KPI de la semana seleccionada
  const totalConfirmadasSemana = citasSemana.filter(
    (c) => c.estado === 'CONFIRMADA',
  ).length;
  const totalAtendidasSemana = citasSemana.filter(
    (c) => c.estado === 'ATENDIDA',
  ).length;
  const totalCanceladasOFaltasSemana = citasSemana.filter((c) =>
    ['CANCELADA_A_TIEMPO', 'CANCELADA_TARDIA', 'INASISTENCIA'].includes(c.estado),
  ).length;

  const franjasManana =
    disponibilidad?.franjas.filter((f) => f.jornada === 'MANANA') || [];
  const franjasTarde =
    disponibilidad?.franjas.filter((f) => f.jornada === 'TARDE') || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Alerta de acceso denegado (redirigido por middleware RBAC) */}
      {alertaForbidden && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-amber-800">
            <ShieldAlert className="w-6 h-6 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-sm">Acceso Restringido por Rol Operativo</p>
              <p className="text-xs text-amber-700/90 mt-0.5">
                La sección de Gestión de Personal es exclusiva para la Fonoaudióloga Titular.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertaForbidden(false)}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg bg-amber-100/80 transition-colors"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Notificación de éxito o error */}
      {mensajeExito && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{mensajeExito}</span>
        </div>
      )}

      {errorCarga && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-bold">{errorCarga}</span>
        </div>
      )}

      {/* Encabezado Principal */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(15,118,110,0.06)] border border-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 xl:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap lg:flex-nowrap">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-lg xl:text-[21px] font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
              Agenda Clínica y Recepción Operativa
            </h1>
            {usuario && (
              <span
                className={`text-[9.5px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${usuario.rol === 'FONOAUDIOLOGA'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}
              >
                {usuario.rol === 'FONOAUDIOLOGA'
                  ? 'Fonoaudióloga Titular'
                  : 'Asistente / Recepción'}
              </span>
            )}
          </div>
        </div>

        {/* Controles de fecha y botón de nueva cita */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() =>
                setFechaSeleccionada((f) =>
                  desplazarFecha(f, vistaActiva === 'SEMANA' ? -7 : -1),
                )
              }
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
              title={vistaActiva === 'SEMANA' ? 'Semana anterior' : 'Día anterior'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="input-fecha-animado bg-transparent px-1.5 text-xs font-bold text-slate-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setFechaSeleccionada((f) =>
                  desplazarFecha(f, vistaActiva === 'SEMANA' ? 7 : 1),
                )
              }
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
              title={vistaActiva === 'SEMANA' ? 'Semana siguiente' : 'Día siguiente'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFechaSeleccionada(obtenerHoyColombia())}
            className="px-3 py-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-100 text-teal-800 text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={() => abrirModalConHora(undefined)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Tarjetas interactivas de Resumen Operativo: Día vs Semana */}
      {resumenCitasVista === 'INICIO' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setResumenCitasVista('DIA')}
            className="bg-white/95 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-teal-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-extrabold text-xl shrink-0">
                {citas.length}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Resumen del día
                </p>
                <p className="text-base font-extrabold text-slate-800 group-hover:text-teal-700 transition-colors mt-0.5">
                  Ver citas del día
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setResumenCitasVista('SEMANA')}
            className="bg-white/95 hover:bg-white rounded-2xl p-5 border border-slate-100 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-xl shrink-0">
                {citasSemana.length}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Resumen semanal
                </p>
                <p className="text-base font-extrabold text-slate-800 group-hover:text-indigo-700 transition-colors mt-0.5">
                  Ver citas de la semana
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setResumenCitasVista('INICIO')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 text-xs font-bold shadow-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Retroceder
            </button>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              {resumenCitasVista === 'DIA'
                ? 'Citas del día'
                : 'Citas de la semana'}
            </span>
          </div>

          {resumenCitasVista === 'DIA' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-extrabold text-lg">
                  {citas.length}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Citas del Día
                  </p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">Registradas</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-extrabold text-lg">
                  {totalConfirmadas}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Confirmadas
                  </p>
                  <p className="text-sm font-bold text-sky-700 mt-0.5">Por atender</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
                  {totalAtendidas}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Atendidas
                  </p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">Completadas</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg">
                  {totalCanceladasOFaltas}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cancel. / Faltas
                  </p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">Historial día</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-lg">
                  {citasSemana.length}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Citas Semana
                  </p>
                  <p className="text-sm font-bold text-indigo-700 mt-0.5">Registradas</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-extrabold text-lg">
                  {totalConfirmadasSemana}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Confirmadas
                  </p>
                  <p className="text-sm font-bold text-sky-700 mt-0.5">Por atender</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
                  {totalAtendidasSemana}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Atendidas
                  </p>
                  <p className="text-sm font-bold text-emerald-700 mt-0.5">Completadas</p>
                </div>
              </div>

              <div className="bg-white/95 rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg">
                  {totalCanceladasOFaltasSemana}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cancel. / Faltas
                  </p>
                  <p className="text-sm font-bold text-amber-700 mt-0.5">Historial semana</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selector de Vista: Semana vs Día vs Lista Operativa (Escenario 5) */}
      <div className="bg-white/95 rounded-3xl shadow-[0_10px_30px_rgba(15,118,110,0.06)] border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 self-start">
            <button
              type="button"
              onClick={() => setVistaActiva('SEMANA')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${vistaActiva === 'SEMANA'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Semana
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('DIA')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${vistaActiva === 'DIA'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Día
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('LISTA')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${vistaActiva === 'LISTA'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Lista ({citas.length})
            </button>
          </div>

          {vistaActiva === 'LISTA' && (
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por paciente, documento o teléfono..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>

        {cargando ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
            <span className="text-xs font-semibold">Cargando agenda del día...</span>
          </div>
        ) : vistaActiva === 'SEMANA' ? (
          /* VISTA SEMANAL: Lunes a Sábado con franjas de 45 min y receso (Escenario 5) */
          <VistaSemanalAgenda
            fechaReferencia={fechaSeleccionada}
            citasSemana={citasSemana}
            onSeleccionarDia={(fechaDia) => {
              setFechaSeleccionada(fechaDia);
              setVistaActiva('DIA');
            }}
            onAgendarEnCelda={(fechaCelda, horaCelda) =>
              abrirModalConHora(horaCelda, fechaCelda)
            }
            onVerDetalle={(c) => setCitaDetalle(c)}
          />
        ) : vistaActiva === 'DIA' ? (
          /* VISTA DIARIA: FRANJAS DE 45 MIN + RECESO + LÍNEA ROJA HORA_ACTUAL (Escenario 5) */
          <div className="p-5 space-y-6">
            {!disponibilidad?.abierto ? (
              <div className="p-10 text-center rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  {disponibilidad?.motivoCierre || 'Consultorio cerrado en esta fecha'}
                </p>
              </div>
            ) : (
              <>
                {fechaSeleccionada === obtenerHoyColombia() &&
                  horaActual.minutos < 9 * 60 && (
                    <LineaHoraActual horaStr={horaActual.horaStr} />
                  )}

                {/* Jornada Mañana */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Jornada Mañana (09:00 – 12:00)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {franjasManana.map((franja) => (
                      <TarjetaFranja
                        key={franja.horaInicio}
                        franja={franja}
                        procesandoId={procesandoId}
                        onAgendar={() => abrirModalConHora(franja.horaInicio)}
                        onVerDetalle={(c) => setCitaDetalle(c)}
                        onCambiarEstado={handleCambiarEstado}
                        onReprogramar={(c) => {
                          setCitaAccion(c);
                          setTipoAccion('REPROGRAMAR');
                        }}
                        onCancelar={(c) => {
                          setCitaAccion(c);
                          setTipoAccion('CANCELAR');
                        }}
                      />
                    ))}
                  </div>
                </div>

                {fechaSeleccionada === obtenerHoyColombia() &&
                  horaActual.minutos >= 9 * 60 &&
                  horaActual.minutos < 12 * 60 && (
                    <LineaHoraActual horaStr={horaActual.horaStr} />
                  )}

                {/* Bloque de Receso Clínico Obligatorio (12:00 - 14:00) */}
                {disponibilidad.bloqueReceso && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-amber-900">
                          Receso Clínico y Almuerzo ({disponibilidad.bloqueReceso.inicio} –{' '}
                          {disponibilidad.bloqueReceso.fin})
                        </p>
                        <p className="text-[11px] text-amber-700">
                          Franja bloqueada automáticamente — no disponible para agendamiento.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {fechaSeleccionada === obtenerHoyColombia() &&
                  horaActual.minutos >= 12 * 60 &&
                  horaActual.minutos < 14 * 60 && (
                    <LineaHoraActual horaStr={horaActual.horaStr} />
                  )}

                {/* Jornada Tarde (solo L-V) */}
                {franjasTarde.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Jornada Tarde (14:00 – 18:00)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {franjasTarde.map((franja) => (
                        <TarjetaFranja
                          key={franja.horaInicio}
                          franja={franja}
                          procesandoId={procesandoId}
                          onAgendar={() => abrirModalConHora(franja.horaInicio)}
                          onVerDetalle={(c) => setCitaDetalle(c)}
                          onCambiarEstado={handleCambiarEstado}
                          onReprogramar={(c) => {
                            setCitaAccion(c);
                            setTipoAccion('REPROGRAMAR');
                          }}
                          onCancelar={(c) => {
                            setCitaAccion(c);
                            setTipoAccion('CANCELAR');
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {fechaSeleccionada === obtenerHoyColombia() &&
                  horaActual.minutos >= 14 * 60 && (
                    <LineaHoraActual horaStr={horaActual.horaStr} />
                  )}
              </>
            )}
          </div>
        ) : (
          /* VISTA 2: LISTA OPERATIVA DE CITAS DEL DÍA (HU - Agenda - 001 & 003) */
          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[1040px] text-left border-collapse">
              <thead>
                <tr className="bg-[#DF8A6B] text-white text-[11px] font-bold uppercase tracking-wider">
                  <th className="w-[10%] py-3.5 px-4 whitespace-nowrap">Hora</th>
                  <th className="w-[10%] py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Fecha</span>
                    </div>
                  </th>
                  <th className="w-[20%] py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Paciente</span>
                    </div>
                  </th>
                  <th className="w-[17%] py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Contacto / Acudiente</span>
                    </div>
                  </th>
                  <th className="w-[18%] py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Servicio</span>
                    </div>
                  </th>
                  <th className="w-[14%] py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Estado</span>
                    </div>
                  </th>
                  <th className="w-[11%] py-3.5 pl-5 pr-8 text-left whitespace-nowrap">
                    <div className="flex items-center justify-start gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Acciones</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {citasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-500">
                      <Calendar className="w-8 h-8 text-teal-500 mx-auto mb-2 opacity-70" />
                      <p className="font-bold text-slate-700">
                        No hay citas registradas para esta fecha o criterio.
                      </p>
                    </td>
                  </tr>
                ) : (
                  citasFiltradas.map((cita) => {
                    const edad = calcularEdadDesdeFecha(cita.paciente.fechaNacimiento);
                    const acudiente = cita.paciente.acudientes?.[0]?.acudiente;
                    const estilo = ESTILOS_ESTADO[cita.estado];
                    const esConfirmada = cita.estado === 'CONFIRMADA';

                    const [anioCita, mesCita, diaCita] = cita.fecha
                      .slice(0, 10)
                      .split('-');
                    const fechaCitaTexto =
                      anioCita && mesCita && diaCita
                        ? `${diaCita}/${mesCita}/${anioCita}`
                        : cita.fecha.slice(0, 10);

                    return (
                      <tr key={cita.id} className="hover:bg-teal-50/20 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-slate-800 whitespace-nowrap">
                          {formatearHoraColombia(cita.horaInicio)} –{' '}
                          {formatearHoraColombia(cita.horaFin)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600 whitespace-nowrap">
                          {fechaCitaTexto}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-800">
                            {cita.paciente.nombres} {cita.paciente.apellidos}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>
                              {cita.paciente.tipoDocumento} {cita.paciente.numeroDocumento}
                              {edad !== null && ` · ${edad} años`}
                            </span>
                            {cita.paciente.totalFaltasTardias > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                <AlertTriangle className="w-3 h-3" />
                                {cita.paciente.totalFaltasTardias} falta(s)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-600">
                          {acudiente ? (
                            <p className="font-semibold text-slate-700">
                              {acudiente.nombres} {acudiente.apellidos} (Acudiente)
                            </p>
                          ) : (
                            <p className="font-semibold text-slate-700">Contacto directo</p>
                          )}
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-teal-600" />
                            {acudiente?.telefonoPrincipal || cita.paciente.telefonoContacto}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 text-xs font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                            {cita.servicio.nombre}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-left">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${estilo.badgeClass}`}
                          >
                            {estilo.label}
                          </span>
                        </td>
                        <td className="py-3.5 pl-5 pr-8 text-left whitespace-nowrap">
                          {esConfirmada ? (
                            <MenuEditarCita
                              onSeleccionarAccion={(accion) => {
                                setCitaAccion(cita);
                                setTipoAccion(accion);
                              }}
                            />
                          ) : cita.estado === 'CANCELADA_A_TIEMPO' ||
                            cita.estado === 'CANCELADA_TARDIA' ? (
                            <button
                              type="button"
                              onClick={() => setCitaMotivoModal(cita)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors"
                            >
                              Ver motivo
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Cerrada</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Agendar Cita + Creación Rápida de Paciente */}
      <ModalAgendarCita
        abierto={modalAgendarAbierto}
        fechaInicial={fechaPreseleccionada || fechaSeleccionada}
        horaInicial={horaPreseleccionada}
        servicios={servicios}
        onCerrar={() => setModalAgendarAbierto(false)}
        onCitaCreada={notificarYRecargar}
      />

      {/* Modal para Cancelar o Reprogramar Cita (HU - Agenda - 003) */}
      <ModalAccionCita
        cita={citaAccion}
        accion={tipoAccion}
        onCerrar={() => {
          setCitaAccion(null);
          setTipoAccion(null);
        }}
        onCompletado={notificarYRecargar}
      />

      {/* Modal de Detalle Rápido al hacer clic sobre un bloque de cita (Escenario 4) */}
      <ModalDetalleCita
        cita={citaDetalle}
        rolUsuario={usuario?.rol}
        onCerrar={() => setCitaDetalle(null)}
        onReprogramar={(c) => {
          setCitaAccion(c);
          setTipoAccion('REPROGRAMAR');
        }}
        onCancelar={(c) => {
          setCitaAccion(c);
          setTipoAccion('CANCELAR');
        }}
      />

      {/* Modal para consultar el motivo completo de una cita cancelada */}
      {citaMotivoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-extrabold">Motivo de Cancelación</h3>
                  <p className="text-[11px] text-rose-100">
                    {ESTILOS_ESTADO[citaMotivoModal.estado].label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitaMotivoModal(null)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-sm font-extrabold text-slate-800">
                  {citaMotivoModal.paciente.nombres} {citaMotivoModal.paciente.apellidos}
                </p>
                <p className="text-xs text-slate-500">
                  {formatearHoraColombia(citaMotivoModal.horaInicio)} –{' '}
                  {formatearHoraColombia(citaMotivoModal.horaFin)} ·{' '}
                  {citaMotivoModal.servicio.nombre}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Motivo registrado
                </p>
                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {citaMotivoModal.motivoCancelacion ||
                    'No se registró un motivo detallado para esta cancelación.'}
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setCitaMotivoModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Botón desplegable multifunción "Editar" para ejecutar acciones sobre una cita CONFIRMADA.
 */
function MenuEditarCita({
  onSeleccionarAccion,
}: {
  onSeleccionarAccion: (
    accion: 'ATENDIDA' | 'INASISTENCIA' | 'REPROGRAMAR' | 'CANCELAR',
  ) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [posicion, setPosicion] = useState<{ top: number; left: number } | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const manejarClickFuera = (e: MouseEvent) => {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target as Node)
      ) {
        setAbierto(false);
        setPosicion(null);
      }
    };
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, [abierto]);

  const elegir = (
    accion: 'ATENDIDA' | 'INASISTENCIA' | 'REPROGRAMAR' | 'CANCELAR',
  ) => {
    setAbierto(false);
    setPosicion(null);
    onSeleccionarAccion(accion);
  };

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (abierto) {
      setAbierto(false);
      setPosicion(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom;
    const abrirArriba = espacioAbajo < 170;
    setPosicion({
      top: abrirArriba ? Math.round(rect.top - 156) : Math.round(rect.bottom + 6),
      left: Math.round(rect.right - 176),
    });
    setAbierto(true);
  };

  return (
    <div ref={contenedorRef} className="relative inline-block text-left">
      <div className="inline-flex items-stretch rounded-lg bg-white border border-[#0084FF] shadow-xs overflow-hidden">
        <span className="px-3 py-1.5 text-xs font-semibold text-[#0084FF] flex items-center select-none">
          Editar
        </span>
        <button
          type="button"
          onClick={toggleMenu}
          className="px-2 py-1.5 border-l border-[#0084FF] text-[#0084FF] hover:bg-sky-50 transition-colors flex items-center justify-center cursor-pointer"
          title="Ver opciones de cita"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {abierto && posicion && (
        <div
          style={{
            position: 'fixed',
            top: `${posicion.top}px`,
            left: `${posicion.left}px`,
            width: '176px',
          }}
          className="rounded-2xl bg-white shadow-xl border border-slate-100 py-1.5 z-50"
        >
          <button
            type="button"
            onClick={() => elegir('ATENDIDA')}
            className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Atendida
          </button>
          <button
            type="button"
            onClick={() => elegir('INASISTENCIA')}
            className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Falta
          </button>
          <button
            type="button"
            onClick={() => elegir('REPROGRAMAR')}
            className="w-full px-3.5 py-2 text-left text-xs font-bold text-sky-700 hover:bg-sky-50 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reprogramar
          </button>
          <div className="my-1 border-t border-slate-100" />
          <button
            type="button"
            onClick={() => elegir('CANCELAR')}
            className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Línea roja indicadora de la hora_actual en tiempo real (Escenario 5).
 */
function LineaHoraActual({ horaStr }: { horaStr: string }) {
  return (
    <div className="flex items-center gap-2 py-1" aria-label="Hora actual en tiempo real">
      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_0_3px_rgba(244,63,94,0.2)]" />
      <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold tracking-wide shrink-0">
        Hora actual · {horaStr}
      </span>
      <div className="flex-1 h-[2px] bg-rose-500/80 rounded-full" />
    </div>
  );
}

/**
 * Subcomponente para renderizar cada franja de 45 minutos (disponible, pasada u ocupada).
 */
function TarjetaFranja({
  franja,
  procesandoId,
  onAgendar,
  onVerDetalle,
  onCambiarEstado,
  onReprogramar,
  onCancelar,
}: {
  franja: DisponibilidadDia['franjas'][number];
  procesandoId: string | null;
  onAgendar: () => void;
  onVerDetalle: (cita: Cita) => void;
  onCambiarEstado: (cita: Cita, estado: 'ATENDIDA' | 'INASISTENCIA') => void;
  onReprogramar: (cita: Cita) => void;
  onCancelar: (cita: Cita) => void;
}) {
  const cita = franja.cita;

  if (!cita) {
    return (
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${franja.disponible
          ? 'bg-white border-slate-200 hover:border-teal-300'
          : 'bg-slate-50 border-slate-100 opacity-70'
          }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${franja.disponible
              ? 'bg-teal-50 text-teal-700'
              : 'bg-slate-200/70 text-slate-500'
              }`}
          >
            {franja.horaInicio} – {franja.horaFin}
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {franja.disponible ? 'Disponible (45 min)' : 'Franja pasada'}
          </span>
        </div>

        {franja.disponible && (
          <button
            type="button"
            onClick={onAgendar}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar
          </button>
        )}
      </div>
    );
  }

  const estilo = ESTILOS_ESTADO[cita.estado];
  const esConfirmada = cita.estado === 'CONFIRMADA';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onVerDetalle(cita)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onVerDetalle(cita);
        }
      }}
      className="p-4 rounded-2xl bg-sky-50/40 hover:bg-sky-50/80 border border-sky-200 hover:border-teal-300 flex flex-col gap-2.5 cursor-pointer transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-xs font-extrabold text-sky-800">
          {franja.horaInicio} – {franja.horaFin}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${estilo.badgeClass}`}
        >
          {estilo.label}
        </span>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-800">
          {cita.paciente.nombres} {cita.paciente.apellidos}
        </p>
        <p className="text-[11px] text-slate-500">
          {cita.servicio.nombre} · Tel:{' '}
          {cita.paciente.acudientes?.[0]?.acudiente?.telefonoPrincipal ||
            cita.paciente.telefonoContacto ||
            'Sin teléfono'}
        </p>
        {cita.paciente.totalFaltasTardias > 0 && (
          <p className="text-[11px] font-bold text-amber-700 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {cita.paciente.totalFaltasTardias} falta(s) previa(s)
          </p>
        )}
      </div>

      {esConfirmada && (
        <div
          className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-sky-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={procesandoId === cita.id}
            onClick={() => onCambiarEstado(cita, 'ATENDIDA')}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
          >
            Atendida
          </button>
          <button
            type="button"
            disabled={procesandoId === cita.id}
            onClick={() => onCambiarEstado(cita, 'INASISTENCIA')}
            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold"
          >
            Falta
          </button>
          <button
            type="button"
            onClick={() => onReprogramar(cita)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold"
          >
            Reprogramar
          </button>
          <button
            type="button"
            onClick={() => onCancelar(cita)}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
