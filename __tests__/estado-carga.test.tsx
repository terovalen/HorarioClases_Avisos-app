/** Estados accesibles de carga, vacío, error y reintento. */
import { fireEvent, render } from '@testing-library/react-native';
import { EstadoCarga } from '../src/componentes/estado-carga';

describe('EstadoCarga', () => {
  test('cargando anuncia el estado', async () => {
    const screen = await render(<EstadoCarga estado="cargando" />);
    expect(screen.getByTestId('estado-cargando')).toBeTruthy();
  });

  test('vacío con mensaje personalizado', async () => {
    const screen = await render(
      <EstadoCarga estado="listo" mensaje="Aún no tienes materias." />,
    );
    expect(screen.getByTestId('estado-vacio')).toBeTruthy();
    expect(screen.getByText('Aún no tienes materias.')).toBeTruthy();
  });

  test('error con botón Reintentar accesible', async () => {
    const alReintentar = jest.fn();
    const screen = await render(
      <EstadoCarga estado="error" alReintentar={alReintentar} />,
    );
    fireEvent.press(screen.getByLabelText('Reintentar'));
    expect(alReintentar).toHaveBeenCalledTimes(1);
  });
});
