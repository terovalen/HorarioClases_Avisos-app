/** Datos de la vista semanal (RF-01): carga, estados y acciones. */
import { useCallback, useEffect, useState } from 'react';
import { listarBloquesConMateria } from '../repositorios/bloques';
import {
  useBorradoSemana,
  useCambiosSemana,
  useEdicionBloqueCompleto,
  useEdicionHoras,
  type DatosCrear,
  type DatosEdicion,
  type Resultado,
} from './use-acciones-semana';
import type { BloqueConMateria, EstadoPantalla } from '../logica/tipos';

export type { DatosCrear, DatosEdicion, Resultado } from './use-acciones-semana';

/** Hook de la pantalla «Semana»: filas, estado y todas las acciones. */
export function useSemana(): {
  filas: BloqueConMateria[];
  estado: EstadoPantalla;
  recargar: () => void;
  crear: (datos: DatosCrear) => Promise<Resultado>;
  ajustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  editarHoras: (id: string, hora_inicio: string, hora_fin: string) => Promise<Resultado>;
  editarBloque: (datos: DatosEdicion) => Promise<Resultado>;
  eliminarBloqueActual: (id: string) => Promise<void>;
  eliminarMateriaCompleta: (id: string) => Promise<void>;
} {
  const [filas, setFilas] = useState<BloqueConMateria[]>([]);
  const [estado, setEstado] = useState<EstadoPantalla>('cargando');

  const recargar = useCallback((): void => {
    try {
      setFilas(listarBloquesConMateria());
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    // Carga inicial desde SQLite: se hace fuera del cuerpo síncrono del
    // efecto para no encadenar renders durante el montaje.
    const t = setTimeout(recargar, 0);
    return () => clearTimeout(t);
  }, [recargar]);

  const { crear, ajustarFin } = useCambiosSemana(recargar);
  const { editarHoras } = useEdicionHoras(recargar);
  const { editarBloque } = useEdicionBloqueCompleto(recargar);
  const { eliminarBloqueActual, eliminarMateriaCompleta } = useBorradoSemana(recargar);

  return {
    filas,
    estado,
    recargar,
    crear,
    ajustarFin,
    editarHoras,
    editarBloque,
    eliminarBloqueActual,
    eliminarMateriaCompleta,
  };
}
