/** Reglas de validación y detección de cruces de bloques horarios (RF-03). */
import { minutosDelDia, parseHora } from './tiempo';

export type BloqueValidable = {
  id?: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
};

export type Validacion = { ok: true } | { ok: false; errores: string[] };

/** Dos bloques del mismo día se cruzan si cada inicio es antes del fin del otro.
 *  Tocarse en el borde (07:00–09:00 y 09:00–10:00) NO es cruce. */
export function seCruzan(a: BloqueValidable, b: BloqueValidable): boolean {
  if (a.dia !== b.dia) return false;
  const inicioA = parseHora(a.hora_inicio);
  const finA = parseHora(a.hora_fin);
  const inicioB = parseHora(b.hora_inicio);
  const finB = parseHora(b.hora_fin);
  if (!inicioA || !finA || !inicioB || !finB) return false;
  const minInicioA = inicioA.h * 60 + inicioA.m;
  const minFinA = finA.h * 60 + finA.m;
  const minInicioB = inicioB.h * 60 + inicioB.m;
  const minFinB = finB.h * 60 + finB.m;
  return minInicioA < minFinB && minInicioB < minFinA;
}

/** Cruces del candidato contra los existentes (excluyéndose a sí mismo). */
export function encontrarCruces(
  candidato: BloqueValidable,
  existentes: BloqueValidable[],
): BloqueValidable[] {
  return existentes.filter(
    (otro) => otro.id !== candidato.id && seCruzan(candidato, otro),
  );
}

/** Valida formato HH:MM 24 h, fin posterior a inicio y día 1..7. */
export function validarBloque(bloque: BloqueValidable): Validacion {
  const errores: string[] = [];
  const inicio = parseHora(bloque.hora_inicio);
  const fin = parseHora(bloque.hora_fin);
  if (!inicio) errores.push('La hora de inicio debe ser HH:MM de 24 h.');
  if (!fin) errores.push('La hora de fin debe ser HH:MM de 24 h.');
  if (!Number.isInteger(bloque.dia) || bloque.dia < 1 || bloque.dia > 7) {
    errores.push('El día debe estar entre 1 (lunes) y 7 (domingo).');
  }
  if (inicio && fin && minutosDelDia(fin) <= minutosDelDia(inicio)) {
    errores.push('La hora de fin debe ser posterior a la de inicio.');
  }
  return errores.length === 0 ? { ok: true } : { ok: false, errores };
}
