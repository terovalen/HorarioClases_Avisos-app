/** Cliente HTTP: Bearer token, refresco único en 401 y errores del formato
 *  acordado { "error": mensaje, "detalles"?: [{ campo, mensaje }] }. */
import { apiUrl } from './config';
import { borrarSesion, guardarSesion, leerSesion } from './tokens';

export type Detalle = { campo: string; mensaje: string };

export class ErrorApi extends Error {
  readonly estado: number;
  readonly detalles: Detalle[];

  constructor(estado: number, mensaje: string, detalles: Detalle[] = []) {
    super(mensaje);
    this.estado = estado;
    this.detalles = detalles;
  }
}

type Opciones = {
  metodo?: 'GET' | 'PUT' | 'DELETE' | 'POST';
  cuerpo?: unknown;
  /** true en rutas privadas: si responde 401 se refresca una vez y reintenta. */
  conToken?: boolean;
};

export async function peticion<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const respuesta = await lanzar(ruta, opciones);
  if (respuesta.status === 401 && opciones.conToken) {
    await renovarYGuardar();
    const segunda = await lanzar(ruta, opciones);
    return procesar<T>(segunda);
  }
  return procesar<T>(respuesta);
}

async function lanzar(ruta: string, opciones: Opciones): Promise<Response> {
  const sesion = await leerSesion();
  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (opciones.conToken && sesion) {
    cabeceras['Authorization'] = `Bearer ${sesion.token}`;
  }
  const urlCompleta = `${apiUrl()}${ruta}`;
  // eslint-disable-next-line no-console
  console.log(`[API] ${opciones.metodo ?? 'GET'} ${urlCompleta}`);
  try {
    return await fetch(urlCompleta, {
      method: opciones.metodo ?? 'GET',
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[API] Error de red en ${urlCompleta}:`, error);
    throw new ErrorApi(
      0,
      `No se pudo conectar con la API (${urlCompleta}). Verifica tu conexión a internet.`,
    );
  }
}

/** Una sola renovación: si falla se cierra la sesión y hay que volver a entrar. */
async function renovarYGuardar(): Promise<void> {
  const sesion = await leerSesion();
  if (!sesion?.refreshToken) throw new ErrorApi(401, 'Sesión expirada');
  const respuesta = await fetch(`${apiUrl()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: sesion.refreshToken }),
  });
  if (!respuesta.ok) {
    await borrarSesion();
    throw new ErrorApi(401, 'Sesión expirada, inicia sesión de nuevo');
  }
  const datos = (await respuesta.json()) as {
    token: string;
    refreshToken: string;
    expiraEnSeg: number;
  };
  await guardarSesion({ ...sesion, ...datos });
}

async function procesar<T>(respuesta: Response): Promise<T> {
  const texto = await respuesta.text();
  const cuerpo: unknown = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) throw errorDelCuerpo(respuesta.status, cuerpo);
  return cuerpo as T;
}

function errorDelCuerpo(estado: number, cuerpo: unknown): ErrorApi {
  if (cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo) {
    const datos = cuerpo as { error: unknown; detalles?: unknown };
    const detalles = Array.isArray(datos.detalles) ? datos.detalles : [];
    return new ErrorApi(
      estado,
      String(datos.error),
      detalles.filter(esDetalle).map((d) => d),
    );
  }
  return new ErrorApi(estado, `Error ${estado}`);
}

function esDetalle(valor: unknown): valor is Detalle {
  if (typeof valor !== 'object' || valor === null) return false;
  const d = valor as Record<string, unknown>;
  return typeof d['campo'] === 'string' && typeof d['mensaje'] === 'string';
}
