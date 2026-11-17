# IA · índice de evidencias

Carpeta `ia/` de este repositorio (la API tiene la suya). Índice de lo exigido
por la hoja «Configuración de IA»:

- [`CONFIGURACION.md`](ia/CONFIGURACION.md) — qué riesgo cubre cada barrera,
  sus límites y los ajustes hechos.
- [`PRUEBAS-CONTENCION.md`](ia/PRUEBAS-CONTENCION.md) — las 10 pruebas con
  prompt exacto, resultado, captura y repetición.
- [`BITACORA.md`](ia/BITACORA.md) — propósito, evidencia, validación y decisión
  de cada uso de IA, con ≥ 3 casos en que se rechazó o corrigió lo propuesto.
- [`INYECCION.md`](ia/INYECCION.md) — informe con 3 ataques de inyección y cómo
  los frena esta configuración (reto de excelencia).
- `evidencias/` — capturas de las pruebas, salida de `npm run check`, cobertura
  y enlace a la CI en verde (se agrega al ejecutar).

Otros archivos relacionados (fuera de `ia/`):

- `AGENTS.md` (≤ 100 líneas) y `CLAUDE.md` → solo `@AGENTS.md`.
- `.claude/settings.json` (permisos + sandbox) y `opencode.json` (misma política).
- `env.example` con valores falsos.
- `.github/workflows/ci.yml` — `npm ci → check → build → audit` + gitleaks.
- `docs/trampa.md` — trampa de inyección para la prueba 10.

El **primer commit** contiene: `AGENTS.md`, la configuración de la IA,
`.gitignore`, `env.example` y los scripts de calidad. El historial lo comprueba.
