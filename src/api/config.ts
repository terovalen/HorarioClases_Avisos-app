/** URL de la API. No es secreta: todo lo que empieza por EXPO_PUBLIC_
 *  queda dentro del APK y cualquiera puede leerlo. */
export function apiUrl(): string {
  // URL fija para evitar problemas con EXPO_PUBLIC_API_URL en iOS
  const url = 'https://horario-clases-avisos-api.vercel.app';
  const normalizada = url.replace(/\/$/, '');
  return normalizada;
}
