/** Pantalla de gestión de materias: listar, editar y borrar materias (RF-01). */
import { type NavigationProp } from '@react-navigation/native';
import { useState, useCallback, type ReactElement } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { listarMaterias } from '../repositorios/materias';
import type { FilaMateria as FilaMateriaRepo } from '../repositorios/materias';
import { MenuMateria } from '../componentes/menu-materia';
import { useSemana, type Resultado } from '../hooks/use-semana';
import type { RootParamList } from '../nav/tipos';

export default function PantallaMaterias({ navigation }: Props): ReactElement {
  const { editarMateria, eliminarMateriaCompleta, recargar } = useSemana();
  const [materias, setMaterias] = useState<FilaMateriaRepo[]>(listarMaterias());
  const [menuId, setMenuId] = useState<string | null>(null);

  const recargarMaterias = useCallback((): void => {
    setMaterias(listarMaterias());
  }, []);

  const recargarYSet = useCallback((): void => {
    recargar();
    recargarMaterias();
  }, [recargar, recargarMaterias]);

  return (
    <View style={styles.base}>
      <Pressable
        style={styles.botonNueva}
        onPress={() => navigation.navigate('NuevaMateria')}
        accessibilityRole="button"
        accessibilityLabel="Crear materia nueva"
      >
        <Text style={styles.botonNuevaTexto}>＋ Nueva materia</Text>
      </Pressable>
      <FlatList
        data={materias}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          renderFilaMateria(
            item,
            menuId,
            setMenuId,
            editarMateria,
            eliminarMateriaCompleta,
            recargarYSet,
          )
        }
        ListEmptyComponent={
          <Text style={styles.vacio}>No hay materias creadas todavía.</Text>
        }
      />
    </View>
  );
}

/** Renderiza una fila de materia con su menú de editar/eliminar. */
function renderFilaMateria(
  item: FilaMateriaRepo,
  menuId: string | null,
  setMenuId: (id: string | null) => void,
  editarMateria: (
    id: string,
    datos: {
      nombre: string;
      docente: string | null;
      salon: string | null;
      color: string;
    },
  ) => Promise<Resultado>,
  eliminarMateriaCompleta: (id: string) => Promise<void>,
  recargarYSet: () => void,
): ReactElement {
  return (
    <FilaMateriaComponente
      key={item.id}
      materia={item}
      estaSeleccionada={menuId === item.id}
      alPulsarLargo={() => setMenuId(item.id)}
      alEditar={async (datos): Promise<Resultado> => {
        const r = await editarMateria(item.id, datos);
        setMenuId(null);
        if (r.ok) {
          recargarYSet();
        } else {
          Alert.alert('Error', r.errores.join('\n'));
        }
        return r;
      }}
      alEliminar={async () => {
        await eliminarMateriaCompleta(item.id);
        setMenuId(null);
        recargarYSet();
      }}
      alCerrar={() => setMenuId(null)}
    />
  );
}

type Props = {
  navigation: NavigationProp<RootParamList>;
};

function FilaMateriaComponente(props: {
  materia: FilaMateriaRepo;
  estaSeleccionada: boolean;
  alPulsarLargo: () => void;
  alEditar: (datos: {
    nombre: string;
    docente: string | null;
    salon: string | null;
    color: string;
  }) => Promise<Resultado>;
  alEliminar: () => Promise<void>;
  alCerrar: () => void;
}): ReactElement {
  const { materia, estaSeleccionada, alPulsarLargo, alEditar, alEliminar, alCerrar } =
    props;
  return (
    <View style={styles.fila}>
      <View style={[styles.color, { backgroundColor: materia.color }]} />
      <View style={styles.info}>
        <Text style={styles.nombre}>{materia.nombre}</Text>
        {materia.docente && <Text style={styles.docente}>{materia.docente}</Text>}
        {materia.salon && <Text style={styles.salon}>{materia.salon}</Text>}
      </View>
      <Pressable
        style={styles.botonMenu}
        onPress={alPulsarLargo}
        accessibilityRole="button"
        accessibilityLabel={`Menú de ${materia.nombre}`}
      >
        <Text style={styles.botonMenuTexto}>…</Text>
      </Pressable>
      {estaSeleccionada && (
        <MenuMateria
          materia={materia}
          alEditar={alEditar}
          alEliminar={alEliminar}
          alCerrar={alCerrar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, padding: 12, gap: 8 },
  botonNueva: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonNuevaTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    padding: 12,
  },
  color: { width: 16, height: 16, borderRadius: 8 },
  info: { flex: 1, gap: 2 },
  nombre: { fontWeight: '700', fontSize: 15 },
  docente: { color: '#586272', fontSize: 13 },
  salon: { color: '#586272', fontSize: 13 },
  botonMenu: {
    padding: 12,
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonMenuTexto: { fontSize: 20 },
  vacio: { color: '#586272', textAlign: 'center', padding: 40 },
});
