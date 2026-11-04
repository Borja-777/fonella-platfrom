'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Pencil,
  Camera,
  Trash2,
} from 'lucide-react';
import { apiService, Usuario } from '@/services/api';

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);

  const [feedback, setFeedback] = useState<{
    tipo: 'exito' | 'error';
    texto: string;
  } | null>(null);

  // Estados del Formulario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [rol, setRol] = useState<'FONOAUDIOLOGA' | 'ASISTENTE'>('ASISTENTE');
  const [registroRethus, setRegistroRethus] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const abrirModalCrear = () => {
    setModoModal('crear');
    setUsuarioSeleccionado(null);
    setNombreCompleto('');
    setEmail('');
    setPassword('');
    setRol('ASISTENTE');
    setRegistroRethus('');
    setFotoPreview('');
    setFormError(null);
    setMostrarPassword(false);
    setModalAbierto(true);
  };

  const abrirModalEditar = (u: Usuario) => {
    setModoModal('editar');
    setUsuarioSeleccionado(u);
    setNombreCompleto(u.nombreCompleto);
    setEmail(u.email);
    setPassword('');
    setRol(u.rol);
    setRegistroRethus(u.registroRethus || '');
    setFotoPreview(u.fotoPerfilUrl || (u.rol === 'FONOAUDIOLOGA' ? '/images/barbara-avatar.jpg' : ''));
    setFormError(null);
    setMostrarPassword(false);
    setModalAbierto(true);
  };

  const handleSeleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('La fotografía no debe superar 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setGuardando(true);

    try {
      if (modoModal === 'crear') {
        await apiService.crearPersonal({
          nombreCompleto,
          email,
          password,
          rol,
          registroRethus: rol === 'FONOAUDIOLOGA' ? registroRethus : undefined,
          fotoPerfilUrl: fotoPreview || undefined,
        });

        setFeedback({
          tipo: 'exito',
          texto: `Cuenta para "${nombreCompleto}" registrada exitosamente.`,
        });
      } else if (usuarioSeleccionado) {
        await apiService.actualizarPersonal(usuarioSeleccionado.id, {
          nombreCompleto,
          email,
          password: password.trim() ? password : undefined,
          rol: usuarioSeleccionado.email === 'barbara.ccucho@fonella.co' ? 'FONOAUDIOLOGA' : rol,
          registroRethus: rol === 'FONOAUDIOLOGA' ? registroRethus : undefined,
          fotoPerfilUrl: fotoPreview || '',
        });

        setFeedback({
          tipo: 'exito',
          texto: `Información de "${nombreCompleto}" actualizada correctamente.`,
        });
      }

      setModalAbierto(false);
      await cargarPersonal();
    } catch (err: any) {
      setFormError(err.message || 'Error al procesar la solicitud.');
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
    <div className="space-y-6 w-full">
      {/* 1. Header Card Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/70 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#F5ECDD] text-[#136A7B] rounded-2xl border border-[#DF9B78]/30 shadow-xs shrink-0">
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

        <button
          onClick={abrirModalCrear}
          className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Nueva Secretaria</span>
        </button>
      </div>

      {/* 2. Banner de Feedback Global */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in shadow-sm ${
            feedback.tipo === 'exito'
              ? 'bg-[#0AA896]/15 border border-[#0AA896]/30 text-[#094A57]'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-[#0AA896] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-bold">{feedback.texto}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Tabla de Personal con Acciones Completas (Editar + Activar/Desactivar) */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/70 overflow-hidden w-full">
        {loading ? (
          <div className="p-16 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-[#0AA896] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-[#136A7B]">
              Cargando cuentas de personal desde PostgreSQL...
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] text-white text-[11px] sm:text-xs uppercase font-extrabold tracking-wider shadow-sm">
                  <th className="py-4 px-6 font-extrabold whitespace-nowrap min-w-[280px]">
                    Nombre Completo
                  </th>
                  <th className="py-4 px-6 font-extrabold whitespace-nowrap min-w-[220px]">
                    Correo Institucional
                  </th>
                  <th className="py-4 px-6 font-extrabold whitespace-nowrap min-w-[170px]">
                    Rol RBAC
                  </th>
                  <th className="py-4 px-6 font-extrabold whitespace-nowrap min-w-[150px]">
                    Registro ReTHUS
                  </th>
                  <th className="py-4 px-6 font-extrabold whitespace-nowrap min-w-[130px]">
                    Estado
                  </th>
                  <th className="py-4 px-6 text-right font-extrabold whitespace-nowrap min-w-[220px]">
                    Acción Inmediata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {personal.map((u) => {
                  const esAdminPrincipal = u.email === 'barbara.ccucho@fonella.co';
                  const activo = u.estado === 'ACTIVO';
                  const fotoUrl = u.fotoPerfilUrl || (u.rol === 'FONOAUDIOLOGA' ? '/images/barbara-avatar.jpg' : null);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FAF6F0]/80 transition-colors"
                    >
                      {/* Colaborador con Foto o Inicial */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          {fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt={u.nombreCompleto}
                              className="w-10 h-10 rounded-full object-cover border border-[#136A7B]/30 shadow-xs ring-2 ring-emerald-50 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-[#DF9B78]/15 text-[#B86E47] border border-[#DF9B78]/30 shrink-0">
                              {u.nombreCompleto.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm whitespace-nowrap">
                              {u.nombreCompleto}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 whitespace-nowrap">
                              ID: {u.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Correo Institucional */}
                      <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Rol RBAC */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                            u.rol === 'FONOAUDIOLOGA'
                              ? 'bg-[#136A7B] text-white shadow-xs'
                              : 'bg-[#0AA896]/15 text-[#00796B] border border-[#0AA896]/30'
                          }`}
                        >
                          {u.rol === 'FONOAUDIOLOGA' ? 'Fonoaudióloga' : 'Asistente / Recepción'}
                        </span>
                      </td>

                      {/* Registro ReTHUS */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {u.registroRethus ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#FAF6F0] text-gray-800 border border-[#DF9B78]/40 shadow-xs">
                            {u.registroRethus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No aplica</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
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

                      {/* Acciones Inmediatas (Editar + Activar/Desactivar) */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Editar para todos (incluida Bárbara) */}
                          <button
                            onClick={() => abrirModalEditar(u)}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-[#136A7B] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs bg-white"
                            title="Editar información y fotografía"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#136A7B]" />
                            <span>Editar</span>
                          </button>

                          {/* Botón Activar / Desactivar (o etiqueta Cuenta Principal) */}
                          {esAdminPrincipal ? (
                            <span className="text-[11px] text-slate-400 italic pl-1">
                              Cuenta Titular
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleEstado(u)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border cursor-pointer ${
                                activo
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {activo ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal para Añadir o Editar Cuenta de Personal */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/60">
            {/* Cabecera Naranja Terracota con Título Dinámico y Botón Rojo de Cerrar */}
            <div className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] px-6 py-4 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  {modoModal === 'crear' ? (
                    <UserPlus className="w-5 h-5 text-white" />
                  ) : (
                    <Pencil className="w-5 h-5 text-white" />
                  )}
                </div>
                <h3 className="text-base font-black tracking-tight text-white">
                  {modoModal === 'crear'
                    ? 'Añadir Nueva Cuenta de Secretaria'
                    : usuarioSeleccionado?.email === 'barbara.ccucho@fonella.co'
                    ? 'Editar Perfil Profesional (Dra. Bárbara)'
                    : `Editar Cuenta de ${usuarioSeleccionado?.nombreCompleto}`}
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
            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleGuardar} className="space-y-4">
                {/* 1.2 Sección para Subir / Cambiar Fotografía de Perfil */}
                <div className="flex items-center gap-4 p-3.5 bg-[#FAF6F0] rounded-2xl border border-[#DF9B78]/30">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border-2 border-[#136A7B]/40 bg-white flex items-center justify-center">
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Foto Perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#DF9B78]/20 flex items-center justify-center text-[#B86E47] font-black text-xl">
                          {nombreCompleto ? nombreCompleto.charAt(0) : 'U'}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-[#136A7B] hover:bg-[#0AA896] text-white rounded-xl shadow-md transition-all cursor-pointer"
                      title="Subir nueva foto"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSeleccionarFoto}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#136A7B]">
                      Fotografía de Perfil
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Haz clic en el ícono de cámara para subir una foto desde tu equipo.
                    </p>
                    {fotoPreview && (
                      <button
                        type="button"
                        onClick={() => setFotoPreview('')}
                        className="text-[11px] text-rose-600 hover:underline font-semibold mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Quitar fotografía</span>
                      </button>
                    )}
                  </div>
                </div>

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

                {/* Correo Electrónico */}
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

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    {modoModal === 'crear'
                      ? 'Contraseña Inicial (mínimo 8 caracteres) *'
                      : 'Nueva Contraseña (opcional, mínimo 8 caracteres)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required={modoModal === 'crear'}
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={modoModal === 'crear' ? '••••••••' : 'Dejar en blanco para conservar la actual'}
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
                    disabled={usuarioSeleccionado?.email === 'barbara.ccucho@fonella.co'}
                    onChange={(e) => setRol(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="ASISTENTE">Asistente / Recepcionista</option>
                    <option value="FONOAUDIOLOGA">Fonoaudióloga Colega</option>
                  </select>
                </div>

                {/* ReTHUS (Condicional) */}
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
                    {guardando
                      ? 'Guardando...'
                      : modoModal === 'crear'
                      ? 'Guardar Cuenta'
                      : 'Guardar Cambios'}
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
