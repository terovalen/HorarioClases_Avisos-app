/** Acciones que modifican el horario semanal (RF-01, RF-03, RF-04). */
import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { encontrarCruces, validarBloque, type Validacion } from '../logica/cruces';
import { validarMateria } from '../logica/validaciones-materia';
import {
  bloquePorId,
  bloquesDeMateria,
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
} from '../repositorios/materias';
import { leerAjustes } from '../repositorios/ajustes';
import { cancelarAvisoDeBloque, reprogramarAvisos } from '../servicios/notificaciones';
import { sincronizarTodo } from '../servicios/sincronizacion';

export type Resultado = { ok: boolean; errores: string[] };

export type DatosCrear = {
  dia: number;
  hora_inicio: string;
  hora_fin: string;
  materia_id?: string;
  nueva?: { nombre: string; docente: string | null; salon: string | null; color: string };
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
