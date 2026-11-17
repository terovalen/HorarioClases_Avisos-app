/** Próxima clase y clase en curso (RF-05), con cambio de semana. */
import { diaDeFecha, parseHora, minutosDelDia, type HoraMin } from './tiempo';
import type { BloqueConMateria } from './tipos';

export type ClaseProxima = BloqueConMateria & { empieza: Date };

/** La hora ya está validada: la fecha siempre se puede construir. */
function fechaDe(ahora: Date, desplazamiento: number, hora: HoraMin): Date {
  return new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + desplazamiento,
    hora.h,
    hora.m,
    0,
    0,
  );
}

/** Próxima vez que ocurre este bloque: hoy mismo si aún no empieza, si no los
 *  días siguientes; al mirar 7 días hacia adelante se cubre el cambio de
 *  semana (domingo por la noche → lunes). */
export function proximaOcurrencia(bloque: BloqueConMateria, ahora: Date): Date | null {
  const hora = parseHora(bloque.bloque.hora_inicio);
  if (!hora) return null;
  for (let k = 0; k <= 7; k++) {
    const fecha = fechaDe(ahora, k, hora);
    if (diaDeFecha(fecha) === bloque.bloque.dia && fecha.getTime() >= ahora.getTime()) {
      return fecha;
    }
  }
  return null;
}

/** La clase más cercana entre todos los bloques; null si no hay horario. */
export function proximaClase(
  bloques: BloqueConMateria[],
  ahora: Date,
): ClaseProxima | null {
  let mejor: ClaseProxima | null = null;
  for (const b of bloques) {
    const empieza = proximaOcurrencia(b, ahora);
    if (!empieza) continue;
    if (!mejor || empieza.getTime() < mejor.empieza.getTime()) {
      mejor = { ...b, empieza };
    }
  }
  return mejor;
}

/** Clase que está ocurriendo ahora mismo, con su hora de fin. */
export function claseEnCurso(
  bloques: BloqueConMateria[],
  ahora: Date,
): (ClaseProxima & { termina: Date }) | null {
  const diaHoy = diaDeFecha(ahora);
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  for (const b of bloques) {
    if (b.bloque.dia !== diaHoy) continue;
    const inicio = parseHora(b.bloque.hora_inicio);
    const fin = parseHora(b.bloque.hora_fin);
    if (!inicio || !fin) continue;
    if (minutosAhora >= minutosDelDia(inicio) && minutosAhora < minutosDelDia(fin)) {
      return {
        ...b,
        empieza: fechaDe(ahora, 0, inicio),
        termina: fechaDe(ahora, 0, fin),
      };
    }
  }
  return null;
}

export type VistaHoy = {
  proxima: ClaseProxima | null;
  enCurso: (ClaseProxima & { termina: Date }) | null;
  deHoy: ClaseProxima[];
};

/** Todo lo que necesita la pantalla «Hoy» en un solo cálculo puro. */
export function calcularVistaHoy(bloques: BloqueConMateria[], ahora: Date): VistaHoy {
  const diaHoy = diaDeFecha(ahora);
  const deHoy = bloques
    .filter((b) => b.bloque.dia === diaHoy)
    .sort((a, b) => a.bloque.hora_inicio.localeCompare(b.bloque.hora_inicio))
    .flatMap((b) => {
      const hora = parseHora(b.bloque.hora_inicio);
      return hora ? [{ ...b, empieza: fechaDe(ahora, 0, hora) }] : [];
    });
  return {
    proxima: proximaClase(bloques, ahora),
    enCurso: claseEnCurso(bloques, ahora),
    deHoy,
  };
}
