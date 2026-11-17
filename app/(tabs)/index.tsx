/** Pantalla «Hoy»: próxima clase, cuenta regresiva, avisos y sincronización. */
import type { ReactElement } from 'react';
import { VistaHoy } from '../../src/componentes/vista-hoy';
import { useDatosHoy } from '../../src/hooks/use-pantalla-hoy';
import { useShake } from '../../src/sensores/use-shake';
import { useSesion } from '../../src/servicios/sesion';

export default function PantallaHoy(): ReactElement {
  const { usuario } = useSesion();
  const datos = useDatosHoy(usuario !== null);
  const sensorDisponible = useShake(datos.hablarProxima);
  return <VistaHoy {...datos} sensorDisponible={sensorDisponible} />;
}
