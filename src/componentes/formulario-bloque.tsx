/** Modal para crear un bloque en el hueco elegido (alternativa accesible al
 *  long-press): materia nueva o existente + horas. Muestra los errores. */
import { useState, type ReactElement } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  formatearHora,
  minutosAHora,
  minutosDelDia,
  type HoraMin,
} from '../logica/tiempo';
import { PALETA_COLORES } from '../logica/validaciones-materia';
import type { Materia } from '../logica/tipos';
import type { DatosCrear, Resultado } from '../hooks/use-semana';

type Props = {
  visible: boolean;
  dia: number;
  hora: number;
  minuto: number;
  materias: Materia[];
  alGuardar: (datos: DatosCrear) => Promise<Resultado>;
  alCerrar: () => void;
};

const DURACIONES = [30, 60, 90, 120];

/** Arma el cuerpo de la petición según se use una materia nueva o existente. */
function armarDatos(
  dia: number,
  inicio: HoraMin,
  duracion: number,
  materiaId: string,
  nombre: string,
  color: string,
): DatosCrear {
  const datos: DatosCrear = {
    dia,
    hora_inicio: formatearHora(inicio),
    hora_fin: formatearHora(minutosAHora(minutosDelDia(inicio) + duracion)),
  };
  if (materiaId === 'nueva') {
    datos.nueva = { nombre, docente: null, salon: null, color };
  } else {
    datos.materia_id = materiaId;
  }
  return datos;
}

