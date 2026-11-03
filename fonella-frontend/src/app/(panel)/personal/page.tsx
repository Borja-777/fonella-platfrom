"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { apiService, Usuario } from "@/services/api";

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [feedback, setFeedback] = useState<{
    tipo: "exito" | "error";
    texto: string;
  } | null>(null);

  // Estados del Formulario de Creación
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"FONOAUDIOLOGA" | "ASISTENTE">("ASISTENTE");
  const [registroRethus, setRegistroRethus] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const data = await apiService.listarPersonal();
      setPersonal(data);
    } catch (err: any) {
      setFeedback({
        tipo: "error",
        texto: err.message || "No se pudo cargar la lista de personal.",
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
    setModalError(null);
    setGuardando(true);

    try {
      await apiService.crearPersonal({
        nombreCompleto,
        email,
        password,
        rol,
        registroRethus: rol === "FONOAUDIOLOGA" ? registroRethus : undefined,
      });

      setFeedback({
        tipo: "exito",
        texto: `Cuenta para "${nombreCompleto}" registrada exitosamente.`,
      });

      // Limpiar formulario y cerrar modal
      setNombreCompleto("");
      setEmail("");
      setPassword("");
      setRegistroRethus("");
      setRol("ASISTENTE");
      setModalAbierto(false);

      // Recargar lista
      await cargarPersonal();
    } catch (err: any) {
      setModalError(err.message || "Error al crear la cuenta.");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (u: Usuario) => {
    const nuevoEstado = u.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const accion = nuevoEstado === "INACTIVO" ? "desactivar" : "activar";

    if (
      !confirm(
        `¿Estás segura de que deseas ${accion} la cuenta de ${u.nombreCompleto}?`,
      )
    ) {
      return;
    }

    try {
      await apiService.cambiarEstado(u.id, nuevoEstado);
      setFeedback({
        tipo: "exito",
        texto: `La cuenta de ${u.nombreCompleto} ahora está ${nuevoEstado}.`,
      });
      await cargarPersonal();
    } catch (err: any) {
      setFeedback({
        tipo: "error",
        texto: err.message || `No se pudo cambiar el estado de la cuenta.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-white/70 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F5ECDD] text-[#136A7B] rounded-xl border border-[#DF9B78]/20">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#136A7B] tracking-tight">
              Gestión de Cuentas de Personal del Consultorio
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Crea, edita o revoca de inmediato el acceso operativo de tu
            Secretaria / Asistente.
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setModalAbierto(true);
          }}
          className="bg-[#0AA896] hover:bg-[#136A7B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Registrar Nueva Secretaria</span>
        </button>
      </div>

      {/* Banner de Feedback Global */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs animate-fade-in ${
            feedback.tipo === "exito"
              ? "bg-[#0AA896]/10 border border-[#0AA896]/30 text-[#136A7B]"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === "exito" ? (
              <CheckCircle2 className="w-4 h-4 text-[#0AA896] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.texto}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabla de Personal */}
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
                  <th className="py-4 px-6 text-white font-extrabold">
                    Nombre Completo
                  </th>
                  <th className="py-4 px-6 text-white font-extrabold">
                    Correo Institucional
                  </th>
                  <th className="py-4 px-6 text-white font-extrabold">
                    Rol RBAC
                  </th>
                  <th className="py-4 px-6 text-white font-extrabold">
                    Registro ReTHUS
                  </th>
                  <th className="py-4 px-6 text-white font-extrabold">
                    Estado
                  </th>
                  <th className="py-4 px-6 text-right text-white font-extrabold">
                    Acción Inmediata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {personal.map((u) => {
                  const esAdminPrincipal =
                    u.email === "barbara.ccucho@fonella.co";
                  const activo = u.estado === "ACTIVO";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#FAF6F0]/80 transition-colors"
                    >
                      {/* Colaborador */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {u.rol === "FONOAUDIOLOGA" ? (
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
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.rol === "FONOAUDIOLOGA"
                              ? "bg-[#136A7B]/10 text-[#136A7B] border border-[#136A7B]/20"
                              : "bg-[#0AA896]/10 text-[#0AA896] border border-[#0AA896]/30"
                          }`}
                        >
                          {u.rol === "FONOAUDIOLOGA"
                            ? "Fonoaudióloga"
                            : "Asistente / Recepción"}
                        </span>
                      </td>

                      {/* ReTHUS */}
                      <td className="py-3.5 px-6 text-xs font-mono text-gray-600">
                        {u.registroRethus ? (
                          <span className="bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#DF9B78]/30 font-semibold text-slate-700">
                            {u.registroRethus}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            No aplica
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            activo
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              activo ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {u.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-6 text-right">
                        {esAdminPrincipal ? (
                          <span className="text-xs text-gray-400 italic">
                            Cuenta Principal
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleEstado(u)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border cursor-pointer ${
                              activo
                                ? "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                                : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            }`}
                          >
                            {activo ? "Desactivar Cuenta" : "Activar Cuenta"}
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

      {/* MODAL DE REGISTRO DE PERSONAL (HU-02) */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#DF9B78]/30 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#F5ECDD] p-6 border-b border-[#DF9B78]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#136A7B]" />
                <h3 className="font-extrabold text-base text-[#136A7B]">
                  ➕ Alta de Nueva Cuenta de Secretaria (HU-02)
                </h3>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-500 hover:text-slate-800 p-1 rounded-lg text-xs font-bold cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCrearPersonal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-[#136A7B] mb-1">
                  Contraseña Inicial (mínimo 8 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                  />
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                >
                  <option value="ASISTENTE">Asistente / Recepcionista</option>
                  <option value="FONOAUDIOLOGA">Fonoaudióloga Colega</option>
                </select>
              </div>

              {/* ReTHUS (Condicional) */}
              {rol === "FONOAUDIOLOGA" && (
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
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#136A7B] bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Acciones Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="bg-[#136A7B] hover:bg-[#0AA896] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? "Guardando..." : "Guardar Cuenta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
