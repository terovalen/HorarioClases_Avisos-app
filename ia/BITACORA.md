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

## Entrada 3 · 2026-11-17 · Edición exacta de horas, botón de avisos y sincronización tolerante a fallos

- **Propósito:** resolver lo reportado desde el iPhone: la sincronización
  terminaba en «Sincronizado con errores · Error 500 · enviados 0 · recibidos
  0», en «Semana» no había botón para añadir un bloque ni forma de escribir la
  hora exacta (07:15, 07:30), y no había ningún botón «Activar avisos
  semanales».
- **Evidencia:** captura del mensaje de sincronización con `Error 500` y
  `enviados 0 · recibidos 0`; la pestaña «Comprobar conexión» sí respondía
  (`/api/health` es una ruta que no usa Firebase). En la API, `/api/health`
  devolvía `firebase: "no-carga"` con `ERR_REQUIRE_ESM` y todas las rutas con
  Firebase respondían 500. La app pedía `/api/ajustes/horario` como si
  devolviera un listado y esa ruta devuelve el documento único de ajustes.
- **Validación:** `npm run check` en verde (82 pruebas, cobertura 97 % de
  sentencias). La API se validó de punta a punta contra
  `https://horario-clases-avisos-api.vercel.app` (registro → `PUT
/api/materia` → `PUT /api/bloque` con `07:15`/`08:45` → `GET /api/bloque` →
  `GET /api/auth/yo`, todo 200) y en local con el emulador de Node 26
  (`--no-experimental-require-module`). La verificación en el iPhone queda a
  cargo del equipo (pasos en la respuesta de la IA).
- **Decisión:** (1) la sincronización deja de abortar en el primer fallo: cada
  ruta y la programación de avisos van por separado y el resumen muestra
  cuántos elementos se enviaron y recibieron; (2) `/api/ajustes/horario` se
  trata como documento único (`src/servicios/sincro-guardado.ts`); (3) el
  formulario de bloque y el menú del bloque (long-press) permiten escribir la
  hora exacta en formato `HH:MM`, con atajos de duración de 30/60/90/120
  minutos; (4) aparece el botón «🔔 Activar avisos semanales» en «Semana» y en
  «Ajustes», que pide permiso y programa los avisos de todas las clases.

## Entrada 4 · 2026-11-17 · 404 en sincronización, docente/salón, «sal ya» con clase vigente

- **Propósito:** corregir los problemas reportados desde el iPhone:
  (1) «Sincronizado con errores · Error 404: El bloque no existe» al enviar un
  bloque marcado para borrar que el servidor ya no tiene; (2) no había campos
  para docente y salón al crear una materia; (3) el banner «sal ya» aparecía
  aunque la clase ya hubiera terminado.
- **Evidencia:** mensaje de sincronización con `Error 404` y `enviado 0`;
  formulario sin campos de docente/salón; banner «sal ya» a las 15:00 para una
  clase de las 7:30 ya pasada.
- **Validación:** `npm run check` en verde (82 pruebas).
- **Decisión:** (1) en `enviarPendientes`, un 404 al borrar se trata como
  borrado confirmado: se purga localmente y se cuenta como enviado sin marcar
  error; (2) se agregan campos de docente y salón al formulario de materia
  nueva y se envían en `DatosCrear.nueva`; (3) `BannerSalYa` recibe
  `hayClasePendiente` y solo muestra «sal ya» cuando hay una clase hoy que aún
  no ha terminado (próxima o en curso).

## Entrada 5 · 2026-11-17 · Sal ya solo con clase hoy, salon/docente en tarjeta, edicion completa desde menu

- **Propósito:** corregir problemas reportados desde el iPhone:
  (1) el banner «sal ya» seguía apareciendo aunque la clase ya hubiera pasado;
  (2) la tarjeta del bloque en la grilla no mostraba docente ni salón;
  (3) desde el menú de long-press solo se podían editar las horas, no todo el
  bloque.
- **Evidencia:** banner «sal ya» a las 15:00 para una clase de las 7:30 ya
  terminada; tarjeta solo mostraba nombre y horas; menú solo tenía «Editar
  hora (exacta)».
- **Validación:** `npm run check` en verde (82 pruebas, typecheck + lint +
  formato + pruebas).
