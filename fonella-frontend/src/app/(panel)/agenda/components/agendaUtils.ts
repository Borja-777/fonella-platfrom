/**
 * Utilidades de fecha, hora y cálculo de edad para la Agenda Clínica.
 * Todas las horas se normalizan a zona horaria de Colombia (UTC-5).
 */

/** Retorna la fecha actual en Colombia (UTC-5) en formato YYYY-MM-DD. */
export function obtenerHoyColombia(): string {
  const col = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return col.toISOString().slice(0, 10);
}

/** Suma o resta días a una fecha YYYY-MM-DD sin desfases de zona horaria. */
export function desplazarFecha(fechaStr: string, dias: number): string {
  const base = new Date(`${fechaStr}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/** Formatea una fecha ISO (DateTime de Prisma) a "HH:mm" en hora Colombia (UTC-5). */
export function formatearHoraColombia(isoString: string): string {
  const fecha = new Date(isoString);
  if (Number.isNaN(fecha.getTime())) return isoString;
  const col = new Date(fecha.getTime() - 5 * 60 * 60 * 1000);
  const hh = String(col.getUTCHours()).padStart(2, '0');
  const mm = String(col.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Calcula la edad cronológica en años a partir de una fecha ISO o YYYY-MM-DD. */
export function calcularEdadDesdeFecha(fechaNacimiento?: string | null): number | null {
  if (!fechaNacimiento) return null;
  const soloFecha = fechaNacimiento.slice(0, 10);
  const [anio, mes, dia] = soloFecha.split('-').map(Number);
  if (!anio || !mes || !dia) return null;

  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const diffMes = hoy.getMonth() + 1 - mes;
  if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < dia)) {
    edad--;
  }
  return edad;
}

/** Retorna la hora actual en Colombia (UTC-5) como cadena "HH:mm" y minutos desde medianoche. */
export function obtenerHoraActualColombia(): {
  horaStr: string;
  minutos: number;
} {
  const col = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const hh = col.getUTCHours();
  const mm = col.getUTCMinutes();
  return {
    horaStr: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    minutos: hh * 60 + mm,
  };
}

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Retorna los 6 días laborales (Lunes a Sábado) de la semana que contiene `fechaStr`. */
export function obtenerSemanaLunesASabado(fechaStr: string): Array<{
  fecha: string;
  etiqueta: string;
  esSabado: boolean;
  festivo: string | null;
}> {
  const base = new Date(`${fechaStr}T12:00:00.000Z`);
  const dia = base.getUTCDay(); // 0 = Dom .. 6 = Sáb
  const diffALunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(base);
  lunes.setUTCDate(base.getUTCDate() + diffALunes);

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes);
    d.setUTCDate(lunes.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const numDia = String(d.getUTCDate()).padStart(2, '0');
    const nombreDia = DIAS_CORTOS[d.getUTCDay()];
    return {
      fecha: iso,
      etiqueta: `${nombreDia} ${numDia}`,
      esSabado: d.getUTCDay() === 6,
      festivo: obtenerFestivoColombia(iso),
    };
  });
}

function calcularDomingoPascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
}

function trasladarALunesISO(anio: number, mes: number, dia: number): string {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
  const diaSemana = fecha.getUTCDay();
  if (diaSemana === 1) return fecha.toISOString().slice(0, 10);
  const dias = diaSemana === 0 ? 1 : 8 - diaSemana;
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

/** Retorna el nombre del festivo colombiano (Ley Emiliani + Pascua) o null si es día ordinario. */
export function obtenerFestivoColombia(fechaStr: string): string | null {
  const soloFecha = fechaStr.slice(0, 10);
  const anio = Number(soloFecha.slice(0, 4));
  if (Number.isNaN(anio)) return null;

  const mapa = new Map<string, string>([
    [`${anio}-01-01`, 'Año Nuevo'],
    [`${anio}-05-01`, 'Día del Trabajo'],
    [`${anio}-07-20`, 'Día de la Independencia'],
    [`${anio}-08-07`, 'Batalla de Boyacá'],
    [`${anio}-12-08`, 'Inmaculada Concepción'],
    [`${anio}-12-25`, 'Navidad'],
    [trasladarALunesISO(anio, 1, 6), 'Día de los Reyes Magos'],
    [trasladarALunesISO(anio, 3, 19), 'Día de San José'],
    [trasladarALunesISO(anio, 6, 29), 'San Pedro y San Pablo'],
    [trasladarALunesISO(anio, 8, 15), 'Asunción de la Virgen'],
    [trasladarALunesISO(anio, 10, 12), 'Día de la Raza'],
    [trasladarALunesISO(anio, 11, 1), 'Todos los Santos'],
    [trasladarALunesISO(anio, 11, 11), 'Independencia de Cartagena'],
  ]);

  const pascua = calcularDomingoPascua(anio);
  const sumar = (dias: number) => {
    const f = new Date(pascua);
    f.setUTCDate(f.getUTCDate() + dias);
    return f.toISOString().slice(0, 10);
  };
  mapa.set(sumar(-3), 'Jueves Santo');
  mapa.set(sumar(-2), 'Viernes Santo');
  mapa.set(sumar(43), 'Ascensión del Señor');
  mapa.set(sumar(64), 'Corpus Christi');
  mapa.set(sumar(71), 'Sagrado Corazón de Jesús');

  return mapa.get(soloFecha) ?? null;
}
