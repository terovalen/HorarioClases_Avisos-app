/** Sincronización idempotente (sección 9.3): enviar pendientes y traer cambios.
 *  La app escribe primero en SQLite (pending = 1); la sincronización corre al
 *  abrir la app, tras cada cambio y manualmente desde Ajustes. */
import { esFalloDeRed, mensajeDeError, peticion } from '../api/cliente';
import { siguienteCursor, tipoDeEscritura } from '../logica/sincronizacion-logica';
import type { DocumentoRemoto } from '../logica/sincronizacion-logica';
import {
  listarMaterias,
  materiasPendientes,
  purgarMateria,
  sustituirMateria,
} from '../repositorios/materias';
import {
  listarBloques,
  bloquesPendientes,
  purgarBloque,
  sustituirBloque,
} from '../repositorios/bloques';
import {
  ajustesPendientes,
  guardarCursor,
  leerCursor,
  leerAjustes,
  sustituirAjustes,
} from '../repositorios/ajustes';
import { cancelarAvisoDeBloque, reprogramarAvisos } from './notificaciones';
import type { Ajustes, Bloque, Materia } from '../logica/tipos';

export type ResultadoSincro = {
  enviados: number;
  recibidos: number;
  errores: number;
  /** Primer fallo encontrado, para explicarlo sin adivinar. */
  detalle: string | null;
  /** true cuando el fallo fue de red (no se pudo contactar con la API). */
  sinConexion: boolean;
};

export async function sincronizarTodo(): Promise<ResultadoSincro> {
  const resultado: ResultadoSincro = {
    enviados: 0,
    recibidos: 0,
    errores: 0,
    detalle: null,
    sinConexion: false,
  };
  resultado.enviados += await enviarPendientes(
    'materia',
    materiasPendientes(),
    resultado,
  );
  resultado.enviados += await enviarPendientes('bloque', bloquesPendientes(), resultado);
  resultado.enviados += await enviarAjustes(resultado);
  resultado.recibidos += await recibirConControl(
    '/api/materia',
    'materia',
    guardarMateriaRemota,
    resultado,
  );
  resultado.recibidos += await recibirConControl(
    '/api/bloque',
    'bloque',
    guardarBloqueRemoto,
    resultado,
  );
  resultado.recibidos += await recibirConControl(
    '/api/ajustes/horario',
    'ajustes',
    guardarAjustesRemota,
    resultado,
  );
  await programarAvisos(resultado);
  return resultado;
}

/** Explica el resultado sin mentir: «sin conexión» solo si la red falló. */
export function mensajeDeSincro(r: ResultadoSincro): string {
  if (r.errores === 0) return 'Sincronizado con la API';
  if (r.sinConexion) return 'Sin conexión · los cambios quedan guardados en el teléfono';
  return `Sincronizado con errores · ${r.detalle ?? 'revisa los detalles'}`;
}

/** Un fallo en una ruta no cancela el resto de la sincronización. */
async function recibirConControl(
  ruta: string,
  recurso: string,
  guardar: (doc: DocumentoRemoto) => void,
  r: ResultadoSincro,
): Promise<number> {
  try {
    return await recibirCambios(ruta, recurso, guardar);
  } catch (error) {
    registrarError(r, error);
    return 0;
  }
}

/** Los avisos son una función opcional: si fallan no rompen la sincronización. */
async function programarAvisos(r: ResultadoSincro): Promise<void> {
  try {
    await reprogramarAvisos(listarBloques(), listarMaterias(), leerAjustes());
  } catch (error) {
    registrarError(r, error);
  }
}

/** Guarda el primer fallo y marca si fue un problema de red. */
function registrarError(r: ResultadoSincro, error: unknown): void {
  r.errores++;
  if (r.detalle === null) r.detalle = mensajeDeError(error);
  if (esFalloDeRed(error)) r.sinConexion = true;
}

type Listado = { items: DocumentoRemoto[]; servidor_ahora: string };

type FilaPendiente = {
  id: string;
  deleted: number;
  pending: number;
  updated_at: string | null;
  nombre?: string;
  docente?: string | null;
  salon?: string | null;
  color?: string;
  materia_id?: string;
  dia?: number;
  hora_inicio?: string;
  hora_fin?: string;
};

async function enviarPendientes(
  recurso: 'materia' | 'bloque',
  filas: FilaPendiente[],
  r: ResultadoSincro,
): Promise<number> {
  let enviados = 0;
  for (const fila of filas) {
    try {
      if (tipoDeEscritura(fila) === 'borrar') {
        await peticion(`/api/${recurso}/${fila.id}`, {
          metodo: 'DELETE',
          conToken: true,
        });
        purgar(recurso, fila.id);
      } else {
        const doc = await peticion<DocumentoRemoto>(`/api/${recurso}/${fila.id}`, {
          metodo: 'PUT',
          conToken: true,
          cuerpo: cuerpoDeFila(recurso, fila),
        });
        guardarDocumentoRemoto(recurso, doc);
      }
      enviados++;
    } catch (error) {
      registrarError(r, error);
    }
  }
  return enviados;
}

