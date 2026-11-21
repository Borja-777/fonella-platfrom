'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Search,
  FilePlus2,
  Lock,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  X,
  Save,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Bell,
  Activity,
  FileText,
  FileDown,
  Send,
  Mail,
  Eye,
  PlusCircle,
  Paperclip,
  UploadCloud,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import {
  apiService,
  EvaluacionOfa,
  HistoriaClinica,
  NotaEvolucion,
  Paciente,
} from '@/services/api';

function obtenerFechaHoraActualColombia(): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const map = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  const hora = map.hour === '24' ? '00' : map.hour;
  return `${map.year}-${map.month}-${map.day}T${hora}:${map.minute}`;
}

const OFA_INICIAL: EvaluacionOfa = {
  labios: '',
  lengua: '',
  paladar: '',
  dientesOclusion: '',
  respiracion: '',
  deglucion: '',
  observacionesOfa: '',
};

type SeccionAcordeon = 'anamnesis' | 'ofa' | 'areas' | 'diagnostico';

export default function HistoriasClinicasPage() {
  const [historias, setHistorias] = useState<HistoriaClinica[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados y Handlers Archivos Médicos Adjuntos (HU-007 / #19)
  const [modalAdjuntosAbierto, setModalAdjuntosAbierto] = useState(false);
  const [historiaAdjuntos, setHistoriaAdjuntos] = useState<HistoriaClinica | null>(null);
  const [listaAdjuntos, setListaAdjuntos] = useState<any[]>([]);
  const [cargandoAdjuntos, setCargandoAdjuntos] = useState(false);
  const [subiendoAdjunto, setSubiendoAdjunto] = useState(false);
  const [mostrarFormAdjunto, setMostrarFormAdjunto] = useState(false);
  const [errorAdjunto, setErrorAdjunto] = useState<string | null>(null);
  const [exitoAdjunto, setExitoAdjunto] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [tituloAdjunto, setTituloAdjunto] = useState('');
  const [fechaEstudioAdjunto, setFechaEstudioAdjunto] = useState(
    () => obtenerFechaHoraActualColombia().split('T')[0],
  );
  const [previewAdjunto, setPreviewAdjunto] = useState<{
    signedUrl: string;
    titulo: string;
    mimeType: string;
    expiresIn: number;
  } | null>(null);
  const [generandoSignedId, setGenerandoSignedId] = useState<string | null>(null);

  const cargarAdjuntosHistoria = async (historiaId: string) => {
    setCargandoAdjuntos(true);
    try {
      const data = await (apiService as any).listarAdjuntosHistoria(historiaId);
      setListaAdjuntos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorAdjunto(err?.message || 'No se pudieron cargar los archivos adjuntos.');
      setListaAdjuntos([]);
    } finally {
      setCargandoAdjuntos(false);
    }
  };

  const abrirModalAdjuntos = async (hc: HistoriaClinica, abrirFormulario = false) => {
    setHistoriaAdjuntos(hc);
    setModalAdjuntosAbierto(true);
    setMostrarFormAdjunto(abrirFormulario);
    setErrorAdjunto(null);
    setExitoAdjunto(null);
    setPreviewAdjunto(null);
    setArchivoSeleccionado(null);
    setTituloAdjunto('');
    setFechaEstudioAdjunto(obtenerFechaHoraActualColombia().split('T')[0]);
    await cargarAdjuntosHistoria(hc.id);
  };

  const handleSeleccionarArchivoAdjunto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorAdjunto(null);
    setExitoAdjunto(null);
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoSeleccionado(null);
      return;
    }

    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (Escenario 2)
    const MIMES_OK = ['application/pdf', 'image/png', 'image/jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const EXT_OK = ['pdf', 'png', 'jpg', 'jpeg'];

    if (!MIMES_OK.includes(file.type) || !EXT_OK.includes(ext)) {
      e.target.value = '';
      setArchivoSeleccionado(null);
      setErrorAdjunto(
        'Formato no compatible: Solo se admiten documentos en formato PDF e imágenes médicas (PNG, JPG, JPEG)',
      );
      return;
    }

    if (file.size > MAX_BYTES) {
      e.target.value = '';
      setArchivoSeleccionado(null);
      setErrorAdjunto(
        'El archivo supera el límite máximo permitido de 10 MB. Por favor reduzca la resolución o el tamaño del PDF o imagen antes de subirlo',
      );
      return;
    }

    setArchivoSeleccionado(file);
  };

  const handleSubirAdjunto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historiaAdjuntos) return;
    setErrorAdjunto(null);
    setExitoAdjunto(null);

    if (!archivoSeleccionado) {
      setErrorAdjunto('Selecciona un documento PDF o imagen médica (PNG, JPG, JPEG) antes de confirmar.');
      return;
    }
    if (!tituloAdjunto.trim()) {
      setErrorAdjunto('Ingresa un título descriptivo para el examen o estudio médico.');
      return;
    }

    setSubiendoAdjunto(true);
    try {
      await (apiService as any).subirAdjuntoHistoria(historiaAdjuntos.id, {
        archivo: archivoSeleccionado,
        titulo: tituloAdjunto.trim(),
        fechaEstudio: fechaEstudioAdjunto,
      });
      setExitoAdjunto('Examen médico almacenado de forma segura y cifrada.');
      setArchivoSeleccionado(null);
      setTituloAdjunto('');
      setMostrarFormAdjunto(false);
      await cargarAdjuntosHistoria(historiaAdjuntos.id);
      await cargarDatos();
    } catch (err: any) {
      setErrorAdjunto(err?.message || 'No se pudo subir el archivo médico.');
    } finally {
      setSubiendoAdjunto(false);
    }
  };

  const handleVisualizarAdjunto = async (adjunto: any) => {
    setGenerandoSignedId(adjunto.id);
    setErrorAdjunto(null);
    try {
      const resp = await (apiService as any).obtenerSignedUrlAdjunto(adjunto.id);
      setPreviewAdjunto({
        signedUrl: resp.signedUrl,
        titulo: adjunto.titulo,
        mimeType: adjunto.mimeType,
        expiresIn: resp.expiresIn || 300,
      });
    } catch (err: any) {
      setErrorAdjunto(err?.message || 'No se pudo generar el enlace temporal seguro.');
    } finally {
      setGenerandoSignedId(null);
    }
  };

  // Estados y Handlers Modal Informe PDF (HU-005 / #17)
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [historiaPdf, setHistoriaPdf] = useState<HistoriaClinica | null>(null);
  const [tipoInformePdf, setTipoInformePdf] = useState<'VALORACION_INICIAL' | 'PROGRESO_TRIMESTRAL' | 'ALTA'>('VALORACION_INICIAL');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('Informe_Fonella.pdf');
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [enviandoInforme, setEnviandoInforme] = useState(false);
  const [bitacoraEnvios, setBitacoraEnvios] = useState<any[]>([]);

  const cargarBitacoraEnvios = async (historiaId: string) => {
    try {
      const logs = await (apiService as any).listarBitacoraEnviosInforme(historiaId);
      setBitacoraEnvios(Array.isArray(logs) ? logs : []);
    } catch {
      setBitacoraEnvios([]);
    }
  };

  const handleCompartirInforme = async (canal: 'WHATSAPP' | 'CORREO') => {
    if (!historiaPdf) return;
    setEnviandoInforme(true);
    setError(null);
    try {
      const resp = await (apiService as any).enviarInformePdf(
        historiaPdf.id,
        canal,
        tipoInformePdf,
      );
      setExito(resp.mensajeBitacora);
      await cargarBitacoraEnvios(historiaPdf.id);

      descargarArchivoPdf();
      if (canal === 'WHATSAPP' && resp.whatsappUrl) {
        window.open(resp.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else if (canal === 'CORREO' && !resp.enviadoPorSmtp && resp.mailtoUrl) {
        window.location.href = resp.mailtoUrl;
      }
    } catch (err: any) {
      setError(err.message || `No se pudo compartir el informe por ${canal}.`);
    } finally {
      setEnviandoInforme(false);
    }
  };

  const cargarPrevisualizacionPdf = async (
    historia: HistoriaClinica,
    tipo: 'VALORACION_INICIAL' | 'PROGRESO_TRIMESTRAL' | 'ALTA',
  ) => {
    setCargandoPdf(true);
    setError('');
    try {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      const { blob, filename } = await (apiService as any).obtenerBlobInformePdf(historia.id, tipo);
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfFilename(filename);
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el informe PDF.');
      setModalPdfAbierto(false);
    } finally {
      setCargandoPdf(false);
    }
  };

  const abrirModalInformePdf = async (
    historia: HistoriaClinica,
    tipoInicial: 'VALORACION_INICIAL' | 'PROGRESO_TRIMESTRAL' | 'ALTA' = 'VALORACION_INICIAL',
  ) => {
    if (!historia.diagnosticoCie10Codigo?.trim() || !historia.diagnosticoCie10Desc?.trim()) {
      setError('No es posible generar el informe: El paciente no cuenta con diagnóstico clínico registrado');
      return;
    }
    setHistoriaPdf(historia);
    setTipoInformePdf(tipoInicial);
    setModalPdfAbierto(true);
    await Promise.all([cargarPrevisualizacionPdf(historia, tipoInicial), cargarBitacoraEnvios(historia.id)]);
  };

  const descargarArchivoPdf = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement('a');
    link.href = pdfPreviewUrl;
    link.download = pdfFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExito(`Informe descargado: ${pdfFilename}`);
  };
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

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

  // Estados para HU - Clínica - 004: Notas de Evolución y Control Trimestral
  const [modalEvoluciones, setModalEvoluciones] = useState(false);
  const [historiaEvolucion, setHistoriaEvolucion] = useState<HistoriaClinica | null>(null);
  const [notasEvolucion, setNotasEvolucion] = useState<NotaEvolucion[]>([]);
  const [siguienteSesion, setSiguienteSesion] = useState(1);
  const [cargandoEvoluciones, setCargandoEvoluciones] = useState(false);
  const [addendumNotaId, setAddendumNotaId] = useState<string | null>(null);
  const [textoAddendum, setTextoAddendum] = useState('');
  const [mostrarInformeTrimestral, setMostrarInformeTrimestral] = useState(false);

  const [formEvolucion, setFormEvolucion] = useState({
    fechaSesion: obtenerFechaHoraActualColombia(),
    objetivosTrabajados: '',
    descripcionEvolucion: '',
    planSiguienteSesion: '',
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
        (apiService as any).listarHistoriasClinicas(filtro),
        (apiService as any).listarPacientes(),
      ]);
      setHistorias(listaHistorias);
      setPacientes(listaPacientes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar información clínica');
    } finally {
      setCargando(false);
    }
  };

  const deepLinkProcesadoRef = useRef(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Si llega ?pacienteId=... desde Agenda, abre automáticamente su Historia Clínica
  useEffect(() => {
    if (deepLinkProcesadoRef.current || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pacienteIdParam = params.get('pacienteId');
    if (!pacienteIdParam || historias.length === 0) return;

    const encontrada = historias.find((h) => h.pacienteId === pacienteIdParam);
    if (encontrada) {
      deepLinkProcesadoRef.current = true;
      abrirEditarVerHistoria(encontrada);
    }
  }, [historias]);

  useEffect(() => {
    if (!modalHistoria) return;
    if (historiaActiva?.estado === 'CERRADA') return;

    const intervalo = setInterval(async () => {
      const actual = formRef.current;
      const activa = historiaActivaRef.current;
      if (!actual.pacienteId) return;

      try {
        if (activa && activa.estado === 'BORRADOR') {
          await (apiService as any).actualizarHistoriaClinica(activa.id, {
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
          setUltimoAutoguardado(
            new Date().toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          );
        } else if (!activa && actual.motivoConsulta.trim().length > 3) {
          const creada = await (apiService as any).crearHistoriaClinica({
            ...actual,
            diagnosticoCie10Codigo: actual.diagnosticoCie10Codigo || 'PENDIENTE',
            diagnosticoCie10Desc: actual.diagnosticoCie10Desc || 'Evaluación en curso (Borrador)',
            estado: 'BORRADOR',
          });
          setHistoriaActiva(creada);
          setUltimoAutoguardado(
            new Date().toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
          );
          cargarDatos(busqueda);
        }
      } catch {
        // Silencioso en autoguardado
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
      diagnosticoCie10Codigo:
        hc.diagnosticoCie10Codigo === 'PENDIENTE' ? '' : hc.diagnosticoCie10Codigo,
      diagnosticoCie10Desc:
        hc.diagnosticoCie10Desc === 'Evaluación en curso (Borrador)' ? '' : hc.diagnosticoCie10Desc,
      planTratamiento: hc.planTratamiento,
      estado: hc.estado,
    });
    setModalHistoria(true);
  };

  const abrirEvoluciones = async (hc: HistoriaClinica, abrirInforme = false) => {
    setError(null);
    setHistoriaEvolucion(hc);
    setMostrarInformeTrimestral(abrirInforme);
    setAddendumNotaId(null);
    setTextoAddendum('');
    setFormEvolucion({
      fechaSesion: obtenerFechaHoraActualColombia(),
      objetivosTrabajados: '',
      descripcionEvolucion: '',
      planSiguienteSesion: '',
    });
    setModalEvoluciones(true);

    try {
      setCargandoEvoluciones(true);
      const data = await (apiService as any).listarEvoluciones(hc.id);
      setHistoriaEvolucion(data.historia);
      setNotasEvolucion(data.notas);
      setSiguienteSesion(data.siguienteNumeroSesion);
    } catch (err: any) {
      setError(err.message || 'Error al cargar línea de tiempo de evoluciones');
    } finally {
      setCargandoEvoluciones(false);
    }
  };

  const handleCrearEvolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!historiaEvolucion) return;
    setError(null);
    try {
      setGuardando(true);
      await (apiService as any).crearNotaEvolucion(historiaEvolucion.id, {
        fechaSesion: new Date(formEvolucion.fechaSesion).toISOString(),
        objetivosTrabajados: formEvolucion.objetivosTrabajados,
        descripcionEvolucion: formEvolucion.descripcionEvolucion,
        planSiguienteSesion: formEvolucion.planSiguienteSesion || undefined,
      });

      const data = await (apiService as any).listarEvoluciones(historiaEvolucion.id);
      setNotasEvolucion(data.notas);
      setSiguienteSesion(data.siguienteNumeroSesion);
      setFormEvolucion({
        fechaSesion: obtenerFechaHoraActualColombia(),
        objetivosTrabajados: '',
        descripcionEvolucion: '',
        planSiguienteSesion: '',
      });
      setExito(`Sesión #${data.notas[0]?.numeroSesion} registrada en la línea de tiempo clínica.`);
      await cargarDatos(busqueda);
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar la nota de evolución');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarAddendum = async (notaId: string) => {
    if (!historiaEvolucion || !textoAddendum.trim()) return;
    setError(null);
    try {
      setGuardando(true);
      await (apiService as any).agregarAddendumEvolucion(
        historiaEvolucion.id,
        notaId,
        textoAddendum,
      );
      const data = await (apiService as any).listarEvoluciones(historiaEvolucion.id);
      setNotasEvolucion(data.notas);
      setAddendumNotaId(null);
      setTextoAddendum('');
      setExito('Addendum legal incorporado correctamente sin alterar el registro original.');
    } catch (err: any) {
      setError(err.message || 'No se pudo agregar el addendum');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarHistoria = async (estadoDestino: 'BORRADOR' | 'CERRADA') => {
    setError(null);
    try {
      setGuardando(true);
      if (historiaActiva) {
        await (apiService as any).actualizarHistoriaClinica(historiaActiva.id, {
          motivoConsulta: formHistoria.motivoConsulta,
          antecedentesPerinatales: formHistoria.antecedentesPerinatales || undefined,
          evaluacionOfa: formHistoria.evaluacionOfa,
          evaluacionHabla: formHistoria.evaluacionHabla || undefined,
          evaluacionLenguaje: formHistoria.evaluacionLenguaje || undefined,
          evaluacionVoz: formHistoria.evaluacionVoz || undefined,
          diagnosticoCie10Codigo:
            formHistoria.diagnosticoCie10Codigo ||
            (estadoDestino === 'BORRADOR' ? 'PENDIENTE' : ''),
          diagnosticoCie10Desc:
            formHistoria.diagnosticoCie10Desc ||
            (estadoDestino === 'BORRADOR' ? 'Evaluación en curso (Borrador)' : ''),
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
        const creada = await (apiService as any).crearHistoriaClinica({
          ...formHistoria,
          antecedentesPerinatales: formHistoria.antecedentesPerinatales || undefined,
          evaluacionHabla: formHistoria.evaluacionHabla || undefined,
          evaluacionLenguaje: formHistoria.evaluacionLenguaje || undefined,
          evaluacionVoz: formHistoria.evaluacionVoz || undefined,
          diagnosticoCie10Codigo:
            formHistoria.diagnosticoCie10Codigo ||
            (estadoDestino === 'BORRADOR' ? 'PENDIENTE' : ''),
          diagnosticoCie10Desc:
            formHistoria.diagnosticoCie10Desc ||
            (estadoDestino === 'BORRADOR' ? 'Evaluación en curso (Borrador)' : ''),
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
            <h1 className="text-xl sm:text-2xl font-black text-[#094A57]">
              Historias Clínicas y Notas de Evolución
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Anamnesis inicial, valoración OFA, seguimiento cronológico por sesión y alertas de control trimestral.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

      {error && !modalHistoria && !modalEvoluciones && (
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
                  <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">Expediente</th>
                  <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Paciente</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Diagnóstico CIE-10</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-extrabold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Estado y Control Trimestral</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 font-extrabold text-left whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Sesiones</span>
                    </div>
                  </th>
                  <th className="w-[1%] py-3.5 pl-4 pr-6 font-extrabold text-left whitespace-nowrap">
                    <div className="flex items-center justify-start gap-2">
                      <span className="h-3.5 w-[2px] bg-white/60 shrink-0" />
                      <span>Acciones Clínicas</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {historias.map((hc) => (
                  <tr key={hc.id} className="hover:bg-[#FAF6F0]/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-[#094A57]">
                      {hc.numeroExpediente}
                      <span className="block text-[10px] font-sans font-normal text-gray-400">
                        {new Date(hc.fechaApertura).toLocaleDateString('es-CO')}
                      </span>
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
                    <td className="py-3.5 px-4 space-y-1">
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

                      {hc.requiereReevaluacion && (
                        <div className="block">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                            <Bell className="w-3 h-3" />
                            Hito Trimestral (RN-05)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-left">
                      <span className="px-2.5 py-1 rounded-xl bg-[#094A57]/10 text-[#094A57] font-black text-[11px]">
                        {hc._count?.notasEvolucion ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 pl-4 pr-6 text-left whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => abrirEditarVerHistoria(hc)}
                        className="px-3 py-1.5 rounded-xl border border-[#136A7B]/30 text-[#094A57] hover:bg-[#136A7B]/10 font-extrabold text-[11px] transition-all cursor-pointer"
                      >
                        {hc.estado === 'CERRADA' ? 'Anamnesis' : 'Continuar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirModalInformePdf(hc, hc.requiereReevaluacion ? 'PROGRESO_TRIMESTRAL' : 'VALORACION_INICIAL')}
                        className="px-3 py-1.5 rounded-xl bg-[#DF9B78] hover:bg-[#cf8965] text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Previsualizar y descargar Informe PDF Membretado RETHUS"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Informe PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirModalAdjuntos(hc, false)}
                        className="px-3 py-1.5 rounded-xl bg-[#094A57] hover:bg-[#0d6273] text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        title="Exámenes y Archivos Médicos Adjuntos"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Adjuntos ({hc._count?.archivosAnexos ?? 0})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirEvoluciones(hc, false)}
                        className="px-3 py-1.5 rounded-xl bg-[#0AA896] hover:bg-[#099686] text-white font-extrabold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Evoluciones</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FORMULARIO CLÍNICO EN ACORDEÓN + AUTOGUARDADO (HU - Clínica - 003) */}
      {modalHistoria && (
        <div className="fixed inset-0 !mt-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
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
                      Todos los pacientes registrados ya tienen historia clínica. Registra uno nuevo desde Directorio de Pacientes o Agenda.
                    </span>
                    <Link
                      href="/pacientes"
                      className="px-3 py-1.5 rounded-xl bg-[#0AA896] text-white font-bold shrink-0 cursor-pointer"
                    >
                      Ir a Pacientes
                    </Link>
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
                        placeholder="Ej. Tono y sellado labial adecuado en reposo"
                        value={formHistoria.evaluacionOfa.labios}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, labios: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Lengua y Frenillo</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        placeholder="Ej. Tamaño, movilidad y frenillo lingual funcional"
                        value={formHistoria.evaluacionOfa.lengua}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, lengua: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Paladar Duro y Blando</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        placeholder="Ej. Paladar duro y velo íntegros, movilidad simétrica"
                        value={formHistoria.evaluacionOfa.paladar}
                        onChange={(e) =>
                          setFormHistoria({
                            ...formHistoria,
                            evaluacionOfa: { ...formHistoria.evaluacionOfa, paladar: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Dientes y Mordida/Oclusión</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        placeholder="Ej. Dentición acorde a la edad, oclusión funcional"
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
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Respiración</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        placeholder="Ej. Modo respiratorio nasal, tipo costodiafragmático"
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
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Deglución</label>
                      <input
                        disabled={soloLectura}
                        type="text"
                        placeholder="Ej. Deglución madura sin interposición lingual"
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
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>

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
            {/* Bitácora de Auditoría de Entregas (HU-006 / Escenario 4) */}
            {bitacoraEnvios.length > 0 && (
              <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#136A7B]">
                  Última entrega registrada:
                </span>
                <span className="text-gray-700 font-medium">
                  {bitacoraEnvios[0].detalle}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: NOTAS DE EVOLUCIÓN Y CONTROL TRIMESTRAL (HU - Clínica - 004) */}
      {modalEvoluciones && historiaEvolucion && (
        <div className="fixed inset-0 !mt-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 border border-[#136A7B]/20">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#094A57] text-white font-mono text-[10px] font-bold">
                    {historiaEvolucion.numeroExpediente}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#136A7B] font-bold text-[10px]">
                    CIE-10: {historiaEvolucion.diagnosticoCie10Codigo}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[10px]">
                    {historiaEvolucion.diasDesdeApertura ?? 0} días desde valoración inicial
                  </span>
                </div>
                <h2 className="text-lg font-black text-[#094A57] mt-1">
                  Evoluciones Terapéuticas — {historiaEvolucion.paciente.nombres}{' '}
                  {historiaEvolucion.paciente.apellidos}
                </h2>
              </div>

              <button
                onClick={() => setModalEvoluciones(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ALERTA DE HITO TRIMESTRAL (RN-05) */}
            {historiaEvolucion.requiereReevaluacion && (
              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-black text-rose-900">
                      🔔 Hito Trimestral Cumplido: Requiere Reevaluación / Informe de Progreso (RN-05)
                    </p>
                    <p className="text-rose-700 mt-0.5">
                      Han transcurrido {historiaEvolucion.diasDesdeApertura} días desde la valoración inicial. Corresponde documentar el corte trimestral para padres o institución educativa.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarInformeTrimestral(!mostrarInformeTrimestral)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>{mostrarInformeTrimestral ? 'Ocultar Informe' : 'Generar Informe de Progreso'}</span>
                </button>
              </div>
            )}

            {/* RESUMEN DE INFORME DE PROGRESO TRIMESTRAL */}
            {mostrarInformeTrimestral && (
              <div className="mt-4 bg-[#FAF6F0] border border-[#DF9B78] rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[#094A57] uppercase tracking-wider">
                    Borrador de Informe de Progreso Trimestral (RN-05)
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500">
                    Total sesiones registradas: {notasEvolucion.length}
                  </span>
                </div>
                <p className="text-gray-700">
                  <strong>Paciente:</strong> {historiaEvolucion.paciente.nombres}{' '}
                  {historiaEvolucion.paciente.apellidos} ({historiaEvolucion.paciente.tipoDocumento}{' '}
                  {historiaEvolucion.paciente.numeroDocumento})
                </p>
                <p className="text-gray-700">
                  <strong>Diagnóstico Base:</strong> {historiaEvolucion.diagnosticoCie10Codigo} —{' '}
                  {historiaEvolucion.diagnosticoCie10Desc}
                </p>
                <p className="text-gray-700">
                  <strong>Plan Terapéutico Inicial:</strong> {historiaEvolucion.planTratamiento}
                </p>
                <p className="text-gray-700">
                  <strong>Último avance documentado:</strong>{' '}
                  {notasEvolucion[0]?.descripcionEvolucion || 'Sin sesiones registradas aún.'}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold">
                {error}
              </div>
            )}

            {/* FORMULARIO DE NUEVA NOTA DE EVOLUCIÓN */}
            <form
              onSubmit={handleCrearEvolucion}
              className="mt-5 bg-[#EAF5F6]/60 border border-[#136A7B]/20 rounded-2xl p-4 space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-[#094A57] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-[#0AA896]" />
                  <span>+ Nueva Nota de Evolución — Sesión #{siguienteSesion}</span>
                </h3>
                <div className="flex items-center gap-2">
                  <label className="font-bold text-gray-700">Fecha y Hora:</label>
                  <input
                    required
                    type="datetime-local"
                    value={formEvolucion.fechaSesion}
                    onChange={(e) =>
                      setFormEvolucion({ ...formEvolucion, fechaSesion: e.target.value })
                    }
                    className="input-fecha-animado px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-extrabold text-[#094A57] mb-1">
                    Objetivos Terapéuticos Abordados *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formEvolucion.objetivosTrabajados}
                    onChange={(e) =>
                      setFormEvolucion({ ...formEvolucion, objetivosTrabajados: e.target.value })
                    }
                    placeholder="Ej. Praxias linguales de elevación apical y discriminación auditiva del fonema /r/..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-extrabold text-[#094A57] mb-1">
                    Recomendaciones y Tareas para la Casa
                  </label>
                  <textarea
                    rows={2}
                    value={formEvolucion.planSiguienteSesion}
                    onChange={(e) =>
                      setFormEvolucion({ ...formEvolucion, planSiguienteSesion: e.target.value })
                    }
                    placeholder="Ej. Realizar 10 repeticiones diarias frente al espejo con apoyo de acudiente..."
                    className="w-full p-2.5 rounded-xl border border-gray-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold text-[#094A57] mb-1">
                  Desempeño Cualitativo y Respuesta del Paciente *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formEvolucion.descripcionEvolucion}
                  onChange={(e) =>
                    setFormEvolucion({ ...formEvolucion, descripcionEvolucion: e.target.value })
                  }
                  placeholder="Describe los logros alcanzados, nivel de atención, tolerancia a la actividad y respuesta clínica..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 bg-white"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0AA896] to-[#136A7B] hover:from-[#099686] hover:to-[#0f5563] text-white font-black flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? 'Guardando...' : 'Guardar Evolución'}</span>
                </button>
              </div>
            </form>

            {/* LÍNEA DE TIEMPO CRONOLÓGICA INMUTABLE */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#094A57]">
                  Línea de Tiempo Cronológica (Inmutable • Res. 1995/1999)
                </h3>
                <span className="text-[11px] font-bold text-gray-500">
                  Orden: Más reciente primero
                </span>
              </div>

              {cargandoEvoluciones ? (
                <div className="p-8 text-center text-xs font-bold text-[#136A7B]">
                  Cargando historial de sesiones...
                </div>
              ) : notasEvolucion.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl text-xs text-gray-500">
                  Aún no hay sesiones registradas para este expediente. Registra la Sesión #1 arriba.
                </div>
              ) : (
                <div className="space-y-3">
                  {notasEvolucion.map((nota) => (
                    <div
                      key={nota.id}
                      className="border border-gray-200 rounded-2xl p-4 bg-white shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          {nota.numeroSesion === 0 || nota.objetivosTrabajados?.startsWith('[BITACORA_ENVIO_INFORME]') ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-300 font-black text-[11px]">
                              Bitácora de Envío
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#0AA896] text-white font-black text-[11px]">
                              Sesión #{nota.numeroSesion}
                            </span>
                          )}
                          <span className="font-bold text-gray-700">
                            {new Date(nota.fechaSesion).toLocaleString('es-CO', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Registro Inmutable
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddendumNotaId(addendumNotaId === nota.id ? null : nota.id);
                              setTextoAddendum('');
                            }}
                            className="text-[11px] font-extrabold text-[#136A7B] hover:underline cursor-pointer"
                          >
                            + Añadir Addendum
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="font-black text-[#094A57]">Objetivos abordados: </span>
                        <span className="text-gray-800">{nota.objetivosTrabajados}</span>
                      </div>

                      <div>
                        <span className="font-black text-[#094A57]">Evolución y respuesta: </span>
                        <p className="text-gray-800 whitespace-pre-line mt-0.5">
                          {nota.descripcionEvolucion}
                        </p>
                      </div>

                      {nota.planSiguienteSesion && (
                        <div className="bg-[#FAF6F0] px-3 py-2 rounded-xl text-gray-700">
                          <span className="font-black text-[#094A57]">Tareas / Casa: </span>
                          {nota.planSiguienteSesion}
                        </div>
                      )}

                      {addendumNotaId === nota.id && (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <label className="block font-extrabold text-amber-800">
                            Nota Aclaratoria / Addendum Legal (se anexa con marca temporal sin borrar el texto original):
                          </label>
                          <textarea
                            rows={2}
                            value={textoAddendum}
                            onChange={(e) => setTextoAddendum(e.target.value)}
                            placeholder="Escribe la aclaración clínica..."
                            className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setAddendumNotaId(null)}
                              className="px-3 py-1.5 rounded-xl border border-gray-200 font-bold text-gray-600 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={guardando}
                              onClick={() => handleGuardarAddendum(nota.id)}
                              className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black cursor-pointer"
                            >
                              Firmar Addendum
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Bitácora de Auditoría de Entregas (HU-006 / Escenario 4) */}
            {bitacoraEnvios.length > 0 && (
              <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#136A7B]">
                  Última entrega registrada:
                </span>
                <span className="text-gray-700 font-medium">
                  {bitacoraEnvios[0].detalle}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL PREVISUALIZACIÓN Y DESCARGA INFORME PDF MEMBRETADO (HU-005 / #17) */}
      {modalPdfAbierto && historiaPdf && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#136A7B]/20 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            {/* Cabecera Modal */}
            <div className="bg-[#136A7B] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-emerald-200 font-semibold">
                  <span>{historiaPdf.numeroExpediente}</span>
                  <span>•</span>
                  <span>CIE-10: {historiaPdf.diagnosticoCie10Codigo}</span>
                  <span>•</span>
                  <span>RETHUS 760014829</span>
                </div>
                <h2 className="text-lg font-bold">
                  Previsualización Informe Oficial — {historiaPdf.paciente.nombres} {historiaPdf.paciente.apellidos}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={tipoInformePdf}
                  onChange={async (e) => {
                    const nuevoTipo = e.target.value as 'VALORACION_INICIAL' | 'PROGRESO_TRIMESTRAL' | 'ALTA';
                    setTipoInformePdf(nuevoTipo);
                    await cargarPrevisualizacionPdf(historiaPdf, nuevoTipo);
                  }}
                  className="bg-white/15 text-white border border-white/30 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="VALORACION_INICIAL" className="text-gray-800">Informe de Valoración Inicial</option>
                  <option value="PROGRESO_TRIMESTRAL" className="text-gray-800">Informe de Progreso Trimestral (RN-05)</option>
                  <option value="ALTA" className="text-gray-800">Informe de Alta Fonoaudiológica</option>
                </select>

                <button
                  onClick={() => handleCompartirInforme('WHATSAPP')}
                  disabled={cargandoPdf || enviandoInforme || !pdfPreviewUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow disabled:opacity-50 transition cursor-pointer"
                  title="Enviar mensaje formal prellenado con enlace seguro por WhatsApp"
                >
                  <Send className="w-3.5 h-3.5" />
                  WhatsApp
                </button>

                <button
                  onClick={() => handleCompartirInforme('CORREO')}
                  disabled={cargandoPdf || enviandoInforme || !pdfPreviewUrl}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#DF9B78] hover:bg-[#cf8965] text-white shadow disabled:opacity-50 transition cursor-pointer"
                  title="Enviar informe por correo electrónico"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Correo
                </button>

                <button
                  onClick={descargarArchivoPdf}
                  disabled={cargandoPdf || !pdfPreviewUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#19AF9C] hover:bg-[#148f80] text-white shadow disabled:opacity-50 transition"
                >
                  <FileDown className="w-4 h-4" />
                  Descargar PDF
                </button>

                <button
                  onClick={() => {
                    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
                    setPdfPreviewUrl(null);
                    setModalPdfAbierto(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visor Integrado del Documento */}
            <div className="flex-1 bg-[#FBF8F2] p-4 flex items-center justify-center overflow-hidden">
              {cargandoPdf ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-[#19AF9C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#136A7B]">Compilando informe membretado de Fonella...</p>
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={`${pdfPreviewUrl}#toolbar=1`}
                  title="Previsualización Informe PDF Fonella"
                  className="w-full h-full rounded-xl border border-gray-300 shadow-inner bg-white"
                />
              ) : (
                <p className="text-sm text-gray-500">No se pudo cargar la vista previa del documento.</p>
              )}
            </div>
            {/* Bitácora de Auditoría de Entregas (HU-006 / Escenario 4) */}
            {bitacoraEnvios.length > 0 && (
              <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#136A7B]">
                  Última entrega registrada:
                </span>
                <span className="text-gray-700 font-medium">
                  {bitacoraEnvios[0].detalle}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* MODAL 4: EXÁMENES Y ARCHIVOS MÉDICOS ADJUNTOS (HU - Clínica - 007 / #19) */}
      {modalAdjuntosAbierto && historiaAdjuntos && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#094A57] text-white font-mono text-[10px] font-bold">
                    {historiaAdjuntos.numeroExpediente}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Almacenamiento Cifrado • Enlaces Efímeros (5 min)
                  </span>
                </div>
                <h2 className="text-lg font-black text-[#094A57] mt-1">
                  Exámenes y Archivos Adjuntos — {historiaAdjuntos.paciente.nombres}{' '}
                  {historiaAdjuntos.paciente.apellidos}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAdjuntosAbierto(false);
                      abrirEditarVerHistoria(historiaAdjuntos);
                    }}
                    className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#094A57] font-bold text-[11px] transition cursor-pointer"
                  >
                    Anamnesis Inicial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalAdjuntosAbierto(false);
                      abrirEvoluciones(historiaAdjuntos, false);
                    }}
                    className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-[#0AA896]/15 text-[#094A57] font-bold text-[11px] transition cursor-pointer"
                  >
                    Evoluciones
                  </button>
                  <span className="px-3 py-1 rounded-lg bg-[#094A57] text-white font-extrabold text-[11px] inline-flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    <span>Exámenes y Archivos Adjuntos ({listaAdjuntos.length})</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormAdjunto(!mostrarFormAdjunto);
                    setErrorAdjunto(null);
                    setExitoAdjunto(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0AA896] hover:bg-[#099686] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Adjuntar Archivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModalAdjuntosAbierto(false);
                    setPreviewAdjunto(null);
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {errorAdjunto && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorAdjunto}</span>
              </div>
            )}

            {exitoAdjunto && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{exitoAdjunto}</span>
              </div>
            )}

            {/* FORMULARIO + ADJUNTAR ARCHIVO (Escenarios 1, 2 y 3) */}
            {mostrarFormAdjunto && (
              <form
                onSubmit={handleSubirAdjunto}
                className="mt-4 bg-[#FAF6F0] border border-[#DF9B78]/40 rounded-2xl p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-[#094A57] flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-[#0AA896]" />
                    <span>Cargar Examen Externo o Reporte Médico</span>
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500">
                    Formatos: PDF, PNG, JPG, JPEG • Máx. 10 MB
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">
                      Título Descriptivo del Estudio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder='Ej. "Audiometría Tonal - Clínica Imbanaco"'
                      value={tituloAdjunto}
                      onChange={(e) => setTituloAdjunto(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-medium text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Fecha del Examen *
                    </label>
                    <input
                      type="date"
                      required
                      min={
                        historiaAdjuntos?.paciente?.fechaNacimiento
                          ? String(historiaAdjuntos.paciente.fechaNacimiento).split('T')[0]
                          : undefined
                      }
                      max={obtenerFechaHoraActualColombia().split('T')[0]}
                      value={fechaEstudioAdjunto}
                      onChange={(e) => setFechaEstudioAdjunto(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Seleccionar Archivo Médico (PDF, PNG, JPG, JPEG — máx. 10 MB) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={handleSeleccionarArchivoAdjunto}
                    className="w-full px-3 py-2 rounded-xl border border-dashed border-[#136A7B]/40 bg-white text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-[#094A57] file:text-white hover:file:bg-[#0d6273] cursor-pointer"
                  />
                  {archivoSeleccionado && (
                    <p className="mt-1.5 text-[11px] font-bold text-emerald-700">
                      Archivo listo: {archivoSeleccionado.name} (
                      {(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormAdjunto(false);
                      setErrorAdjunto(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={subiendoAdjunto}
                    className="px-4 py-2 rounded-xl bg-[#094A57] hover:bg-[#0d6273] text-white font-extrabold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{subiendoAdjunto ? 'Subiendo...' : 'Confirmar Subida'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* VISOR SEGURO CON SIGNED URL TEMPORAL DE 5 MINUTOS (Escenario 4) */}
            {previewAdjunto && (
              <div className="mt-4 border border-[#136A7B]/30 rounded-2xl overflow-hidden bg-gray-900">
                <div className="bg-[#094A57] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#0AA896]" />
                    <span className="font-black">{previewAdjunto.titulo}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold">
                      Enlace firmado temporal • Expira en {previewAdjunto.expiresIn}s (5 min)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${previewAdjunto.signedUrl}?download=1`}
                      download
                      className="px-2.5 py-1 rounded-lg bg-[#0AA896] hover:bg-[#099686] text-white font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <FileDown className="w-3 h-3" />
                      <span>Descargar Archivo</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewAdjunto(null)}
                      className="p-1 rounded-lg hover:bg-white/15 text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-100 flex items-center justify-center max-h-[55vh] overflow-auto">
                  {previewAdjunto.mimeType === 'application/pdf' ? (
                    <iframe
                      src={previewAdjunto.signedUrl}
                      title={previewAdjunto.titulo}
                      className="w-full h-[52vh] border-0"
                    />
                  ) : (
                    <img
                      src={previewAdjunto.signedUrl}
                      alt={previewAdjunto.titulo}
                      className="max-h-[52vh] w-auto object-contain p-3"
                    />
                  )}
                </div>
              </div>
            )}

            {/* TABLA DE ARCHIVOS MÉDICOS ADJUNTOS (Escenarios 1 y 4) */}
            <div className="mt-5">
              {cargandoAdjuntos ? (
                <div className="py-10 text-center text-xs font-bold text-gray-500">
                  Cargando exámenes y documentos clínicos...
                </div>
              ) : listaAdjuntos.length === 0 ? (
                <div className="py-10 px-4 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/60">
                  <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-black text-[#094A57]">
                    No hay exámenes ni archivos adjuntos en este expediente
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Haz clic en &quot;+ Adjuntar Archivo&quot; para subir audiometrías, reportes de neuropediatría (PDF) o fotos clínicas (PNG/JPG).
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#094A57] text-white text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-4 font-extrabold">Estudio / Documento</th>
                        <th className="py-3 px-4 font-extrabold">Archivo Original</th>
                        <th className="py-3 px-4 font-extrabold">Fecha Examen</th>
                        <th className="py-3 px-4 font-extrabold">Tamaño</th>
                        <th className="py-3 px-4 font-extrabold text-right">Visualización Segura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listaAdjuntos.map((adj) => (
                        <tr
                          key={adj.id}
                          onClick={() => handleVisualizarAdjunto(adj)}
                          className="hover:bg-[#EAF5F6]/50 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 font-black text-[#094A57]">
                            <div className="flex items-center gap-2">
                              {adj.mimeType === 'application/pdf' ? (
                                <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-[#0AA896] shrink-0" />
                              )}
                              <span>{adj.titulo}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 font-medium">
                            {adj.nombreArchivo}
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                            {adj.fechaEstudio}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold text-[11px]">
                              {adj.tamanoMb} MB
                            </span>
                          </td>
                          <td
                            className="py-3 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              disabled={generandoSignedId === adj.id}
                              onClick={() => handleVisualizarAdjunto(adj)}
                              className="px-3 py-1.5 rounded-xl bg-[#136A7B] hover:bg-[#094A57] text-white font-extrabold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>
                                {generandoSignedId === adj.id
                                  ? 'Generando enlace...'
                                  : 'Visualizar / Descargar'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
