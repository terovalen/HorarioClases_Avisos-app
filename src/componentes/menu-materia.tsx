/** Menú de una materia (alternativa por botón a los gestos): editar sus
 *  datos (nombre, docente, salón, color) o eliminarla con sus bloques. */
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState, type ReactElement } from 'react';
import type { Materia } from '../logica/tipos';
import type { Resultado } from '../hooks/use-semana';

type Props = {
  materia: Materia;
  alEditar: (datos: {
    nombre: string;
    docente: string | null;
    salon: string | null;
    color: string;
  }) => Promise<Resultado>;
  alEliminar: (id: string) => Promise<void>;
  alCerrar: () => void;
};

/** Botón de acción del menú con etiqueta accesible. */
function BotonAccion({
  texto,
  etiqueta,
  peligro,
  alPulsar,
}: {
  texto: string;
  etiqueta: string;
  peligro?: boolean;
  alPulsar: () => void;
}): ReactElement {
  return (
    <Pressable
      style={[styles.boton, peligro && styles.peligro]}
      onPress={alPulsar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      <Text style={[styles.texto, peligro && styles.textoPeligro]}>{texto}</Text>
    </Pressable>
  );
}

/** Campo de texto de edición. */
function CampoTexto(props: {
  rotulo: string;
  valor: string;
  alCambiar: (v: string) => void;
  placeholder: string;
  etiquetaAccesibilidad: string;
}): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>{props.rotulo}</Text>
      <TextInput
        style={styles.campo}
        value={props.valor}
        onChangeText={props.alCambiar}
        placeholder={props.placeholder}
        accessibilityLabel={props.etiquetaAccesibilidad}
      />
    </>
  );
}