- **Decisión:** (1) `BannerSalYa` solo muestra «sal ya» cuando hay una clase
  de HOY que aún no ha terminado (se calcula desde `deHoy` comparando
  `hora_fin` con la hora actual); (2) `TarjetaBloque` en la grilla ahora
  muestra docente y salón además del nombre y las horas; (3) el menú de
  long-press tiene un nuevo botón «✏️ Editar bloque completo» que abre un
  formulario para cambiar materia, horas exactas, docente, salón y color de
  una vez; (4) `FormularioEdicionBloque` es un nuevo componente que precarga
  todos los valores del bloque existente.

## Entrada 6 · 2026-11-17 · Edicion completa desde menu y gestion de materias

- **Propósito:** corregir que al pulsar «Editar bloque completo» no se abriera
  el formulario (el flujo estaba invertido: el menú cerraba antes de abrir el
  formulario), y agregar la posibilidad de editar y borrar materias existentes
  desde una pantalla dedicada.
- **Evidencia:** al pulsar «Editar bloque completo» el menú se cerraba y no
  aparecía ningún formulario; no había forma de editar o borrar una materia
  ya creada.
- **Validación:** `npm run check` en verde (82 pruebas, typecheck + lint +
  formato + pruebas).
- **Decisión:** (1) el menú de long-press ya no llama a `alEditarBloque`
  directamente; solo establece el bloque en `bloqueEditando` y cierra el
  menú, y `FormularioEdicionBloque` se encarga de llamar a `editarBloque`
  al guardar; (2) nueva pantalla `Materias` accesible desde Ajustes
  («📚 Gestionar materias») que lista todas las materias y permite dejar
  presionada cualquiera para editar sus datos (nombre, docente, salón, color)
  o eliminarla con sus bloques; (3) nuevas funciones `editarMateria` y
  `eliminarMateria` en `use-acciones-semana.ts` con validación de nombre
  duplicado.

## Entrada 7 · 2026-11-17 · Quitar boton sincronizar, banner conexion, edicion solo hora

- **Propósito:** corregir problemas reportados desde el iPhone:
  (1) no debería haber botón de sincronizar manual (no está en las rúbricas);
  (2) cuando no hay conexión debe aparecer un aviso rojo persistente que se
  quede hasta que vuelva la conexión; (3) en Semana, al dejar presionado un
  bloque solo debe aparecer «Editar hora (exacta)», no «Editar bloque
  completo» (eso ya está en Gestionar materias); (4) agregar más colores al
  selector.
- **Evidencia:** usuario reportó que no quiere botón de sincronizar manual;
  que el aviso «sin conexión» debería ser persistente; que en Semana solo
  quiere editar la hora.
- **Validación:** `npm run check` en verde (82 pruebas, typecheck + lint +
  formato + pruebas).
- **Decisión:** (1) se eliminó el botón «🔄 Sincronizar ahora» de Ajustes;
  (2) se agregó `BannerConexion` que hace ping a `/api/health` cada 10s y
  muestra un banner rojo persistente cuando no hay conexión, y se quita solo
  cuando vuelve; (3) en `menu-bloque.tsx` se eliminó el botón «Editar bloque
  completo» y solo queda «✏️ Editar hora (exacta)»; (4) se agregaron más
  colores a `PALETA_COLORES` en `validaciones-materia.ts`; (5) se arregló
  `Materias.tsx` para que cargue las materias al montar (antes aparecía vacío
  aunque hubiera materias creadas).

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
6. **Fallo puntual que cancelaba todo.** La IA propuso que la sincronización
   lanzara error al primer fallo de una ruta. Se corrigió: un fallo en
   `/api/materia` no puede impedir que `/api/bloque` y los ajustes se
   sincronicen, y el mensaje final informa cuántos elementos se enviaron y
   recibieron además del error.

> Los integrantes deben agregar aquí sus propios casos con fecha y evidencia
> (captura o enlace al diff) a medida que trabajan.

## Uso por sesión (plantilla)

| Fecha | Tarea | Propósito | Evidencia | Validación | Decisión |
| ----- | ----- | --------- | --------- | ---------- | -------- |
|       |       |           |           |            |          |