function cuerpoDeFila(recurso: 'materia' | 'bloque', fila: FilaPendiente): unknown {
  if (recurso === 'materia') {
    return {
      nombre: fila.nombre,
      docente: fila.docente ?? null,
      salon: fila.salon ?? null,
      color: fila.color ?? '#2563eb',
    };
  }
  return {
    materia_id: fila.materia_id,
    dia: fila.dia,
    hora_inicio: fila.hora_inicio,
    hora_fin: fila.hora_fin,
  };
}

function guardarDocumentoRemoto(
  recurso: 'materia' | 'bloque',
  doc: DocumentoRemoto,
): void {
  if (recurso === 'materia') {
    sustituirMateria(aMateria(doc));
  } else {
    sustituirBloque(aBloque(doc));
  }
}

/** El borrado confirmado por el servidor se convierte en borrado físico
 *  local: la lápida vive en Firestore. */
function purgar(recurso: 'materia' | 'bloque', id: string): void {
  if (recurso === 'materia') purgarMateria(id);
  else purgarBloque(id);
}

/** Trae cambios con `?since=` hasta recibir menos de 500 (incluye lápidas). */
async function recibirCambios(
  ruta: string,
  recurso: string,
  guardar: (doc: DocumentoRemoto) => void,
): Promise<number> {
  let desde = leerCursor(recurso);
  let total = 0;
  for (let ronda = 0; ronda < 20; ronda++) {
    const respuesta = await peticion<Listado>(
      `${ruta}?since=${encodeURIComponent(desde ?? '')}`,
      { conToken: true },
    );
    total += respuesta.items.length;
    for (const doc of respuesta.items) {
      if (doc.deleted_at === null) {
        guardar(doc);
      } else {
        await borrarLapida(recurso, doc.id);
      }
    }
    const siguiente = siguienteCursor(respuesta.items, desde);
    if (!siguiente.continuar) {
      guardarCursor(recurso, respuesta.servidor_ahora);
      return total;
    }
    desde = siguiente.desde;
  }
  guardarCursor(recurso, new Date().toISOString());
  return total;
}

async function borrarLapida(recurso: string, id: string): Promise<void> {
  if (recurso === 'bloque') await cancelarAvisoDeBloque(id);
  if (recurso === 'materia') purgarMateria(id);
  if (recurso === 'bloque') purgarBloque(id);
}

async function enviarAjustes(r: ResultadoSincro): Promise<number> {
  if (!ajustesPendientes()) return 0;
  try {
    const ajustes = leerAjustes();
    const doc = await peticion<DocumentoRemoto>('/api/ajustes/horario', {
      metodo: 'PUT',
      conToken: true,
      cuerpo: {
        campus_lat: ajustes.campus_lat,
        campus_lng: ajustes.campus_lng,
        minutos_aviso: ajustes.minutos_aviso,
      },
    });
    sustituirAjustes(ajustes, doc.updated_at ?? null);
    return 1;
  } catch (error) {
    registrarError(r, error);
    return 0;
  }
}

function guardarAjustesRemota(doc: DocumentoRemoto): void {
  const ajustes: Ajustes = {
    campus_lat: (doc['campus_lat'] as number | null) ?? null,
    campus_lng: (doc['campus_lng'] as number | null) ?? null,
    minutos_aviso: Number(doc['minutos_aviso'] ?? 15),
  };
  if (ajustes.minutos_aviso >= 0 && ajustes.minutos_aviso <= 120) {
    sustituirAjustes(ajustes, doc.updated_at ?? null);
  }
}

function guardarMateriaRemota(doc: DocumentoRemoto): void {
  sustituirMateria(aMateria(doc));
}

function guardarBloqueRemoto(doc: DocumentoRemoto): void {
  sustituirBloque(aBloque(doc));
}

function aMateria(doc: DocumentoRemoto): Materia & { updated_at: string | null } {
  return {
    id: doc.id,
    nombre: String(doc['nombre'] ?? ''),
    docente: (doc['docente'] as string | null) ?? null,
    salon: (doc['salon'] as string | null) ?? null,
    color: String(doc['color'] ?? '#2563eb'),
    updated_at: doc.updated_at,
  };
}

function aBloque(doc: DocumentoRemoto): Omit<Bloque, 'notificacion_id'> & {
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
