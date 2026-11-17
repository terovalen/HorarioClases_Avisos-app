/** Validaciones de materias: nombre obligatorio, límites y color #RRGGBB. */
import { PALETA_COLORES, validarMateria } from '../src/logica/validaciones-materia';

const BASE = {
  nombre: 'Cálculo',
  docente: null,
  salon: null,
  color: '#2563eb',
};

describe('validarMateria', () => {
  test('materia válida pasa', () => {
    expect(validarMateria(BASE).ok).toBe(true);
  });

  test('nombre vacío o con espacios se rechaza', () => {
    expect(validarMateria({ ...BASE, nombre: '' }).ok).toBe(false);
    expect(validarMateria({ ...BASE, nombre: '   ' }).ok).toBe(false);
  });

  test('nombre mayor a 80 caracteres se rechaza', () => {
    expect(validarMateria({ ...BASE, nombre: 'x'.repeat(81) }).ok).toBe(false);
    expect(validarMateria({ ...BASE, nombre: 'x'.repeat(80) }).ok).toBe(true);
  });

  test('color debe ser #RRGGBB', () => {
    expect(validarMateria({ ...BASE, color: 'azul' }).ok).toBe(false);
    expect(validarMateria({ ...BASE, color: '#2563e' }).ok).toBe(false);
    expect(validarMateria({ ...BASE, color: '#ABCDEF' }).ok).toBe(true);
  });

  test('docente y salón opcionales con límite de longitud', () => {
    expect(validarMateria({ ...BASE, docente: 'x'.repeat(81) }).ok).toBe(false);
    expect(validarMateria({ ...BASE, docente: 'x'.repeat(80) }).ok).toBe(true);
    expect(validarMateria({ ...BASE, salon: 'x'.repeat(41) }).ok).toBe(false);
    expect(validarMateria({ ...BASE, salon: 'x'.repeat(40) }).ok).toBe(true);
  });

  test('acumula varios errores a la vez', () => {
    const resultado = validarMateria({ ...BASE, nombre: '', color: 'rojo' });
    if (resultado.ok) throw new Error('debía fallar');
    expect(resultado.errores).toHaveLength(2);
  });
});

describe('PALETA_COLORES', () => {
  test('todos los colores de la paleta son #RRGGBB válidos', () => {
    expect(PALETA_COLORES.length).toBeGreaterThanOrEqual(6);
    for (const color of PALETA_COLORES) {
      expect(validarMateria({ ...BASE, color }).ok).toBe(true);
    }
  });
});
