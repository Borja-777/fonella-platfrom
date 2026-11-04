'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldAlert,
  CheckCircle2,
  X,
  Mail,
  Lock,
  User,
  Award,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { apiService, Usuario } from '@/services/api';

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  // Estados del Formulario de Creación
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rol, setRol] = useState<'FONOAUDIOLOGA' | 'ASISTENTE'>('ASISTENTE');
  const [registroRethus, setRegistroRethus] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const data = await apiService.listarPersonal();
      setPersonal(data);
    } catch (err: any) {
      setFeedback({
        tipo: 'error',
        texto: err.message || 'No se pudo cargar la lista de personal.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPersonal();
  }, []);

  const handleCrearPersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setGuardando(true);

    try {
      await apiService.crearPersonal({
        nombreCompleto,
        email,
        password,
        rol,
        registroRethus: rol === 'FONOAUDIOLOGA' ? registroRethus : undefined,
      });

      setFeedback({
        tipo: 'exito',
        texto: `Cuenta para "${nombreCompleto}" registrada exitosamente.`,
      });

      // Limpiar formulario y cerrar modal
      setNombreCompleto('');
      setEmail('');
      setPassword('');
      setRegistroRethus('');
      setRol('ASISTENTE');
      setModalAbierto(false);

      // Recargar lista
      await cargarPersonal();
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la cuenta.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (u: Usuario) => {
    const nuevoEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const accion = nuevoEstado === 'INACTIVO' ? 'desactivar' : 'activar';

    if (
      !confirm(
        `¿Estás segura de que deseas ${accion} la cuenta de ${u.nombreCompleto}?`
      )
    ) {
      return;
    }

    try {
      await apiService.cambiarEstado(u.id, nuevoEstado);
      setFeedback({
        tipo: 'exito',
        texto: `La cuenta de ${u.nombreCompleto} ahora está ${nuevoEstado}.`,
      });
      await cargarPersonal();
    } catch (err: any) {
      setFeedback({
        tipo: 'error',
        texto: err.message || `No se pudo cambiar el estado de la cuenta.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Card Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/70 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F5ECDD] text-[#136A7B] rounded-xl border border-[#DF9B78]/30">
              <Users className="w-6 h-6 text-[#136A7B]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#136A7B] tracking-tight">
                Gestión de Cuentas de Personal del Consultorio
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Crea, edita o revoca de inmediato el acceso operativo de tu Secretaria / Asistente.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setModalAbierto(true);
          }}
          className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Nueva Secretaria</span>
        </button>
      </div>

      {/* 2. Banner de Feedback Global */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in ${
            feedback.tipo === 'exito'
              ? 'bg-[#0AA896]/10 border border-[#0AA896]/30 text-[#136A7B]'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-[#0AA896] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.texto}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Tabla de Personal con Cabecera Naranja Terracota Fonella */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/70 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#136A7B]">
              Cargando cuentas de personal desde PostgreSQL...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] text-white text-xs uppercase font-extrabold tracking-wider shadow-sm">
                  <th className="py-4 px-6 text-white font-extrabold">Nombre Completo</th>
                  <th className="py-4 px-6 text-white font-extrabold">Correo Institucional</th>
                  <th className="py-4 px-6 text-white font-extrabold">Rol RBAC</th>
                  <th className="py-4 px-6 text-white font-extrabold">Registro ReTHUS</th>
                  <th className="py-4 px-6 text-white font-extrabold">Estado</th>
                  <th className="py-4 px-6 text-right text-white font-extrabold">Acción Inmediata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {personal.map((u) => {
                  const esAdminPrincipal = u.email === 'barbara.ccucho@fonella.co';
                  const activo = u.estado === 'ACTIVO';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FAF6F0]/80 transition-colors"
                    >
                      {/* Colaborador con Foto de Bárbara o Inicial */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {u.rol === 'FONOAUDIOLOGA' ? (
                            <img
                              src="/images/barbara-avatar.jpg"
                              alt={u.nombreCompleto}
                              className="w-9 h-9 rounded-full object-cover border border-[#136A7B]/30 shadow-xs ring-1 ring-emerald-50"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs bg-[#DF9B78]/15 text-[#B86E47] border border-[#DF9B78]/30">
                              {u.nombreCompleto.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900">
                              {u.nombreCompleto}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              ID: {u.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-6 font-medium text-slate-700">
                        {u.email}
                      </td>

                      {/* Rol */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            u.rol === 'FONOAUDIOLOGA'
                              ? 'bg-[#136A7B] text-white'
                              : 'bg-[#0AA896]/15 text-[#00796B] border border-[#0AA896]/30'
                          }`}
                        >
                          {u.rol === 'FONOAUDIOLOGA' ? 'Fonoaudióloga' : 'Asistente / Recepción'}
                        </span>
                      </td>

                      {/* Registro ReTHUS */}
                      <td className="py-3.5 px-6">
                        {u.registroRethus ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#FAF6F0] text-gray-800 border border-[#DF9B78]/40">
                            {u.registroRethus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No aplica</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            activo
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activo ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {u.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-6 text-right">
                        {esAdminPrincipal ? (
                          <span className="text-xs text-slate-400 italic">Cuenta Principal</span>
                        ) : (
                          <button
                            onClick={() => handleToggleEstado(u)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border cursor-pointer ${
                              activo
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {activo ? 'Desactivar Cuenta' : 'Activar Cuenta'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal "Añadir Nueva Cuenta de Secretaria" con Cabecera Naranja y Botón Rojo de Cerrar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/60">
            {/* Cabecera Naranja Terracota con Título y Botón Rojo de Cerrar */}
            <div className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] px-6 py-4 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-black tracking-tight text-white">
                  Añadir Nueva Cuenta de Secretaria
                </h3>
              </div>

              {/* Botón Rojo Bonito de Cerrar */}
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✕</span>
                <span>Cerrar</span>
              </button>
            </div>

            {/* Cuerpo del Formulario */}
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCrearPersonal} className="space-y-4">
                {/* Nombre Completo */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      placeholder="Ej: Valeria Ríos"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="valeria.recepcion@fonella.co"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                    />
                  </div>
                </div>

                {/* Password con botón mostrar/ocultar */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    Contraseña Inicial (mínimo 8 caracteres) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {mostrarPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    Rol en el Sistema *
                  </label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                  >
                    <option value="ASISTENTE">Asistente / Recepcionista</option>
                    <option value="FONOAUDIOLOGA">Fonoaudióloga Colega</option>
                  </select>
                </div>

                {/* ReTHUS (Condicional si es Fonoaudióloga) */}
                {rol === 'FONOAUDIOLOGA' && (
                  <div>
                    <label className="block text-xs font-bold text-[#136A7B] mb-1">
                      Código ReTHUS (Salud Colombia)
                    </label>
                    <div className="relative">
                      <Award className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={registroRethus}
                        onChange={(e) => setRegistroRethus(e.target.value)}
                        placeholder="RETHUS-76001XXXX"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Acciones del Modal */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="bg-[#136A7B] hover:bg-[#0AA896] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                  >
                    {guardando ? 'Guardando...' : 'Guardar Cuenta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
