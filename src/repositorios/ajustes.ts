/** Repositorio de ajustes (fila única id = 1) y del cursor de sincronización. */
import { abrirBase } from '../db';
import type { Ajustes } from '../logica/tipos';

export const AJUSTES_POR_DEFECTO: Ajustes = {
  campus_lat: null,
  campus_lng: null,
  minutos_aviso: 15,
};

/** Asegura que la tabla ajustes exista (idempotente). */
function asegurarTablaAjustes(): void {
  const db = abrirBase();
  db.execSync(
    `CREATE TABLE IF NOT EXISTS ajustes (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      campus_lat REAL,
      campus_lng REAL,
      minutos_aviso INTEGER NOT NULL DEFAULT 15,
      remote_id TEXT,
      updated_at TEXT,
      deleted INTEGER DEFAULT 0,
      pending INTEGER DEFAULT 0
    )`,
  );
}

export function leerAjustes(): Ajustes {
  try {
    const fila = abrirBase().getFirstSync<{
      campus_lat: number | null;
      campus_lng: number | null;
      minutos_aviso: number;
    }>('SELECT campus_lat, campus_lng, minutos_aviso FROM ajustes WHERE id = 1');
    if (!fila) return AJUSTES_POR_DEFECTO;
    return {
      campus_lat: fila.campus_lat,
      campus_lng: fila.campus_lng,
      minutos_aviso: fila.minutos_aviso,
    };
  } catch {
    // La tabla no existía o hubo un error: crearla y retornar valores por defecto.
    asegurarTablaAjustes();
    return AJUSTES_POR_DEFECTO;
  }
}

export function guardarAjustes(ajustes: Ajustes): void {
  try {
    abrirBase().runSync(
      `INSERT INTO ajustes (id, campus_lat, campus_lng, minutos_aviso, remote_id, updated_at, deleted, pending)
       VALUES (1, ?, ?, ?, 'horario', NULL, 0, 1)
       ON CONFLICT(id) DO UPDATE SET
         campus_lat = excluded.campus_lat, campus_lng = excluded.campus_lng,
         minutos_aviso = excluded.minutos_aviso, pending = 1`,
      [ajustes.campus_lat, ajustes.campus_lng, ajustes.minutos_aviso],
    );
  } catch {
    // La tabla no existía: crearla y volver a intentar.
    asegurarTablaAjustes();
    abrirBase().runSync(
      `INSERT INTO ajustes (id, campus_lat, campus_lng, minutos_aviso, remote_id, updated_at, deleted, pending)
       VALUES (1, ?, ?, ?, 'horario', NULL, 0, 1)
       ON CONFLICT(id) DO UPDATE SET
         campus_lat = excluded.campus_lat, campus_lng = excluded.campus_lng,
         minutos_aviso = excluded.minutos_aviso, pending = 1`,
      [ajustes.campus_lat, ajustes.campus_lng, ajustes.minutos_aviso],
    );
  }
}

export function ajustesPendientes(): boolean {
  try {
    const fila = abrirBase().getFirstSync<{ pending: number }>(
      'SELECT pending FROM ajustes WHERE id = 1',
    );
    return (fila?.pending ?? 0) === 1;
  } catch {
    asegurarTablaAjustes();
    return false;
  }
}

export function sustituirAjustes(ajustes: Ajustes, updated_at: string | null): void {
  try {
    abrirBase().runSync(
      `INSERT INTO ajustes (id, campus_lat, campus_lng, minutos_aviso, remote_id, updated_at, deleted, pending)
       VALUES (1, ?, ?, ?, 'horario', ?, 0, 0)
       ON CONFLICT(id) DO UPDATE SET
         campus_lat = excluded.campus_lat, campus_lng = excluded.campus_lng,
         minutos_aviso = excluded.minutos_aviso, updated_at = excluded.updated_at, pending = 0`,
      [ajustes.campus_lat, ajustes.campus_lng, ajustes.minutos_aviso, updated_at],
    );
  } catch {
    asegurarTablaAjustes();
    abrirBase().runSync(
      `INSERT INTO ajustes (id, campus_lat, campus_lng, minutos_aviso, remote_id, updated_at, deleted, pending)
       VALUES (1, ?, ?, ?, 'horario', ?, 0, 0)
       ON CONFLICT(id) DO UPDATE SET
         campus_lat = excluded.campus_lat, campus_lng = excluded.campus_lng,
         minutos_aviso = excluded.minutos_aviso, updated_at = excluded.updated_at, pending = 0`,
      [ajustes.campus_lat, ajustes.campus_lng, ajustes.minutos_aviso, updated_at],
    );
  }
}

/** Cursor de sincronización por recurso (tabla `sincro`). */
export function leerCursor(recurso: string): string | null {
  return (
    abrirBase().getFirstSync<{ desde: string | null }>(
      'SELECT desde FROM sincro WHERE recurso = ?',
      recurso,
    )?.desde ?? null
  );
}

export function guardarCursor(recurso: string, desde: string | null): void {
  abrirBase().runSync(
    `INSERT INTO sincro (recurso, desde) VALUES (?, ?)
     ON CONFLICT(recurso) DO UPDATE SET desde = excluded.desde`,
    [recurso, desde],
  );
}
