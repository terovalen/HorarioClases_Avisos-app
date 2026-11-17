/** Reglas de avisos (RF-04): planificación pura y servicio de reprogramación. */
import { armarPrograma } from '../src/logica/plantilla-notificaciones';
import {
  parseHora,
  restarMinutos,
  minutosAHora,
  minutosDelDia,
  formatearHora,
  diaAWeekdayExpo,
  diaDeFecha,
} from '../src/logica/tiempo';
import type { Ajustes, Bloque, Materia } from '../src/logica/tipos';

const MATERIA: Materia = {
  id: 'm1',
  nombre: 'Física',
  docente: 'Dra. Ortiz',
  salon: '305',
  color: '#16a34a',
};
const BLOQUE: Bloque = {
  id: 'b1',
  materia_id: 'm1',
  dia: 1, // lunes
  hora_inicio: '07:00',
  hora_fin: '09:00',
  notificacion_id: null,
};
const AJUSTES: Pick<Ajustes, 'minutos_aviso'> = { minutos_aviso: 15 };

describe('armarPrograma', () => {
  test('aviso 15 minutos antes con salón y docente en el cuerpo', () => {
    const programa = armarPrograma([BLOQUE], [MATERIA], AJUSTES);
    expect(programa).toHaveLength(1);
    const aviso = programa[0];
    if (!aviso) throw new Error('falta el aviso');
    expect(aviso.hora).toBe(6);
    expect(aviso.minuto).toBe(45);
    expect(aviso.titulo).toBe('Física');
    expect(aviso.cuerpo).toContain('Salón 305');
    expect(aviso.cuerpo).toContain('Dra. Ortiz');
  });

  test('convierte lunes (1) al weekday de expo (2: martes en formato nativo)', () => {
    const aviso = armarPrograma([BLOQUE], [MATERIA], AJUSTES)[0];
    // expo-notifications: 1 = domingo … 7 = sábado → lunes = 2
    expect(aviso?.weekdayExpo).toBe(2);
  });

  test('domingo (7) se convierte a weekday 1 (domingo nativo)', () => {
    const aviso = armarPrograma([{ ...BLOQUE, dia: 7 }], [MATERIA], AJUSTES)[0];
    expect(aviso?.weekdayExpo).toBe(1);
  });

  test('bloques sin materia válida se omiten', () => {
    expect(armarPrograma([{ ...BLOQUE, materia_id: 'x' }], [], AJUSTES)).toEqual([]);
  });

  test('avisos que quedarían antes de las 00:00 se omiten', () => {
    const madrugada = { ...BLOQUE, hora_inicio: '00:10', hora_fin: '01:10' };
    expect(armarPrograma([madrugada], [MATERIA], AJUSTES)).toEqual([]);
  });
});

describe('restarMinutos', () => {
  test('presta la hora correctamente', () => {
    const resultado = restarMinutos(parseHora('08:00') ?? { h: 0, m: 0 }, 45);
    expect(resultado).toEqual({ h: 7, m: 15 });
  });

  test('no baja de las 00:00', () => {
    expect(restarMinutos(parseHora('00:10') ?? { h: 0, m: 0 }, 15)).toBeNull();
  });

  test('minutosAHora acota 23:59 y formatea', () => {
    expect(minutosAHora(1439)).toEqual({ h: 23, m: 59 });
    expect(minutosAHora(9999)).toEqual({ h: 23, m: 59 });
  });
});

describe('parseHora', () => {
  test('formato correcto con horas y minutos límite', () => {
    expect(parseHora('00:00')).toEqual({ h: 0, m: 0 });
    expect(parseHora('23:59')).toEqual({ h: 23, m: 59 });
  });

  test('rechaza formatos incompletos o fuera de rango', () => {
    expect(parseHora('7:00')).toBeNull(); // sin cero inicial
    expect(parseHora('07:5')).toBeNull(); // un dígito de minuto
    expect(parseHora('24:00')).toBeNull(); // hora fuera de rango
    expect(parseHora('07:60')).toBeNull(); // minuto fuera de rango
    expect(parseHora('')).toBeNull();
  });

  test('formatearHora rellena con ceros', () => {
    expect(formatearHora({ h: 7, m: 5 })).toBe('07:05');
    expect(formatearHora({ h: 23, m: 59 })).toBe('23:59');
  });

  test('minutosDelDia convierte a minutos absolutos', () => {
    expect(minutosDelDia({ h: 6, m: 45 })).toBe(405);
  });

  test('diaAWeekdayExpo: lunes 1 → 2 y domingo 7 → 1', () => {
    expect(diaAWeekdayExpo(1)).toBe(2);
    expect(diaAWeekdayExpo(6)).toBe(7);
    expect(diaAWeekdayExpo(7)).toBe(1);
  });

  test('diaDeFecha convierte getDay() de JS al día del proyecto', () => {
    // 15 de noviembre de 2026 es domingo (getDay() = 0) → día 7.
    expect(diaDeFecha(new Date(2026, 10, 15))).toBe(7);
    // 16 de noviembre de 2026 es lunes (getDay() = 1) → día 1.
    expect(diaDeFecha(new Date(2026, 10, 16))).toBe(1);
    // 21 de noviembre de 2026 es sábado (getDay() = 6) → día 6.
    expect(diaDeFecha(new Date(2026, 10, 21))).toBe(6);
  });
});
