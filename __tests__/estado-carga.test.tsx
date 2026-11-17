/** Estados accesibles de carga, vacío, error y reintento. */
import { EstadoCarga } from '../src/componentes/estado-carga';

describe('EstadoCarga', () => {
  test('se exporta como componente de React', () => {
    expect(typeof EstadoCarga).toBe('function');
  });

  test('acepta prop estado cargando', () => {
    const elemento = EstadoCarga({ estado: 'cargando' });
    expect(elemento).toBeDefined();
  });

  test('acepta prop estado listo con mensaje', () => {
    const elemento = EstadoCarga({ estado: 'listo', mensaje: 'Hola' });
    expect(elemento).toBeDefined();
  });

  test('acepta prop estado error con alReintentar', () => {
    const alReintentar = jest.fn();
    const elemento = EstadoCarga({ estado: 'error', alReintentar });
    expect(elemento).toBeDefined();
    alReintentar();
    expect(alReintentar).toHaveBeenCalledTimes(1);
  });
});
