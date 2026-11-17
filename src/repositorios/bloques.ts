/** Repositorio de bloques horarios. */
import { abrirBase } from '../db';
import { randomUUID } from 'expo-crypto';
import type { Bloque, BloqueConMateria } from '../logica/tipos';

export type FilaBloque = Bloque & {
  remote_id: string | null;
  updated_at: string | null;
  deleted: number;
  pending: number;
};

const CON_MATERIA = `
  SELECT bloque.*, materia.nombre AS m_nombre, materia.docente AS m_docente,
         materia.salon AS m_salon, materia.color AS m_color
  FROM bloque JOIN materia ON materia.id = bloque.materia_id
  WHERE bloque.deleted = 0 AND materia.deleted = 0
`;

function filaAConMateria(f: Record<string, unknown>): BloqueConMateria {
  return {
    bloque: {
      id: String(f['id']),
      materia_id: String(f['materia_id']),
      dia: Number(f['dia']),
      hora_inicio: String(f['hora_inicio']),
      hora_fin: String(f['hora_fin']),
      notificacion_id: (f['notificacion_id'] as string | null) ?? null,
    },
    materia: {
      id: String(f['materia_id']),
      nombre: String(f['m_nombre']),
      docente: (f['m_docente'] as string | null) ?? null,
      salon: (f['m_salon'] as string | null) ?? null,
      color: String(f['m_color']),
    },
  };
}

export function listarBloquesConMateria(): BloqueConMateria[] {
  return abrirBase()
    .getAllSync<Record<string, unknown>>(
      `${CON_MATERIA} ORDER BY bloque.dia, bloque.hora_inicio`,
    )
    .map(filaAConMateria);
}

export function listarBloques(): FilaBloque[] {
  return abrirBase().getAllSync<FilaBloque>(
    'SELECT * FROM bloque WHERE deleted = 0 ORDER BY dia, hora_inicio',
  );
}

export function bloquePorId(id: string): FilaBloque | null {
  return (
    abrirBase().getFirstSync<FilaBloque>(
      'SELECT * FROM bloque WHERE id = ? AND deleted = 0',
      id,
    ) ?? null
  );
}

/** Bloque con su materia, para editarlo completo desde el menú. */
export function bloqueConMateriaPorId(id: string): BloqueConMateria | null {
  const fila = abrirBase().getFirstSync<Record<string, unknown>>(
    `${CON_MATERIA} AND bloque.id = ?`,
    id,
  );
  return fila ? filaAConMateria(fila) : null;
}

export function crearBloque(
  datos: Omit<Bloque, 'id' | 'notificacion_id'> & { notificacion_id?: string | null },
): string {
  const id = randomUUID();
  abrirBase().runSync(
    `INSERT INTO bloque (id, materia_id, dia, hora_inicio, hora_fin, notificacion_id,
                         remote_id, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 1)`,
    [
      id,
      datos.materia_id,
      datos.dia,
      datos.hora_inicio,
      datos.hora_fin,
      datos.notificacion_id ?? null,
      id,
    ],
  );
  return id;
}

/** Cambia la hora de fin (gesto de arrastre o botones) y marca pendiente. */
export function actualizarHoraFin(id: string, hora_fin: string): void {
  abrirBase().runSync('UPDATE bloque SET hora_fin = ?, pending = 1 WHERE id = ?', [
    hora_fin,
    id,
  ]);
}

/** Cambia horas y materia de un bloque y marca pendiente. */
export function actualizarBloque(
  id: string,
  materia_id: string,
  hora_inicio: string,
  hora_fin: string,
): void {
  abrirBase().runSync(
    'UPDATE bloque SET materia_id = ?, hora_inicio = ?, hora_fin = ?, pending = 1 WHERE id = ?',
    [materia_id, hora_inicio, hora_fin, id],
  );
}

export function actualizarHoras(id: string, inicio: string, fin: string): void {
  abrirBase().runSync(
    'UPDATE bloque SET hora_inicio = ?, hora_fin = ?, pending = 1 WHERE id = ?',
    [inicio, fin, id],
  );
}

export function asignarNotificacion(id: string, notificacion_id: string): void {
  abrirBase().runSync('UPDATE bloque SET notificacion_id = ? WHERE id = ?', [
    notificacion_id,
    id,
  ]);
}

export function eliminarBloque(id: string): void {
  abrirBase().runSync('UPDATE bloque SET deleted = 1, pending = 1 WHERE id = ?', id);
}

/** Al eliminar una materia se borran sus bloques y sus avisos en cascada. */
export function bloquesDeMateria(materiaId: string): FilaBloque[] {
  return abrirBase().getAllSync<FilaBloque>(
    'SELECT * FROM bloque WHERE materia_id = ? AND deleted = 0',
    materiaId,
  );
}

export function bloquesPendientes(): FilaBloque[] {
  return abrirBase().getAllSync<FilaBloque>('SELECT * FROM bloque WHERE pending = 1');
}

export function sustituirBloque(fila: {
  id: string;
  materia_id: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  updated_at: string | null;
}): void {
  abrirBase().runSync(
    `INSERT INTO bloque (id, materia_id, dia, hora_inicio, hora_fin, notificacion_id,
                         remote_id, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?, 0, 0)
     ON CONFLICT(id) DO UPDATE SET
       materia_id = excluded.materia_id, dia = excluded.dia,
       hora_inicio = excluded.hora_inicio, hora_fin = excluded.hora_fin,
       remote_id = excluded.remote_id, updated_at = excluded.updated_at, pending = 0`,
    [
      fila.id,
      fila.materia_id,
      fila.dia,
      fila.hora_inicio,
      fila.hora_fin,
      fila.id,
      fila.updated_at,
    ],
  );
}

/** Borra físicamente una fila ya confirmada por el servidor (o una lápida). */
export function purgarBloque(id: string): void {
  abrirBase().runSync('DELETE FROM bloque WHERE id = ?', id);
}
