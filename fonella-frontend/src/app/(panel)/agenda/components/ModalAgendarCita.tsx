'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  Coffee,
  Loader2,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import {
  apiService,
  DisponibilidadDia,
  Paciente,
  ServicioTerapeutico,
  TipoDocumento,
  TipoRemision,
} from '@/services/api';
import { calcularEdadDesdeFecha, obtenerHoyColombia } from './agendaUtils';
import {
  DOCUMENTOS_MENOR_COLOMBIA,
  PARENTESCOS_ACUDIENTE,
  REGLAS_DOCUMENTO_COLOMBIA,
  limpiarEntradaDocumento,
  limpiarEntradaTelefono,
  validarDocumentoColombia,
  validarTelefonoColombia,
} from '@/utils/validaciones-colombia';

interface ModalAgendarCitaProps {
  abierto: boolean;
  fechaInicial: string;
  horaInicial?: string;
  servicios: ServicioTerapeutico[];
  onCerrar: () => void;
  onCitaCreada: (mensaje: string) => void;
}

/**
 * Modal unificado para agendar cita (HU - Agenda - 001 & 002):
 * 1. Búsqueda predictiva de paciente existente (con alerta de faltas tardías).
 * 2. Registro rápido de paciente inline aplicando RN-06 (acudiente obligatorio < 18 años).
 * 3. Selección de servicio de 45 min y franja disponible respetando receso 12:00–14:00.
 */
