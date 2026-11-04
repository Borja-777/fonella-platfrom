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
  Archive,
  Check,
  RotateCcw,
} from 'lucide-react';
import { apiService, Usuario } from '@/services/api';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalArchivadosAbierto, setModalArchivadosAbierto] = useState(false);
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

    // Validación estricta de formato (JPG / PNG)
    const formatosValidos = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!formatosValidos.includes(file.type.toLowerCase())) {
      setFormError('Formato no compatible. Solo se permiten imágenes en formato JPG o PNG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validación de tamaño máximo (10 MB)
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      setFormError(`La fotografía seleccionada supera el límite máximo de ${MAX_MB} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFormError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar suavemente a un máx de 1200px para almacenamiento óptimo sin perder calidad
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const formatoSalida = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(formatoSalida, 0.90);
          setFotoPreview(dataUrl);
        } else {
          setFotoPreview(reader.result as string);
        }
      };
      img.onerror = () => {
        setFormError('No se pudo procesar la imagen seleccionada.');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const validarPasswordComplejidad = (pass: string) => {
    return PASSWORD_REGEX.test(pass);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validación de contraseña según el modo
    if (modoModal === 'crear') {
      if (!validarPasswordComplejidad(password)) {
        setFormError(
          'La contraseña no cumple los requisitos: mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.'
        );
        return;
      }
    } else if (password.trim().length > 0) {
      if (!validarPasswordComplejidad(password)) {
        setFormError(
          'La nueva contraseña debe contener mínimo 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial.'
        );
        return;
      }
    }

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

  const handleOcultarCuenta = async (u: Usuario) => {
    if (
      !confirm(
        `¿Deseas ocultar del panel la cuenta inactiva de ${u.nombreCompleto}? Podrás restaurarla en cualquier momento desde "Cuentas Archivadas".`
      )
    ) {
      return;
    }

    try {
      await apiService.actualizarPersonal(u.id, { ocultoEnPanel: true });
      setFeedback({
        tipo: 'exito',
        texto: `Cuenta de ${u.nombreCompleto} archivada. Puedes restaurarla desde el botón "Cuentas Archivadas".`,
      });
      await cargarPersonal();
    } catch (err: any) {
      setFeedback({
        tipo: 'error',
        texto: err.message || 'No se pudo ocultar la cuenta.',
      });
    }
  };

  const handleRestaurarCuenta = async (u: Usuario) => {
    try {
      await apiService.actualizarPersonal(u.id, { ocultoEnPanel: false });
      setFeedback({
        tipo: 'exito',
        texto: `Cuenta de ${u.nombreCompleto} restaurada exitosamente al panel principal.`,
      });
      await cargarPersonal();
    } catch (err: any) {
      setFeedback({
        tipo: 'error',
        texto: err.message || 'No se pudo restaurar la cuenta.',
      });
    }
  };

  // Cuentas visibles en panel y cuentas archivadas
  const personalVisible = personal.filter((u) => !u.ocultoEnPanel);
  const personalArchivado = personal.filter((u) => u.ocultoEnPanel);

  // Verificadores de complejidad de contraseña en tiempo real
  const passLongitudOk = password.length >= 8;
  const passMayusculaOk = /[A-Z]/.test(password);
  const passMinusculaOk = /[a-z]/.test(password);
  const passNumeroOk = /\d/.test(password);
  const passEspecialOk = /[^a-zA-Z0-9]/.test(password);

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

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón de Cuentas Archivadas / Ocultas */}
          <button
            onClick={() => setModalArchivadosAbierto(true)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer border ${
              personalArchivado.length > 0
                ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Ver cuentas inactivas archivadas u ocultas"
          >
            <Archive className="w-4 h-4 text-[#136A7B]" />
            <span>Cuentas Archivadas ({personalArchivado.length})</span>
          </button>

          {/* Botón de Registrar Nueva Secretaria */}
          <button
            onClick={abrirModalCrear}
            className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Nueva Secretaria</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Feedback Global */}
      {feedback && (
        <div
          className={`px-5 py-3.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-fade-in shadow-xl border backdrop-blur-md transition-all ${
            feedback.tipo === 'exito'
              ? 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 border-emerald-400/40 text-white shadow-emerald-950/20'
              : 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-700 border-rose-400/40 text-white shadow-rose-950/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-1 bg-white/20 rounded-lg shrink-0">
              {feedback.tipo === 'exito' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-100" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-100" />
              )}
            </div>
            <span className="font-extrabold tracking-wide">{feedback.texto}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Tabla de Personal con Acciones Completas */}
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
                  <th className="py-4 px-5 font-extrabold whitespace-nowrap">
                    Nombre Completo
                  </th>
                  <th className="py-4 px-5 font-extrabold whitespace-nowrap">
                    Correo Institucional
                  </th>
                  <th className="py-4 px-4 font-extrabold whitespace-nowrap">
                    Rol RBAC
                  </th>
                  <th className="py-4 px-4 font-extrabold whitespace-nowrap">
                    Registro ReTHUS
                  </th>
                  <th className="py-4 px-4 font-extrabold whitespace-nowrap">
                    Estado
                  </th>
                  <th className="py-4 px-5 text-right font-extrabold whitespace-nowrap">
                    Acción Inmediata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {personalVisible.map((u) => {
                  const esAdminPrincipal = u.email === 'barbara.ccucho@fonella.co';
                  const activo = u.estado === 'ACTIVO';
                  const fotoUrl = u.fotoPerfilUrl || (u.rol === 'FONOAUDIOLOGA' ? '/images/barbara-avatar.jpg' : null);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FAF6F0]/80 transition-colors"
                    >
                      {/* Colaborador con Foto o Inicial */}
                      <td className="py-4 px-5">
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
                      <td className="py-4 px-5 font-medium text-slate-700 whitespace-nowrap">
                        {u.email}
                      </td>

                      {/* Rol RBAC */}
                      <td className="py-4 px-4 whitespace-nowrap">
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
                      <td className="py-4 px-4 whitespace-nowrap">
                        {u.registroRethus ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-[#FAF6F0] text-gray-800 border border-[#DF9B78]/40 shadow-xs">
                            {u.registroRethus}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No aplica</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-4 px-4 whitespace-nowrap">
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

                      {/* Acciones Inmediatas (Editar + Activar/Desactivar + Ocultar) */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
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

                          {/* Botón Activar / Desactivar (o etiqueta Cuenta Titular) */}
                          {esAdminPrincipal ? (
                            <span className="text-[11px] text-slate-400 italic pl-1">
                              Cuenta Titular
                            </span>
                          ) : (
                            <>
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

                              {/* Ícono de Ojo Ocultar: Solo para cuentas desactivadas */}
                              {!activo && (
                                <button
                                  onClick={() => handleOcultarCuenta(u)}
                                  className="p-1.5 rounded-lg border border-slate-300 text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer bg-white shadow-xs"
                                  title="Ocultar esta cuenta inactiva del panel principal"
                                >
                                  <EyeOff className="w-3.5 h-3.5 text-slate-500 hover:text-slate-800" />
                                </button>
                              )}
                            </>
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
                      title="Subir fotografía (JPG o PNG, máx. 10 MB)"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleSeleccionarFoto}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#136A7B]">
                      Fotografía de Perfil
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Formatos: <span className="font-bold text-slate-700">JPG o PNG</span>. Máximo: <span className="font-bold text-[#136A7B]">10 MB</span>.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Haz clic en la cámara para seleccionar la imagen.
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

                {/* Contraseña con Regla de Complejidad */}
                <div>
                  <label className="block text-xs font-bold text-[#136A7B] mb-1">
                    {modoModal === 'crear'
                      ? 'Contraseña Segura *'
                      : 'Nueva Contraseña (opcional)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required={modoModal === 'crear'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={modoModal === 'crear' ? 'Ej: Fonella2026*' : 'Dejar en blanco para conservar la actual'}
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

                  {/* Checklist visual de requisitos de contraseña */}
                  {(modoModal === 'crear' || password.length > 0) && (
                    <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]">
                      <p className="font-bold text-slate-700">Requisitos de contraseña:</p>
                      <div className="grid grid-cols-2 gap-1 text-slate-600">
                        <div className={`flex items-center gap-1.5 ${passLongitudOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passLongitudOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Mínimo 8 caracteres</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passMayusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passMayusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 letra Mayúscula</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passMinusculaOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passMinusculaOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 letra Minúscula</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passNumeroOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passNumeroOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 Número</span>
                        </div>
                        <div className={`col-span-2 flex items-center gap-1.5 ${passEspecialOk ? 'text-emerald-700 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passEspecialOk ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>1 Carácter especial (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  )}
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

      {/* 5. Modal para Cuentas Archivadas / Ocultas */}
      {modalArchivadosAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[3px] z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-white/60">
            {/* Cabecera Naranja Terracota con Botón Rojo Cerrar */}
            <div className="bg-gradient-to-r from-[#C26B43] via-[#DF9B78] to-[#E5A885] px-6 py-4 flex items-center justify-between text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Cuentas de Personal Archivadas
                  </h3>
                  <p className="text-[11px] text-white/80">
                    Cuentas inactivas que fueron ocultadas del panel de control
                  </p>
                </div>
              </div>

              {/* Botón Rojo Bonito de Cerrar */}
              <button
                type="button"
                onClick={() => setModalArchivadosAbierto(false)}
                className="bg-red-500 hover:bg-red-600 active:scale-95 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✕</span>
                <span>Cerrar</span>
              </button>
            </div>

            {/* Contenido del Modal de Archivados */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {personalArchivado.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Archive className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No hay cuentas archivadas
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Cuando desactives una cuenta en el panel principal, aparecerá el ícono de ojo para ocultarla y archivarla aquí.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  {personalArchivado.map((u) => {
                    const fotoUrl = u.fotoPerfilUrl || (u.rol === 'FONOAUDIOLOGA' ? '/images/barbara-avatar.jpg' : null);

                    return (
                      <div
                        key={u.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white hover:bg-[#FAF6F0]/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {fotoUrl ? (
                            <img
                              src={fotoUrl}
                              alt={u.nombreCompleto}
                              className="w-10 h-10 rounded-full object-cover border border-[#136A7B]/20 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              {u.nombreCompleto.charAt(0)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm">
                                {u.nombreCompleto}
                              </p>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                Inactivo
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {u.email} • <span className="font-medium text-[#136A7B]">{u.rol === 'FONOAUDIOLOGA' ? 'Fonoaudióloga' : 'Asistente'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Botón Restaurar al Panel */}
                        <button
                          onClick={() => handleRestaurarCuenta(u)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#136A7B] hover:bg-[#0AA896] text-white shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          title="Restaurar y volver a mostrar en el panel principal"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar al Panel</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalArchivadosAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
