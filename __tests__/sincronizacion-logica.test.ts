/** Reglas puras de sincronización (sección 9.3): LWW y paginación de 500. */
import {
  ganaRemoto,
  siguienteCursor,
  tipoDeEscritura,
} from '../src/logica/sincronizacion-logica';

const LOCAL = (pending = 0, updated_at = '2026-11-01T10:00:00.000Z') => ({
  deleted: 0,
  pending,
  updated_at,
});

const REMOTO = (updated_at: string | null, deleted_at: string | null = null) => ({
  id: 'x',
  updated_at,
  deleted_at,
});

describe('ganaRemoto', () => {
  test('mientras haya cambios locales pendientes, gana el local', () => {
    expect(ganaRemoto(LOCAL(1), REMOTO('2026-11-02T10:00:00.000Z'))).toBe(false);
  });

  test('sin pendientes, gana la última escritura (updated_at del servidor)', () => {
    expect(ganaRemoto(LOCAL(0), REMOTO('2026-11-02T10:00:00.000Z'))).toBe(true);
    expect(
      ganaRemoto(
        LOCAL(0, '2026-11-03T10:00:00.000Z'),
        REMOTO('2026-11-02T10:00:00.000Z'),
      ),
    ).toBe(false);
  });

  test('un documento remoto sin marca de tiempo no pisa el local', () => {
    expect(ganaRemoto(LOCAL(0), REMOTO(null))).toBe(false);
  });
});

describe('siguienteCursor', () => {
  const lote = (n: number) =>
    Array.from({ length: n }, (_, i) =>
      REMOTO(`2026-11-01T00:${String(i % 60).padStart(2, '0')}:00.000Z`),
    );

  test('menos de 500 items → termina y guarda el servidor_ahora en el cursor', () => {
    const r = siguienteCursor(lote(3), null);
    expect(r.continuar).toBe(false);
    expect(r.desde).toBeNull();
  });

  test('500 items → continuar con el updated_at del último', () => {
    const items = lote(500);
    const r = siguienteCursor(items, null);
    expect(r.continuar).toBe(true);
    expect(r.desde).toBe(items[499]?.updated_at ?? null);
  });

  test('cursor igual al último updated_at → no quedar atrapado en bucle', () => {
    const items = lote(500);
    const ultimo = items[499]?.updated_at ?? null;
    const r = siguienteCursor(items, ultimo);
    expect(r.continuar).toBe(false);
  });
});

describe('tipoDeEscritura', () => {
  test('borrado lógico local → DELETE; resto → PUT', () => {
    expect(tipoDeEscritura({ deleted: 1, pending: 1, updated_at: null })).toBe('borrar');
    expect(tipoDeEscritura({ deleted: 0, pending: 1, updated_at: null })).toBe('crear');
  });
});
