const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface Usuario {
  id: string;
  nombreCompleto: string;
  email: string;
  rol: 'FONOAUDIOLOGA' | 'ASISTENTE';
  registroRethus?: string | null;
  fotoPerfilUrl?: string | null;
  ocultoEnPanel?: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
  resetToken?: string | null;
  resetTokenExpira?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Juguete {
  id: string;
  codigoSku: string;
  nombre: string;
  descripcionTerapeutica: string;
  areaEstimulacion: string;
  edadSugerida: string;
  imagenUrl?: string;
  stockDisponible: number;
  stockMinimoAlerta: number;
  costoUnitario?: number;
  precioVenta: number;
  gananciaNetaUnitaria?: number;
  margenPorcentual?: number;
  publicadoCatalogo: boolean;
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt?: string;
}

export interface CrearJugueteData {
  codigoSku: string;
  nombre: string;
  descripcionTerapeutica: string;
  areaEstimulacion: string;
  edadSugerida: string;
  imagenUrl?: string;
  stockDisponible: number;
  stockMinimoAlerta?: number;
  costoUnitario: number;
  precioVenta: number;
  publicadoCatalogo?: boolean;
}

export interface RegistrarVentaData {
  cantidad: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
  pacienteId?: string;
}

export interface VentaHistorial {
  id: string;
  jugueteId: string;
  cantidad: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
  precioUnitarioVenta: number;
  totalVenta: number;
  costoUnitarioSnapshot?: number;
  gananciaNeta?: number;
  fechaVenta: string;
  juguete: {
    id: string;
    codigoSku: string;
    nombre: string;
    imagenUrl?: string;
    areaEstimulacion: string;
  };
  vendidoPor: {
    id: string;
    nombreCompleto: string;
    rol: string;
  };
}

export interface EvaluacionOfa {
  labios: string;
  lengua: string;
  paladar: string;
  dientesOclusion: string;
  respiracion: string;
  deglucion: string;
  observacionesOfa?: string;
}

export interface Paciente {
  id: string;
  tipoDocumento: 'RC' | 'TI' | 'CC' | 'CE' | 'PA';
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  edad?: number;
  genero?: string | null;
  telefonoContacto: string;
  email?: string | null;
  ciudad?: string | null;
  direccion?: string | null;
  tipoRemision: 'PARTICULAR' | 'REMISION_EXTERNA';
  institucionRemitente?: string | null;
  totalFaltasTardias: number;
  estado?: 'ACTIVO' | 'INACTIVO';
  activo?: boolean;
  acudientes?: PacienteAcudienteRelacion[];
  historiaClinica?: {
    id: string;
    numeroExpediente: string;
    estado: 'BORRADOR' | 'CERRADA';
    diagnosticoCie10Codigo?: string;
    diagnosticoCie10Desc?: string;
    fechaApertura?: string;
  } | null;
}

export interface HistoriaClinica {
  id: string;
  numeroExpediente: string;
  pacienteId: string;
  creadoPorId: string;
  fechaApertura: string;
  motivoConsulta: string;
  antecedentesPerinatales?: string | null;
  evaluacionOfa: EvaluacionOfa;
  evaluacionHabla?: string | null;
  evaluacionLenguaje?: string | null;
  evaluacionVoz?: string | null;
  diagnosticoCie10Codigo: string;
  diagnosticoCie10Desc: string;
  planTratamiento: string;
  estado: 'BORRADOR' | 'CERRADA';
  diasDesdeApertura?: number;
  requiereReevaluacion?: boolean;
  createdAt?: string;
  updatedAt?: string;
  paciente: Paciente;
  creadoPor?: {
    id: string;
    nombreCompleto: string;
    registroRethus?: string | null;
  };
  _count?: {
    notasEvolucion: number;
    archivosAnexos: number;
  };
}

export interface LoginResponse {
  mensaje: string;
  usuario: Usuario;
}

export interface RecuperacionResponse {
  mensaje: string;
  email?: string;
  nombreCompleto?: string;
}

// ----------------------------------------------------------------------------
// Tipos del dominio de Pacientes y Agenda Clínica (Sprint 2)
// ----------------------------------------------------------------------------

export type TipoDocumento = 'RC' | 'TI' | 'CC' | 'CE' | 'PA';
export type TipoRemision = 'PARTICULAR' | 'REMISION_EXTERNA';
export type EstadoCita =
  | 'CONFIRMADA'
  | 'ATENDIDA'
  | 'CANCELADA_A_TIEMPO'
  | 'CANCELADA_TARDIA'
  | 'INASISTENCIA';

export interface Acudiente {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  telefonoPrincipal: string;
  telefonoRespaldo?: string | null;
  email?: string | null;
}

export interface PacienteAcudienteRelacion {
  id: string;
  parentesco: string;
  esPrincipal: boolean;
  acudiente: Acudiente;
}

export interface CrearPacienteData {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero?: string;
  telefonoContacto?: string;
  email?: string;
  ciudad?: string;
  direccion?: string;
  tipoRemision?: TipoRemision;
  institucionRemitente?: string;
  acudiente?: {
    tipoDocumento: TipoDocumento;
    numeroDocumento: string;
    nombres: string;
    apellidos: string;
    parentesco: string;
    telefonoPrincipal: string;
    telefonoRespaldo?: string;
    email?: string;
  };
}

export interface ServicioTerapeutico {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  publicoObjetivo: string;
  duracionMinutos: number;
  precioReferencia: string | number;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface Cita {
  id: string;
  pacienteId: string;
  servicioId: string;
  creadoPorId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoCita;
  motivoCancelacion?: string | null;
  fechaCancelacion?: string | null;
  cancelacionTardia?: boolean;
  paciente: Paciente;
  servicio: ServicioTerapeutico;
  creadoPor: {
    id: string;
    nombreCompleto: string;
    rol: string;
  };
}

export interface FranjaDisponibilidad {
  horaInicio: string;
  horaFin: string;
  jornada: 'MANANA' | 'TARDE';
  disponible: boolean;
  motivoNoDisponible: 'OCUPADA' | 'PASADA' | null;
  cita: Cita | null;
}

export interface DisponibilidadDia {
  fecha: string;
  abierto: boolean;
  motivoCierre?: string;
  duracionFranjaMinutos?: number;
  bloqueReceso: { inicio: string; fin: string } | null;
  franjas: FranjaDisponibilidad[];
}

/**
 * Helper interno para centralizar peticiones autenticadas con cookie HttpOnly
 * y normalizar mensajes de error del backend (NestJS puede devolver string o string[]).
 */
async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const mensaje = Array.isArray(data.message)
      ? data.message.join(' ')
      : data.message;
    throw new Error(mensaje || 'Error en la comunicación con el servidor.');
  }
  return data as T;
}

