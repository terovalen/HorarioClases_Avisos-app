/** Tokens de sesión SOLO en expo-secure-store (nunca en AsyncStorage). */
import * as SecureStore from 'expo-secure-store';

export type DatosSesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: UsuarioSesion;
};

export type UsuarioSesion = { id: string; email: string };

const CLAVE_SESION = 'sesion.38';

export async function guardarSesion(datos: DatosSesion): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_SESION, JSON.stringify(datos));
}

export async function leerSesion(): Promise<DatosSesion | null> {
  const crudo = await SecureStore.getItemAsync(CLAVE_SESION);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo) as DatosSesion;
  } catch {
    await borrarSesion();
    return null;
  }
}

export async function borrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_SESION);
}
