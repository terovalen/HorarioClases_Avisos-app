/** Distancia al campus y margen del aviso «sal ya» (RF-06).
 *
 *  El margen se define como la distancia que se camina en los
 *  `minutos_aviso` previos a la clase (velocidad de caminata por defecto
 *  1,2 m/s): si estás más lejos que eso, conviene salir ya. */
export const VELOCIDAD_CAMINATA_MPS = 1.2;

const RADIO_TIERRA_M = 6_371_000;

/** Distancia haversine en metros entre dos coordenadas. */
export function haversineMetros(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Distancia en metros que se cubre caminando N minutos. */
export function margenMetros(
  minutosAviso: number,
  velocidadMps: number = VELOCIDAD_CAMINATA_MPS,
): number {
  return Math.round(minutosAviso * 60 * velocidadMps);
}

/** ¿Está el usuario más lejos del campus que el margen configurado? */
export function convieneSalirYa(distanciaMetros: number, minutosAviso: number): boolean {
  return distanciaMetros > margenMetros(minutosAviso);
}
