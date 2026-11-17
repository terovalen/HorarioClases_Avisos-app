# Bitácora de IA

Formato por entrada: **propósito · evidencia · validación · decisión**.
Regla: si el código generado con IA se usa, primero se entiende línea por línea;
si no se entiende, no se entrega.

## Entrada 1 · 2026-11-16 · Diseño inicial del proyecto

- **Propósito:** configurar la IA (restricciones, sandbox, reglas de calidad) y
  generar el esqueleto del proyecto 38 (app y API) según `38-horario-de-clases.md`.
- **Evidencia:** primer commit (config de IA + calidad), commits posteriores de
  código y pruebas en este repositorio y en `38-horario-de-clases-api`.
- **Validación:** `npm run check` en verde; pruebas de contención de
  `ia/PRUEBAS-CONTENCION.md` (se completan al ejecutarlas en vivo).
- **Decisión:** aceptar la configuración y el esqueleto tras revisión manual
  del diff completo por ambos integrantes.

## Entrada 2 · 2026-11-17 · Aviso de «sin conexión» y migración SQLite en iOS

- **Propósito:** corregir dos fallos observados en el iPhone con Expo Go:
  `no such table: bloque` y un aviso «Sin conexión» que aparecía teniendo red.
- **Evidencia:** logs del Metro en el dispositivo (`[API] POST .../api/auth/login`
  correcto y luego `Error code 1: no such table: bloque`) y captura de la pantalla
  «Hoy» con el aviso de conexión.
- **Validación:** `npm run check` en verde (82 pruebas, cobertura por encima del
  umbral). La migración ejecuta ahora una sola sentencia por `execSync` y el
  `CHECK` de `bloque` quedó al final del esquema.
- **Decisión:** el aviso de conexión solo puede decir «Sin conexión» cuando el
  fallo es de red (`ErrorApi` con estado 0). Un 401/404/500 de la API o un fallo
  al programar avisos muestran su causa real y no abortan el resto de la
  sincronización.

## Casos en que se rechazó o corrigió lo propuesto por la IA (mínimo 3)

1. **Tokens de sesión.** La IA propuso guardar `token` y `refreshToken` en
   `AsyncStorage` por comodidad. Se rechazó: la lista de verificación de
   seguridad exige `expo-secure-store` (cifrado del sistema), y `AsyncStorage`
   no está cifrado. → `src/api/tokens.ts` usa `expo-secure-store`.
2. **Identificadores únicos.** La IA propuso `Math.random()` para generar los
   UUID de materias y bloques. Se corrigió: `randomUUID` de `expo-crypto`
   (criptográficamente aleatorio; el mismo UUID viaja a SQLite y Firestore para
   que reintentar no duplique).
3. **Lint en Next 16.** La IA propuso `next lint` para la API. Se corrigió:
   desde Next 16 el comando no existe; se usa `eslint .` con
   `eslint-config-next`.
4. **Pantalla de login.** El modelo inicial de pantallas del documento no
   incluía dónde inicia sesión el usuario. Se agregó `app/login.tsx` con
   validación y estados de carga/error, sin alterar los requisitos del
   documento.
5. **Aviso de «sin conexión».** La IA propuso mostrar ese aviso ante cualquier
   fallo de la sincronización. Se corrigió: el mensaje solo corresponde a un
   fallo de red; los errores de la API y los fallos al programar avisos se
   muestran con su código y su mensaje real. Se añadió además el botón
   «Comprobar conexión» (GET `/api/health`) para distinguir red caída de API
   con fallo.

> Los integrantes deben agregar aquí sus propios casos con fecha y evidencia
> (captura o enlace al diff) a medida que trabajan.

## Uso por sesión (plantilla)

| Fecha | Tarea | Propósito | Evidencia | Validación | Decisión |
| ----- | ----- | --------- | --------- | ---------- | -------- |
|       |       |           |           |            |          |
