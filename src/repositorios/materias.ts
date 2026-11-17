/** Repositorio de materias: SQL parametrizado, nunca se interpola texto. */ import { abrirBase } from '../db';
import { randomUUID } from 'expo-crypto';
import type { Materia } from '../logica/tipos';

export type FilaMateria = Materia & {
  remote_id: string | null;
  updated_at: string | null;
  deleted: number;
  pending: number;
};

const SIN_BORRADAS = 'SELECT * FROM materia WHERE deleted = 0 ORDER BY nombre';

export function listarMaterias(): FilaMateria[] {
  return abrirBase().getAllSync<FilaMateria>(SIN_BORRADAS);
}

export function materiaPorId(id: string): FilaMateria | null {
  return (
    abrirBase().getFirstSync<FilaMateria>(
      'SELECT * FROM materia WHERE id = ? AND deleted = 0',
      id,
    ) ?? null
  );
}

/** El id (UUID) lo genera el cliente y es el mismo en SQLite y Firestore. */
export function crearMateria(datos: Omit<Materia, 'id'>): string {
  const id = randomUUID();
  abrirBase().runSync(
    `INSERT INTO materia (id, nombre, docente, salon, color, remote_id, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)`,
    [id, datos.nombre, datos.docente, datos.salon, datos.color, id, null],
  );
  return id;
}

export function actualizarMateria(id: string, datos: Omit<Materia, 'id'>): void {
  abrirBase().runSync(
    `UPDATE materia SET nombre = ?, docente = ?, salon = ?, color = ?, pending = 1
     WHERE id = ?`,
    [datos.nombre, datos.docente, datos.salon, datos.color, id],
  );
}

/** Borrado lógico local; la sincronización lo manda como DELETE remoto. */
export function eliminarMateria(id: string): void {
  abrirBase().runSync('UPDATE materia SET deleted = 1, pending = 1 WHERE id = ?', id);
}

export function materiasPendientes(): FilaMateria[] {
  return abrirBase().getAllSync<FilaMateria>('SELECT * FROM materia WHERE pending = 1');
}

/** Guarda el documento remoto (gana la última escritura) y limpia pending. */
export function sustituirMateria(fila: {
  id: string;
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
  updated_at: string | null;
}): void {
  abrirBase().runSync(
    `INSERT INTO materia (id, nombre, docente, salon, color, remote_id, updated_at, deleted, pending)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
     ON CONFLICT(id) DO UPDATE SET
       nombre = excluded.nombre, docente = excluded.docente, salon = excluded.salon,
       color = excluded.color, remote_id = excluded.remote_id,
       updated_at = excluded.updated_at, pending = 0`,
    [
      fila.id,
      fila.nombre,
      fila.docente,
      fila.salon,
      fila.color,
      fila.id,
      fila.updated_at,
    ],
  );
}

/** Borra físicamente una fila ya confirmada por el servidor (o una lápida). */
export function purgarMateria(id: string): void {
  abrirBase().runSync('DELETE FROM materia WHERE id = ?', id);
}
