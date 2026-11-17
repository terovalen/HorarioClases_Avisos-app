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
import { useSemana, type DatosCrear, type Resultado } from '../hooks/use-semana';
import { listarMaterias } from '../repositorios/materias';
import { bloquePorId, type FilaBloque } from '../repositorios/bloques';

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

/** Modales de la pantalla: creación de bloque y menú del bloque. */
function ModalesSemana(props: {
  hueco: Hueco;
  dia: number;
  bloqueMenu: FilaBloque | null;
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
}): ReactElement {
  return (
    <>
      <FormularioBloque
        visible={props.hueco !== null}
        dia={props.hueco?.dia ?? props.dia}
        hora={props.hueco?.hora ?? 8}
        minuto={props.hueco?.minuto ?? 0}
        materias={listarMaterias()}
        alGuardar={props.alGuardar}
        alCerrar={props.alCerrarHueco}
      />
      <MenuBloque
        bloque={props.bloqueMenu}
        alEliminar={props.alEliminar}
        alAjustarFin={props.alAjustarFin}
        alEditarHoras={props.alEditarHoras}
        alCerrar={props.alCerrarMenu}
      />
    </>
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
  const bloqueMenu = menuId ? bloquePorId(menuId) : null;

  return (
    <View style={styles.base}>
      <CabeceraSemana dia={dia} alCambiar={setDia} alCambiarDelta={cambiarDia} />
      <BotonCrearBloque dia={dia} alCrear={() => setHueco({ dia, hora: 8, minuto: 0 })} />
      <ScrollView>
        <GrillaDia
          bloques={delDia}
          alPulsarLargo={(hora, minuto) => setHueco({ dia, hora, minuto })}
          alAjustarFin={(id, fin) => void ajustarFin(id, fin)}
          alAbrirMenu={setMenuId}
          alCambiarDia={cambiarDia}
          alIrHoy={() => setDia(diaDeFecha(new Date()))}
        />
      </ScrollView>
      <BotonAvisos />
      <ModalesSemana
        hueco={hueco}
        dia={dia}
        bloqueMenu={bloqueMenu}
        alGuardar={crear}
        alAjustarFin={ajustarFin}
        alEditarHoras={editarHoras}
        alEliminar={eliminarBloqueActual}
        alCerrarHueco={() => setHueco(null)}
        alCerrarMenu={() => setMenuId(null)}
      />
    </View>
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
