/** Conversión de los documentos remotos (Firestore) a filas locales. */
import { sustituirAjustes } from '../repositorios/ajustes';
import { sustituirBloque } from '../repositorios/bloques';
import { sustituirMateria } from '../repositorios/materias';
import type { DocumentoRemoto } from '../logica/sincronizacion-logica';
import type { Ajustes, Bloque, Materia } from '../logica/tipos';

/** Documento de ajustes que devuelve /api/ajustes/horario. */
export type AjustesRemotos = {
  campus_lat: number | null;
  campus_lng: number | null;
  minutos_aviso: number;
  updated_at?: string | null;
};

export function guardarAjustesRemota(doc: AjustesRemotos): void {
  const ajustes: Ajustes = {
    campus_lat: doc.campus_lat ?? null,
    campus_lng: doc.campus_lng ?? null,
    minutos_aviso: Number(doc.minutos_aviso ?? 15),
  };
  if (ajustes.minutos_aviso >= 0 && ajustes.minutos_aviso <= 120) {
    sustituirAjustes(ajustes, doc.updated_at ?? null);
  }
}

export function guardarMateriaRemota(doc: DocumentoRemoto): void {
  sustituirMateria(aMateria(doc));
}

export function guardarBloqueRemota(doc: DocumentoRemoto): void {
  sustituirBloque(aBloque(doc));
}

export function aMateria(doc: DocumentoRemoto): Materia & { updated_at: string | null } {
  return {
    id: doc.id,
    nombre: String(doc['nombre'] ?? ''),
    docente: (doc['docente'] as string | null) ?? null,
    salon: (doc['salon'] as string | null) ?? null,
    color: String(doc['color'] ?? '#2563eb'),
    updated_at: doc.updated_at,
  };
}

export function aBloque(doc: DocumentoRemoto): Omit<Bloque, 'notificacion_id'> & {
  updated_at: string | null;
} {
  return {
    id: doc.id,
    materia_id: String(doc['materia_id'] ?? ''),
    dia: Number(doc['dia'] ?? 1),
    hora_inicio: String(doc['hora_inicio'] ?? '07:00'),
    hora_fin: String(doc['hora_fin'] ?? '08:00'),
    updated_at: doc.updated_at,
  };
}