export default function ModalAgendarCita({
  abierto,
  fechaInicial,
  horaInicial,
  servicios,
  onCerrar,
  onCitaCreada,
}: ModalAgendarCitaProps) {
  // Estado de pestaña: buscar paciente existente vs crear uno nuevo en línea
  const [modoPaciente, setModoPaciente] = useState<'BUSCAR' | 'CREAR'>('BUSCAR');

  // Estados de búsqueda predictiva
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [buscandoPacientes, setBuscandoPacientes] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  // Estados de creación / edición rápida de paciente (RN-06)
  const [pacienteEditandoId, setPacienteEditandoId] = useState<string | null>(null);
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>('TI');
  const [numDoc, setNumDoc] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [emailPaciente, setEmailPaciente] = useState('');
  const [tipoRemision, setTipoRemision] = useState<TipoRemision>('PARTICULAR');
  const [institucionRemitente, setInstitucionRemitente] = useState('');
  const [profesionalRemitente, setProfesionalRemitente] = useState('');

  // Campos de acudiente (obligatorios si edad < 18 años por RN-06)
  const [acudTipoDoc, setAcudTipoDoc] = useState<TipoDocumento>('CC');
  const [acudNumDoc, setAcudNumDoc] = useState('');
  const [acudNombres, setAcudNombres] = useState('');
  const [acudApellidos, setAcudApellidos] = useState('');
  const [acudParentesco, setAcudParentesco] = useState('Madre');
  const [acudParentescoOtro, setAcudParentescoOtro] = useState('');
  const [acudTelefono, setAcudTelefono] = useState('');
  const [acudEmail, setAcudEmail] = useState('');
  const [buscandoAcudiente, setBuscandoAcudiente] = useState(false);
  const [acudienteEncontradoMsg, setAcudienteEncontradoMsg] = useState<string | null>(null);

  // Validación en línea (onBlur) de existencia de correos de paciente y acudiente
  const [estadoEmailPaciente, setEstadoEmailPaciente] = useState<{
    estado: 'IDLE' | 'VALIDANDO' | 'VALIDO' | 'ERROR';
    mensaje?: string;
  }>({ estado: 'IDLE' });
  const [estadoEmailAcudiente, setEstadoEmailAcudiente] = useState<{
    estado: 'IDLE' | 'VALIDANDO' | 'VALIDO' | 'ERROR';
    mensaje?: string;
  }>({ estado: 'IDLE' });

  /** Valida existencia real de un correo al salir del campo (onBlur). */
  const validarCorreoEnLinea = async (
    valor: string,
    setEstado: React.Dispatch<
      React.SetStateAction<{
        estado: 'IDLE' | 'VALIDANDO' | 'VALIDO' | 'ERROR';
        mensaje?: string;
      }>
    >,
  ) => {
    const limpio = valor.trim();
    if (!limpio) {
      setEstado({ estado: 'IDLE' });
      return;
    }
    setEstado({ estado: 'VALIDANDO', mensaje: 'Verificando correo...' });
    try {
      await apiService.validarEmail(limpio);
      setEstado({ estado: 'VALIDO', mensaje: 'Correo verificado' });
    } catch (err) {
      setEstado({
        estado: 'ERROR',
        mensaje:
          err instanceof Error ? err.message : 'El correo no es válido o no existe.',
      });
    }
  };

  // Estados de la cita (fecha, hora, servicio y disponibilidad del día)
  const [fecha, setFecha] = useState(fechaInicial);
  const [horaInicio, setHoraInicio] = useState(horaInicial || '');
  const [servicioId, setServicioId] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadDia | null>(null);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);

  // Feedback de envío / errores
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hoyColombia = obtenerHoyColombia();
  const edadCalculada = calcularEdadDesdeFecha(fechaNacimiento);
  const requiereAcudiente = edadCalculada !== null && edadCalculada < 18;

  // Si el paciente es menor de edad, evita que quede seleccionado CC o CE
  useEffect(() => {
    if (requiereAcudiente && !DOCUMENTOS_MENOR_COLOMBIA.includes(tipoDoc)) {
      setTipoDoc('TI');
      setNumDoc((prev) => limpiarEntradaDocumento(prev, 'TI'));
    }
  }, [requiereAcudiente, tipoDoc]);

  // Sincroniza fecha/hora/servicio cuando se abre el modal
  useEffect(() => {
    if (!abierto) return;
    setFecha(fechaInicial);
    setHoraInicio(horaInicial || '');
    setServicioId((prev) => prev || servicios[0]?.id || '');
    setErrorMsg(null);
  }, [abierto, fechaInicial, horaInicial, servicios]);

  // Carga las franjas de 45 min disponibles cada vez que cambia la fecha en el modal
  useEffect(() => {
    if (!abierto || !fecha) return;
    let cancelado = false;

    async function cargarFranjas() {
      setCargandoFranjas(true);
      try {
        const data = await apiService.obtenerDisponibilidadAgenda(fecha);
        if (!cancelado) {
          setDisponibilidad(data);
          // Si la hora preseleccionada no está disponible, limpia la selección
          if (horaInicio) {
            const sigueLibre = data.franjas.some(
              (f) => f.horaInicio === horaInicio && f.disponible,
            );
            if (!sigueLibre) setHoraInicio('');
          }
        }
      } catch (err) {
        if (!cancelado) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Error cargando disponibilidad del día.',
          );
        }
      } finally {
        if (!cancelado) setCargandoFranjas(false);
      }
    }

    cargarFranjas();
    return () => {
      cancelado = true;
    };
  }, [abierto, fecha]);

  // Búsqueda predictiva con debounce corto (250ms)
  useEffect(() => {
    if (!abierto || modoPaciente !== 'BUSCAR') return;
    let cancelado = false;

    const timer = setTimeout(async () => {
      setBuscandoPacientes(true);
      try {
        const lista = await apiService.buscarPacientes(busqueda);
        if (!cancelado) setResultados(lista);
      } catch {
        if (!cancelado) setResultados([]);
      } finally {
        if (!cancelado) setBuscandoPacientes(false);
      }
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [abierto, modoPaciente, busqueda]);

  if (!abierto) return null;

  /** Busca un acudiente existente por documento para reutilizarlo (hermanos). */
  const handleBuscarAcudiente = async () => {
    if (!acudNumDoc.trim()) return;
    setBuscandoAcudiente(true);
    setAcudienteEncontradoMsg(null);
    try {
      const acud = await apiService.buscarAcudientePorDocumento(acudNumDoc);
      setAcudTipoDoc(acud.tipoDocumento);
      setAcudNombres(acud.nombres);
      setAcudApellidos(acud.apellidos);
      setAcudTelefono(acud.telefonoPrincipal);
      setAcudEmail(acud.email || '');
      setAcudienteEncontradoMsg('Acudiente existente cargado automáticamente.');
    } catch {
      setAcudienteEncontradoMsg('No existe aún; se registrará como acudiente nuevo.');
    } finally {
      setBuscandoAcudiente(false);
    }
  };

  /** Limpia el formulario para registrar un paciente desde cero. */
  const limpiarFormularioPaciente = () => {
    setPacienteEditandoId(null);
    setTipoDoc('TI');
    setNumDoc('');
    setNombres('');
    setApellidos('');
    setFechaNacimiento('');
    setTelefonoContacto('');
    setEmailPaciente('');
    setTipoRemision('PARTICULAR');
    setInstitucionRemitente('');
    setProfesionalRemitente('');
    setAcudTipoDoc('CC');
    setAcudNumDoc('');
    setAcudNombres('');
    setAcudApellidos('');
    setAcudParentesco('Madre');
    setAcudParentescoOtro('');
    setAcudTelefono('');
    setAcudEmail('');
    setAcudienteEncontradoMsg(null);
  };

  /** Pre-carga los datos de un paciente existente (y su acudiente) para editarlos. */
  const abrirEdicionPaciente = (p: Paciente) => {
    setErrorMsg(null);
    setPacienteEditandoId(p.id);
    setTipoDoc(p.tipoDocumento);
    setNumDoc(p.numeroDocumento);
    setNombres(p.nombres);
    setApellidos(p.apellidos);
    setFechaNacimiento(p.fechaNacimiento.slice(0, 10));
    setTelefonoContacto(p.telefonoContacto);
    setEmailPaciente(p.email || '');
    setTipoRemision(p.tipoRemision);
    setInstitucionRemitente(p.institucionRemitente || '');
    setProfesionalRemitente(p.profesionalRemitente || '');

    const relPrincipal = p.acudientes?.[0];
    if (relPrincipal) {
      setAcudTipoDoc(relPrincipal.acudiente.tipoDocumento);
      setAcudNumDoc(relPrincipal.acudiente.numeroDocumento);
      setAcudNombres(relPrincipal.acudiente.nombres);
      setAcudApellidos(relPrincipal.acudiente.apellidos);
      const esPredefinido = (PARENTESCOS_ACUDIENTE as readonly string[]).includes(
        relPrincipal.parentesco,
      );
      if (esPredefinido) {
        setAcudParentesco(relPrincipal.parentesco);
        setAcudParentescoOtro('');
      } else {
        setAcudParentesco('Otro');
        setAcudParentescoOtro(relPrincipal.parentesco);
      }
      setAcudTelefono(relPrincipal.acudiente.telefonoPrincipal);
      setAcudEmail(relPrincipal.acudiente.email || '');
    } else {
      setAcudTipoDoc('CC');
      setAcudNumDoc('');
      setAcudNombres('');
      setAcudApellidos('');
      setAcudParentesco('Madre');
      setAcudParentescoOtro('');
      setAcudTelefono('');
      setAcudEmail('');
    }
    setAcudienteEncontradoMsg(null);
    setModoPaciente('CREAR');
  };

  /** Registra o actualiza el paciente y lo deja seleccionado para agendar de inmediato. */
  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fechaNacimiento || fechaNacimiento > hoyColombia) {
      setErrorMsg('La fecha de nacimiento no puede ser mayor a la fecha actual.');
      return;
    }

    if (requiereAcudiente && !DOCUMENTOS_MENOR_COLOMBIA.includes(tipoDoc)) {
      setErrorMsg(
        'Un menor de edad colombiano solo puede registrarse con Registro Civil (RC), Tarjeta de Identidad (TI) o Pasaporte (PA).',
      );
      return;
    }

    const errorDocPaciente = validarDocumentoColombia(
      numDoc,
      tipoDoc,
      'El documento del paciente',
    );
    if (errorDocPaciente) {
      setErrorMsg(errorDocPaciente);
      return;
    }

    // Para mayores de edad el teléfono del paciente es obligatorio; para menores es opcional
    if (!requiereAcudiente || telefonoContacto.trim()) {
      const errorTelPaciente = validarTelefonoColombia(
        telefonoContacto,
        'El teléfono de contacto',
      );
      if (errorTelPaciente) {
        setErrorMsg(errorTelPaciente);
        return;
      }
    }

    const parentescoFinal =
      acudParentesco === 'Otro' ? acudParentescoOtro.trim() : acudParentesco;

    if (requiereAcudiente) {
      if (
        !acudNumDoc.trim() ||
        !acudNombres.trim() ||
        !acudApellidos.trim() ||
        !acudTelefono.trim() ||
        !parentescoFinal
      ) {
        setErrorMsg(
          'Todo paciente menor de 18 años debe tener acudiente completo (RN-06).',
        );
        return;
      }

      const errorDocAcud = validarDocumentoColombia(
        acudNumDoc,
        acudTipoDoc,
        'El documento del acudiente',
      );
      if (errorDocAcud) {
        setErrorMsg(errorDocAcud);
        return;
      }

      const errorTelAcud = validarTelefonoColombia(
        acudTelefono,
        'El teléfono principal del acudiente',
      );
      if (errorTelAcud) {
        setErrorMsg(errorTelAcud);
        return;
      }
    }

    setGuardando(true);
    try {
      // Valida existencia real de los correos ingresados antes de registrar al paciente
      if (emailPaciente.trim()) {
        try {
          await apiService.validarEmail(emailPaciente);
        } catch (err) {
          throw new Error(
            `Correo del paciente: ${err instanceof Error ? err.message : 'no es válido o no existe.'}`,
          );
        }
      }

      if (requiereAcudiente && acudEmail.trim()) {
        try {
          await apiService.validarEmail(acudEmail);
        } catch (err) {
          throw new Error(
            `Correo del acudiente: ${err instanceof Error ? err.message : 'no es válido o no existe.'}`,
          );
        }
      }

      const payload = {
        tipoDocumento: tipoDoc,
        numeroDocumento: numDoc.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fechaNacimiento,
        telefonoContacto: telefonoContacto.trim(),
        email: emailPaciente.trim() || undefined,
        tipoRemision,
        institucionRemitente:
          tipoRemision !== 'PARTICULAR'
            ? institucionRemitente.trim() || undefined
            : undefined,
        profesionalRemitente:
          tipoRemision !== 'PARTICULAR'
            ? profesionalRemitente.trim() || undefined
            : undefined,
        acudiente: requiereAcudiente
          ? {
            tipoDocumento: acudTipoDoc,
            numeroDocumento: acudNumDoc.trim(),
            nombres: acudNombres.trim(),
            apellidos: acudApellidos.trim(),
            parentesco: parentescoFinal || 'Acudiente',
            telefonoPrincipal: acudTelefono.trim(),
            email: acudEmail.trim() || undefined,
          }
          : undefined,
      };

      const guardado = pacienteEditandoId
        ? await apiService.actualizarPaciente(pacienteEditandoId, payload)
        : await apiService.crearPaciente(payload);

      setPacienteSeleccionado(guardado);
      setResultados((prev) =>
        pacienteEditandoId
          ? prev.map((item) => (item.id === guardado.id ? guardado : item))
          : [guardado, ...prev],
      );
      limpiarFormularioPaciente();
      setModoPaciente('BUSCAR');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : pacienteEditandoId
            ? 'Error al actualizar paciente.'
            : 'Error al registrar paciente.',
      );
    } finally {
      setGuardando(false);
    }
  };

  /** Confirma el agendamiento de la cita en el backend. */
  const handleConfirmarCita = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!pacienteSeleccionado) {
      setErrorMsg('Selecciona o registra primero un paciente.');
      return;
    }
    if (!servicioId) {
      setErrorMsg('Selecciona un servicio terapéutico.');
      return;
    }
    if (!horaInicio) {
      setErrorMsg('Selecciona una franja horaria disponible de 45 minutos.');
      return;
    }

    setGuardando(true);
    try {
      await apiService.crearCita({
        pacienteId: pacienteSeleccionado.id,
        servicioId,
        fecha,
        horaInicio,
      });
      onCitaCreada(
        `Cita guardada para ${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos} el ${fecha} a las ${horaInicio}.`,
      );
      onCerrar();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo agendar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-[#0F766E] to-[#14B8A6] p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Agendar Cita en Consultorio
            </h3>
            <p className="text-xs text-teal-100 mt-0.5">
              Búsqueda y creación de pacientes
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* PASO A: Selección o Creación Rápida de Paciente */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                1. Paciente
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormularioPaciente();
                    setModoPaciente('BUSCAR');
                    setErrorMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${modoPaciente === 'BUSCAR'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Buscar existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    limpiarFormularioPaciente();
                    setModoPaciente('CREAR');
                    setErrorMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${modoPaciente === 'CREAR'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {pacienteEditandoId ? 'Editar paciente' : 'Nuevo paciente'}
                </button>
              </div>
            </div>

            {modoPaciente === 'BUSCAR' ? (
              <div className="space-y-2.5">
                {pacienteSeleccionado ? (
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-teal-600" />
                        <span className="font-bold text-slate-800 text-sm">
                          {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                          {pacienteSeleccionado.tipoDocumento} {pacienteSeleccionado.numeroDocumento}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Tel: {pacienteSeleccionado.telefonoContacto}
                        {pacienteSeleccionado.edad !== undefined &&
                          ` · ${pacienteSeleccionado.edad} años`}
                        {pacienteSeleccionado.acudientes?.[0] &&
                          ` · Acudiente: ${pacienteSeleccionado.acudientes[0].acudiente.nombres} ${pacienteSeleccionado.acudientes[0].acudiente.apellidos}`}
                      </p>
                      {pacienteSeleccionado.totalFaltasTardias > 0 && (
                        <p className="text-[11px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Historial: {pacienteSeleccionado.totalFaltasTardias} falta(s) o cancelación(es) tardía(s)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => abrirEdicionPaciente(pacienteSeleccionado)}
                        className="text-xs font-bold text-slate-600 hover:text-teal-700 inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPacienteSeleccionado(null)}
                        className="text-xs font-bold text-teal-700 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre, apellido o documento..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                      {buscandoPacientes ? (
                        <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                          Buscando pacientes...
                        </div>
                      ) : resultados.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No hay pacientes con ese criterio. Puedes crearlo en{' '}
                          <button
                            type="button"
                            onClick={() => setModoPaciente('CREAR')}
                            className="text-teal-700 font-bold underline"
                          >
                            Nuevo paciente
                          </button>
                          .
                        </div>
                      ) : (
                        resultados.map((p) => (
                          <div
                            key={p.id}
                            className="w-full px-3.5 py-2.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-2"
                          >
                            <button
                              type="button"
                              onClick={() => setPacienteSeleccionado(p)}
                              className="flex-1 text-left"
                            >
                              <p className="text-sm font-bold text-slate-800">
                                {p.nombres} {p.apellidos}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {p.tipoDocumento} {p.numeroDocumento} · {p.edad ?? '?'} años · Tel: {p.telefonoContacto}
                              </p>
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {p.totalFaltasTardias > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  {p.totalFaltasTardias} falta(s)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => abrirEdicionPaciente(p)}
                                title="Editar paciente"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Formulario inline para crear paciente respetando RN-06 */
              <form
                onSubmit={handleCrearPaciente}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tipo Doc *
                    </label>
                    <select
                      value={tipoDoc}
                      onChange={(e) => {
                        const nuevoTipo = e.target.value as TipoDocumento;
                        setTipoDoc(nuevoTipo);
                        setNumDoc((prev) => limpiarEntradaDocumento(prev, nuevoTipo));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                    >
                      <option value="RC">RC (Reg. Civil)</option>
                      <option value="TI">TI (Tarjeta Id.)</option>
                      {!requiereAcudiente && (
                        <>
                          <option value="CC">CC (Cédula)</option>
                          <option value="CE">CE (Extranjería)</option>
                        </>
                      )}
                      <option value="PA">PA (Pasaporte)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].max}
                      placeholder={
                        REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].soloNumeros
                          ? `Solo números (${REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].min}–${REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].max} dígitos)`
                          : `Alfanumérico (${REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].min}–${REGLAS_DOCUMENTO_COLOMBIA[tipoDoc].max} caracteres)`
                      }
                      value={numDoc}
                      onChange={(e) =>
                        setNumDoc(limpiarEntradaDocumento(e.target.value, tipoDoc))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Fecha Nacimiento *
                    </label>
                    <input
                      type="date"
                      required
                      max={hoyColombia}
                      value={fechaNacimiento}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor && valor > hoyColombia) {
                          setErrorMsg(
                            'La fecha de nacimiento no puede ser mayor a la fecha actual.',
                          );
                          return;
                        }
                        setFechaNacimiento(valor);
                      }}
                      className="input-fecha-animado w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {requiereAcudiente
                        ? 'Teléfono Contacto (Opcional)'
                        : 'Teléfono Contacto *'}
                    </label>
                    <input
                      type="tel"
                      required={!requiereAcudiente}
                      maxLength={10}
                      placeholder={
                        requiereAcudiente ? 'Opcional (10 dígitos)' : 'Ej. 3001234567'
                      }
                      value={telefonoContacto}
                      onChange={(e) =>
                        setTelefonoContacto(limpiarEntradaTelefono(e.target.value))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Correo (Opcional)
                    </label>
                    <input
                      type="email"
                      value={emailPaciente}
                      onChange={(e) => {
                        setEmailPaciente(e.target.value);
                        setEstadoEmailPaciente({ estado: 'IDLE' });
                      }}
                      onBlur={(e) =>
                        validarCorreoEnLinea(e.target.value, setEstadoEmailPaciente)
                      }
                      className={`w-full px-3 py-2 rounded-xl bg-white border text-xs ${estadoEmailPaciente.estado === 'ERROR'
                        ? 'border-rose-400'
                        : estadoEmailPaciente.estado === 'VALIDO'
                          ? 'border-emerald-400'
                          : 'border-slate-200'
                        }`}
                    />
                    {estadoEmailPaciente.estado !== 'IDLE' && (
                      <p
                        className={`text-[10px] font-semibold mt-1 ${estadoEmailPaciente.estado === 'ERROR'
                          ? 'text-rose-600'
                          : estadoEmailPaciente.estado === 'VALIDO'
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                          }`}
                      >
                        {estadoEmailPaciente.mensaje}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Tipo de Remisión
                    </label>
                    <select
                      value={tipoRemision}
                      onChange={(e) => setTipoRemision(e.target.value as TipoRemision)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold"
                    >
                      <option value="PARTICULAR">Particular</option>
                      <option value="REMISION_EXTERNA">Remisión médica</option>
                      <option value="ESCOLAR">Remisión escolar</option>
                    </select>
                  </div>
                  {tipoRemision !== 'PARTICULAR' && (
                  <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {tipoRemision === 'ESCOLAR'
                            ? 'Institución educativa'
                            : 'Institución remitente'}
                        </label>
                        <input
                          type="text"
                          value={institucionRemitente}
                          onChange={(e) => setInstitucionRemitente(e.target.value)}
                          placeholder={
                            tipoRemision === 'ESCOLAR'
                              ? 'Ej. Colegio San José'
                              : 'Ej. Clínica Palma Real'
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Profesional que remite
                        </label>
                        <input
                          type="text"
                          value={profesionalRemitente}
                          onChange={(e) => setProfesionalRemitente(e.target.value)}
                          placeholder={
                            tipoRemision === 'ESCOLAR'
                              ? 'Ej. Docente o psicólogo escolar'
                              : 'Ej. Médico tratante'
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Sección dinámica RN-06: Acudiente obligatorio si edad < 18 */}
                {requiereAcudiente && (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-amber-800 uppercase">
                        Acudiente Obligatorio
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={acudTipoDoc}
                        onChange={(e) => {
                          const nuevoTipo = e.target.value as TipoDocumento;
                          setAcudTipoDoc(nuevoTipo);
                          setAcudNumDoc((prev) =>
                            limpiarEntradaDocumento(prev, nuevoTipo),
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold"
                      >
                        <option value="CC">CC</option>
                        <option value="CE">CE</option>
                        <option value="PA">PA</option>
                      </select>
                      <div className="sm:col-span-2 flex gap-1.5">
                        <input
                          type="text"
                          required
                          maxLength={REGLAS_DOCUMENTO_COLOMBIA[acudTipoDoc].max}
                          placeholder={`Documento acudiente (${REGLAS_DOCUMENTO_COLOMBIA[acudTipoDoc].min}–${REGLAS_DOCUMENTO_COLOMBIA[acudTipoDoc].max}) *`}
                          value={acudNumDoc}
                          onChange={(e) =>
                            setAcudNumDoc(
                              limpiarEntradaDocumento(e.target.value, acudTipoDoc),
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleBuscarAcudiente}
                          disabled={buscandoAcudiente}
                          className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
                        >
                          {buscandoAcudiente ? '...' : 'Buscar'}
                        </button>
                      </div>
                    </div>

                    {acudienteEncontradoMsg && (
                      <p className="text-[11px] font-semibold text-amber-800">
                        {acudienteEncontradoMsg}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Nombres acudiente *"
                        value={acudNombres}
                        onChange={(e) => setAcudNombres(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Apellidos acudiente *"
                        value={acudApellidos}
                        onChange={(e) => setAcudApellidos(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                      />
                      <select
                        value={acudParentesco}
                        onChange={(e) => {
                          setAcudParentesco(e.target.value);
                          if (e.target.value !== 'Otro') {
                            setAcudParentescoOtro('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs font-semibold"
                      >
                        {PARENTESCOS_ACUDIENTE.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                        <option value="Otro">Otro</option>
                      </select>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="Teléfono principal (3XX...) *"
                        value={acudTelefono}
                        onChange={(e) =>
                          setAcudTelefono(limpiarEntradaTelefono(e.target.value))
                        }
                        className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                      />
                    </div>
                    {acudParentesco === 'Otro' && (
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="Especifica el parentesco *"
                          value={acudParentescoOtro}
                          onChange={(e) => setAcudParentescoOtro(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs"
                        />
                      </div>
                    )}
                    <div>
                      <input
                        type="email"
                        placeholder="Correo acudiente (opcional)"
                        value={acudEmail}
                        onChange={(e) => {
                          setAcudEmail(e.target.value);
                          setEstadoEmailAcudiente({ estado: 'IDLE' });
                        }}
                        onBlur={(e) =>
                          validarCorreoEnLinea(e.target.value, setEstadoEmailAcudiente)
                        }
                        className={`w-full px-3 py-2 rounded-xl bg-white border text-xs ${estadoEmailAcudiente.estado === 'ERROR'
                          ? 'border-rose-400'
                          : estadoEmailAcudiente.estado === 'VALIDO'
                            ? 'border-emerald-400'
                            : 'border-amber-200'
                          }`}
                      />
                      {estadoEmailAcudiente.estado !== 'IDLE' && (
                        <p
                          className={`text-[10px] font-semibold mt-1 ${estadoEmailAcudiente.estado === 'ERROR'
                            ? 'text-rose-600'
                            : estadoEmailAcudiente.estado === 'VALIDO'
                              ? 'text-emerald-700'
                              : 'text-amber-800'
                            }`}
                        >
                          {estadoEmailAcudiente.mensaje}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {pacienteEditandoId && (
                    <button
                      type="button"
                      onClick={() => {
                        limpiarFormularioPaciente();
                        setModoPaciente('BUSCAR');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    {guardando ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : pacienteEditandoId ? (
                      <Pencil className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {pacienteEditandoId
                      ? 'Guardar Cambios'
                      : 'Guardar Paciente y Continuar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* PASO B: Servicio, Fecha y Franja de 45 min */}
          <form onSubmit={handleConfirmarCita} className="space-y-4 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">
              2. Servicio y Franja Horaria (45 min)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  Servicio Terapéutico *
                </label>
                <select
                  value={servicioId}
                  onChange={(e) => setServicioId(e.target.value)}
                  className="input-fecha-animado w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                >
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.duracionMinutos} min)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  Fecha de la Cita *
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="input-fecha-animado w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                />
              </div>
            </div>

            {/* Selector visual de franjas de 45 min con bloque de receso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Franjas disponibles *
                </span>
                {disponibilidad?.bloqueReceso && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                    <Coffee className="w-3 h-3" />
                    Receso: {disponibilidad.bloqueReceso.inicio} – {disponibilidad.bloqueReceso.fin}
                  </span>
                )}
              </div>

              {cargandoFranjas ? (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  Cargando franjas del día...
                </div>
              ) : !disponibilidad?.abierto ? (
                <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold text-center">
                  {disponibilidad?.motivoCierre || 'Consultorio cerrado en esta fecha.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {disponibilidad.franjas.map((f) => {
                    const seleccionada = horaInicio === f.horaInicio;
                    return (
                      <button
                        key={f.horaInicio}
                        type="button"
                        disabled={!f.disponible}
                        onClick={() => setHoraInicio(f.horaInicio)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${seleccionada
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : f.disponible
                            ? 'bg-white text-slate-700 border-slate-200 hover:border-teal-400 hover:bg-teal-50/40'
                            : 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed line-through'
                          }`}
                      >
                        {f.horaInicio}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCerrar}
                className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !pacienteSeleccionado || !horaInicio}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#0F766E] to-[#14B8A6] shadow-md hover:shadow-lg transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar Cita
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