function SelectorMateria({
  materias,
  materiaId,
  alCambiar,
}: {
  materias: Materia[];
  materiaId: string;
  alCambiar: (id: string) => void;
}): ReactElement {
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

function SelectorDuracion({
  duracion,
  alCambiar,
}: {
  duracion: number;
  alCambiar: (d: number) => void;
}): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>Duración</Text>
      <View style={styles.fila}>
        {DURACIONES.map((d) => (
          <Pressable
            key={d}
            style={[styles.opcion, duracion === d && styles.opcionActiva]}
            onPress={() => alCambiar(d)}
            accessibilityRole="button"
            accessibilityLabel={`Duración ${d} minutos`}
          >
            <Text style={styles.opcionTexto}>{d} min</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function PieFormulario({
  ocupado,
  alGuardar,
  alCerrar,
}: {
  ocupado: boolean;
  alGuardar: () => void;
  alCerrar: () => void;
}): ReactElement {
  return (
    <View style={styles.fila}>
      <Pressable
        style={styles.botonPrincipal}
        onPress={alGuardar}
        disabled={ocupado}
        accessibilityRole="button"
        accessibilityLabel="Guardar bloque"
      >
        <Text style={styles.botonPrincipalTexto}>
          {ocupado ? 'Guardando…' : 'Guardar'}
        </Text>
      </Pressable>
      <Pressable
        style={styles.botonSecundario}
        onPress={alCerrar}
        accessibilityRole="button"
        accessibilityLabel="Cancelar"
      >
        <Text style={styles.botonSecundarioTexto}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function EncabezadoFormulario({
  dia,
  inicio,
}: {
  dia: number;
  inicio: HoraMin;
}): ReactElement {
  return (
    <>
      <Text style={styles.titulo}>Nuevo bloque</Text>
      <Text style={styles.sub}>
        {diaTexto(dia)} a las {formatearHora(inicio)} · mantén presionado un hueco para
        crear aquí (o usa este formulario).
      </Text>
    </>
  );
}

/** Controles del formulario: materia (nueva o existente), duración, errores y
 *  botones. Presentacional; el estado vive en FormularioBloque. */
function CuerpoFormulario(props: {
  materias: Materia[];
  materiaId: string;
  alCambiarMateria: (id: string) => void;
  nombre: string;
  alCambiarNombre: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
  duracion: number;
  alCambiarDuracion: (d: number) => void;
  errores: string[];
  ocupado: boolean;
  alGuardar: () => void;
  alCerrar: () => void;
}): ReactElement {
  return (
    <>
      <SelectorMateria
        materias={props.materias}
        materiaId={props.materiaId}
        alCambiar={props.alCambiarMateria}
      />
      {props.materiaId === 'nueva' ? (
        <CamposNuevaMateria
          nombre={props.nombre}
          alCambiarNombre={props.alCambiarNombre}
          color={props.color}
          alCambiarColor={props.alCambiarColor}
        />
      ) : null}
      <SelectorDuracion duracion={props.duracion} alCambiar={props.alCambiarDuracion} />
      <ListaErrores errores={props.errores} />
      <PieFormulario
        ocupado={props.ocupado}
        alGuardar={props.alGuardar}
        alCerrar={props.alCerrar}
      />
    </>
  );
}

/** Envía los datos y decide si cerrar el modal o mostrar los errores. */
async function enviarBloque(
  datos: DatosCrear,
  alGuardar: (d: DatosCrear) => Promise<Resultado>,
  alCerrar: () => void,
  ocupar: (v: boolean) => void,
  alErrores: (e: string[]) => void,
): Promise<void> {
  ocupar(true);
  alErrores([]);
  const resultado = await alGuardar(datos);
  ocupar(false);
  if (resultado.ok) {
    alCerrar();
    return;
  }
  alErrores(resultado.errores);
}

export function FormularioBloque({
  visible,
  dia,
  hora,
  minuto,
  materias,
  alGuardar,
  alCerrar,
}: Props): ReactElement {
  const [materiaId, setMateriaId] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<string>(PALETA_COLORES[0] ?? '#2563eb');
  const [errores, setErrores] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const inicio = minutosAHora(hora * 60 + minuto);
  const [duracion, setDuracion] = useState(60);

  const guardar = (): void => {
    void enviarBloque(
      armarDatos(dia, inicio, duracion, materiaId, nombre, color),
      alGuardar,
      alCerrar,
      setOcupado,
      setErrores,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.velo}>
        <View style={styles.caja}>
          <EncabezadoFormulario dia={dia} inicio={inicio} />
          <CuerpoFormulario
            materias={materias}
            materiaId={materiaId}
            alCambiarMateria={setMateriaId}
            nombre={nombre}
            alCambiarNombre={setNombre}
            color={color}
            alCambiarColor={setColor}
            duracion={duracion}
            alCambiarDuracion={setDuracion}
            errores={errores}
            ocupado={ocupado}
            alGuardar={() => void guardar()}
            alCerrar={alCerrar}
          />
        </View>
      </View>
    </Modal>
  );
}

function ListaErrores({ errores }: { errores: string[] }): ReactElement | null {
  if (errores.length === 0) return null;
  return (
    <>
      {errores.map((e) => (
        <Text key={e} role="alert" style={styles.error}>
          {e}
        </Text>
      ))}
    </>
  );
}

function CamposNuevaMateria(props: {
  nombre: string;
  alCambiarNombre: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
}): ReactElement {
  return (
    <View>
      <TextInput
        style={styles.campo}
        placeholder="Nombre de la materia"
        value={props.nombre}
        onChangeText={props.alCambiarNombre}
        accessibilityLabel="Nombre de la materia"
      />
      <View style={styles.fila}>
        {PALETA_COLORES.map((c) => (
          <Pressable
            key={c}
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

function diaTexto(dia: number): string {
  const nombres = [
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
  ];
  return nombres[dia - 1] ?? '';
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  caja: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 },
  titulo: { fontSize: 18, fontWeight: '800' },
  sub: { color: '#586272', fontSize: 13 },
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
  error: { color: '#b91c1c', fontWeight: '600' },
  botonPrincipal: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  botonPrincipalTexto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  botonSecundario: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  botonSecundarioTexto: { color: '#1f2937', fontWeight: '700', textAlign: 'center' },
});
