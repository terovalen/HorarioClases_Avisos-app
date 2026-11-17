/** Vista semanal: grilla por días con gestos y modales (RF-02). */
import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CabeceraSemana } from '../componentes/cabecera-semana';
import { GrillaDia } from '../componentes/grilla-dia';
import { FormularioBloque } from '../componentes/formulario-bloque';
import { MenuBloque } from '../componentes/menu-bloque';
import { BotonAvisos } from '../componentes/boton-avisos';
import { EstadoCarga } from '../componentes/estado-carga';
import { diaDeFecha, NOMBRES_DIAS } from '../logica/tiempo';
import type { BloqueConMateria, Materia } from '../logica/tipos';
import { useSemana, type DatosCrear, type Resultado } from '../hooks/use-semana';
import { listarMaterias } from '../repositorios/materias';

function BotonCrearBloque({
  dia,
  alCrear,
}: {
  dia: number;
  alCrear: () => void;
}): ReactElement {
  return (
    <Pressable
      style={styles.botonCrear}
      onPress={alCrear}
      accessibilityRole="button"
      accessibilityLabel="Crear un bloque en el día visible (alternativa al mantener presionado)"
    >
      <Text style={styles.botonCrearTexto}>
        ＋ Crear bloque en {NOMBRES_DIAS[dia - 1] ?? ''}
      </Text>
    </Pressable>
  );
}

type Hueco = { dia: number; hora: number; minuto: number } | null;

