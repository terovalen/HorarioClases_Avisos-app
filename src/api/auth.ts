/** Llamadas de autenticación mediadas por la API (Firebase nunca en la app). */
import { peticion } from './cliente';
import { borrarSesion, guardarSesion, leerSesion } from './tokens';
import type { DatosSesion, UsuarioSesion } from './tokens';

type RespuestaSesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: UsuarioSesion;
};

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<UsuarioSesion> {
  return guardarRespuesta(
    peticion<RespuestaSesion>('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { email, password },
    }),
  );
}

export async function registrarUsuario(
  email: string,
  password: string,
): Promise<UsuarioSesion> {
  return guardarRespuesta(
    peticion<RespuestaSesion>('/api/auth/registro', {
      metodo: 'POST',
      cuerpo: { email, password },
    }),
  );
}

async function guardarRespuesta(
  promesa: Promise<RespuestaSesion>,
): Promise<UsuarioSesion> {
  const datos = await promesa;
  const sesion: DatosSesion = {
    token: datos.token,
    refreshToken: datos.refreshToken,
    expiraEnSeg: datos.expiraEnSeg,
    usuario: datos.usuario,
  };
  await guardarSesion(sesion);
  return datos.usuario;
}

export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
}

export async function usuarioActual(): Promise<UsuarioSesion | null> {
  return (await leerSesion())?.usuario ?? null;
}
