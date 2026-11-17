/** Conversión de días y horas. Todo puro, sin dependencias de Expo. */

/** Nombres de los días; el índice 0 corresponde al día 1 (lunes). */
export const NOMBRES_DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

/** Expo-notifications: weekday 1 = domingo … 7 = sábado (docs del SDK). */
export function diaAWeekdayExpo(dia: number): number {
  return dia === 7 ? 1 : dia + 1;
}

/** getDay() de JS (0 = domingo) → día del proyecto (1 = lunes … 7 = domingo). */
export function diaDeFecha(fecha: Date): number {
  return ((fecha.getDay() + 6) % 7) + 1;
}

export type HoraMin = { h: number; m: number };

/** Acepta estrictamente "HH:MM" de 24 h ("07:05" sí, "7:05" no). */
export function parseHora(texto: string): HoraMin | null {
  if (!/^\d{2}:\d{2}$/.test(texto)) return null;
  const partes = texto.split(':');
  const h = Number(partes[0]);
  const m = Number(partes[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function formatearHora(hora: HoraMin): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(hora.h)}:${dos(hora.m)}`;
}

/** Minutos desde la medianoche (0 … 1439). */
export function minutosDelDia(hora: HoraMin): number {
  return hora.h * 60 + hora.m;
}

export function minutosAHora(total: number): HoraMin {
  const dentro = Math.min(Math.max(total, 0), 23 * 60 + 59);
  return { h: Math.floor(dentro / 60), m: dentro % 60 };
}

/** Hora - minutos; null si el aviso quedaría antes de las 00:00. */
export function restarMinutos(hora: HoraMin, minutos: number): HoraMin | null {
  const total = minutosDelDia(hora) - minutos;
  if (total < 0) return null;
  return minutosAHora(total);
}

export type CuentaRegresiva = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
};

export function desglosarCuenta(ms: number): CuentaRegresiva {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    dias: Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    minutos: Math.floor((total % 3600) / 60),
    segundos: total % 60,
  };
}

export function textoCuenta(cuenta: CuentaRegresiva): string {
  const p = (n: number, u: string) => `${n} ${u}`;
  if (cuenta.dias > 0) {
    return `${p(cuenta.dias, cuenta.dias === 1 ? 'día' : 'días')} ${p(cuenta.horas, 'h')}`;
  }
  return `${p(cuenta.horas, 'h')} ${p(cuenta.minutos, 'min')} ${p(cuenta.segundos, 's')}`;
}
