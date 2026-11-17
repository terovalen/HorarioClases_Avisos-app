/** Programación y cancelación de los avisos semanales (RF-04).
 *  Se reprograma al editar y se cancela al eliminar (criterios 2 y 3). */
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { armarPrograma } from '../logica/plantilla-notificaciones';
import type { Ajustes, Bloque, Materia } from '../logica/tipos';
import { asignarNotificacion, bloquePorId } from '../repositorios/bloques';

const ID_CANAL = 'avisos-horario';

export async function pedirPermisoAvisos(): Promise<boolean> {
  if (!(await getPermissionsAsync()).granted) {
    const pedida = await requestPermissionsAsync();
    return pedida.granted;
  }
  return true;
}

/** El canal es obligatorio en Android 13+ antes de programar avisos. */
export async function prepararCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await setNotificationChannelAsync(ID_CANAL, {
    name: 'Avisos de clases',
    importance: AndroidImportance.HIGH,
  });
}

/** Cancela los avisos actuales y vuelve a programar todos los bloques. */
export async function reprogramarAvisos(
  bloques: Bloque[],
  materias: Materia[],
  ajustes: Pick<Ajustes, 'minutos_aviso'>,
): Promise<number> {
  await prepararCanal();
  await cancelarAvisosDeBloques(bloques);
  const programa = armarPrograma(bloques, materias, ajustes);
  for (const aviso of programa) {
    const id = await scheduleNotificationAsync({
      content: {
        title: aviso.titulo,
        body: aviso.cuerpo,
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.WEEKLY,
        weekday: aviso.weekdayExpo,
        hour: aviso.hora,
        minute: aviso.minuto,
        channelId: ID_CANAL,
      },
    });
    asignarNotificacion(aviso.idBloque, id);
  }
  return programa.length;
}

async function cancelarAvisosDeBloques(bloques: Bloque[]): Promise<void> {
  for (const bloque of bloques) {
    if (!bloque.notificacion_id) continue;
    await cancelScheduledNotificationAsync(bloque.notificacion_id);
  }
}

/** Cancela el aviso de un bloque (se usa al eliminar o mover). */
export async function cancelarAvisoDeBloque(idBloque: string): Promise<void> {
  const bloque = bloquePorId(idBloque);
  if (!bloque?.notificacion_id) return;
  await cancelScheduledNotificationAsync(bloque.notificacion_id);
}

/** Al eliminar una materia se cancelan los avisos de todos sus bloques. */
export async function cancelarAvisosDeMateria(bloques: Bloque[]): Promise<void> {
  await cancelarAvisosDeBloques(bloques);
}
