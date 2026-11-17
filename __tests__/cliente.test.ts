/** Cliente HTTP: refresco único en 401 y formato de error de la API. */
import { ErrorApi, peticion } from '../src/api/cliente';
import { borrarSesion, guardarSesion, leerSesion } from '../src/api/tokens';

jest.mock('../src/api/tokens', () => ({
  guardarSesion: jest.fn(),
  borrarSesion: jest.fn(),
  leerSesion: jest.fn(),
}));

jest.mock('../src/api/config', () => ({
  apiUrl: () => 'https://api-de-prueba.local',
}));

const SESION_BASE = {
  token: 'token-viejo',
  refreshToken: 'refresh-1',
  expiraEnSeg: 3600,
  usuario: { id: 'u1', email: 'a@b.co' },
};

/** Estado mutable: guardarSesion escribe y leerSesion lee lo último. */
let sesionActual: typeof SESION_BASE;

function respuesta(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  sesionActual = { ...SESION_BASE };
  (leerSesion as jest.Mock).mockImplementation(async () => sesionActual);
  (guardarSesion as jest.Mock).mockImplementation(async (datos: typeof SESION_BASE) => {
    sesionActual = datos;
  });
  (borrarSesion as jest.Mock).mockImplementation(async () => {
    sesionActual = { ...SESION_BASE, token: '', refreshToken: '' };
  });
  global.fetch = jest.fn();
});

describe('peticion', () => {
  test('con token vencido: refresca una vez, reintenta y guarda la sesión', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(respuesta(401, { error: 'Token inválido o expirado' }))
      .mockResolvedValueOnce(
        respuesta(200, { token: 'nuevo', refreshToken: 'nuevo-r', expiraEnSeg: 3600 }),
      )
      .mockResolvedValueOnce(respuesta(200, { ok: true }));
    const resultado = await peticion<{ ok: boolean }>('/api/materia', { conToken: true });
    expect(resultado.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    const refresco = (global.fetch as jest.Mock).mock.calls[1]?.[1];
    expect(refresco?.body).toContain('refresh-1');
    const reintento = (global.fetch as jest.Mock).mock.calls[2]?.[1];
    expect(reintento?.headers['Authorization']).toBe('Bearer nuevo');
  });

  test('si el refresco falla, borra la sesión y lanza 401', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(respuesta(401, { error: 'Token inválido o expirado' }))
      .mockResolvedValueOnce(respuesta(401, { error: 'Sesión expirada' }));
    await expect(peticion('/api/materia', { conToken: true })).rejects.toThrow(ErrorApi);
    expect(borrarSesion).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2); // solo un reintento
  });

  test('traduce el formato { error, detalles } del servidor', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      respuesta(400, {
        error: 'Datos inválidos',
        detalles: [{ campo: 'hora_fin', mensaje: 'Debe ser posterior a la de inicio' }],
      }),
    );
    const error = await peticion('/api/bloque/x', {
      metodo: 'PUT',
      cuerpo: {},
    }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    const detalle = (error as ErrorApi).detalles[0];
    expect(detalle?.campo).toBe('hora_fin');
  });

  test('no refresca en rutas públicas (login) aunque respondan 401', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      respuesta(401, { error: 'Correo o contraseña incorrectos' }),
    );
    await expect(
      peticion('/api/auth/login', { metodo: 'POST', cuerpo: {} }),
    ).rejects.toThrow('Correo o contraseña incorrectos');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
