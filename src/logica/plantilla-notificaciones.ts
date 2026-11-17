/** Planificación pura de los avisos semanales (RF-04).
 *  Cada bloque genera un aviso N minutos antes de su hora de inicio. */
import { parseHora, restarMinutos, diaAWeekdayExpo } from './tiempo';
import type { Ajustes, Bloque, Materia } from './tipos';

export type ProgramaAviso = {
  idBloque: string;
  weekdayExpo: number; // 1 = domingo … 7 = sábado (formato de expo-notifications)
  hora: number;
  minuto: number;
  titulo: string;
  cuerpo: string;
};

function cuerpoAviso(bloque: Bloque, materia: Materia): string {
  const salon = materia.salon ? ` · Salón ${materia.salon}` : '';
  const docente = materia.docente ? ` · ${materia.docente}` : '';
  return `${bloque.hora_inicio}${salon}${docente}`;
}

/** Devuelve un aviso por bloque con materia válida; los que quedarían antes
 *  de las 00:00 se omiten. */
export function armarPrograma(
  bloques: Bloque[],
  materias: Materia[],
  ajustes: Pick<Ajustes, 'minutos_aviso'>,
): ProgramaAviso[] {
  const avisos: ProgramaAviso[] = [];
  for (const bloque of bloques) {
    const materia = materias.find((m) => m.id === bloque.materia_id);
    if (!materia) continue;
    const inicio = parseHora(bloque.hora_inicio);
    if (!inicio) continue;
    const aviso = restarMinutos(inicio, ajustes.minutos_aviso);
    if (!aviso) continue;
    avisos.push({
      idBloque: bloque.id,
      weekdayExpo: diaAWeekdayExpo(bloque.dia),
      hora: aviso.h,
      minuto: aviso.m,
      titulo: materia.nombre,
      cuerpo: cuerpoAviso(bloque, materia),
    });
  }
  return avisos;
}
