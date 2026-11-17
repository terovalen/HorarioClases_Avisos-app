/** Validaciones de materias (nombre único lo garantiza SQLite con UNIQUE). */
import type { Validacion } from './cruces';

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Nombre obligatorio (1..80) y color #RRGGBB; docente y salón opcionales. */
export function validarMateria(datos: {
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
}): Validacion {
  const errores: string[] = [];
  const nombre = datos.nombre.trim();
  if (nombre.length === 0) errores.push('El nombre de la materia es obligatorio.');
  if (nombre.length > 80) errores.push('El nombre debe tener 80 caracteres o menos.');
  if (!COLOR_RE.test(datos.color)) {
    errores.push('El color debe tener formato #RRGGBB.');
  }
  if (datos.docente && datos.docente.length > 80) {
    errores.push('El docente debe tener 80 caracteres o menos.');
  }
  if (datos.salon && datos.salon.length > 40) {
    errores.push('El salón debe tener 40 caracteres o menos.');
  }
  return errores.length === 0 ? { ok: true } : { ok: false, errores };
}

export const PALETA_COLORES = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#6366f1',
  '#a21caf',
  '#eab308',
  '#15803d',
  '#b45309',
] as const;
