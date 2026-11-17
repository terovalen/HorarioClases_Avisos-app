/** Crear o editar una materia con docente, salón y color (RF-01). */
import { useNavigation, useRoute } from '@react-navigation/native';
import { useState, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { validarMateria, PALETA_COLORES } from '../logica/validaciones-materia';
import { actualizarMateria, crearMateria, materiaPorId } from '../repositorios/materias';
import { bloquePorId, actualizarHoras } from '../repositorios/bloques';
import { validarBloque } from '../logica/cruces';
import { useSemana } from '../hooks/use-semana';
import type { Materia } from '../logica/tipos';

type DatosMateria = {
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
};

const COLOR_INICIAL = PALETA_COLORES[0] ?? '#2563eb';

function estadoInicial(existente: Materia | null): {
  nombre: string;
  docente: string;
  salon: string;
  color: string;
} {
  if (!existente) return { nombre: '', docente: '', salon: '', color: COLOR_INICIAL };
  return {
    nombre: existente.nombre,
    docente: existente.docente ?? '',
    salon: existente.salon ?? '',
    color: existente.color,
  };
}

function intentarGuardar(
  nombre: string,
  docente: string,
  salon: string,
  color: string,
  existente: Materia | null,
  bloqueId: string | undefined,
): string[] {
  const datos: DatosMateria = {
    nombre: nombre.trim(),
    docente: docente.trim() || null,
    salon: salon.trim() || null,
    color,
  };
  const valido = validarMateria(datos);
  if (!valido.ok) return valido.errores;
  if (existente) actualizarMateria(existente.id, datos);
  else crearMateria(datos);
  const bloqueActual = bloqueId ? bloquePorId(bloqueId) : null;
  if (bloqueActual && validarBloque(bloqueActual).ok) {
    actualizarHoras(bloqueActual.id, bloqueActual.hora_inicio, bloqueActual.hora_fin);
  }
  return [];
}

function CampoTexto({
  valor,
  alCambiar,
  pista,
  etiqueta,
}: {
  valor: string;
  alCambiar: (v: string) => void;
  pista: string;
  etiqueta: string;
}): ReactElement {
  return (
    <TextInput
      style={styles.campo}
      placeholder={pista}
      placeholderTextColor="#9ca3af"
      value={valor}
      onChangeText={alCambiar}
      accessibilityLabel={etiqueta}
    />
  );
}

function PaletaColores({
  color,
  alCambiar,
}: {
  color: string;
  alCambiar: (c: string) => void;
}): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>Color</Text>
      <View style={styles.fila}>
        {PALETA_COLORES.map((c) => (
          <Pressable
            key={c}
            onPress={() => alCambiar(c)}
            style={[
              styles.color,
              { backgroundColor: c },
              color === c && styles.colorActivo,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Elegir color ${c}`}
          />
        ))}
      </View>
    </>
  );
}

function BotonesMateria({
  existente,
  ocupado,
  alGuardar,
  alEliminar,
}: {
  existente: Materia | null;
  ocupado: boolean;
  alGuardar: () => void;
  alEliminar: () => void;
}): ReactElement {
  return (
    <>
      <Pressable
        style={styles.boton}
        onPress={alGuardar}
        accessibilityRole="button"
        accessibilityLabel="Guardar materia"
      >
        <Text style={styles.botonTexto}>
          {ocupado ? 'Guardando…' : 'Guardar materia'}
        </Text>
      </Pressable>
      {existente ? (
        <Pressable
          style={[styles.boton, styles.peligro]}
          onPress={alEliminar}
          disabled={ocupado}
          accessibilityRole="button"
          accessibilityLabel={`Eliminar ${existente.nombre} y sus bloques`}
        >
          <Text style={[styles.botonTexto, styles.textoPeligro]}>Eliminar materia</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function TextoError({ mensaje }: { mensaje: string }): ReactElement {
  return (
    <Text role="alert" style={styles.error}>
      {mensaje}
    </Text>
  );
}

function useCamposMateria(existente: Materia | null): {
  nombre: string;
  setNombre: (v: string) => void;
  docente: string;
  setDocente: (v: string) => void;
  salon: string;
  setSalon: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  errores: string[];
  setErrores: (e: string[]) => void;
  ocupado: boolean;
  setOcupado: (v: boolean) => void;
} {
  const inicial = estadoInicial(existente);
  const [nombre, setNombre] = useState(inicial.nombre);
  const [docente, setDocente] = useState(inicial.docente);
  const [salon, setSalon] = useState(inicial.salon);
  const [color, setColor] = useState(inicial.color);
  const [errores, setErrores] = useState<string[]>([]);
  const [ocupado, setOcupado] = useState(false);
  return {
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
  };
}

function useAccionesMateria(
  c: ReturnType<typeof useCamposMateria>,
  existente: Materia | null,
  bloqueId: string | undefined,
): { guardar: () => void; eliminar: () => Promise<void> } {
  const navigation = useNavigation();
  const { eliminarMateriaCompleta, recargar } = useSemana();

  const guardar = (): void => {
    const fallas = intentarGuardar(
      c.nombre,
      c.docente,
      c.salon,
      c.color,
      existente,
      bloqueId,
    );
    if (fallas.length > 0) {
      c.setErrores(fallas);
      return;
    }
    c.setErrores([]);
    recargar();
    navigation.goBack();
  };

  const eliminar = async (): Promise<void> => {
    if (!existente) return;
    c.setOcupado(true);
    await eliminarMateriaCompleta(existente.id);
    c.setOcupado(false);
    navigation.goBack();
  };

  return { guardar, eliminar };
}

export default function PantallaNuevaMateria(): ReactElement {
  const params = (useRoute().params as { id?: string; bloque?: string }) ?? {};
  const existente = params.id ? materiaPorId(params.id) : null;
  const c = useCamposMateria(existente);
  const { guardar, eliminar } = useAccionesMateria(c, existente, params.bloque);

  return (
    <KeyboardAvoidingView style={styles.base} behavior="padding">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.titulo}>
          {existente ? 'Editar materia' : 'Nueva materia'}
        </Text>
        <CampoTexto
          valor={c.nombre}
          alCambiar={c.setNombre}
          pista="Nombre *"
          etiqueta="Nombre de la materia"
        />
        <CampoTexto
          valor={c.docente}
          alCambiar={c.setDocente}
          pista="Docente"
          etiqueta="Docente"
        />
        <CampoTexto
          valor={c.salon}
          alCambiar={c.setSalon}
          pista="Salón"
          etiqueta="Salón"
        />
        <PaletaColores color={c.color} alCambiar={c.setColor} />
        {c.errores.map((e) => (
          <TextoError key={e} mensaje={e} />
        ))}
        <BotonesMateria
          existente={existente}
          ocupado={c.ocupado}
          alGuardar={guardar}
          alEliminar={() => void eliminar()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, padding: 16, gap: 10 },
  titulo: { fontSize: 20, fontWeight: '800' },
  campo: {
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
    backgroundColor: '#fff',
  },
  rotulo: { fontWeight: '700', marginTop: 4 },
  fila: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  color: { width: 40, height: 40, borderRadius: 20 },
  colorActivo: { borderWidth: 3, borderColor: '#1f2937' },
  error: { color: '#b91c1c', fontWeight: '600' },
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    minHeight: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  botonTexto: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 },
  peligro: { backgroundColor: '#fee2e2' },
  textoPeligro: { color: '#b91c1c' },
});
