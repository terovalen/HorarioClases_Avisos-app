/** Modal para crear un bloque en el hueco elegido (alternativa accesible al
 *  long-press): materia nueva o existente + horas exactas. Muestra los errores. */
import { useState, type ReactElement } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { formatearHora, minutosAHora, minutosDelDia, parseHora } from '../logica/tiempo';
import { PALETA_COLORES } from '../logica/validaciones-materia';
import type { Materia } from '../logica/tipos';
import type { DatosCrear, Resultado } from '../hooks/use-semana';
import { CuerpoFormulario, EncabezadoFormulario } from './formulario-bloque-campos';

type Props = {
  visible: boolean;
  dia: number;
  hora: number;
  minuto: number;
  materias: Materia[];
  alGuardar: (datos: DatosCrear) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Arma el cuerpo de la petición según se use una materia nueva o existente. */
function armarDatos(
  dia: number,
  hora_inicio: string,
  hora_fin: string,
  materiaId: string,
  nombre: string,
  docente: string | null,
  salon: string | null,
  color: string,
): DatosCrear {
  const datos: DatosCrear = { dia, hora_inicio, hora_fin };
  if (materiaId === 'nueva') {
    datos.nueva = { nombre, docente, salon, color };
  } else {
    datos.materia_id = materiaId;
  }
  return datos;
}

/** Estado del formulario: materia, horas exactas, errores y guardado. */
function useEstadoFormulario(hora: number, minuto: number) {
  const [materiaId, setMateriaId] = useState<string>('');
  const [nombre, setNombre] = useState('');
  const [docente, setDocente] = useState<string | null>(null);
  const [salon, setSalon] = useState<string | null>(null);
  const [color, setColor] = useState<string>(PALETA_COLORES[0] ?? '#2563eb');
  const [errores, setErrores] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const inicioBase = minutosAHora(hora * 60 + minuto);
  const [inicio, setInicio] = useState(formatearHora(inicioBase));
  const [fin, setFin] = useState(
    formatearHora(minutosAHora(minutosDelDia(inicioBase) + 60)),
  );

  /** Los atajos de duración recalculan el fin a partir del inicio actual. */
  const cambiarDuracion = (d: number): void => {
    const base = parseHora(inicio) ?? inicioBase;
    setFin(formatearHora(minutosAHora(minutosDelDia(base) + d)));
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
async function enviarBloque(
  datos: DatosCrear,
  alGuardar: (datos: DatosCrear) => Promise<Resultado>,
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
  estado: ReturnType<typeof useEstadoFormulario>;
  materias: Materia[];
  alGuardar: () => void;
  alCerrar: () => void;
}): ReactElement {
  const e = props.estado;
  return (
    <CuerpoFormulario
      materias={props.materias}
      materiaId={e.materiaId}
      alCambiarMateria={e.setMateriaId}
      nombre={e.nombre}
      alCambiarNombre={e.setNombre}
      docente={e.docente}
      alCambiarDocente={e.setDocente}
      salon={e.salon}
      alCambiarSalon={e.setSalon}
      color={e.color}
      alCambiarColor={e.setColor}
      inicio={e.inicio}
      fin={e.fin}
      alCambiarInicio={e.setInicio}
      alCambiarFin={e.setFin}
      alCambiarDuracion={e.cambiarDuracion}
      errores={e.errores}
      ocupado={e.ocupado}
      alGuardar={props.alGuardar}
      alCerrar={props.alCerrar}
    />
  );
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

/** Crea el callback de guardar para el formulario, ya con los datos armados. */
function crearGuardar(
  dia: number,
  estado: ReturnType<typeof useEstadoFormulario>,
  alGuardar: (datos: DatosCrear) => Promise<Resultado>,
  alCerrar: () => void,
): () => void {
  return (): void => {
    void enviarBloque(
      armarDatos(
        dia,
        estado.inicio.trim(),
        estado.fin.trim(),
        estado.materiaId,
        estado.nombre,
        estado.docente,
        estado.salon,
        estado.color,
      ),
      alGuardar,
      alCerrar,
      estado.setOcupado,
      estado.setErrores,
    );
  };
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
  const estado = useEstadoFormulario(hora, minuto);
  const guardar = crearGuardar(dia, estado, alGuardar, alCerrar);

  return (
    <Modal
      key={`${dia}-${hora}-${minuto}-${visible ? 'abierto' : 'cerrado'}`}
      visible={visible}
      animationType="slide"
      transparent
    >
      <View style={styles.velo}>
        <ContenidoFormulario
          dia={dia}
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