/** Selector de color de la materia. */
function SelectorColor(props: {
  color: string;
  alCambiar: (v: string) => void;
}): ReactElement {
  const COLORES = [
    '#2563eb',
    '#dc2626',
    '#16a34a',
    '#ca8a04',
    '#4f46e5',
    '#db2777',
    '#0891b2',
    '#6366f1',
    '#a21caf',
    '#eab308',
    '#15803d',
    '#b45309',
  ];
  return (
    <>
      <Text style={styles.rotulo}>Color</Text>
      <View style={styles.filaColores}>
        {COLORES.map((c, i) => (
          <Pressable
            key={`color-${i}`}
            onPress={() => props.alCambiar(c)}
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
    </>
  );
}

/** Panel de edición de los datos de una materia. */
function PanelEdicion(props: {
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
  alCambiarNombre: (v: string) => void;
  alCambiarDocente: (v: string) => void;
  alCambiarSalon: (v: string) => void;
  alCambiarColor: (v: string) => void;
  alGuardar: () => void;
  alCancelar: () => void;
}): ReactElement {
  return (
    <>
      <CampoTexto
        rotulo="Nombre"
        valor={props.nombre}
        alCambiar={props.alCambiarNombre}
        placeholder="Nombre de la materia"
        etiquetaAccesibilidad="Nombre de la materia"
      />
      <CampoTexto
        rotulo="Docente (opcional)"
        valor={props.docente ?? ''}
        alCambiar={props.alCambiarDocente}
        placeholder="Docente"
        etiquetaAccesibilidad="Docente de la materia"
      />
      <CampoTexto
        rotulo="Salón (opcional)"
        valor={props.salon ?? ''}
        alCambiar={props.alCambiarSalon}
        placeholder="Salón"
        etiquetaAccesibilidad="Salón de la materia"
      />
      <SelectorColor color={props.color} alCambiar={props.alCambiarColor} />
      <BotonAccion
        texto="Guardar"
        etiqueta="Guardar cambios de la materia"
        alPulsar={props.alGuardar}
      />
      <BotonAccion
        texto="Cancelar"
        etiqueta="Cancelar edición de la materia"
        alPulsar={props.alCancelar}
      />
    </>
  );
}

/** Cuerpo del menú (sin el wrapper Modal). */
function CuerpoMenuMateria(props: {
  materia: Materia;
  estado: ReturnType<typeof useEstadoMenuMateria>;
  acciones: ReturnType<typeof useAccionesMenuMateria>;
  alCerrar: () => void;
}): ReactElement {
  const { materia, estado, acciones, alCerrar } = props;
  return (
    <View style={styles.caja}>
      <Text style={styles.titulo}>{materia.nombre}</Text>
      {estado.errores.map((e) => (
        <Text key={e} role="alert" style={styles.error}>
          {e}
        </Text>
      ))}
      {estado.editando ? (
        <PanelEdicion
          nombre={estado.nombre}
          docente={estado.docente}
          salon={estado.salon}
          color={estado.color}
          alCambiarNombre={estado.setNombre}
          alCambiarDocente={estado.setDocente}
          alCambiarSalon={estado.setSalon}
          alCambiarColor={estado.setColor}
          alGuardar={() => void acciones.guardar()}
          alCancelar={() => estado.setEditando(false)}
        />
      ) : (
        <>
          <BotonAccion
            texto="✏️ Editar materia"
            etiqueta="Editar nombre, docente, salón y color"
            alPulsar={acciones.abrirEditor}
          />
          <BotonAccion
            texto="🗑️ Eliminar materia"
            etiqueta="Eliminar materia y sus bloques"
            peligro
            alPulsar={acciones.eliminar}
          />
          <BotonAccion texto="Cerrar" etiqueta="Cerrar menú" alPulsar={alCerrar} />
        </>
      )}
    </View>
  );
}

/** Estado del menú de materia (errores, modo edición y datos escritos). */
function useEstadoMenuMateria() {
  const [errores, setErrores] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [docente, setDocente] = useState<string | null>(null);
  const [salon, setSalon] = useState<string | null>(null);
  const [color, setColor] = useState('#2563eb');
  return {
    errores,
    setErrores,
    editando,
    setEditando,
    nombre,
    setNombre,
    docente,
    setDocente,
    salon,
    setSalon,
    color,
    setColor,
  };
}

/** Acciones del menú de materia. */
function useAccionesMenuMateria(
  materia: Materia,
  estado: ReturnType<typeof useEstadoMenuMateria>,
  alEditar: (datos: {
    nombre: string;
    docente: string | null;
    salon: string | null;
    color: string;
  }) => Promise<Resultado>,
  alEliminar: (id: string) => Promise<void>,
  alCerrar: () => void,
) {
  const { setErrores, setEditando, setNombre, setDocente, setSalon, setColor } = estado;

  const abrirEditor = (): void => {
    setErrores([]);
    setNombre(materia.nombre);
    setDocente(materia.docente);
    setSalon(materia.salon);
    setColor(materia.color);
    setEditando(true);
  };

  const guardar = async (): Promise<void> => {
    const r = await alEditar({
      nombre: estado.nombre.trim(),
      docente: estado.docente?.trim() ?? null,
      salon: estado.salon?.trim() ?? null,
      color: estado.color,
    });
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    alCerrar();
  };

  const eliminar = (): void => {
    Alert.alert(
      'Eliminar materia',
      `¿Eliminar "${materia.nombre}" y todos sus bloques?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void alEliminar(materia.id).then(alCerrar),
        },
      ],
    );
  };

  return { abrirEditor, guardar, eliminar };
}

export function MenuMateria({
  materia,
  alEditar,
  alEliminar,
  alCerrar,
}: Props): ReactElement {
  const estado = useEstadoMenuMateria();
  const acciones = useAccionesMenuMateria(
    materia,
    estado,
    alEditar,
    alEliminar,
    alCerrar,
  );

  return (
    <Modal visible animationType="fade" transparent onRequestClose={alCerrar}>
      <View style={styles.velo}>
        <View style={styles.caja}>
          <CuerpoMenuMateria
            materia={materia}
            estado={estado}
            acciones={acciones}
            alCerrar={alCerrar}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  caja: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  titulo: { fontSize: 18, fontWeight: '800' },
  rotulo: { fontWeight: '700', marginTop: 8 },
  campo: {
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
  },
  error: { color: '#b91c1c', fontWeight: '600' },
  filaColores: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  color: { width: 32, height: 32, borderRadius: 16 },
  colorActivo: { borderWidth: 3, borderColor: '#1f2937' },
  boton: {
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  texto: { fontWeight: '700', color: '#1f2937' },
  peligro: { backgroundColor: '#fee2e2' },
  textoPeligro: { color: '#b91c1c' },
});
