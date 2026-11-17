/** Estado de carga, vacío o error con reintento, accesible. */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import type { EstadoPantalla } from '../logica/tipos';

type Props = {
  estado: EstadoPantalla;
  mensaje?: string;
  alReintentar?: () => void;
};

export function EstadoCarga({ estado, mensaje, alReintentar }: Props): ReactElement {
  if (estado === 'cargando') {
    return (
      <View style={[styles.base, styles.centro]} testID="estado-cargando">
        <ActivityIndicator size="large" />
        <Text style={styles.texto}>Cargando…</Text>
      </View>
    );
  }
  if (estado === 'error') {
    return (
      <View style={[styles.base, styles.centro]} testID="estado-error">
        <Text style={styles.texto}>{mensaje ?? 'Ocurrió un error.'}</Text>
        {alReintentar ? (
          <Pressable
            style={styles.boton}
            onPress={alReintentar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar"
          >
            <Text style={styles.botonTexto}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  return (
    <View style={[styles.base, styles.centro]} testID="estado-vacio">
      <Text style={styles.texto}>{mensaje ?? 'No hay datos todavía.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: 16 },
  centro: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  texto: { color: '#374151', textAlign: 'center' },
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  botonTexto: { color: '#fff', fontWeight: '700' },
});
