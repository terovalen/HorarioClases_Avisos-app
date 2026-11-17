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

> Los integrantes deben agregar aquí sus propios casos con fecha y evidencia
> (captura o enlace al diff) a medida que trabajan.

## Uso por sesión (plantilla)

| Fecha | Tarea | Propósito | Evidencia | Validación | Decisión |
| ----- | ----- | --------- | --------- | ---------- | -------- |
|       |       |           |           |            |          |
