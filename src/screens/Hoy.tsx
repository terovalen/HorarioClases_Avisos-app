/** Pantalla «Hoy»: próxima clase, cuenta regresiva, avisos y sincronización. */
import type { ReactElement } from 'react';
import { VistaHoy } from '../componentes/vista-hoy';
import { useDatosHoy } from '../hooks/use-pantalla-hoy';
import { useShake } from '../sensores/use-shake';
import { useSesion } from '../servicios/sesion';

export default function PantallaHoy(): ReactElement {
  const { usuario } = useSesion();
  const datos = useDatosHoy(usuario !== null);
  const sensorDisponible = useShake(datos.hablarProxima);
  return <VistaHoy {...datos} sensorDisponible={sensorDisponible} />;
}
