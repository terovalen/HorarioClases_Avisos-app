/** Servicio: reprogramar avisos al editar; cancelar al eliminar (RF-04,
 *  criterio 2). Sensores/módulos nativos simulados con mocks. */
import * as Notificaciones from 'expo-notifications';
import { Platform } from 'react-native';
import type { Ajustes, Bloque, Materia } from '../src/logica/tipos';
import { asignarNotificacion, bloquePorId } from '../src/repositorios/bloques';
import {
  reprogramarAvisos,
  cancelarAvisoDeBloque,
  pedirPermisoAvisos,
  cancelarAvisosDeMateria,
} from '../src/servicios/notificaciones';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  AndroidImportance: { HIGH: 4 },
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-1'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/repositorios/bloques', () => ({
  asignarNotificacion: jest.fn(),
  bloquePorId: jest.fn(),
}));

jest.mock('../src/db', () => ({
  abrirBase: jest.fn(() => ({
    getFirstSync: jest.fn(() => null),
    getAllSync: jest.fn(() => []),
    execSync: jest.fn(),
  })),
}));

const MATERIA: Materia = {
  id: 'm1',
  nombre: 'Química',
  docente: null,
  salon: '7',
  color: '#2563eb',
};
const AJUSTES: Pick<Ajustes, 'minutos_aviso'> = { minutos_aviso: 15 };

function bloque(hora_inicio: string, id = 'b1'): Bloque {
  return {
    id,
    materia_id: 'm1',
    dia: 1,
    hora_inicio,
    hora_fin: '09:00',
    notificacion_id: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('reprogramarAvisos', () => {
  test('programa un aviso semanal con el disparador WEEKLY correcto', async () => {
    const cantidad = await reprogramarAvisos([bloque('07:00')], [MATERIA], AJUSTES);
    expect(cantidad).toBe(1);
    const llamada = (Notificaciones.scheduleNotificationAsync as jest.Mock).mock
      .calls[0]?.[0];
    expect(llamada?.trigger?.type).toBe('weekly');
    expect(llamada?.trigger?.weekday).toBe(2); // lunes en formato nativo
    expect(llamada?.trigger?.hour).toBe(6);
    expect(llamada?.trigger?.minute).toBe(45);
    expect(asignarNotificacion).toHaveBeenCalledWith('b1', 'notif-1');
  });

  test('al editar un bloque se cancela el aviso viejo y se programa el nuevo', async () => {
    const viejo = { ...bloque('07:00'), notificacion_id: 'vieja-1' };
    await reprogramarAvisos([viejo], [MATERIA], AJUSTES);
    expect(Notificaciones.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
      'vieja-1',
    );
    await reprogramarAvisos([bloque('08:00')], [MATERIA], AJUSTES);
    const segunda = (Notificaciones.scheduleNotificationAsync as jest.Mock).mock
      .calls[1]?.[0];
    expect(segunda?.trigger?.hour).toBe(7);
    expect(segunda?.trigger?.minute).toBe(45);
  });

  test('sin bloques no programa nada', async () => {
    expect(await reprogramarAvisos([], [MATERIA], AJUSTES)).toBe(0);
    expect(Notificaciones.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('cancelarAvisoDeBloque', () => {
  test('cancela con el id guardado en el bloque', async () => {
    (bloquePorId as jest.Mock).mockReturnValue({
      ...bloque('07:00'),
      notificacion_id: 'n-9',
    });
    await cancelarAvisoDeBloque('b1');
    expect(Notificaciones.cancelScheduledNotificationAsync).toHaveBeenCalledWith('n-9');
  });

  test('bloque sin aviso no llama a cancelar', async () => {
    (bloquePorId as jest.Mock).mockReturnValue(bloque('07:00'));
    await cancelarAvisoDeBloque('b1');
    expect(Notificaciones.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });
});

describe('pedirPermisoAvisos', () => {
  test('permiso ya concedido no vuelve a pedirlo', async () => {
    (Notificaciones.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
    });
    expect(await pedirPermisoAvisos()).toBe(true);
    expect(Notificaciones.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test('sin permiso lo pide y devuelve el resultado de la petición', async () => {
    (Notificaciones.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
    });
    (Notificaciones.requestPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
    });
    expect(await pedirPermisoAvisos()).toBe(false);
    expect(Notificaciones.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

describe('canal de Android y cancelación por materia', () => {
  test('en Android configura el canal antes de programar', async () => {
    Platform.OS = 'android';
    await reprogramarAvisos([bloque('07:00')], [MATERIA], AJUSTES);
    expect(Notificaciones.setNotificationChannelAsync).toHaveBeenCalledWith(
      'avisos-horario',
      expect.objectContaining({ name: 'Avisos de clases' }),
    );
  });

  test('fuera de Android no intenta configurar el canal', async () => {
    Platform.OS = 'ios';
    await reprogramarAvisos([bloque('07:00')], [MATERIA], AJUSTES);
    expect(Notificaciones.setNotificationChannelAsync).not.toHaveBeenCalled();
  });

  test('cancelarAvisosDeMateria cancela solo los bloques con aviso', async () => {
    await cancelarAvisosDeMateria([
      { ...bloque('07:00'), notificacion_id: 'n-1' },
      { ...bloque('08:00', 'b2'), notificacion_id: null },
      { ...bloque('09:00', 'b3'), notificacion_id: 'n-3' },
    ]);
    expect(Notificaciones.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notificaciones.cancelScheduledNotificationAsync).toHaveBeenCalledWith('n-1');
    expect(Notificaciones.cancelScheduledNotificationAsync).toHaveBeenCalledWith('n-3');
  });
});
