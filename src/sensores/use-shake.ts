/** Hook del acelerómetro (sacudir). Devuelve si el sensor está disponible;
 *  la pantalla ofrece un botón equivalente si no lo está. */
import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';

const UMBRAL_SACUDIDA = 2.2;
const INTERVALO_ENTRE_SACUDIDAS_MS = 1500;

export function useShake(alSacudir: () => void): boolean {
  const [disponible, setDisponible] = useState(false);
  const ultimoDisparo = useRef(0);
  const accion = useRef(alSacudir);

  useEffect(() => {
    accion.current = alSacudir;
  }, [alSacudir]);

  useEffect(() => {
    let cancelado = false;
    let suscripcion: { remove: () => void } | null = null;
    Accelerometer.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelado) return;
        setDisponible(true);
        Accelerometer.setUpdateInterval(200);
        suscripcion = Accelerometer.addListener((datos) => {
          const magnitud = Math.abs(datos.x) + Math.abs(datos.y) + Math.abs(datos.z);
          const ahora = Date.now();
          if (
            magnitud > UMBRAL_SACUDIDA &&
            ahora - ultimoDisparo.current > INTERVALO_ENTRE_SACUDIDAS_MS
          ) {
            ultimoDisparo.current = ahora;
            accion.current();
          }
        });
      })
      .catch(() => setDisponible(false));
    return () => {
      cancelado = true;
      suscripcion?.remove();
    };
  }, []);

  return disponible;
}
