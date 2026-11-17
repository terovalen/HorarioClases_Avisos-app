/** Menú de un bloque (alternativa por botón a los gestos): editar todo el
 *  bloque (materia, horas, docente, salón, color), ajustar el fin o
 *  eliminar el bloque. */
import { useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatearHora, minutosAHora, minutosDelDia, parseHora } from '../logica/tiempo';
import type { BloqueConMateria } from '../logica/tipos';
import type { Resultado } from '../hooks/use-semana';
import { EditorHoras } from './editor-horas';

type Props = {
  bloque: BloqueConMateria | null;
  alEliminar: (id: string) => Promise<void>;
  alAjustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  alEditarHoras: (
    id: string,
    hora_inicio: string,
    hora_fin: string,
  ) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Botón de acción del menú con etiqueta accesible. */
function TextoError({ mensaje }: { mensaje: string }): ReactElement {
  return (
    <Text role="alert" style={styles.error}>
      {mensaje}
    </Text>
  );
}

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

/** Panel de edición manual de las horas (07:15, 08:45…). */
function PanelEdicion(props: {
  inicio: string;
  fin: string;
  alCambiarInicio: (v: string) => void;
  alCambiarFin: (v: string) => void;
  alGuardar: () => void;
  alCancelar: () => void;
}): ReactElement {
  return (
    <>
      <EditorHoras
        inicio={props.inicio}
        fin={props.fin}
        alCambiarInicio={props.alCambiarInicio}
        alCambiarFin={props.alCambiarFin}
      />
      <BotonAccion
        texto="Guardar horas"
        etiqueta="Guardar las horas escritas"
        alPulsar={props.alGuardar}
      />
      <BotonAccion
        texto="Cancelar edición"
        etiqueta="Cancelar la edición de horas"
        alPulsar={props.alCancelar}
      />
    </>
  );
}

/** Acciones rápidas del menú. */
function AccionesRapidas(props: {
  alAbrirEditor: () => void;
  alCambiarFinDelta: (delta: number) => void;
  alEliminar: () => void;
}): ReactElement {
  return (
    <>
      <BotonAccion
        texto="✏️ Editar hora (exacta)"
        etiqueta="Editar la hora de inicio y de fin"
        alPulsar={props.alAbrirEditor}
      />
      <BotonAccion
        texto="Fin +30 min"
        etiqueta="Extender fin 30 minutos"
        alPulsar={() => props.alCambiarFinDelta(30)}
      />
      <BotonAccion
        texto="Fin −30 min"
        etiqueta="Acortar fin 30 minutos"
        alPulsar={() => props.alCambiarFinDelta(-30)}
      />
      <BotonAccion
        texto="Eliminar bloque"
        etiqueta="Eliminar bloque"
        peligro
        alPulsar={props.alEliminar}
      />
    </>
  );
}

/** Estado del menú (errores, modo edición y horas escritas). */
function useEstadoMenu() {
  const [errores, setErrores] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  return { errores, setErrores, editando, setEditando, inicio, setInicio, fin, setFin };
}

/** Acciones de cambiar fin y editar horas. */
function useAccionesHoras(
  bloque: BloqueConMateria | null,
  estado: ReturnType<typeof useEstadoMenu>,
  alAjustarFin: (id: string, hora_fin: string) => Promise<Resultado>,
  alEditarHoras: (
    id: string,
    hora_inicio: string,
    hora_fin: string,
  ) => Promise<Resultado>,
  alCerrar: () => void,
) {
  const { setErrores, setInicio, setFin, setEditando } = estado;

  const cambiarFin = async (delta: number): Promise<void> => {
    if (!bloque) return;
    const actual = minutosDelDia(parseHora(bloque.bloque.hora_fin) ?? { h: 0, m: 0 });
    const r = await alAjustarFin(
      bloque.bloque.id,
      formatearHora(minutosAHora(actual + delta)),
    );
    if (!r.ok) setErrores(r.errores);
    else alCerrar();
  };

  const abrirEditor = (): void => {
    if (!bloque) return;
    setErrores([]);
    setInicio(bloque.bloque.hora_inicio);
    setFin(bloque.bloque.hora_fin);
    setEditando(true);
  };

  const guardarHoras = async (): Promise<void> => {
    if (!bloque) return;
    const r = await alEditarHoras(
      bloque.bloque.id,
      estado.inicio.trim(),
      estado.fin.trim(),
    );
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    alCerrar();
  };

  return { cambiarFin, abrirEditor, guardarHoras };
}

/** Acción de eliminar. */
function useAccionEliminar(
  bloque: BloqueConMateria | null,
  alEliminar: (id: string) => Promise<void>,
  alCerrar: () => void,
) {
  const eliminarActual = (): void => {
    if (!bloque) return;
    void alEliminar(bloque.bloque.id).then(alCerrar);
  };

  return { eliminarActual };
}

/** Cuerpo del menú (sin el wrapper Modal). */
function CuerpoMenuBloque(props: {
  bloque: BloqueConMateria;
  estado: ReturnType<typeof useEstadoMenu>;
  accionesHoras: ReturnType<typeof useAccionesHoras>;
  accionEliminar: ReturnType<typeof useAccionEliminar>;
  alCerrar: () => void;
}): ReactElement {
  const { bloque, estado, accionesHoras, accionEliminar, alCerrar } = props;
  return (
    <View style={styles.caja}>
      <Text style={styles.titulo}>
        {`${bloque.bloque.hora_inicio}–${bloque.bloque.hora_fin}`}
      </Text>
      {estado.errores.map((e) => (
        <TextoError key={e} mensaje={e} />
      ))}
      {estado.editando ? (
        <PanelEdicion
          inicio={estado.inicio}
          fin={estado.fin}
          alCambiarInicio={estado.setInicio}
          alCambiarFin={estado.setFin}
          alGuardar={() => void accionesHoras.guardarHoras()}
          alCancelar={() => estado.setEditando(false)}
        />
      ) : (
        <AccionesRapidas
          alAbrirEditor={accionesHoras.abrirEditor}
          alCambiarFinDelta={(delta) => void accionesHoras.cambiarFin(delta)}
          alEliminar={accionEliminar.eliminarActual}
        />
      )}
      <BotonAccion texto="Cerrar" etiqueta="Cerrar menú" alPulsar={alCerrar} />
    </View>
  );
}

export function MenuBloque({
  bloque,
  alEliminar,
  alAjustarFin,
  alEditarHoras,
  alCerrar,
}: Props): ReactElement {
  const estado = useEstadoMenu();
  const accionesHoras = useAccionesHoras(
    bloque,
    estado,
    alAjustarFin,
    alEditarHoras,
    alCerrar,
  );
  const accionEliminar = useAccionEliminar(bloque, alEliminar, alCerrar);

  if (!bloque) return <Modal visible={false} />;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={alCerrar}>
      <View style={styles.velo}>
        <CuerpoMenuBloque
          bloque={bloque}
          estado={estado}
          accionesHoras={accionesHoras}
          accionEliminar={accionEliminar}
          alCerrar={alCerrar}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  caja: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 },
  titulo: { fontSize: 16, fontWeight: '800' },
  error: { color: '#b91c1c', fontWeight: '600' },
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
