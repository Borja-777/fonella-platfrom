import { TipoDocumento } from '@/services/api';

/** Reglas de formato y longitud para documentos de identidad en Colombia. */
export const REGLAS_DOCUMENTO_COLOMBIA: Record<
  TipoDocumento,
  { soloNumeros: boolean; min: number; max: number; nombre: string }
> = {
  CC: { soloNumeros: true, min: 6, max: 10, nombre: 'Cédula de Ciudadanía (CC)' },
  TI: { soloNumeros: true, min: 10, max: 11, nombre: 'Tarjeta de Identidad (TI)' },
  RC: { soloNumeros: true, min: 10, max: 11, nombre: 'Registro Civil (RC)' },
  CE: { soloNumeros: true, min: 6, max: 10, nombre: 'Cédula de Extranjería (CE)' },
  PA: { soloNumeros: false, min: 5, max: 16, nombre: 'Pasaporte (PA)' },
};

/** Tipos de documento permitidos para menores de edad (< 18 años) en Colombia. */
export const DOCUMENTOS_MENOR_COLOMBIA: TipoDocumento[] = ['RC', 'TI', 'PA'];

/** Prefijos válidos para líneas móviles en territorio colombiano. */
export const PREFIJOS_TELEFONO_COLOMBIA = new Set([
  '300',
  '301',
  '302',
  '303',
  '304',
  '305',
  '310',
  '311',
  '312',
  '313',
  '314',
  '315',
  '316',
  '317',
  '318',
  '319',
  '320',
  '321',
  '322',
  '323',
  '324',
  '333',
  '350',
  '351',
]);

/** Opciones predefinidas de parentesco para el acudiente. */
export const PARENTESCOS_ACUDIENTE = [
  'Madre',
  'Padre',
  'Hermano',
  'Hermana',
  'Tío',
  'Tía',
  'Abuelo',
  'Abuela',
] as const;

/** Filtra y limita los caracteres permitidos según el tipo de documento. */
export function limpiarEntradaDocumento(valor: string, tipo: TipoDocumento): string {
  const regla = REGLAS_DOCUMENTO_COLOMBIA[tipo];
  if (regla.soloNumeros) {
    return valor.replace(/\D/g, '').slice(0, regla.max);
  }
  return valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, regla.max);
}

/** Valida formato, caracteres y longitud mínima/máxima de un documento colombiano. */
export function validarDocumentoColombia(
  numero: string,
  tipo: TipoDocumento,
  etiqueta = 'El documento',
): string | null {
  const limpio = numero.trim();
  const regla = REGLAS_DOCUMENTO_COLOMBIA[tipo];

  if (!limpio) {
    return `${etiqueta} es obligatorio.`;
  }

  if (regla.soloNumeros && !/^\d+$/.test(limpio)) {
    return `${etiqueta} (${regla.nombre}) solo puede contener números.`;
  }

  if (!regla.soloNumeros && !/^[A-Za-z0-9]+$/.test(limpio)) {
    return `${etiqueta} (${regla.nombre}) solo puede contener letras y números sin espacios ni símbolos.`;
  }

  if (limpio.length < regla.min || limpio.length > regla.max) {
    const rango =
      regla.min === regla.max
        ? `${regla.min} caracteres`
        : `entre ${regla.min} y ${regla.max} ${regla.soloNumeros ? 'dígitos' : 'caracteres'}`;
    return `${etiqueta} (${regla.nombre}) debe tener ${rango}.`;
  }

  return null;
}

/** Filtra solo dígitos y limita a 10 caracteres para teléfonos móviles colombianos. */
export function limpiarEntradaTelefono(valor: string): string {
  return valor.replace(/\D/g, '').slice(0, 10);
}

/** Valida longitud (10 dígitos) y prefijo válido en Colombia. */
export function validarTelefonoColombia(
  telefono: string,
  etiqueta = 'El teléfono',
): string | null {
  const limpio = telefono.trim();
  if (!/^\d{10}$/.test(limpio)) {
    return `${etiqueta} debe tener exactamente 10 dígitos numéricos.`;
  }
  const prefijo = limpio.slice(0, 3);
  if (!PREFIJOS_TELEFONO_COLOMBIA.has(prefijo)) {
    return `${etiqueta} debe iniciar con un prefijo móvil válido en Colombia (ej. 300–305, 310–324, 333, 350, 351).`;
  }
  return null;
}
