/** Acciones que modifican el horario semanal (RF-01, RF-03, RF-04). */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { encontrarCruces, validarBloque, type Validacion } from '../logica/cruces';
import { validarMateria } from '../logica/validaciones-materia';
import {
  bloqueConMateriaPorId,
  bloquePorId,
  bloquesDeMateria,
  actualizarBloque,
  actualizarHoraFin,
  actualizarHoras,
  crearBloque,
  eliminarBloque,
  listarBloques,
  listarBloquesConMateria,
} from '../repositorios/bloques';
import {
  crearMateria,
  eliminarMateria as eliminarMateriaRepo,
  listarMaterias,
  materiaPorId,
  actualizarMateria,
} from '../repositorios/materias';
import { leerAjustes } from '../repositorios/ajustes';
import { cancelarAvisoDeBloque, reprogramarAvisos } from '../servicios/notificaciones';
import { sincronizarTodo } from '../servicios/sincronizacion';
import type { BloqueConMateria } from '../logica/tipos';

export type Resultado = { ok: boolean; errores: string[] };

export type DatosCrear = {
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  materia_id?: string;
  nueva?: { nombre: string; docente: string | null; salon: string | null; color: string };
};

/** Datos para editar un bloque existente: todo se puede cambiar. */
export type DatosEdicion = {
  id: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  materia_id?: string;
  nueva?: { nombre: string; docente: string | null; salon: string | null; color: string };
  /** Si se edita una materia existente, estos campos se actualizan en la materia. */
  nombre?: string;
  docente?: string | null;
  salon?: string | null;
  color?: string;
};

const OK: Resultado = { ok: true, errores: [] };

function vibrar(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
}

/** Tras cada cambio: avisos al día y sincronización en segundo plano. */
async function despuesDeCambiar(): Promise<void> {
  await reprogramarAvisos(listarBloques(), listarMaterias(), leerAjustes());
  try {
    await sincronizarTodo();
  } catch {
    // Sin conexión: los cambios quedan pendientes en SQLite (pending = 1).
  }
}

/** Aplica el cambio, refresca, programa avisos + sincroniza y vuelve a refrescar. */
async function aplicar(
  recargar: () => void,
  cambio: () => void | Promise<void>,
): Promise<void> {
  await cambio();
  recargar();
  await despuesDeCambiar();
  recargar();
}

/** Crear bloques y ajustar la hora de fin (con vibración y validación). */
export function useCambiosSemana(recargar: () => void): {
  crear: (datos: DatosCrear) => Promise<Resultado>;
  ajustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
} {
  const crear = useCallback(
    async (datos: DatosCrear): Promise<Resultado> => {
      const fallo = validarCreacion(datos);
      if (fallo) return fallo;
      const materiaId =
        datos.nueva !== undefined ? crearMateria(datos.nueva) : (datos.materia_id ?? '');
      if (!materiaId) return { ok: false, errores: ['Elige o crea una materia.'] };
      vibrar();
      await aplicar(recargar, () => {
        crearBloque({
          materia_id: materiaId,
          dia: datos.dia,
          hora_inicio: datos.hora_inicio,
          hora_fin: datos.hora_fin,
        });
      });
      return OK;
    },
    [recargar],
  );

  const ajustarFin = useCallback(
    async (id: string, hora_fin: string): Promise<Resultado> => {
      const actual = bloquePorId(id);
      if (!actual) return { ok: false, errores: ['El bloque ya no existe.'] };
      const candidato = {
        id,
        dia: actual.dia,
        hora_inicio: actual.hora_inicio,
        hora_fin,
      };
      const fallo = validarContraExistente(candidato);
      if (fallo) return fallo;
      vibrar();
      await aplicar(recargar, () => actualizarHoraFin(id, hora_fin));
      return OK;
    },
    [recargar],
  );

  return { crear, ajustarFin };
}

/** Edición manual de las horas de un bloque (menú de long-press): permite
 *  escribir el inicio y el fin exactos (07:15, 08:45…). */
export function useEdicionHoras(recargar: () => void): {
  editarHoras: (id: string, hora_inicio: string, hora_fin: string) => Promise<Resultado>;
} {
  const editarHoras = useCallback(
    async (id: string, hora_inicio: string, hora_fin: string): Promise<Resultado> => {
      const actual = bloquePorId(id);
      if (!actual) return { ok: false, errores: ['El bloque ya no existe.'] };
      const fallo = validarContraExistente({
        id,
        dia: actual.dia,
        hora_inicio,
        hora_fin,
      });
      if (fallo) return fallo;
      await aplicar(recargar, () => actualizarHoras(id, hora_inicio, hora_fin));
      return OK;
    },
    [recargar],
  );

  return { editarHoras };
}

