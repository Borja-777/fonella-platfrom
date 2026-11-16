'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ClipboardList,
  Search,
  UserPlus,
  FilePlus2,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  X,
  Save,
  ShieldCheck,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import {
  apiService,
  EvaluacionOfa,
  HistoriaClinica,
  Paciente,
} from '@/services/api';

const OFA_INICIAL: EvaluacionOfa = {
  labios: 'Tono y sellado labial adecuado en reposo',
  lengua: 'Tamaño, movilidad y frenillo lingual funcional',
  paladar: 'Paladar duro y velo del paladar íntegros, movilidad simétrica',
  dientesOclusion: 'Dentición acorde a la edad, oclusión funcional',
  respiracion: 'Modo respiratorio nasal, tipo costodiafragmático',
  deglucion: 'Deglución madura sin interposición lingual',
  observacionesOfa: '',
};

type SeccionAcordeon = 'anamnesis' | 'ofa' | 'areas' | 'diagnostico';

export default function HistoriasClinicasPage() {
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [modalPaciente, setModalPaciente] = useState(false);
  const [modalHistoria, setModalHistoria] = useState(false);
  const [historiaActiva, setHistoriaActiva] = useState<HistoriaClinica | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ultimoAutoguardado, setUltimoAutoguardado] = useState<string | null>(null);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<SeccionAcordeon, boolean>>({
    anamnesis: true,
    ofa: true,
    areas: false,
    diagnostico: true,
  });

  const [formPaciente, setFormPaciente] = useState({
    tipoDocumento: 'TI' as 'RC' | 'TI' | 'CC' | 'CE' | 'PA',
    numeroDocumento: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    genero: 'Masculino',
    telefonoContacto: '',
    email: '',
    ciudad: 'Palmira',
    direccion: '',
    tipoRemision: 'PARTICULAR' as 'PARTICULAR' | 'REMISION_EXTERNA',
    institucionRemitente: '',
  });

  const [formHistoria, setFormHistoria] = useState({
    pacienteId: '',
    motivoConsulta: '',
    antecedentesPerinatales: '',
    evaluacionOfa: { ...OFA_INICIAL },
    evaluacionHabla: '',
    evaluacionLenguaje: '',
    evaluacionVoz: '',
    diagnosticoCie10Codigo: '',
    diagnosticoCie10Desc: '',
    planTratamiento: '',
    estado: 'BORRADOR' as 'BORRADOR' | 'CERRADA',
  });

  const formRef = useRef(formHistoria);
  formRef.current = formHistoria;
  const historiaActivaRef = useRef(historiaActiva);
  historiaActivaRef.current = historiaActiva;

  const toggleSeccion = (sec: SeccionAcordeon) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const cargarDatos = async (filtro?: string) => {
    try {
      setCargando(true);
      const [listaHistorias, listaPacientes] = await Promise.all([
        apiService.listarHistoriasClinicas(filtro),
        apiService.listarPacientes(),
      ]);
      setHistorias(listaHistorias);
      setPacientes(listaPacientes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar información clínica');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Autoguardado silencioso de borrador cada 30 segundos mientras el modal está abierto
  useEffect(() => {
    if (!modalHistoria) return;
    if (historiaActiva?.estado === 'CERRADA') return;

    const intervalo = setInterval(async () => {
      const actual = formRef.current;
      const activa = historiaActivaRef.current;
      if (!actual.pacienteId) return;

      try {
        if (activa && activa.estado === 'BORRADOR') {
          await apiService.actualizarHistoriaClinica(activa.id, {
            motivoConsulta: actual.motivoConsulta,
            antecedentesPerinatales: actual.antecedentesPerinatales || undefined,
            evaluacionOfa: actual.evaluacionOfa,
            evaluacionHabla: actual.evaluacionHabla || undefined,
            evaluacionLenguaje: actual.evaluacionLenguaje || undefined,
            evaluacionVoz: actual.evaluacionVoz || undefined,
            diagnosticoCie10Codigo: actual.diagnosticoCie10Codigo || 'PENDIENTE',
            diagnosticoCie10Desc: actual.diagnosticoCie10Desc || 'Evaluación en curso (Borrador)',
            planTratamiento: actual.planTratamiento,
            estado: 'BORRADOR',
          });
          setUltimoAutoguardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        } else if (!activa && actual.motivoConsulta.trim().length > 3) {
          const creada = await apiService.crearHistoriaClinica({
            ...actual,
            diagnosticoCie10Codigo: actual.diagnosticoCie10Codigo || 'PENDIENTE',
            diagnosticoCie10Desc: actual.diagnosticoCie10Desc || 'Evaluación en curso (Borrador)',
            estado: 'BORRADOR',
          });
          setHistoriaActiva(creada);
          setUltimoAutoguardado(new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          cargarDatos(busqueda);
        }
      } catch {
        // Silencioso en autoguardado para no interrumpir sesión
      }
    }, 30000);

    return () => clearInterval(intervalo);
  }, [modalHistoria, historiaActiva?.estado]);

  const pacientesSinHistoria = pacientes.filter((p) => !p.historiaClinica);

  const abrirNuevaHistoria = (pacientePreseleccionadoId = '') => {
    setHistoriaActiva(null);
    setUltimoAutoguardado(null);
    setError(null);
    setSeccionesAbiertas({ anamnesis: true, ofa: true, areas: true, diagnostico: true });
    setFormHistoria({
      pacienteId: pacientePreseleccionadoId || (pacientesSinHistoria[0]?.id ?? ''),
      motivoConsulta: '',
      antecedentesPerinatales: '',
      evaluacionOfa: { ...OFA_INICIAL },
      evaluacionHabla: '',
      evaluacionLenguaje: '',
      evaluacionVoz: '',
      diagnosticoCie10Codigo: '',
      diagnosticoCie10Desc: '',
      planTratamiento: '',
      estado: 'BORRADOR',
    });
    setModalHistoria(true);
  };

  const abrirEditarVerHistoria = (hc: HistoriaClinica) => {
    setHistoriaActiva(hc);
    setUltimoAutoguardado(null);
    setError(null);
    setSeccionesAbiertas({ anamnesis: true, ofa: true, areas: true, diagnostico: true });
    setFormHistoria({
      pacienteId: hc.pacienteId,
      motivoConsulta: hc.motivoConsulta,
      antecedentesPerinatales: hc.antecedentesPerinatales || '',
      evaluacionOfa: {
        ...OFA_INICIAL,
        ...(hc.evaluacionOfa || {}),
      },
      evaluacionHabla: hc.evaluacionHabla || '',
      evaluacionLenguaje: hc.evaluacionLenguaje || '',
      evaluacionVoz: hc.evaluacionVoz || '',
      diagnosticoCie10Codigo: hc.diagnosticoCie10Codigo === 'PENDIENTE' ? '' : hc.diagnosticoCie10Codigo,
      diagnosticoCie10Desc: hc.diagnosticoCie10Desc === 'Evaluación en curso (Borrador)' ? '' : hc.diagnosticoCie10Desc,
      planTratamiento: hc.planTratamiento,
      estado: hc.estado,
    });
    setModalHistoria(true);
  };

  const handleCrearPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setGuardando(true);
      const nuevo = await apiService.crearPaciente({
        ...formPaciente,
        email: formPaciente.email || undefined,
        direccion: formPaciente.direccion || undefined,
        institucionRemitente:
          formPaciente.tipoRemision === 'REMISION_EXTERNA'
            ? formPaciente.institucionRemitente
            : undefined,
      });
      setModalPaciente(false);
      setExito(`Paciente ${nuevo.nombres} ${nuevo.apellidos} registrado correctamente.`);
      await cargarDatos(busqueda);
      abrirNuevaHistoria(nuevo.id);
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar el paciente');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarHistoria = async (estadoDestino: 'BORRADOR' | 'CERRADA') => {
    setError(null);
    try {
      setGuardando(true);
      if (historiaActiva) {
        await apiService.actualizarHistoriaClinica(historiaActiva.id, {
          motivoConsulta: formHistoria.motivoConsulta,
          antecedentesPerinatales: formHistoria.antecedentesPerinatales || undefined,
          evaluacionOfa: formHistoria.evaluacionOfa,
          evaluacionHabla: formHistoria.evaluacionHabla || undefined,
          evaluacionLenguaje: formHistoria.evaluacionLenguaje || undefined,
          evaluacionVoz: formHistoria.evaluacionVoz || undefined,
          diagnosticoCie10Codigo: formHistoria.diagnosticoCie10Codigo || (estadoDestino === 'BORRADOR' ? 'PENDIENTE' : ''),
          diagnosticoCie10Desc: formHistoria.diagnosticoCie10Desc || (estadoDestino === 'BORRADOR' ? 'Evaluación en curso (Borrador)' : ''),
          planTratamiento: formHistoria.planTratamiento,
          estado: estadoDestino,
        });
        setExito(
          estadoDestino === 'CERRADA'
            ? `Expediente ${historiaActiva.numeroExpediente} firmado y finalizado (inmutable según Res. 1995/1999).`
            : `Borrador de ${historiaActiva.numeroExpediente} guardado correctamente.`,
        );
      } else {
        if (!formHistoria.pacienteId) {
          throw new Error('Debes seleccionar un paciente para abrir la historia clínica.');
        }
        const creada = await apiService.crearHistoriaClinica({
          ...formHistoria,
          antecedentesPerinatales: formHistoria.antecedentesPerinatales || undefined,
          evaluacionHabla: formHistoria.evaluacionHabla || undefined,
          evaluacionLenguaje: formHistoria.evaluacionLenguaje || undefined,
          evaluacionVoz: formHistoria.evaluacionVoz || undefined,
          diagnosticoCie10Codigo: formHistoria.diagnosticoCie10Codigo || (estadoDestino === 'BORRADOR' ? 'PENDIENTE' : ''),
          diagnosticoCie10Desc: formHistoria.diagnosticoCie10Desc || (estadoDestino === 'BORRADOR' ? 'Evaluación en curso (Borrador)' : ''),
          estado: estadoDestino,
        });
        setExito(
          `Historia clínica ${creada.numeroExpediente} creada (${
            estadoDestino === 'CERRADA' ? 'Finalizada y Firmada' : 'Guardada como Borrador'
          }).`,
        );
      }
      setModalHistoria(false);
      await cargarDatos(busqueda);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la historia clínica');
    } finally {
      setGuardando(false);
    }
  };

  const soloLectura = historiaActiva?.estado === 'CERRADA';

  return (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-[#136A7B]/15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0AA896] to-[#136A7B] text-white flex items-center justify-center shadow-md shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0AA896]/15 text-[#0E5666]">
                Dominio Clínico • HU-003 • Ley 1581 / Res. 1995
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#094A57] mt-1">
              Historias Clínicas y Anamnesis
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Apertura de expedientes fonoaudiológicos, valoración OFA, diagnóstico CIE-10 y plan terapéutico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setModalPaciente(true);
            }}
            className="px-4 py-2.5 rounded-2xl border-2 border-[#136A7B] text-[#094A57] hover:bg-[#136A7B]/10 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#0AA896]" />
            <span>Registrar Paciente</span>
          </button>

          <button
            type="button"
            onClick={() => abrirNuevaHistoria()}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0AA896] to-[#136A7B] hover:from-[#099686] hover:to-[#0f5563] text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Abrir Historia Clínica</span>
          </button>
        </div>
      </div>

      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {exito}
          </span>
          <button onClick={() => setExito(null)} className="text-emerald-700 hover:underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      {error && !modalHistoria && !modalPaciente && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold shadow-xs">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-red-700 hover:underline cursor-pointer">
            Cerrar
          </button>
        </div>
      )}

      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-md border border-[#136A7B]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              cargarDatos(e.target.value);
            }}
            placeholder="Buscar por expediente (HC-2026...), documento, paciente o CIE-10..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-[#FAF6F0]/60 text-xs font-medium text-gray-800 focus:outline-none focus:border-[#0AA896]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
          <span className="px-3 py-1.5 rounded-xl bg-[#F5ECDD] text-[#094A57]">
            Expedientes: <strong>{historias.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-teal-50 text-[#136A7B]">
            Pacientes sin HC: <strong>{pacientesSinHistoria.length}</strong>
          </span>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-[#136A7B]/15 overflow-hidden">
        {cargando ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold text-[#136A7B]">Cargando expedientes clínicos...</p>
          </div>
        ) : historias.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Stethoscope className="w-10 h-10 text-[#0AA896]/60 mx-auto" />
            <h3 className="text-sm font-black text-[#094A57]">
              Aún no hay historias clínicas registradas
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Registra un paciente (o selecciona uno existente) y abre su primera anamnesis fonoaudiológica.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#094A57] text-white text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-extrabold">Expediente</th>
                  <th className="py-3.5 px-4 font-extrabold">Paciente</th>
                  <th className="py-3.5 px-4 font-extrabold">Diagnóstico CIE-10</th>
                  <th className="py-3.5 px-4 font-extrabold">Estado Legal</th>
                  <th className="py-3.5 px-4 font-extrabold">Apertura</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {historias.map((hc) => (
                  <tr key={hc.id} className="hover:bg-[#FAF6F0]/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#094A57]">
                      {hc.numeroExpediente}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-gray-900">
                        {hc.paciente.nombres} {hc.paciente.apellidos}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {hc.paciente.tipoDocumento} {hc.paciente.numeroDocumento} - {hc.paciente.telefonoContacto}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-teal-50 text-[#136A7B] font-mono font-bold text-[11px] mr-1.5">
                        {hc.diagnosticoCie10Codigo}
                      </span>
                      <span className="text-gray-700 font-medium line-clamp-1">
                        {hc.diagnosticoCie10Desc}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {hc.estado === 'CERRADA' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                          <Lock className="w-3 h-3" />
                          FINALIZADA / CERRADA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                          <Edit3 className="w-3 h-3" />
                          BORRADOR
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 font-medium">
                      {new Date(hc.fechaApertura).toLocaleDateString('es-CO')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => abrirEditarVerHistoria(hc)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0AA896]/15 hover:bg-[#0AA896] text-[#094A57] hover:text-white font-extrabold text-[11px] transition-all cursor-pointer"
                      >
                        {hc.estado === 'CERRADA' ? 'Consultar Expediente' : 'Continuar Anamnesis'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: REGISTRO RÁPIDO DE PACIENTE */}
      {modalPaciente && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-[#136A7B]/20">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-[#0AA896]" />
                <h2 className="text-base font-black text-[#094A57]">
                  Registrar Nuevo Paciente
                </h2>
              </div>
              <button
                onClick={() => setModalPaciente(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCrearPaciente} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo Doc. *</label>
                  <select
                    value={formPaciente.tipoDocumento}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, tipoDocumento: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold"
                  >
                    <option value="RC">RC - Registro Civil</option>
                    <option value="TI">TI - Tarjeta Identidad</option>
                    <option value="CC">CC - Cédula Ciudadanía</option>
                    <option value="CE">CE - Cédula Extranjería</option>
                    <option value="PA">PA - Pasaporte</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 mb-1">Número de Documento *</label>
                  <input
                    required
                    type="text"
                    value={formPaciente.numeroDocumento}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, numeroDocumento: e.target.value })
                    }
                    placeholder="Ej. 1112345678"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nombres *</label>
                  <input
                    required
                    type="text"
                    value={formPaciente.nombres}
                    onChange={(e) => setFormPaciente({ ...formPaciente, nombres: e.target.value })}
                    placeholder="Ej. Mateo"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Apellidos *</label>
                  <input
                    required
                    type="text"
                    value={formPaciente.apellidos}
                    onChange={(e) => setFormPaciente({ ...formPaciente, apellidos: e.target.value })}
                    placeholder="Ej. Gómez Rivera"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Fecha Nacimiento *</label>
                  <input
                    required
                    type="date"
                    value={formPaciente.fechaNacimiento}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, fechaNacimiento: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Género</label>
                  <select
                    value={formPaciente.genero}
                    onChange={(e) => setFormPaciente({ ...formPaciente, genero: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Teléfono Contacto *</label>
                  <input
                    required
                    type="text"
                    value={formPaciente.telefonoContacto}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, telefonoContacto: e.target.value })
                    }
                    placeholder="3150000000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formPaciente.ciudad}
                    onChange={(e) => setFormPaciente({ ...formPaciente, ciudad: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tipo de Remisión</label>
                  <select
                    value={formPaciente.tipoRemision}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, tipoRemision: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                  >
                    <option value="PARTICULAR">Consulta Particular</option>
                    <option value="REMISION_EXTERNA">Remisión Externa (EPS / Colegio)</option>
                  </select>
                </div>
              </div>

              {formPaciente.tipoRemision === 'REMISION_EXTERNA' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Institución Remitente</label>
                  <input
                    type="text"
                    value={formPaciente.institucionRemitente}
                    onChange={(e) =>
                      setFormPaciente({ ...formPaciente, institucionRemitente: e.target.value })
                    }
                    placeholder="Nombre de la clínica, pediatra o institución educativa"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalPaciente(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-gray-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-[#0AA896] hover:bg-[#099686] text-white font-black cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar y Abrir Historia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FORMULARIO CLÍNICO EN ACORDEÓN + AUTOGUARDADO (HU - Clínica - 003) */}
      {modalHistoria && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 border border-[#136A7B]/20">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#094A57] text-white font-mono text-[10px] font-bold">
                    {historiaActiva ? historiaActiva.numeroExpediente : 'NUEVO EXPEDIENTE'}
                  </span>
                  {soloLectura ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> FINALIZADA E INMUTABLE (RES. 1995/1999)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ultimoAutoguardado
                        ? `Borrador autoguardado a las ${ultimoAutoguardado}`
                        : 'Autoguardado activo cada 30s'}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-[#094A57] mt-1">
                  Historia Clínica Fonoaudiológica - Anamnesis Inicial
                </h2>
              </div>

              <button
                onClick={() => setModalHistoria(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4 text-xs">
              {/* Selección de Paciente */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#DF9B78]/30">
                <label className="block font-black text-[#094A57] mb-1.5">
                  Paciente Titular del Expediente *
                </label>
                {historiaActiva ? (
                  <p className="font-bold text-gray-800">
                    {historiaActiva.paciente.nombres} {historiaActiva.paciente.apellidos} -{' '}
                    {historiaActiva.paciente.tipoDocumento} {historiaActiva.paciente.numeroDocumento}
                  </p>
                ) : pacientesSinHistoria.length === 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-amber-800 font-semibold">
                      Todos los pacientes registrados ya tienen historia clínica. Registra uno nuevo primero.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalHistoria(false);
                        setModalPaciente(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#0AA896] text-white font-bold shrink-0 cursor-pointer"
                    >
                      + Nuevo Paciente
                    </button>
                  </div>
                ) : (
                  <select
                    value={formHistoria.pacienteId}
                    onChange={(e) =>
                      setFormHistoria({ ...formHistoria, pacienteId: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-800"
                  >
                    {pacientesSinHistoria.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombres} {p.apellidos} ({p.tipoDocumento} {p.numeroDocumento})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* ACORDEÓN 1: Motivo y Antecedentes */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeccion('anamnesis')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-black text-[#094A57] cursor-pointer"
                >
                  <span>1. Motivo de Consulta y Antecedentes Perinatales</span>
                  {seccionesAbiertas.anamnesis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {seccionesAbiertas.anamnesis && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Motivo de Consulta *
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={3}
                        value={formHistoria.motivoConsulta}
                        onChange={(e) =>
                          setFormHistoria({ ...formHistoria, motivoConsulta: e.target.value })
                        }
                        placeholder="Describe el motivo principal referido por el paciente o acudiente..."
                        className="w-full p-3 rounded-2xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Antecedentes Perinatales y Desarrollo Psicomotor
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={3}
                        value={formHistoria.antecedentesPerinatales}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            antecedentesPerinatales: e.target.value,
                          })
                        }
                        placeholder="Embarazo, parto, hitos motores/lingüísticos, antecedentes médicos relevantes..."
                        className="w-full p-3 rounded-2xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACORDEÓN 2: Evaluación OFA */}
              <div className="border border-[#136A7B]/20 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeccion('ofa')}
                  className="w-full px-4 py-3 bg-[#EAF5F6] hover:bg-[#dceff1] flex items-center justify-between font-black text-[#094A57] cursor-pointer"
                >
                  <span>2. Evaluación de Órganos Fonoarticulatorios (OFA)</span>
                  {seccionesAbiertas.ofa ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {seccionesAbiertas.ofa && (
                  <div className="p-4 bg-[#EAF5F6]/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Labios</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.labios}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, labios: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Lengua y Frenillo</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.lengua}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, lengua: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Paladar Duro y Blando</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.paladar}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, paladar: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Dientes y Mordida/Oclusión</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.dientesOclusion}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: {
                              ...formHistoria.evaluacionOfa,
                              dientesOclusion: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Respiración</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.respiracion}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: {
                              ...formHistoria.evaluacionOfa,
                              respiracion: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Deglución</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        value={formHistoria.evaluacionOfa.deglucion}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: {
                              ...formHistoria.evaluacionOfa,
                              deglucion: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACORDEÓN 3: Áreas Fonoaudiológicas */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeccion('areas')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-black text-[#094A57] cursor-pointer"
                >
                  <span>3. Valoración de Habla, Lenguaje y Voz</span>
                  {seccionesAbiertas.areas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {seccionesAbiertas.areas && (
                  <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Evaluación del Habla
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={2}
                        value={formHistoria.evaluacionHabla}
                        onChange={(e) =>
                          setFormHistoria({ ...formHistoria, evaluacionHabla: e.target.value })
                        }
                        placeholder="Articulación, inteligibilidad, fluidez..."
                        className="w-full p-2.5 rounded-xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Evaluación del Lenguaje
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={2}
                        value={formHistoria.evaluacionLenguaje}
                        onChange={(e) =>
                          setFormHistoria({ ...formHistoria, evaluacionLenguaje: e.target.value })
                        }
                        placeholder="Comprensión, expresión, pragmática..."
                        className="w-full p-2.5 rounded-xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Evaluación de la Voz
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={2}
                        value={formHistoria.evaluacionVoz}
                        onChange={(e) =>
                          setFormHistoria({ ...formHistoria, evaluacionVoz: e.target.value })
                        }
                        placeholder="Tono, timbre, intensidad, coordinación..."
                        className="w-full p-2.5 rounded-xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ACORDEÓN 4: Diagnóstico CIE-10 y Plan */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSeccion('diagnostico')}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between font-black text-[#094A57] cursor-pointer"
                >
                  <span>4. Diagnóstico Fonoaudiológico (CIE-10) y Plan Terapéutico</span>
                  {seccionesAbiertas.diagnostico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {seccionesAbiertas.diagnostico && (
                  <div className="p-4 bg-white space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-extrabold text-[#094A57] mb-1">
                          Código CIE-10 *
                        </label>
                        <input
                          disabled={soloLectura}
                          type="text"
                          value={formHistoria.diagnosticoCie10Codigo}
                          onChange={(e) =>
                            setFormHistoria({ ...formHistoria, diagnosticoCie10Codigo: e.target.value })
                          }
                          placeholder="Ej. F80.0"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono uppercase disabled:bg-gray-50"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block font-extrabold text-[#094A57] mb-1">
                          Descripción Diagnóstico CIE-10 *
                        </label>
                        <input
                          disabled={soloLectura}
                          type="text"
                          value={formHistoria.diagnosticoCie10Desc}
                          onChange={(e) =>
                            setFormHistoria({ ...formHistoria, diagnosticoCie10Desc: e.target.value })
                          }
                          placeholder="Ej. Trastorno específico de la pronunciación"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 disabled:bg-gray-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-extrabold text-[#094A57] mb-1">
                        Plan de Tratamiento Terapéutico *
                      </label>
                      <textarea
                        disabled={soloLectura}
                        rows={3}
                        value={formHistoria.planTratamiento}
                        onChange={(e) =>
                          setFormHistoria({ ...formHistoria, planTratamiento: e.target.value })
                        }
                        placeholder="Objetivos generales, frecuencia de sesiones sugeridas y estrategias terapéuticas..."
                        className="w-full p-3 rounded-2xl border border-gray-200 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botonera */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalHistoria(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-600 cursor-pointer"
                >
                  Cerrar Ventana
                </button>

                {!soloLectura && (
                  <>
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => handleGuardarHistoria('BORRADOR')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar como Borrador</span>
                    </button>

                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => handleGuardarHistoria('CERRADA')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0AA896] to-[#136A7B] hover:from-[#099686] hover:to-[#0f5563] text-white font-black flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Guardar y Finalizar Historia</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
