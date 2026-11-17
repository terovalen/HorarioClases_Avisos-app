# 38 · Horario de clases con avisos · App móvil

Horario semanal con detección de cruces y avisos antes de cada clase, según qué
tan lejos estés del campus. Proyecto 38 de **Desarrollo Móvil IeS 2026-2**
(Expo + React Native + TypeScript + Expo Router), con API propia en Vercel
(repo aparte `38-horario-de-clases-api`).

## Capturas

_(Agregar aquí las capturas: pantalla Hoy con cuenta regresiva, vista semanal
con gestos, formulario de materia, ajustes.)_

## Puesta en marcha

```bash
npm install
cp env.example .env        # y poner la URL pública de la API (NO es secreta)
npm run start              # desarrollo
npm run check              # typecheck + lint + formato + pruebas con cobertura
npm run build              # export web (CI)
```

El APK se genera con **EAS Build** (`eas build -p android --profile preview`)
siguiendo `../Clase-Generar-APK-EAS-Build.pdf`. Probar en un dispositivo físico:
muchos sensores no existen en el emulador.

## Estructura

```text
app/                     pantallas (Expo Router): Hoy, Semana, materia/nueva, ajustes, login
src/db/                  abrir SQLite + migraciones (PRAGMA user_version)
src/repositorios/        SQL parametrizado (materias, bloques, ajustes)
src/logica/              lógica de negocio PURA (cruces, próxima clase, avisos, distancia)
src/servicios/           notificaciones, sincronización con la API, sesión
src/api/                 cliente HTTP (Bearer + refresco único) y tokens en SecureStore
src/sensores/            hooks de sensores con alternativa
src/componentes/         UI reutilizable y accesible
src/hooks/               hooks de datos de pantalla
ia/                      evidencias de la configuración de IA
```

## Qué cumple

- **RF-01** CRUD de materias y bloques (SQLite con UUID compartido con Firestore,
  borrado lógico y `pending` para sincronizar).
- **RF-02** Vista «hoy» (cuenta regresiva) y vista semanal por días.
- **RF-03** Cruces rechazados en la app (lógica pura) y de nuevo en el servidor (409).
- **RF-04** Avisos semanales N minutos antes; se reprograman al editar y se
  cancelan al eliminar la materia.
- **RF-05** Próxima clase con cambio de semana (domingo por la noche → lunes).
- **RF-06** Aviso «sal ya»: margen = metros que se caminan en `minutos_aviso`.

### Gestos (con alternativa por botón, accesible)

| Gesto                                               | Acción                   | Botón equivalente            |
| --------------------------------------------------- | ------------------------ | ---------------------------- |
| Mantener presionado en un hueco                     | Crear bloque en esa hora | «＋ Crear bloque»            |
| Arrastre vertical en el borde inferior de un bloque | Cambiar hora de fin      | Menú del bloque: fin ±30 min |
| Deslizar horizontal                                 | Cambiar de día           | Botones ‹ ›                  |
| Doble toque                                         | Volver a «hoy»           | Chips de día                 |

### Sensores y capacidades (con alternativa)

| Capacidad                      | Uso                                             | Si no está disponible     |
| ------------------------------ | ----------------------------------------------- | ------------------------- |
| expo-notifications (principal) | Aviso semanal repetitivo                        | Aviso solo en la pantalla |
| expo-location                  | Distancia al campus → «sal ya»                  | Aviso fijo por hora       |
| Accelerometer (sacudir)        | Leer la próxima clase en voz alta (expo-speech) | Botón 🔊                  |
| expo-haptics                   | Vibración al crear o mover un bloque            | —                         |

Todas con `isAvailableAsync()`/verificación de permiso, permisos pedidos solo al
activar la función (Ajustes o botón) y suscripciones canceladas al salir.

## Justificación de dependencias

Todas las dependencias son del stack del curso o del documento del proyecto:
`expo-sqlite` (datos locales), `expo-secure-store` (tokens cifrados),
`expo-notifications` (avisos, capacidad principal), `expo-location` (distancia),
`expo-sensors` + `expo-haptics` + `expo-speech` (segundo sensor y opción de voz),
`react-native-gesture-handler` + `react-native-reanimated` + `worklets`
(gestos obligatorios), `expo-router` (navegación), `expo-crypto` (UUID del
cliente, mismo id en SQLite y Firestore). En dev: `jest-expo` +
`@testing-library/react-native` (pruebas), `eslint-config-expo` (calidad),
`husky` + `lint-staged` (calidad en cada commit), `prettier` (formato).
Ninguna dependencia fue inventada por la IA: cada paquete existe en
npmjs.com con mantenimiento activo.

## Seguridad

- La app **no contiene** `firebaseConfig` ni claves: el login lo hace la API.
- Tokens en `expo-secure-store`, nunca en `AsyncStorage`.
- `EXPO_PUBLIC_API_URL` es pública por diseño; nada más viaja en el APK.
- HTTPS en todas las llamadas; sin `localhost` en el APK.
- Permisos mínimos en `app.json` (ubicación, notificaciones, vibración).
- Ver lista completa en la lista de verificación de la sección 14 del documento.

## IA

Configuración propia versionada desde el **primer commit**: `AGENTS.md`,
`CLAUDE.md`, `.claude/settings.json`, `opencode.json`, `env.example`,
scripts de calidad y carpeta `ia/` (ver `IA.md`).
