/** Editor manual de horas (HH:MM) para crear o editar un bloque con
 *  precisión (07:15, 07:30…), además de los atajos por duración. */
import { type ReactElement } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  inicio: string;
  fin: string;
  alCambiarInicio: (v: string) => void;
  alCambiarFin: (v: string) => void;
};

export function EditorHoras({
  inicio,
  fin,
  alCambiarInicio,
  alCambiarFin,
}: Props): ReactElement {
  return (
    <View style={styles.base}>
      <Text style={styles.rotulo}>Hora exacta (HH:MM)</Text>
      <View style={styles.fila}>
        <TextInput
          style={styles.campo}
          value={inicio}
          onChangeText={alCambiarInicio}
          placeholder="07:15"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel="Hora de inicio, formato HH:MM"
        />
        <TextInput
          style={styles.campo}
          value={fin}
          onChangeText={alCambiarFin}
          placeholder="08:45"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          accessibilityLabel="Hora de fin, formato HH:MM"
        />
      </View>
      <Text style={styles.nota}>Escribe la hora exacta: 07:15, 07:30, 08:45…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { marginTop: 4 },
  rotulo: { fontWeight: '700' },
  fila: { flexDirection: 'row', gap: 8, marginTop: 4 },
  campo: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
  },
  nota: { color: '#586272', fontSize: 12, marginTop: 4 },
});
