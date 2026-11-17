/** Próxima clase con cambio de semana (RF-05, criterio 3). */
import {
  claseEnCurso,
  calcularVistaHoy,
  proximaClase,
  proximaOcurrencia,
} from '../src/logica/proxima-clase';
import { desglosarCuenta, textoCuenta } from '../src/logica/tiempo';
import type { BloqueConMateria } from '../src/logica/tipos';

const MATERIA = {
  id: 'm1',
  nombre: 'Cálculo',
  docente: null,
  salon: '201',
  color: '#2563eb',
};
const BLOQUE = {
  id: 'b1',
  materia_id: 'm1',
  dia: 1,
  hora_inicio: '07:00',
  hora_fin: '09:00',
  notificacion_id: null,
};
const CLASE: BloqueConMateria = { bloque: BLOQUE, materia: MATERIA };

const FECHA = (y: number, m: number, d: number, h: number, min: number) =>
  new Date(y, m, d, h, min, 0, 0);

describe('proximaOcurrencia', () => {
  test('criterio 3: domingo por la noche → la próxima clase es el lunes', () => {
    // 15 de noviembre de 2026 es domingo.
    const ahora = FECHA(2026, 10, 15, 22, 0);
    const resultado = proximaOcurrencia(CLASE, ahora);
    expect(resultado?.getDay()).toBe(1); // lunes
    expect(resultado?.getFullYear()).toBe(2026);
    expect(resultado?.getMonth()).toBe(10);
    expect(resultado?.getDate()).toBe(16);
    expect(resultado?.getHours()).toBe(7);
  });

  test('hoy mismo si la clase aún no empieza', () => {
    const ahora = FECHA(2026, 10, 16, 6, 30); // lunes
    const resultado = proximaOcurrencia(CLASE, ahora);
    expect(resultado?.getDate()).toBe(16);
    expect(resultado?.getHours()).toBe(7);
  });

  test('si ya empezó, pasa a la semana siguiente', () => {
    const ahora = FECHA(2026, 10, 16, 8, 0); // lunes, en curso
    const resultado = proximaOcurrencia(CLASE, ahora);
    expect(resultado?.getDate()).toBe(23);
  });

  test('día inválido (fuera de 1..7) no produce ninguna fecha', () => {
    const invalido: BloqueConMateria = {
      bloque: { ...BLOQUE, dia: 9 },
      materia: MATERIA,
    };
    expect(proximaOcurrencia(invalido, FECHA(2026, 10, 16, 6, 0))).toBeNull();
  });

  test('bloque con hora inválida no produce ninguna fecha', () => {
    const invalido: BloqueConMateria = {
      bloque: { ...BLOQUE, hora_inicio: '7:00' },
      materia: MATERIA,
    };
    expect(proximaOcurrencia(invalido, FECHA(2026, 10, 16, 6, 0))).toBeNull();
  });
});

describe('proximaClase', () => {
  test('elige la más cercana de varios bloques', () => {
    const otra = {
      bloque: { ...BLOQUE, id: 'b2', dia: 1, hora_inicio: '10:00', hora_fin: '11:00' },
      materia: MATERIA,
    };
    const ahora = FECHA(2026, 10, 16, 6, 0);
    expect(proximaClase([otra, CLASE], ahora)?.bloque.id).toBe('b1');
  });

  test('conserva la mejor aunque después llegue una más tarde', () => {
    const tarde = {
      bloque: { ...BLOQUE, id: 'b2', dia: 1, hora_inicio: '10:00', hora_fin: '11:00' },
      materia: MATERIA,
    };
    const ahora = FECHA(2026, 10, 16, 6, 0);
    expect(proximaClase([CLASE, tarde], ahora)?.bloque.id).toBe('b1');
  });

  test('salta los bloques con hora inválida y elige los válidos', () => {
    const roto: BloqueConMateria = {
      bloque: { ...BLOQUE, id: 'b2', hora_inicio: '7:00' },
      materia: MATERIA,
    };
    const ahora = FECHA(2026, 10, 16, 6, 0);
    expect(proximaClase([roto, CLASE], ahora)?.bloque.id).toBe('b1');
  });

  test('sin bloques devuelve null', () => {
    expect(proximaClase([], new Date())).toBeNull();
  });
});

describe('claseEnCurso', () => {
  test('detecta la clase en curso y su hora de fin', () => {
    const ahora = FECHA(2026, 10, 16, 7, 30);
    const enCurso = claseEnCurso([CLASE], ahora);
    expect(enCurso?.bloque.id).toBe('b1');
    expect(enCurso?.termina.getHours()).toBe(9);
  });

  test('fuera de la franja no hay clase en curso', () => {
    const ahora = FECHA(2026, 10, 16, 10, 0);
    expect(claseEnCurso([CLASE], ahora)).toBeNull();
  });

  test('ignora bloques de otro día y bloques con horas inválidas', () => {
    const otroDia: BloqueConMateria = {
      bloque: { ...BLOQUE, id: 'b2', dia: 3 },
      materia: MATERIA,
    };
    const roto: BloqueConMateria = {
      bloque: { ...BLOQUE, id: 'b3', hora_inicio: '7:00', hora_fin: 'x' },
      materia: MATERIA,
    };
    const ahora = FECHA(2026, 10, 16, 7, 30);
    expect(claseEnCurso([otroDia, roto, CLASE], ahora)?.bloque.id).toBe('b1');
  });
});

describe('calcularVistaHoy', () => {
  test('incluye las clases de hoy ordenadas', () => {
    const tarde = {
      bloque: { ...BLOQUE, id: 'b3', dia: 1, hora_inicio: '14:00', hora_fin: '15:00' },
      materia: MATERIA,
    };
    const vista = calcularVistaHoy([tarde, CLASE], FECHA(2026, 10, 16, 6, 0));
    expect(vista.deHoy.map((c) => c.bloque.id)).toEqual(['b1', 'b3']);
    expect(vista.proxima?.bloque.id).toBe('b1');
  });
});

describe('cuenta regresiva', () => {
  test('desglosa días, horas, minutos y segundos', () => {
    const cuenta = desglosarCuenta((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(cuenta).toEqual({ dias: 2, horas: 3, minutos: 4, segundos: 5 });
    expect(textoCuenta(cuenta)).toBe('2 días 3 h');
  });

  test('menos de un día muestra horas y minutos', () => {
    expect(textoCuenta(desglosarCuenta(90 * 60 * 1000))).toBe('1 h 30 min 0 s');
  });
});
