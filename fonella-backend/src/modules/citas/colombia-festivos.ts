/**
 * Cálculo determinista de días festivos oficiales en Colombia (Ley 51 de 1983 / Ley Emiliani).
 * Permite bloquear agendamiento en festivos fijos, trasladables al lunes y relativos a Pascua.
 */

/** Calcula la fecha del Domingo de Pascua para un año dado (algoritmo de Meeus/Jones/Butcher). */
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
  const mes = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
}

function sumarDiasUTC(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

function formatearISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/** Traslada una fecha al lunes siguiente si no cae lunes (Ley Emiliani). */
function trasladarALunes(anio: number, mes: number, dia: number): string {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0));
  const diaSemana = fecha.getUTCDay(); // 0 = Dom, 1 = Lun ... 6 = Sáb
  if (diaSemana === 1) return formatearISO(fecha);
  const diasHastaLunes = diaSemana === 0 ? 1 : 8 - diaSemana;
  return formatearISO(sumarDiasUTC(fecha, diasHastaLunes));
}

/** Construye el mapa { "YYYY-MM-DD": "Nombre del festivo" } para un año dado en Colombia. */
function obtenerMapaFestivosAnio(anio: number): Map<string, string> {
  const festivos = new Map<string, string>();
  const pad = (n: number) => String(n).padStart(2, "0");

  // 1. Festivos de fecha fija
  festivos.set(`${anio}-01-01`, "Año Nuevo");
  festivos.set(`${anio}-05-01`, "Día del Trabajo");
  festivos.set(`${anio}-07-20`, "Día de la Independencia");
  festivos.set(`${anio}-08-07`, "Batalla de Boyacá");
  festivos.set(`${anio}-12-08`, "Inmaculada Concepción");
  festivos.set(`${anio}-12-25`, "Navidad");

  // 2. Festivos Ley Emiliani (trasladados al lunes siguiente)
  festivos.set(trasladarALunes(anio, 1, 6), "Día de los Reyes Magos");
  festivos.set(trasladarALunes(anio, 3, 19), "Día de San José");
  festivos.set(trasladarALunes(anio, 6, 29), "San Pedro y San Pablo");
  festivos.set(trasladarALunes(anio, 8, 15), "Asunción de la Virgen");
  festivos.set(trasladarALunes(anio, 10, 12), "Día de la Raza");
  festivos.set(trasladarALunes(anio, 11, 1), "Todos los Santos");
  festivos.set(trasladarALunes(anio, 11, 11), "Independencia de Cartagena");

  // 3. Festivos relativos a Semana Santa / Pascua
  const pascua = calcularDomingoPascua(anio);
  festivos.set(formatearISO(sumarDiasUTC(pascua, -3)), "Jueves Santo");
  festivos.set(formatearISO(sumarDiasUTC(pascua, -2)), "Viernes Santo");
  festivos.set(formatearISO(sumarDiasUTC(pascua, 43)), "Ascensión del Señor");
  festivos.set(formatearISO(sumarDiasUTC(pascua, 64)), "Corpus Christi");
  festivos.set(formatearISO(sumarDiasUTC(pascua, 71)), "Sagrado Corazón de Jesús");

  return festivos;
}

/**
 * Retorna el nombre del festivo colombiano si `fechaStr` (YYYY-MM-DD) es festivo,
 * o `null` si es un día ordinario.
 */
export function obtenerFestivoColombia(fechaStr: string): string | null {
  const soloFecha = fechaStr.slice(0, 10);
  const anio = Number(soloFecha.slice(0, 4));
  if (Number.isNaN(anio)) return null;
  return obtenerMapaFestivosAnio(anio).get(soloFecha) ?? null;
}