type PropsModalCreacion = {
  visible: boolean;
  dia: number;
  hora: number;
  minuto: number;
  materias: Materia[];
  alGuardar: (datos: DatosCrear) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Modal de creación de bloque en un hueco. */
function ModalCreacionBloque(props: PropsModalCreacion): ReactElement {
  return (
    <FormularioBloque
      visible={props.visible}
      dia={props.dia}
      hora={props.hora}
      minuto={props.minuto}
      materias={props.materias}
      alGuardar={props.alGuardar}
      alCerrar={props.alCerrar}
    />
  );
}

type PropsMenuBloqueSemana = {
  menuId: string | null;
  delDia: BloqueConMateria[];
  alEliminar: (id: string) => Promise<void>;
  alAjustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  alEditarHoras: (
    id: string,
    hora_inicio: string,
    hora_fin: string,
  ) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Menú del bloque dentro de los modales. */
function CuerpoMenuBloqueSemana(props: PropsMenuBloqueSemana): ReactElement {
  return (
    <MenuBloque
      bloque={
        props.menuId
          ? (props.delDia.find((f) => f.bloque.id === props.menuId) ?? null)
          : null
      }
      alEliminar={props.alEliminar}
      alAjustarFin={props.alAjustarFin}
      alEditarHoras={props.alEditarHoras}
      alCerrar={props.alCerrar}
    />
  );
}

type PropsCuerpoModales = {
  hueco: Hueco;
  dia: number;
  menuId: string | null;
  delDia: BloqueConMateria[];
  alGuardar: (datos: DatosCrear) => Promise<Resultado>;
  alAjustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  alEditarHoras: (
    id: string,
    hora_inicio: string,
    hora_fin: string,
  ) => Promise<Resultado>;
  alEliminar: (id: string) => Promise<void>;
  alCerrarHueco: () => void;
  alCerrarMenu: () => void;
};

/** Modales de la pantalla Semana. */
function CuerpoModalesSemana(props: PropsCuerpoModales): ReactElement {
  return (
    <>
      <ModalCreacionBloque
        visible={props.hueco !== null}
        dia={props.hueco?.dia ?? props.dia}
        hora={props.hueco?.hora ?? 8}
        minuto={props.hueco?.minuto ?? 0}
        materias={listarMaterias()}
        alGuardar={props.alGuardar}
        alCerrar={props.alCerrarHueco}
      />
      <CuerpoMenuBloqueSemana
        menuId={props.menuId}
        delDia={props.delDia}
        alEliminar={props.alEliminar}
        alAjustarFin={props.alAjustarFin}
        alEditarHoras={props.alEditarHoras}
        alCerrar={props.alCerrarMenu}
      />
    </>
  );
}

type PropsCuerpoGrilla = {
  bloques: BloqueConMateria[];
  dia: number;
  setHueco: (h: Hueco) => void;
  ajustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  setMenuId: (id: string | null) => void;
  cambiarDia: (delta: number) => void;
  setDia: (d: number) => void;
};

/** Grilla del día con sus gestos. */
function CuerpoGrillaSemana(props: PropsCuerpoGrilla): ReactElement {
  return (
    <ScrollView>
      <GrillaDia
        bloques={props.bloques}
        alPulsarLargo={(hora, minuto) => props.setHueco({ dia: props.dia, hora, minuto })}
        alAjustarFin={(id, fin) => void props.ajustarFin(id, fin)}
        alAbrirMenu={props.setMenuId}
        alCambiarDia={props.cambiarDia}
        alIrHoy={() => props.setDia(diaDeFecha(new Date()))}
      />
    </ScrollView>
  );
}

type PropsCabeceraYCrear = {
  dia: number;
  setDia: (d: number) => void;
  cambiarDia: (delta: number) => void;
  setHueco: (h: Hueco) => void;
};

/** Encabezado y botón crear de la pantalla Semana. */
function CabeceraYCrearSemana(props: PropsCabeceraYCrear): ReactElement {
  return (
    <>
      <CabeceraSemana
        dia={props.dia}
        alCambiar={props.setDia}
        alCambiarDelta={props.cambiarDia}
      />
      <BotonCrearBloque
        dia={props.dia}
        alCrear={() => props.setHueco({ dia: props.dia, hora: 8, minuto: 0 })}
      />
    </>
  );
}

type PropsCuerpoPantalla = {
  dia: number;
  setDia: (d: number) => void;
  cambiarDia: (delta: number) => void;
  delDia: BloqueConMateria[];
  hueco: Hueco;
  setHueco: (h: Hueco) => void;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  ajustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  editarHoras: (id: string, hora_inicio: string, hora_fin: string) => Promise<Resultado>;
  eliminarBloqueActual: (id: string) => Promise<void>;
  crear: (datos: DatosCrear) => Promise<Resultado>;
};

/** Cuerpo de la pantalla Semana (extraído para cumplir límite de líneas). */
function CuerpoPantallaSemana(props: PropsCuerpoPantalla): ReactElement {
  return (
    <View style={styles.base}>
      <CabeceraYCrearSemana
        dia={props.dia}
        setDia={props.setDia}
        cambiarDia={props.cambiarDia}
        setHueco={props.setHueco}
      />
      <CuerpoGrillaSemana
        bloques={props.delDia}
        dia={props.dia}
        setHueco={props.setHueco}
        ajustarFin={props.ajustarFin}
        setMenuId={props.setMenuId}
        cambiarDia={props.cambiarDia}
        setDia={props.setDia}
      />
      <BotonAvisos />
      <CuerpoModalesSemana
        hueco={props.hueco}
        dia={props.dia}
        menuId={props.menuId}
        delDia={props.delDia}
        alGuardar={props.crear}
        alAjustarFin={props.ajustarFin}
        alEditarHoras={props.editarHoras}
        alEliminar={props.eliminarBloqueActual}
        alCerrarHueco={() => props.setHueco(null)}
        alCerrarMenu={() => props.setMenuId(null)}
      />
    </View>
  );
}

export default function PantallaSemana(): ReactElement {
  const {
    filas,
    estado,
    recargar,
    crear,
    ajustarFin,
    editarHoras,
    eliminarBloqueActual,
  } = useSemana();
  const [dia, setDia] = useState(diaDeFecha(new Date()));
  const [hueco, setHueco] = useState<Hueco>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const cambiarDia = (delta: number): void => {
    setDia((actual) => ((actual - 1 + delta + 7) % 7) + 1);
  };

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} alReintentar={recargar} />;
  }

  const delDia = filas.filter((f) => f.bloque.dia === dia);

  return (
    <CuerpoPantallaSemana
      dia={dia}
      setDia={setDia}
      cambiarDia={cambiarDia}
      delDia={delDia}
      hueco={hueco}
      setHueco={setHueco}
      menuId={menuId}
      setMenuId={setMenuId}
      ajustarFin={ajustarFin}
      editarHoras={editarHoras}
      eliminarBloqueActual={eliminarBloqueActual}
      crear={crear}
    />
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, padding: 12, gap: 8 },
  botonCrear: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  botonCrearTexto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
