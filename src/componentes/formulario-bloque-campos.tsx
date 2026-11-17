/** Piezas presentacionales del formulario de bloque: materia, horas exactas,
 *  duración, errores y botones. */
import { type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Materia } from '../logica/tipos';
import { EditorHoras } from './editor-horas';
import { CamposNuevaMateria, SelectorMateria } from './selector-materia';

const DURACIONES = [30, 60, 90, 120];

/** Duración en minutos entre dos horas HH:MM; null si alguna no es válida. */
export function duracionEntre(inicio: string, fin: string): number | null {
  const i = parseHH(inicio);
  const f = parseHH(fin);
  if (i === null || f === null) return null;
  return f - i;
}

/** Minutos desde la medianoche de una hora HH:MM; null si el formato falla. */
function parseHH(texto: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(texto)) return null;
  const [h, m] = texto.split(':');
  const horas = Number(h);
  const minutos = Number(m);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) return null;
  if (horas > 23 || minutos > 59) return null;
  return horas * 60 + minutos;
}

export function SelectorDuracion({
  duracion,
  alCambiar,
}: {
  duracion: number | null;
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

export function PieFormulario({
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

export function EncabezadoFormulario({
  dia,
  inicio,
}: {
  dia: number;
  inicio: string;
}): ReactElement {
  return (
    <>
      <Text style={styles.titulo}>Nuevo bloque</Text>
      <Text style={styles.sub}>
        {diaTexto(dia)} · mantén presionado un hueco para crear aquí, o escribe la hora
        exacta.
      </Text>
    </>
  );
}

/** Campos de la materia nueva (solo si se elige «+ Nueva»). */
export function CamposMateria(props: {
  materiaId: string;
  nombre: string;
  alCambiarNombre: (v: string) => void;
  docente: string | null;
  alCambiarDocente: (v: string) => void;
  salon: string | null;
  alCambiarSalon: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
}): ReactElement | null {
  if (props.materiaId !== 'nueva') return null;
  return (
    <CamposNuevaMateria
      nombre={props.nombre}
      alCambiarNombre={props.alCambiarNombre}
      docente={props.docente}
      alCambiarDocente={props.alCambiarDocente}
      salon={props.salon}
      alCambiarSalon={props.alCambiarSalon}
      color={props.color}
      alCambiarColor={props.alCambiarColor}
    />
  );
}

/** Horas exactas y atajos de duración. */
export function HorasFormulario(props: {
  inicio: string;
  fin: string;
  alCambiarInicio: (v: string) => void;
  alCambiarFin: (v: string) => void;
  alCambiarDuracion: (d: number) => void;
}): ReactElement {
  return (
    <>
      <EditorHoras
        inicio={props.inicio}
        fin={props.fin}
        alCambiarInicio={props.alCambiarInicio}
        alCambiarFin={props.alCambiarFin}
      />
      <SelectorDuracion
        duracion={duracionEntre(props.inicio, props.fin)}
        alCambiar={props.alCambiarDuracion}
      />
    </>
  );
}

export function ListaErrores({ errores }: { errores: string[] }): ReactElement | null {
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

/** Selector de materia + campos de materia nueva, agrupados. */
function BloqueMateriaForm(props: {
  materias: Materia[];
  materiaId: string;
  alCambiarMateria: (id: string) => void;
  nombre: string;
  alCambiarNombre: (v: string) => void;
  docente: string | null;
  alCambiarDocente: (v: string) => void;
  salon: string | null;
  alCambiarSalon: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
}): ReactElement {
  return (
    <>
      <SelectorMateria
        materias={props.materias}
        materiaId={props.materiaId}
        alCambiar={props.alCambiarMateria}
      />
      <CamposMateria
        materiaId={props.materiaId}
        nombre={props.nombre}
        alCambiarNombre={props.alCambiarNombre}
        docente={props.docente}
        alCambiarDocente={props.alCambiarDocente}
        salon={props.salon}
        alCambiarSalon={props.alCambiarSalon}
        color={props.color}
        alCambiarColor={props.alCambiarColor}
      />
    </>
  );
}
/** Props de los controles del formulario. */
export type CuerpoFormularioProps = {
  materias: Materia[];
  materiaId: string;
  alCambiarMateria: (id: string) => void;
  nombre: string;
  alCambiarNombre: (v: string) => void;
  docente: string | null;
  alCambiarDocente: (v: string) => void;
  salon: string | null;
  alCambiarSalon: (v: string) => void;
  color: string;
  alCambiarColor: (v: string) => void;
  inicio: string;
  fin: string;
  alCambiarInicio: (v: string) => void;
  alCambiarFin: (v: string) => void;
  alCambiarDuracion: (d: number) => void;
  errores: string[];
  ocupado: boolean;
  alGuardar: () => void;
  alCerrar: () => void;
};

/** Controles del formulario: materia, horas, duración, errores y botones. */
export function CuerpoFormulario(props: CuerpoFormularioProps): ReactElement {
  return (
    <>
      <BloqueMateriaForm
        materias={props.materias}
        materiaId={props.materiaId}
        alCambiarMateria={props.alCambiarMateria}
        nombre={props.nombre}
        alCambiarNombre={props.alCambiarNombre}
        docente={props.docente}
        alCambiarDocente={props.alCambiarDocente}
        salon={props.salon}
        alCambiarSalon={props.alCambiarSalon}
        color={props.color}
        alCambiarColor={props.alCambiarColor}
      />
      <HorasFormulario
        inicio={props.inicio}
        fin={props.fin}
        alCambiarInicio={props.alCambiarInicio}
        alCambiarFin={props.alCambiarFin}
        alCambiarDuracion={props.alCambiarDuracion}
      />
      <ListaErrores errores={props.errores} />
      <PieFormulario
        ocupado={props.ocupado}
        alGuardar={props.alGuardar}
        alCerrar={props.alCerrar}
      />
    </>
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
  titulo: { fontSize: 18, fontWeight: '800' },
  sub: { color: '#586272', fontSize: 13 },
  rotulo: { fontWeight: '700', marginTop: 4 },
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
