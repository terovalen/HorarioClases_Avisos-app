/** Selector de materia del formulario: una existente o una nueva con
 *  nombre, docente, salón y color. */
import { type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PALETA_COLORES } from '../logica/validaciones-materia';
import type { Materia } from '../logica/tipos';

type PropsSelector = {
  materias: Materia[];
  materiaId: string;
  alCambiar: (id: string) => void;
};

export function SelectorMateria({
  materias,
  materiaId,
  alCambiar,
}: PropsSelector): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>Materia</Text>
      <ScrollView horizontal style={styles.opciones}>
        {materias.map((m) => (
          <Pressable
            key={m.id}
            style={[styles.opcion, materiaId === m.id && styles.opcionActiva]}
            onPress={() => alCambiar(m.id)}
            accessibilityRole="button"
            accessibilityLabel={`Usar ${m.nombre}`}
          >
            <Text style={styles.opcionTexto}>{m.nombre}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.opcion, materiaId === 'nueva' && styles.opcionActiva]}
          onPress={() => alCambiar('nueva')}
          accessibilityRole="button"
          accessibilityLabel="Crear materia nueva"
        >
          <Text style={styles.opcionTexto}>+ Nueva</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

type PropsNueva = {
  nombre: string;
  alCambiarNombre: (v: string) => void;
  docente: string | null;
  alCambiarDocente: (v: string) => void;
  salon: string | null;
  alCambiarSalon: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
};

export function CamposNuevaMateria(props: PropsNueva): ReactElement {
  return (
    <View>
      <TextInput
        style={styles.campo}
        placeholder="Nombre de la materia"
        value={props.nombre}
        onChangeText={props.alCambiarNombre}
        accessibilityLabel="Nombre de la materia"
      />
      <TextInput
        style={styles.campo}
        placeholder="Docente (opcional)"
        value={props.docente ?? ''}
        onChangeText={props.alCambiarDocente}
        accessibilityLabel="Docente de la materia"
      />
      <TextInput
        style={styles.campo}
        placeholder="Salón (opcional)"
        value={props.salon ?? ''}
        onChangeText={props.alCambiarSalon}
        accessibilityLabel="Salón de la materia"
      />
      <View style={styles.fila}>
        {PALETA_COLORES.map((c, i) => (
          <Pressable
            key={`color-${i}`}
            onPress={() => props.alCambiarColor(c)}
            style={[
              styles.color,
              { backgroundColor: c },
              props.color === c && styles.colorActivo,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Color ${c}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rotulo: { fontWeight: '700', marginTop: 4 },
  opciones: { flexDirection: 'row' },
  fila: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opcion: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f3f6',
    minHeight: 40,
    justifyContent: 'center',
  },
  opcionActiva: { backgroundColor: '#2563eb' },
  opcionTexto: { fontWeight: '700', color: '#1f2937' },
  campo: {
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
  },
  color: { width: 36, height: 36, borderRadius: 18 },
  colorActivo: { borderWidth: 3, borderColor: '#1f2937' },
});
