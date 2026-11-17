/** Aviso «sal ya» según la distancia al campus (RF-06).
 *
 *  Solo se muestra cuando hay una clase hoy que aún no termina (próxima o en
 *  curso). Si la clase ya pasó, no tiene sentido decir «sal ya». */
import { StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import { convieneSalirYa } from '../logica/distancia';

type Props = {
  distanciaMetros: number | null;
  minutosAviso: number;
  campusConfigurado: boolean;
  /** true cuando hay una clase hoy que aún no ha terminado. */
  hayClasePendiente: boolean;
};

export function BannerSalYa({
  distanciaMetros,
  minutosAviso,
  campusConfigurado,
  hayClasePendiente,
}: Props): ReactElement | null {
  if (!campusConfigurado) {
    return (
      <View style={[styles.banner, styles.gris]}>
        <Text style={styles.texto}>
          Configura la ubicación del campus en Ajustes para avisos «sal ya».
        </Text>
      </View>
    );
  }
  if (!hayClasePendiente) {
    return (
      <View style={[styles.banner, styles.gris]}>
        <Text style={styles.texto}>
          No tienes clases hoy pendientes: no aplica aviso «sal ya».
        </Text>
      </View>
    );
  }
  if (distanciaMetros === null) return null;
  const salir = convieneSalirYa(distanciaMetros, minutosAviso);
  return (
    <View
      style={[styles.banner, salir ? styles.rojo : styles.verde]}
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.texto}>
        {salir ? '🚨 Sal ya: estás a ' : '✅ Todo bien: estás a '}
        {Math.round(distanciaMetros)} m del campus (margen {minutosAviso} min).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 12, padding: 12 },
  gris: { backgroundColor: '#e5e7eb' },
  rojo: { backgroundColor: '#fecaca' },
  verde: { backgroundColor: '#dcfce7' },
  texto: { color: '#1f2937', fontWeight: '600' },
});
