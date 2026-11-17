/** Detección de cruces: 6 casos obligatorios + bordes (RF-03, criterio 1). */
import { encontrarCruces, seCruzan, validarBloque } from '../src/logica/cruces';

const LUNES = (inicio: string, fin: string, id?: string) => ({
  id,
  dia: 1,
  hora_inicio: inicio,
  hora_fin: fin,
});

describe('seCruzan', () => {
  test('criterio 1: lunes 07:00–09:00 vs lunes 08:00–10:00 se cruzan', () => {
    expect(seCruzan(LUNES('07:00', '09:00'), LUNES('08:00', '10:00'))).toBe(true);
  });

  test('tocarse en el borde no es cruce (09:00 sigue libre)', () => {
    expect(seCruzan(LUNES('07:00', '09:00'), LUNES('09:00', '10:00'))).toBe(false);
  });

  test('un bloque contenido dentro de otro se cruza', () => {
    expect(seCruzan(LUNES('07:00', '12:00'), LUNES('08:00', '09:00'))).toBe(true);
  });

  test('días distintos nunca se cruzan', () => {
    expect(
      seCruzan(LUNES('07:00', '09:00'), {
        dia: 2,
        hora_inicio: '07:00',
        hora_fin: '09:00',
      }),
    ).toBe(false);
  });

  test('el mismo horario dos veces se cruza', () => {
    expect(seCruzan(LUNES('07:00', '09:00'), LUNES('07:00', '09:00'))).toBe(true);
  });

  test('el cruce es simétrico (el otro empieza antes)', () => {
    expect(seCruzan(LUNES('08:00', '10:00'), LUNES('07:00', '09:00'))).toBe(true);
  });
});

describe('encontrarCruces', () => {
  test('excluye al propio bloque por id', () => {
    const existentes = [LUNES('07:00', '09:00', 'a'), LUNES('10:00', '11:00', 'b')];
    const resultado = encontrarCruces(LUNES('08:00', '10:00', 'a'), existentes);
    expect(resultado).toHaveLength(0);
  });

  test('encuentra los cruces con otros bloques', () => {
    const existentes = [LUNES('07:00', '09:00', 'a'), LUNES('10:00', '11:00', 'b')];
    const resultado = encontrarCruces(LUNES('08:00', '09:30', undefined), existentes);
    expect(resultado).toEqual([LUNES('07:00', '09:00', 'a')]);
  });
});

describe('validarBloque', () => {
  test('fin igual a inicio se rechaza', () => {
    expect(validarBloque(LUNES('07:00', '07:00')).ok).toBe(false);
  });

  test('fin anterior a inicio se rechaza', () => {
    expect(validarBloque(LUNES('09:00', '07:00')).ok).toBe(false);
  });

  test('día fuera de 1..7 se rechaza', () => {
    expect(validarBloque({ dia: 8, hora_inicio: '07:00', hora_fin: '08:00' }).ok).toBe(
      false,
    );
    expect(validarBloque({ dia: 0, hora_inicio: '07:00', hora_fin: '08:00' }).ok).toBe(
      false,
    );
  });

  test('formato 24 h estricto: "7:00" y "24:00" se rechazan', () => {
    expect(validarBloque(LUNES('7:00', '08:00')).ok).toBe(false);
    expect(validarBloque(LUNES('24:00', '24:30')).ok).toBe(false);
  });

  test('domingo (día 7) con horario válido pasa', () => {
    expect(validarBloque({ dia: 7, hora_inicio: '07:00', hora_fin: '09:00' }).ok).toBe(
      true,
    );
  });
});