/** Edición completa de un bloque existente (menú de long-press): materia,
 *  horas exactas, docente, salón y color. */
export function useEdicionBloqueCompleto(recargar: () => void): {
  editarBloque: (datos: DatosEdicion) => Promise<Resultado>;
} {
  const editarBloque = useCallback(
    async (datos: DatosEdicion): Promise<Resultado> => {
      const actual = bloqueConMateriaPorId(datos.id);
      if (!actual) return { ok: false, errores: ['El bloque ya no existe.'] };

      const { materiaId, error } = resolverMateriaId(datos, actual);
      if (error) return error;

      const candidato = {
        id: datos.id,
        dia: datos.dia,
        hora_inicio: datos.hora_inicio,
        hora_fin: datos.hora_fin,
      };
      const fallo = validarContraExistente(candidato);
      if (fallo) return fallo;

      vibrar();
      await aplicar(recargar, () => {
        actualizarBloque(datos.id, materiaId, datos.hora_inicio, datos.hora_fin);
      });
      return OK;
    },
    [recargar],
  );

  return { editarBloque };
}

/** Resuelve el ID de materia y actualiza la materia existente si corresponde. */
function resolverMateriaId(
  datos: DatosEdicion,
  actual: BloqueConMateria,
): { materiaId: string; error: Resultado | null } {
  let materiaId = datos.materia_id ?? actual.bloque.materia_id;

  if (datos.nueva !== undefined) {
    const creado = crearOMateriaNueva(datos.nueva);
    if (creado.error) return { materiaId: '', error: creado.error };
    vibrar();
    materiaId = creado.materiaId;
  }

  if (hayCambiosDeMateria(datos)) {
    const materiaActual = materiaPorId(actual.bloque.materia_id);
    if (materiaActual) {
      actualizarMateria(actual.bloque.materia_id, {
        nombre: datos.nombre ?? materiaActual.nombre,
        docente: datos.docente ?? null,
        salon: datos.salon ?? null,
        color: datos.color ?? materiaActual.color,
      });
    }
  }

  return { materiaId, error: null };
}

/** Valida y crea una materia nueva; devuelve su id o un error. */
function crearOMateriaNueva(datos: {
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
}): { materiaId: string; error: Resultado | null } {
  const valido = validarMateria(datos);
  if (!valido.ok) return { materiaId: '', error: valido };
  vibrar();
  return { materiaId: crearMateria(datos), error: null };
}

/** Indica si se enviaron campos para actualizar una materia existente. */
function hayCambiosDeMateria(datos: DatosEdicion): boolean {
  return (
    datos.nombre !== undefined ||
    datos.docente !== undefined ||
    datos.salon !== undefined ||
    datos.color !== undefined
  );
}

/** Eliminar bloques y materias; al eliminar una materia se cancelan sus avisos. */
export function useBorradoSemana(recargar: () => void): {
  eliminarBloqueActual: (id: string) => Promise<void>;
  eliminarMateriaCompleta: (id: string) => Promise<void>;
} {
  const eliminarBloqueActual = useCallback(
    async (id: string): Promise<void> => {
      await aplicar(recargar, async () => {
        await cancelarAvisoDeBloque(id);
        eliminarBloque(id);
      });
    },
    [recargar],
  );

  const eliminarMateriaCompleta = useCallback(
    async (id: string): Promise<void> => {
      await aplicar(recargar, async () => {
        for (const bloque of bloquesDeMateria(id)) {
          await cancelarAvisoDeBloque(bloque.id);
          eliminarBloque(bloque.id);
        }
        eliminarMateriaRepo(id);
      });
    },
    [recargar],
  );

  return { eliminarBloqueActual, eliminarMateriaCompleta };
}

function validarCreacion(datos: DatosCrear): Resultado | null {
  const bloque = {
    dia: datos.dia,
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin,
  };
  const fallo = validarContraExistente(bloque);
  if (fallo) return fallo;
  if (datos.nueva !== undefined) {
    const materia = validarMateria({ ...datos.nueva, nombre: datos.nueva.nombre });
    if (!materia.ok) return materia;
  } else if (!datos.materia_id) {
    return { ok: false, errores: ['Elige o crea una materia.'] };
  }
  return null;
}

/** Validación local + detección de cruces contra los bloques guardados. */
function validarContraExistente(candidato: {
  id?: string;
  dia: number;
  hora_inicio: string;
  hora_fin: string;
}): Resultado | null {
  const valido: Validacion = validarBloque(candidato);
  if (!valido.ok) return valido;
  const cruces = encontrarCruces(
    candidato,
    listarBloquesConMateria().map((f) => f.bloque),
  );
  if (cruces.length > 0) {
    return { ok: false, errores: ['Se cruza con otro bloque del mismo día.'] };
  }
  return null;
}
