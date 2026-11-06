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
  createdAt?: string;
  updatedAt?: string;
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

export const apiService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Imprescindible para cookies HttpOnly
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
};
