/** Reglas puras de sincronización: qué enviar, qué guardar y el cursor. */

export type EstadoFila = {
  deleted: number; // 1 = borrado lógico local pendiente
  pending: number; // 1 = cambio local sin enviar
  updated_at: string | null;
};

export type DocumentoRemoto = {
  id: string;
  updated_at: string | null;
  deleted_at: string | null;
  [campo: string]: unknown;
};

/** ¿Gana el remoto? La app es la fuente mientras haya cambios locales
 *  pendientes; después gana la última escritura (updated_at). */
export function ganaRemoto(local: EstadoFila, remoto: DocumentoRemoto): boolean {
  if (local.pending === 1) return false;
  if (!remoto.updated_at) return false;
  return (local.updated_at ?? '') < remoto.updated_at;
}

/** El servidor entrega máx. 500 por llamada; el cursor es el último
 *  updated_at recibido. La ronda termina cuando llegan menos de 500. */
export function siguienteCursor(
  items: DocumentoRemoto[],
  desdeActual: string | null,
): { desde: string | null; continuar: boolean } {
  const ultimo = items[items.length - 1];
  if (items.length < 500 || !ultimo?.updated_at || ultimo.updated_at === desdeActual) {
    return { desde: desdeActual, continuar: false };
  }
  return { desde: ultimo.updated_at, continuar: true };
}

export type TipoEscritura = 'crear' | 'borrar';

/** Un pendiente borrado localmente se envía como DELETE; el resto como PUT. */
export function tipoDeEscritura(fila: EstadoFila): TipoEscritura {
  return fila.deleted === 1 ? 'borrar' : 'crear';
}