export const apiService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    return data;
  },

  async solicitarRecuperacion(email: string): Promise<RecuperacionResponse> {
    const res = await fetch(`${API_URL}/auth/recuperar-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al procesar la solicitud');
    }
    return data;
  },

  async restablecerPassword(
    token: string,
    nuevaPassword: string,
  ): Promise<{ mensaje: string }> {
    const res = await fetch(`${API_URL}/auth/restablecer-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, nuevaPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al restablecer la contraseña');
    }
    return data;
  },

  async registroAdministrador(datos: {
    nombreCompleto: string;
    email: string;
    password: string;
    registroRethus?: string;
    fotoPerfilUrl?: string;
  }): Promise<{ mensaje: string; email: string; nombreCompleto: string }> {
    const res = await fetch(`${API_URL}/auth/registro-administrador`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al registrar administradora');
    }
    return data;
  },

  async confirmarCuenta(token: string): Promise<{ mensaje: string; usuario: Usuario }> {
    const res = await fetch(`${API_URL}/auth/confirmar-cuenta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al confirmar cuenta');
    }
    return data;
  },

  async getMe(): Promise<{ usuario: Usuario }> {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'No autorizado');
    }
    return data;
  },

  async logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async listarPersonal(): Promise<Usuario[]> {
    const res = await fetch(`${API_URL}/usuarios/personal`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al obtener personal');
    }
    return data;
  },

  async crearPersonal(datos: {
    nombreCompleto: string;
    email: string;
    password: string;
    rol: 'FONOAUDIOLOGA' | 'ASISTENTE';
    registroRethus?: string;
    fotoPerfilUrl?: string;
  }): Promise<{ mensaje: string; usuario: Usuario }> {
    const res = await fetch(`${API_URL}/usuarios/personal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al registrar personal');
    }
    return data;
  },

  async actualizarPersonal(
    id: string,
    datos: {
      nombreCompleto?: string;
      email?: string;
      password?: string;
      rol?: 'FONOAUDIOLOGA' | 'ASISTENTE';
      registroRethus?: string;
      fotoPerfilUrl?: string;
      ocultoEnPanel?: boolean;
    },
  ): Promise<{ mensaje: string; usuario: Usuario }> {
    const res = await fetch(`${API_URL}/usuarios/personal/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al actualizar información');
    }
    return data;
  },

  async cambiarEstado(
    id: string,
    estado: 'ACTIVO' | 'INACTIVO',
  ): Promise<{ mensaje: string; usuario: Usuario }> {
    const res = await fetch(`${API_URL}/usuarios/personal/${id}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ estado }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al cambiar estado');
    }
    return data;
  },

  async reenviarActivacionPersonal(id: string): Promise<{ mensaje: string }> {
    const res = await fetch(`${API_URL}/usuarios/personal/${id}/reenviar-activacion`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al reenviar correo de activación');
    }
    return data;
  },

  // --------------------------------------------------------------------------
  // MÓDULO DE INVENTARIO DIDÁCTICO Y MARGEN DE GANANCIA
  // --------------------------------------------------------------------------
  async getJuguetes(): Promise<Juguete[]> {
    const res = await fetch(`${API_URL}/inventario/juguetes`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al consultar inventario de juguetes');
    }
    return data;
  },

  async crearJuguete(datos: CrearJugueteData): Promise<Juguete & { mensaje: string }> {
    const res = await fetch(`${API_URL}/inventario/juguetes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al registrar producto en inventario');
    }
    return data;
  },

  async actualizarJuguete(
    id: string,
    datos: Partial<CrearJugueteData>,
  ): Promise<Juguete & { mensaje: string }> {
    const res = await fetch(`${API_URL}/inventario/juguetes/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al actualizar juguete');
    }
    return data;
  },

  async eliminarJuguete(id: string): Promise<{ id: string; mensaje: string }> {
    const res = await fetch(`${API_URL}/inventario/juguetes/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al eliminar juguete del inventario');
    }
    return data;
  },

  async registrarVentaJuguete(
    id: string,
    datos: RegistrarVentaData,
  ): Promise<{
    ventaId: string;
    jugueteId: string;
    nombre: string;
    cantidadVendida: number;
    stockRestante: number;
    totalVenta: number;
    mensaje: string;
  }> {
    const res = await fetch(`${API_URL}/inventario/juguetes/${id}/venta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al procesar la venta');
    }
    return data;
  },

  async listarVentas(): Promise<VentaHistorial[]> {
    const res = await fetch(`${API_URL}/inventario/ventas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al obtener historial de ventas');
    }
    return data;
  },

  async validarEmail(
    email: string,
  ): Promise<{ valido: boolean; email: string; mensaje: string }> {
    const res = await fetch(`${API_URL}/auth/validar-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data.message || 'El correo electrónico ingresado no existe o no es válido.',
      );
    }
    return data;
  },

  // --------------------------------------------------------------------------
  // Endpoints de Pacientes y Acudientes (HU - Agenda - 001 / RN-06)
  // --------------------------------------------------------------------------

  /** Búsqueda predictiva de pacientes por nombre, apellido o número de documento. */
  buscarPacientes(q?: string): Promise<Paciente[]> {
    const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    return requestJson<Paciente[]>(`/pacientes${query}`);
  },

  /** Alias compatible para el módulo de historias clínicas. */
  listarPacientes(q?: string): Promise<Paciente[]> {
    return this.buscarPacientes(q);
  },

  /** Consulta un acudiente existente por documento para reutilizarlo entre hermanos. */
  buscarAcudientePorDocumento(numeroDocumento: string): Promise<Acudiente> {
    return requestJson<Acudiente>(
      `/pacientes/acudiente/${encodeURIComponent(numeroDocumento.trim())}`,
    );
  },

  /** Registra un nuevo paciente (y su acudiente obligatorio si es menor de 18 años). */
  crearPaciente(datos: CrearPacienteData): Promise<Paciente> {
    return requestJson<Paciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  /** Actualiza los datos de un paciente existente (y su acudiente si aplica). */
  actualizarPaciente(
    id: string,
    datos: Partial<CrearPacienteData>,
  ): Promise<Paciente> {
    return requestJson<Paciente>(`/pacientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
  },

  // --------------------------------------------------------------------------
  // Endpoints de Agenda Clínica y Citas (HU - Agenda - 001, 002 y 003)
  // --------------------------------------------------------------------------

  /** Lista el catálogo de servicios terapéuticos activos. */
  listarServiciosCitas(): Promise<ServicioTerapeutico[]> {
    return requestJson<ServicioTerapeutico[]>('/citas/servicios');
  },

  /** Obtiene las franjas de 45 min y el bloque de receso para una fecha (YYYY-MM-DD). */
  obtenerDisponibilidadAgenda(fecha: string): Promise<DisponibilidadDia> {
    return requestJson<DisponibilidadDia>(
      `/citas/disponibilidad?fecha=${encodeURIComponent(fecha)}`,
    );
  },

  /** Lista citas por fecha puntual o rango (desde / hasta). */
  listarCitas(params?: {
    fecha?: string;
    desde?: string;
    hasta?: string;
  }): Promise<Cita[]> {
    const search = new URLSearchParams();
    if (params?.fecha) search.set('fecha', params.fecha);
    if (params?.desde) search.set('desde', params.desde);
    if (params?.hasta) search.set('hasta', params.hasta);
    const qs = search.toString();
    return requestJson<Cita[]>(`/citas${qs ? `?${qs}` : ''}`);
  },

  /** Agenda una nueva cita en consultorio. */
  crearCita(datos: {
    pacienteId: string;
    servicioId: string;
    fecha: string;
    horaInicio: string;
  }): Promise<Cita> {
    return requestJson<Cita>('/citas', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  },

  /** Reprograma fecha y hora de una cita CONFIRMADA. */
  reprogramarCita(
    id: string,
    datos: { fecha: string; horaInicio: string },
  ): Promise<Cita> {
    return requestJson<Cita>(`/citas/${id}/reprogramar`, {
      method: 'PATCH',
      body: JSON.stringify(datos),
    });
  },

  /** Cancela una cita CONFIRMADA registrando motivo y aplicando regla de 24 horas. */
  cancelarCita(id: string, motivoCancelacion: string): Promise<Cita> {
    return requestJson<Cita>(`/citas/${id}/cancelar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivoCancelacion }),
    });
  },

  /** Marca una cita CONFIRMADA como ATENDIDA o INASISTENCIA. */
  actualizarEstadoCita(
    id: string,
    estado: 'ATENDIDA' | 'INASISTENCIA',
  ): Promise<Cita> {
    return requestJson<Cita>(`/citas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    });
  },

  // --------------------------------------------------------------------------
  // Endpoints de Historias Clínicas / Anamnesis (HU - Clínica - 003)
  // --------------------------------------------------------------------------

  async listarHistoriasClinicas(q?: string): Promise<HistoriaClinica[]> {
    const url = q
      ? `${API_URL}/historias-clinicas?q=${encodeURIComponent(q)}`
      : `${API_URL}/historias-clinicas`;
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al obtener historias clínicas');
    }
    return data;
  },

  async obtenerHistoriaPorPaciente(pacienteId: string): Promise<HistoriaClinica> {
    const res = await fetch(`${API_URL}/historias-clinicas/paciente/${pacienteId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al obtener historia clínica del paciente');
    }
    return data;
  },

  async crearHistoriaClinica(datos: {
    pacienteId: string;
    motivoConsulta: string;
    antecedentesPerinatales?: string;
    evaluacionOfa: EvaluacionOfa;
    evaluacionHabla?: string;
    evaluacionLenguaje?: string;
    evaluacionVoz?: string;
    diagnosticoCie10Codigo: string;
    diagnosticoCie10Desc: string;
    planTratamiento: string;
    estado?: 'BORRADOR' | 'CERRADA';
  }): Promise<HistoriaClinica> {
    const res = await fetch(`${API_URL}/historias-clinicas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al crear historia clínica');
    }
    return data;
  },

  async actualizarHistoriaClinica(
    id: string,
    datos: {
      motivoConsulta?: string;
      antecedentesPerinatales?: string;
      evaluacionOfa?: EvaluacionOfa;
      evaluacionHabla?: string;
      evaluacionLenguaje?: string;
      evaluacionVoz?: string;
      diagnosticoCie10Codigo?: string;
      diagnosticoCie10Desc?: string;
      planTratamiento?: string;
      estado?: 'BORRADOR' | 'CERRADA';
    },
  ): Promise<HistoriaClinica> {
    const res = await fetch(`${API_URL}/historias-clinicas/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Error al actualizar historia clínica');
    }
    return data;
  },
};

