/** Cabecera de la semana: selector de días con gesto de doble toque «hoy».
 *  Accesibilidad: botones ‹ › y «Hoy» equivalentes al doble toque. */
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';
import { NOMBRES_DIAS, diaDeFecha } from '../logica/tiempo';

type Props = {
  dia: number;
  alCambiar: (dia: number) => void;
  alCambiarDelta: (delta: number) => void;
};

export function CabeceraSemana({ dia, alCambiar, alCambiarDelta }: Props): ReactElement {
  const dobleToque = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onStart(() => alCambiar(diaDeFecha(new Date())));

  return (
    <View>
      <GestureDetector gesture={dobleToque}>
        <Text style={styles.titulo}>Horario · doble toque para volver a «hoy»</Text>
      </GestureDetector>
      <View style={styles.fila}>
        <Pressable
          style={styles.flecha}
          onPress={() => alCambiarDelta(-1)}
          accessibilityRole="button"
          accessibilityLabel="Día anterior"
        >
          <Text style={styles.flechaTexto}>‹</Text>
        </Pressable>
        {NOMBRES_DIAS.map((nombre, indice) => (
          <Pressable
            key={nombre}
            style={[styles.chip, dia === indice + 1 && styles.chipActivo]}
            onPress={() => alCambiar(indice + 1)}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${nombre}`}
          >
            <Text style={dia === indice + 1 ? styles.chipActivoTexto : styles.chipTexto}>
              {nombre.slice(0, 2)}
            </Text>
          </Pressable>
        ))}
        <Pressable
          style={styles.flecha}
          onPress={() => alCambiarDelta(1)}
          accessibilityRole="button"
          accessibilityLabel="Día siguiente"
        >
          <Text style={styles.flechaTexto}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 17, fontWeight: '800', paddingVertical: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f3f6',
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActivo: { backgroundColor: '#2563eb' },
  chipTexto: { color: '#374151', fontWeight: '700' },
  chipActivoTexto: { color: '#fff', fontWeight: '700' },
  flecha: { paddingHorizontal: 8, minHeight: 40, justifyContent: 'center' },
  flechaTexto: { fontSize: 22, color: '#2563eb', fontWeight: '800' },
});
