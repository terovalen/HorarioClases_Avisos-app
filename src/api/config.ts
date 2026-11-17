/** URL de la API. No es secreta: todo lo que empieza por EXPO_PUBLIC_
 *  queda dentro del APK y cualquiera puede leerlo. */
export function apiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      'Configura EXPO_PUBLIC_API_URL (copia env.example a .env con la URL de tu API en Vercel).',
    );
  }
  return url.replace(/\/$/, '');
}