export const api = apiService;


// ==========================================
// MÓDULO CLÍNICO: PACIENTES, HISTORIAS Y EVOLUCIONES (HU-003 y HU-004)
// ==========================================

export interface NotaEvolucion {
  id: string;
  historiaClinicaId: string;
  profesionalId: string;
  numeroSesion: number;
  fechaSesion: string;
  objetivosTrabajados: string;
  descripcionEvolucion: string;
  planSiguienteSesion?: string | null;
  createdAt: string;
}

export interface RespuestaEvoluciones {
  historia: HistoriaClinica;
  siguienteNumeroSesion: number;
  notas: NotaEvolucion[];
}

const API_CLINICA = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function fetchClinico<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fonella_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_CLINICA}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = Array.isArray(errData.message)
      ? errData.message.join(', ')
      : errData.message || `Error ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }
  return res.json();
}

Object.assign(apiService, {
  listarPacientes(q?: string): Promise<Paciente[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return fetchClinico<Paciente[]>(`/pacientes${query}`);
  },
  crearPaciente(data: Omit<Paciente, 'id' | 'activo' | 'historiaClinica'>): Promise<Paciente> {
    return fetchClinico<Paciente>('/pacientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  listarHistoriasClinicas(q?: string): Promise<HistoriaClinica[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return fetchClinico<HistoriaClinica[]>(`/historias${query}`);
  },
  obtenerHistoriaPorPaciente(pacienteId: string): Promise<HistoriaClinica> {
    return fetchClinico<HistoriaClinica>(`/historias/paciente/${pacienteId}`);
  },
  crearHistoriaClinica(data: any): Promise<HistoriaClinica> {
    return fetchClinico<HistoriaClinica>('/historias', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  actualizarHistoriaClinica(id: string, data: any): Promise<HistoriaClinica> {
    return fetchClinico<HistoriaClinica>(`/historias/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  listarEvoluciones(historiaId: string): Promise<RespuestaEvoluciones> {
    return fetchClinico<RespuestaEvoluciones>(`/historias/${historiaId}/evoluciones`);
  },
  crearNotaEvolucion(historiaId: string, data: any): Promise<NotaEvolucion> {
    return fetchClinico<NotaEvolucion>(`/historias/${historiaId}/evoluciones`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  agregarAddendumEvolucion(historiaId: string, notaId: string, textoAddendum: string): Promise<NotaEvolucion> {
    return fetchClinico<NotaEvolucion>(`/historias/${historiaId}/evoluciones/${notaId}/addendum`, {
      method: 'POST',
      body: JSON.stringify({ textoAddendum }),
    });
  },
});
