/** Modal para editar un bloque existente: materia, horas exactas, docente,
 *  salón y color. Todo se puede cambiar. */
import { useState, type ReactElement } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { formatearHora, minutosAHora, minutosDelDia, parseHora } from '../logica/tiempo';
import type { BloqueConMateria, Materia } from '../logica/tipos';
import type { DatosEdicion, Resultado } from '../hooks/use-semana';
import {
  CuerpoFormulario,
  EncabezadoFormulario,
  type CuerpoFormularioProps,
} from './formulario-bloque-campos';

type Props = {
  visible: boolean;
  bloque: BloqueConMateria;
  materias: Materia[];
  alGuardar: (datos: DatosEdicion) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Arma los datos de edición a partir del estado del formulario. */
function armarDatosEdicion(
  bloque: BloqueConMateria,
  estado: ReturnType<typeof useEstadoFormularioEdicion>,
): DatosEdicion {
  const datos: DatosEdicion = {
    id: bloque.bloque.id,
    dia: bloque.bloque.dia,
    hora_inicio: estado.inicio.trim(),
    hora_fin: estado.fin.trim(),
  };
  if (estado.materiaId === 'nueva') {
    datos.nueva = {
      nombre: estado.nombre,
      docente: estado.docente,
      salon: estado.salon,
      color: estado.color,
    };
  } else {
    datos.materia_id = estado.materiaId;
    // Siempre se envían los campos de la materia existente para poder editarlos.
    datos.nombre = estado.nombre;
    datos.docente = estado.docente;
    datos.salon = estado.salon;
    datos.color = estado.color;
  }
  return datos;
}

/** Estado del formulario de edición: precargado con los valores del bloque. */
function useEstadoFormularioEdicion(bloque: BloqueConMateria) {
  const [materiaId, setMateriaId] = useState<string>(
    bloque.bloque.materia_id === 'nueva' ? 'nueva' : bloque.bloque.materia_id,
  );
  const materia = bloque.materia;
  const [nombre, setNombre] = useState<string>(materia.nombre);
  const [docente, setDocente] = useState<string | null>(materia.docente);
  const [salon, setSalon] = useState<string | null>(materia.salon);
  const [color, setColor] = useState<string>(materia.color);
  const [errores, setErrores] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const inicioHora = parseHora(bloque.bloque.hora_inicio) ?? { h: 8, m: 0 };
  const [inicio, setInicio] = useState(formatearHora(inicioHora));
  const finHora = parseHora(bloque.bloque.hora_fin) ?? { h: 9, m: 0 };
  const [fin, setFin] = useState(formatearHora(finHora));

  /** Los atajos de duración recalculan el fin a partir del inicio actual. */
  const cambiarDuracion = (d: number): void => {
    const base = parseHora(inicio);
    const total = base ? minutosDelDia(base) : 0;
    setFin(formatearHora(minutosAHora(total + d)));
  };

  return {
    materiaId,
    setMateriaId,
    nombre,
    setNombre,
    docente,
    setDocente,
    salon,
    setSalon,
    color,
    setColor,
    errores,
    setErrores,
    ocupado,
    setOcupado,
    inicio,
    setInicio,
    fin,
    setFin,
    cambiarDuracion,
  };
}

/** Envía los datos y decide si cerrar el modal o mostrar los errores. */
async function enviarEdicion(
  datos: DatosEdicion,
  alGuardar: (datos: DatosEdicion) => Promise<Resultado>,
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

/** Controles del formulario con el estado ya calculado. */
function ControlesFormulario(props: {
  estado: ReturnType<typeof useEstadoFormularioEdicion>;
  materias: Materia[];
  alGuardar: () => void;
  alCerrar: () => void;
}): ReactElement {
  const e = props.estado;
  const propsCuerpo: CuerpoFormularioProps = {
    materias: props.materias,
    materiaId: e.materiaId,
    alCambiarMateria: e.setMateriaId,
    nombre: e.nombre,
    alCambiarNombre: e.setNombre,
    docente: e.docente,
    alCambiarDocente: e.setDocente,
    salon: e.salon,
    alCambiarSalon: e.setSalon,
    color: e.color,
    alCambiarColor: e.setColor,
    inicio: e.inicio,
    fin: e.fin,
    alCambiarInicio: e.setInicio,
    alCambiarFin: e.setFin,
    alCambiarDuracion: e.cambiarDuracion,
    errores: e.errores,
    ocupado: e.ocupado,
    alGuardar: props.alGuardar,
    alCerrar: props.alCerrar,
  };
  return <CuerpoFormulario {...propsCuerpo} />;
}

/** Contenido del modal (encabezado + controles). */
function ContenidoFormulario(props: {
  dia: number;
  inicio: string;
  cuerpo: ReactElement;
}): ReactElement {
  return (
    <View style={styles.caja}>
      <EncabezadoFormulario dia={props.dia} inicio={props.inicio} />
      {props.cuerpo}
    </View>
  );
}

export function FormularioEdicionBloque({
  visible,
  bloque,
  materias,
  alGuardar,
  alCerrar,
}: Props): ReactElement {
  const estado = useEstadoFormularioEdicion(bloque);

  const guardar = (): void => {
    void enviarEdicion(
      armarDatosEdicion(bloque, estado),
      alGuardar,
      alCerrar,
      estado.setOcupado,
      estado.setErrores,
    );
  };

  return (
    <Modal
      key={`editar-${bloque.bloque.id}-${visible ? 'abierto' : 'cerrado'}`}
      visible={visible}
      animationType="slide"
      transparent
    >
      <View style={styles.velo}>
        <ContenidoFormulario
          dia={bloque.bloque.dia}
          inicio={estado.inicio}
          cuerpo={
            <ControlesFormulario
              estado={estado}
              materias={materias}
              alGuardar={() => void guardar()}
              alCerrar={alCerrar}
            />
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  caja: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 },
});
