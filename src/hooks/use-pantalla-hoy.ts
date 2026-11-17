/** Hooks de la pantalla «Hoy»: datos + sincronización, reloj y ubicación. */
import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { haversineMetros } from '../logica/distancia';
import { calcularVistaHoy } from '../logica/proxima-clase';
import type { VistaHoy } from '../logica/proxima-clase';
import type { EstadoPantalla } from '../logica/tipos';
import { leerAjustes } from '../repositorios/ajustes';
import { listarBloquesConMateria } from '../repositorios/bloques';
import { mensajeDeSincro, sincronizarTodo } from '../servicios/sincronizacion';
import { mensajeDeError } from '../api/cliente';

export type DatosHoy = {
  estado: EstadoPantalla;
  vista: VistaHoy | null;
  avisoSincro: string | null;
  recargar: () => void;
  hablarProxima: () => void;
};

export function useDatosHoy(usuarioActivo: boolean): DatosHoy {
  const [vista, setVista] = useState<VistaHoy | null>(null);
  const [estado, setEstado] = useState<EstadoPantalla>('cargando');
  const [avisoSincro, setAvisoSincro] = useState<string | null>(null);

  const recargar = useCallback((): void => {
    try {
      setVista(calcularVistaHoy(listarBloquesConMateria(), new Date()));
      setEstado('listo');
    } catch {
      setEstado('error');
    }
  }, []);

  const sincronizar = useCallback(async (): Promise<void> => {
    if (!usuarioActivo) return;
    try {
      const r = await sincronizarTodo();
      setAvisoSincro(mensajeDeSincro(r));
    } catch (error) {
      setAvisoSincro(mensajeDeError(error));
    }
    recargar();
  }, [usuarioActivo, recargar]);

  useEffect(() => {
    // Sincroniza al abrir: se hace fuera del cuerpo síncrono del efecto
    // para no encadenar renders durante el montaje.
    const t = setTimeout(() => void sincronizar(), 0);
    return () => clearTimeout(t);
  }, [sincronizar]);

  useEffect(() => {
    const t = setInterval(recargar, 30000);
    return () => clearInterval(t);
  }, [recargar]);

  const hablarProxima = useCallback((): void => {
    const clase = vista?.proxima;
    if (!clase) return;
    try {
      Speech.speak(
        `Próxima clase: ${clase.materia.nombre}, a las ${clase.bloque.hora_inicio}` +
          (clase.materia.salon ? `, en salón ${clase.materia.salon}` : ''),
        { language: 'es' },
      );
    } catch {
      // La voz es opcional: si falla, la tarjeta y el botón siguen funcionando.
    }
  }, [vista]);

  return { estado, vista, avisoSincro, recargar, hablarProxima };
}

export function useReloj(): Date {
  const [ahora, setAhora] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return ahora;
}

export function useDistanciaCampus(): {
  distancia: number | null;
  verificar: () => Promise<void>;
} {
  const [distancia, setDistancia] = useState<number | null>(null);
  const verificar = useCallback(async (): Promise<void> => {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) {
      setDistancia(null);
      return;
    }
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const ajustes = leerAjustes();
    if (ajustes.campus_lat === null || ajustes.campus_lng === null) return;
    setDistancia(
      haversineMetros(
        posicion.coords.latitude,
        posicion.coords.longitude,
        ajustes.campus_lat,
        ajustes.campus_lng,
      ),
    );
  }, []);
  return { distancia, verificar };
}
