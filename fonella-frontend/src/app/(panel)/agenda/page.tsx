'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  Search,
  Plus,
  Stethoscope,
  X,
  Baby,
  UserCheck,
} from 'lucide-react';
import { apiService, Usuario } from '@/services/api';

interface CitaOperativa {
  id: string;
  hora: string;
  tipo: 'MENOR' | 'ADULTO';
  pacienteNombre: string;
  pacienteEdad: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  servicio: string;
  estado: 'CONFIRMADA' | 'EN_ESPERA' | 'COMPLETADA' | 'PENDIENTE';
}

export default function AgendaPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [alertaForbidden, setAlertaForbidden] = useState(false);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [modalNuevaCita, setModalNuevaCita] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados del Formulario del Modal
  const [tipoPaciente, setTipoPaciente] = useState<'MENOR' | 'ADULTO'>('MENOR');
  const [formNombre, setFormNombre] = useState('');
  const [formEdad, setFormEdad] = useState('');
  const [formHora, setFormHora] = useState('14:00');
  const [formAcudiente, setFormAcudiente] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formServicio, setFormServicio] = useState('Valoración Fonoaudiológica Inicial');

  // Lista de citas operativas (HU-03: Solo datos de contacto y recepción, sin historias clínicas)
  const [citas, setCitas] = useState<CitaOperativa[]>([
    {
      id: 'c1',
      hora: '08:00 AM',
      tipo: 'MENOR',
      pacienteNombre: 'Mateo Gómez Pardo',
      pacienteEdad: '5 años',
      contactoNombre: 'Camila Pardo (Madre)',
      contactoEmail: 'camila.pardo@gmail.com',
      contactoTelefono: '315 889 4421',
      servicio: 'Terapia del Lenguaje y Pronunciación',
      estado: 'COMPLETADA',
    },
    {
      id: 'c2',
      hora: '09:00 AM',
      tipo: 'MENOR',
      pacienteNombre: 'Luciana Vélez Restrepo',
      pacienteEdad: '4 años',
      contactoNombre: 'Andrés Vélez (Padre)',
      contactoEmail: 'andres.velez@hotmail.com',
      contactoTelefono: '310 445 9988',
      servicio: 'Valoración Fonoaudiológica Inicial',
      estado: 'COMPLETADA',
    },
    {
      id: 'c3',
      hora: '10:30 AM',
      tipo: 'ADULTO',
      pacienteNombre: 'Carlos Eduardo Mendoza',
      pacienteEdad: '42 años',
      contactoNombre: 'Paciente Directo (Adulto)',
      contactoEmail: 'carlos.mendoza@empresa.com',
      contactoTelefono: '301 552 1100',
      servicio: 'Terapia Vocal y Disfonía del Profesional',
      estado: 'EN_ESPERA',
    },
    {
      id: 'c4',
      hora: '11:30 AM',
      tipo: 'MENOR',
      pacienteNombre: 'Valentina Morales Cruz',
      pacienteEdad: '3 años',
      contactoNombre: 'Diana Cruz (Madre)',
      contactoEmail: 'diana.cruz91@gmail.com',
      contactoTelefono: '318 662 1090',
      servicio: 'Terapia Miofuncional Orofacial',
      estado: 'CONFIRMADA',
    },
    {
      id: 'c5',
      hora: '02:00 PM',
      tipo: 'ADULTO',
      pacienteNombre: 'Patricia Elena Duarte',
      pacienteEdad: '58 años',
      contactoNombre: 'Paciente Directo (Adulto)',
      contactoEmail: 'patricia.duarte@gmail.com',
      contactoTelefono: '312 901 3456',
      servicio: 'Rehabilitación de la Deglución / Disfagia',
      estado: 'CONFIRMADA',
    },
  ]);

  useEffect(() => {
    // 1. Cargar información de la sesión activa
    async function cargarPerfil() {
      try {
        const data = await apiService.getMe();
        setUsuario(data.usuario);
      } catch (err) {
        console.error('Error cargando usuario en agenda', err);
      }
    }
    cargarPerfil();

    // 2. Detectar si el usuario fue bloqueado al intentar entrar a rutas restringidas (?error=forbidden)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'forbidden') {
        setAlertaForbidden(true);
      }
    }
  }, []);

  const citasFiltradas = citas.filter((c) =>
    c.pacienteNombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    c.contactoNombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    c.contactoEmail.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
    c.contactoTelefono.includes(filtroBusqueda)
  );

  const cambiarEstadoCita = (id: string, nuevoEstado: CitaOperativa['estado']) => {
    setCitas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
    );
  };

  const handleGuardarCita = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNombre.trim() || !formEmail.trim() || !formTelefono.trim()) {
      alert('Por favor completa los campos requeridos: Nombre, Correo Electrónico y Teléfono.');
      return;
    }

    const nuevaCita: CitaOperativa = {
      id: 'c_' + Date.now(),
      hora: formHora,
      tipo: tipoPaciente,
      pacienteNombre: formNombre,
      pacienteEdad: formEdad ? `${formEdad} años` : (tipoPaciente === 'MENOR' ? '5 años' : '32 años'),
      contactoNombre: tipoPaciente === 'MENOR' ? (formAcudiente || 'Acudiente Titular') : 'Paciente Directo (Adulto)',
      contactoEmail: formEmail,
      contactoTelefono: formTelefono,
      servicio: formServicio,
      estado: 'CONFIRMADA',
    };

    setCitas([nuevaCita, ...citas]);
    setModalNuevaCita(false);

    // Mensaje de éxito temporal
    setMensajeExito(`Cita para ${formNombre} (${tipoPaciente === 'MENOR' ? 'Menor' : 'Adulto'}) agendada exitosamente.`);
    setTimeout(() => setMensajeExito(null), 5000);

    // Limpiar formulario
    setFormNombre('');
    setFormEdad('');
    setFormAcudiente('');
    setFormEmail('');
    setFormTelefono('');
  };

  const esAsistente = usuario?.rol === 'ASISTENTE';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Alerta de Seguridad 403 Forbidden si intentó entrar a /personal o /historia-clinica */}
      {alertaForbidden && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/90 via-amber-600/90 to-rose-600/90 text-white shadow-xl flex items-start justify-between border border-amber-300/40 animate-bounce-short">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black tracking-wider uppercase">
                  Acceso Restringido 403
                </span>
                <h4 className="font-extrabold text-sm text-white">
                  Módulo Clínico o Administrativo Bloqueado
                </h4>
              </div>
              <p className="text-xs text-amber-100 mt-1 leading-relaxed max-w-3xl">
                Tu cuenta tiene rol operativo de <strong>{usuario?.rol || 'ASISTENTE / RECEPCIÓN'}</strong>. 
                Por normatividad legal de reserva médica y protección de datos (Ley 1581 de 2012), 
                la <strong>Gestión de Cuentas de Personal</strong> y las <strong>Historias Clínicas</strong> están 
                reservadas con exclusividad a la <strong>Fonoaudióloga Titular</strong>. Has sido redirigido a tu módulo autorizado de Agenda.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAlertaForbidden(false)}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de Éxito al Agendar Cita */}
      {mensajeExito && (
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex items-center justify-between text-xs sm:text-sm animate-fade-in border border-emerald-400/40">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="font-bold">{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="p-1 hover:bg-white/20 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* 2. Cabecera Principal de la Agenda */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-sm border border-[#136A7B]/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-center text-[#0AA896] shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#094A57] tracking-tight">
                Agenda Clínica y Recepción Operativa
              </h1>
              {esAsistente ? (
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-[#0E5666] text-[10px] font-black uppercase tracking-wider border border-teal-200">
                  Modo Operativo Recepción
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  Fonoaudióloga Titular
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Gestión diaria de turnos, confirmación de acudientes y control de sala de espera en consultorio.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF6F0] border border-[#136A7B]/15 text-xs font-bold text-[#0E5666]">
            <Stethoscope className="w-4 h-4 text-[#0AA896]" />
            <span>Consultorio 1: Dra. Bárbara Ccucho</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          <button
            onClick={() => setModalNuevaCita(true)}
            className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agendar Cita en Recepción</span>
          </button>
        </div>
      </div>

      {/* 3. Garantía de Confidencialidad y Reserva Legal (DoD HU-03) */}
      <div className="bg-[#EAF5F6] border border-[#0AA896]/30 p-3.5 rounded-2xl flex items-start gap-3 shadow-xs">
        <Info className="w-4 h-4 text-[#0AA896] shrink-0 mt-0.5" />
        <div className="text-xs text-[#094A57] leading-relaxed">
          <strong className="font-extrabold text-[#0E5666]">Garantía de Confidencialidad Médica (HU-03):</strong>
          <span className="ml-1 opacity-90">
            Esta pantalla opera bajo el principio de privilegio mínimo de seguridad (RBAC). El personal asistente 
            accede exclusivamente a la información de coordinación, correos y teléfonos. Los expedientes de anamnesis, 
            diagnósticos y notas clínicas privadas permanecen estrictamente resguardados para la fonoaudióloga.
          </span>
        </div>
      </div>

      {/* 4. Métricas Rápidas Operativas del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0AA896] font-black text-sm">
            {citas.length}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Citas Hoy</div>
            <div className="text-sm font-black text-[#094A57]">{citas.length} Pacientes</div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
            {citas.filter((c) => c.estado === 'COMPLETADA').length}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Atendidas</div>
            <div className="text-sm font-black text-emerald-700">Completadas</div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-black text-sm">
            {citas.filter((c) => c.estado === 'EN_ESPERA').length}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">En Sala</div>
            <div className="text-sm font-black text-amber-700">En Espera</div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#136A7B]/10 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 font-black text-sm">
            {citas.filter((c) => c.estado === 'CONFIRMADA').length}
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Por Llegar</div>
            <div className="text-sm font-black text-sky-700">Confirmadas</div>
          </div>
        </div>
      </div>

      {/* 5. Tabla Operativa de Citas */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/70 overflow-hidden w-full">
        {/* Barra de Filtro y Búsqueda */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente, contacto, correo o teléfono..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0AA896] transition-all bg-[#FAF6F0]/50"
            />
          </div>

          <div className="text-xs font-bold text-gray-500">
            Mostrando <strong className="text-[#094A57]">{citasFiltradas.length}</strong> de {citas.length} citas
          </div>
        </div>

        {/* Listado / Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-[#DF9B78] to-[#D68B66] text-white text-[11px] font-black uppercase tracking-wider">
                <th className="py-3 px-4">Hora</th>
                <th className="py-3 px-4 border-l border-white/20">Paciente y Modalidad</th>
                <th className="py-3 px-4 border-l border-white/20">Contacto / Acudiente</th>
                <th className="py-3 px-4 border-l border-white/20">Servicio Solicitado</th>
                <th className="py-3 px-4 border-l border-white/20">Estado Sala</th>
                <th className="py-3 px-4 border-l border-white/20 text-center">Acciones Recepción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {citasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-black text-[#094A57] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0AA896]" />
                      <span>{c.hora}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{c.pacienteNombre}</span>
                      {c.tipo === 'MENOR' ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold uppercase border border-amber-200 flex items-center gap-0.5">
                          <Baby className="w-2.5 h-2.5" />
                          <span>Pediátrico</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-900 text-[9px] font-extrabold uppercase border border-sky-200 flex items-center gap-0.5">
                          <UserCheck className="w-2.5 h-2.5" />
                          <span>Adulto</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">({c.pacienteEdad})</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700">
                    <div className="font-semibold text-gray-900">{c.contactoNombre}</div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <div className="text-[11px] text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#136A7B] shrink-0" />
                        <span className="truncate">{c.contactoEmail}</span>
                      </div>
                      <div className="text-[11px] text-teal-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#0AA896] shrink-0" />
                        <span>{c.contactoTelefono}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-700 max-w-xs">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FAF6F0] border border-[#136A7B]/10 text-[#0E5666] text-[11px] font-medium">
                      {c.servicio}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {c.estado === 'COMPLETADA' && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wide border border-emerald-200 flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completada</span>
                      </span>
                    )}
                    {c.estado === 'EN_ESPERA' && (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wide border border-amber-300 flex items-center gap-1 w-max animate-pulse">
                        <Clock className="w-3 h-3" />
                        <span>En Sala de Espera</span>
                      </span>
                    )}
                    {c.estado === 'CONFIRMADA' && (
                      <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] uppercase tracking-wide border border-sky-200 flex items-center gap-1 w-max">
                        <span>Confirmada</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {c.estado === 'CONFIRMADA' && (
                      <button
                        onClick={() => cambiarEstadoCita(c.id, 'EN_ESPERA')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0AA896] hover:bg-[#136A7B] text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        Pasar a Sala
                      </button>
                    )}
                    {c.estado === 'EN_ESPERA' && (
                      <button
                        onClick={() => cambiarEstadoCita(c.id, 'COMPLETADA')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs"
                      >
                        Marcar Atendida
                      </button>
                    )}
                    {c.estado === 'COMPLETADA' && (
                      <span className="text-[11px] text-gray-400 font-semibold italic">
                        Turno finalizado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Modal de Registro Rápido de Cita en Recepción (Con Selector Menor / Adulto y Correo Electrónico) */}
      {modalNuevaCita && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-[#136A7B]/10 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0AA896]" />
                <h3 className="font-extrabold text-base text-gray-900">
                  Agendar Cita en Recepción
                </h3>
              </div>
              <button
                onClick={() => setModalNuevaCita(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Modalidad: Menor de Edad vs Adulto */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Tipo de Paciente
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTipoPaciente('MENOR')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoPaciente === 'MENOR'
                      ? 'bg-white text-[#094A57] shadow-sm border border-gray-200/80'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Baby className="w-4 h-4 text-amber-600" />
                  <span>Menor (Pediátrico)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoPaciente('ADULTO')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    tipoPaciente === 'ADULTO'
                      ? 'bg-white text-[#094A57] shadow-sm border border-gray-200/80'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-sky-600" />
                  <span>Paciente Adulto</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleGuardarCita} className="space-y-3 text-xs">
              {/* Campo Nombre del Paciente */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {tipoPaciente === 'MENOR'
                    ? 'Nombre Completo del Niño/Niña'
                    : 'Nombre Completo del Paciente Adulto'}
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder={tipoPaciente === 'MENOR' ? 'Ej. Lucas Daniel Morales' : 'Ej. Mariana Gómez Rivas'}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                />
              </div>

              {/* Edad y Hora Deseada */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Edad</label>
                  <input
                    type="text"
                    value={formEdad}
                    onChange={(e) => setFormEdad(e.target.value)}
                    placeholder={tipoPaciente === 'MENOR' ? 'Ej. 5' : 'Ej. 34'}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Hora del Turno</label>
                  <input
                    type="time"
                    value={formHora}
                    onChange={(e) => setFormHora(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Campos condicionales para Menor de Edad */}
              {tipoPaciente === 'MENOR' && (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nombre del Acudiente / Familiar Responsable
                  </label>
                  <input
                    type="text"
                    required
                    value={formAcudiente}
                    onChange={(e) => setFormAcudiente(e.target.value)}
                    placeholder="Ej. Martha Morales (Madre)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              )}

              {/* Correo Electrónico (Acudiente o Paciente) */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {tipoPaciente === 'MENOR'
                    ? 'Correo Electrónico del Acudiente'
                    : 'Correo Electrónico del Paciente'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Teléfono Móvil / WhatsApp */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {tipoPaciente === 'MENOR'
                    ? 'Teléfono Móvil del Acudiente (WhatsApp)'
                    : 'Teléfono Móvil del Paciente (WhatsApp)'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="Ej. 315 778 9900"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-[#FAF6F0]/40"
                  />
                </div>
              </div>

              {/* Servicio Solicitado */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Servicio Solicitado</label>
                <select
                  value={formServicio}
                  onChange={(e) => setFormServicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#0AA896] bg-white cursor-pointer"
                >
                  <option value="Valoración Fonoaudiológica Inicial">Valoración Fonoaudiológica Inicial</option>
                  <option value="Terapia del Habla y Lenguaje">Terapia del Habla y Lenguaje</option>
                  <option value="Terapia Miofuncional Orofacial">Terapia Miofuncional Orofacial</option>
                  <option value="Terapia Vocal y Disfonía">Terapia Vocal y Disfonía</option>
                  <option value="Rehabilitación de la Deglución">Rehabilitación de la Deglución</option>
                  <option value="Estimulación Temprana">Estimulación Temprana</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevaCita(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0AA896] hover:bg-[#136A7B] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
