/** Distancia al campus y margen «sal ya» (RF-06). */
import { convieneSalirYa, haversineMetros, margenMetros } from '../src/logica/distancia';

describe('haversineMetros', () => {
  test('misma coordenada → 0', () => {
    expect(haversineMetros(4.71, -74.07, 4.71, -74.07)).toBe(0);
  });

  test('0,01° de latitud ≈ 1,11 km', () => {
    const distancia = haversineMetros(4.7, -74.07, 4.71, -74.07);
    expect(distancia).toBeGreaterThan(1050);
    expect(distancia).toBeLessThan(1150);
  });

  test('0,01° de longitud en el ecuador ≈ 1,11 km', () => {
    const distancia = haversineMetros(0, -74.07, 0, -74.06);
    expect(distancia).toBeGreaterThan(1050);
    expect(distancia).toBeLessThan(1150);
  });
});

describe('margen y aviso «sal ya»', () => {
  test('15 min a 1,2 m/s ≈ 1080 m', () => {
    expect(margenMetros(15)).toBe(1080);
  });

  test('criterio del RF-06: más lejos que el margen → salir ya', () => {
    expect(convieneSalirYa(2000, 15)).toBe(true);
    expect(convieneSalirYa(500, 15)).toBe(false);
    expect(convieneSalirYa(1080, 15)).toBe(false); // exactamente el margen
  });
});
