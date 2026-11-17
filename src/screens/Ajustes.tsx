/** Ajustes: campus, minutos de aviso, avisos, sincronización y sesión (RF-04/RF-06). */
import { useNavigation, type NavigationProp } from '@react-navigation/native';
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
import * as Location from 'expo-location';
import { mensajeDeError } from '../api/cliente';
import { BotonAvisos } from '../componentes/boton-avisos';
import { PruebaConexion } from '../componentes/prueba-conexion';
import { ajustesPendientes, guardarAjustes, leerAjustes } from '../repositorios/ajustes';
import { mensajeDeSincro, sincronizarTodo } from '../servicios/sincronizacion';
import { useSesion } from '../servicios/sesion';
import { margenMetros } from '../logica/distancia';
import type { Ajustes } from '../logica/tipos';
import type { RootParamList } from '../nav/tipos';

const PASO_AVISO = 5;

interface SeccionCampusProps {
  ajustes: Ajustes;
  alGuardar: (a: Ajustes) => void;
  alUsarMiUbicacion: () => void;
}

function SeccionCampus({
  ajustes,
  alGuardar,
  alUsarMiUbicacion,
}: SeccionCampusProps): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>Ubicación del campus</Text>
      <View style={styles.fila}>
        <TextInput
          style={[styles.campo, styles.campoCorto]}
          keyboardType="numbers-and-punctuation"
          value={ajustes.campus_lat === null ? '' : String(ajustes.campus_lat)}
          onChangeText={(v) =>
            alGuardar({ ...ajustes, campus_lat: Number(v.replace(',', '.')) || null })
          }
          placeholder="Latitud"
          placeholderTextColor="#9ca3af"
          accessibilityLabel="Latitud del campus"
        />
        <TextInput
          style={[styles.campo, styles.campoCorto]}
          keyboardType="numbers-and-punctuation"
          value={ajustes.campus_lng === null ? '' : String(ajustes.campus_lng)}
          onChangeText={(v) =>
            alGuardar({ ...ajustes, campus_lng: Number(v.replace(',', '.')) || null })
          }
          placeholder="Longitud"
          placeholderTextColor="#9ca3af"
          accessibilityLabel="Longitud del campus"
        />
      </View>
      <Pressable
        style={styles.boton}
        onPress={alUsarMiUbicacion}
        accessibilityRole="button"
        accessibilityLabel="Usar mi ubicación actual como campus"
      >
        <Text style={styles.botonTexto}>📍 Usar mi ubicación actual</Text>
      </Pressable>
      <Text style={styles.nota}>
        El permiso de ubicación se pide solo aquí: sirve para calcular tu distancia al
        campus.
      </Text>
    </>
  );
}

function SeccionMinutos({
  minutosAviso,
  alCambiar,
}: {
  minutosAviso: number;
  alCambiar: (n: number) => void;
}): ReactElement {
  return (
    <>
      <Text style={styles.rotulo}>Minutos de aviso</Text>
      <View style={styles.fila}>
        <Pressable
          style={styles.paso}
          onPress={() => alCambiar(Math.max(0, minutosAviso - PASO_AVISO))}
          accessibilityRole="button"
          accessibilityLabel="Menos minutos de aviso"
        >
          <Text style={styles.pasoTexto}>−</Text>
        </Pressable>
        <Text style={styles.valor}>
          {minutosAviso} min (≈ {margenMetros(minutosAviso)} m caminando)
        </Text>
        <Pressable
          style={styles.paso}
          onPress={() => alCambiar(Math.min(120, minutosAviso + PASO_AVISO))}
          accessibilityRole="button"
          accessibilityLabel="Más minutos de aviso"
        >
          <Text style={styles.pasoTexto}>＋</Text>
        </Pressable>
      </View>
    </>
  );
}

function useAccionesAjustes(
  ajustes: Ajustes,
  guardar: (a: Ajustes) => void,
  alMensaje: (m: string) => void,
): {
  usarMiUbicacion: () => Promise<void>;
  sincronizar: () => Promise<void>;
} {
  const usarMiUbicacion = async (): Promise<void> => {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) {
      alMensaje('Permiso de ubicación denegado: escribe latitud y longitud.');
      return;
    }
    const posicion = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    guardar({
      ...ajustes,
      campus_lat: Number(posicion.coords.latitude.toFixed(6)),
      campus_lng: Number(posicion.coords.longitude.toFixed(6)),
    });
  };

  const sincronizar = async (): Promise<void> => {
    try {
      const r = await sincronizarTodo();
      alMensaje(
        `${mensajeDeSincro(r)} · enviados ${r.enviados} · recibidos ${r.recibidos}`,
      );
    } catch (error) {
      alMensaje(mensajeDeError(error));
    }
  };

  return { usarMiUbicacion, sincronizar };
}

function PieAjustes({
  mensaje,
  alSincronizar,
  alSalir,
}: {
  mensaje: string | null;
  alSincronizar: () => void;
  alSalir: () => void;
}): ReactElement {
  return (
    <>
      <Pressable
        style={styles.boton}
        onPress={alSincronizar}
        accessibilityRole="button"
        accessibilityLabel="Sincronizar ahora"
      >
        <Text style={styles.botonTexto}>🔄 Sincronizar ahora</Text>
      </Pressable>
      {ajustesPendientes() ? (
        <Text style={styles.nota}>Hay ajustes pendientes de sincronizar.</Text>
      ) : null}
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      <Pressable
        style={[styles.boton, styles.peligro]}
        onPress={alSalir}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Text style={[styles.botonTexto, styles.textoPeligro]}>Cerrar sesión</Text>
      </Pressable>
    </>
  );
}

export default function PantallaAjustes(): ReactElement {
  const { salir } = useSesion();
  const navigation: NavigationProp<RootParamList> = useNavigation();
  const [ajustes, setAjustes] = useState(leerAjustes());
  const [mensaje, setMensaje] = useState<string | null>(null);

  const guardar = (nuevos: Ajustes): void => {
    setAjustes(nuevos);
    guardarAjustes(nuevos);
    setMensaje(
      'Guardado en el teléfono. Pulsa «Sincronizar ahora» para enviarlo a la API.',
    );
  };

  const { usarMiUbicacion, sincronizar } = useAccionesAjustes(
    ajustes,
    guardar,
    setMensaje,
  );

  return (
    <KeyboardAvoidingView style={styles.base} behavior="padding">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.titulo}>Ajustes</Text>
        <BotonAvisos />
        <Pressable
          style={styles.botonGestionarMaterias}
          onPress={() => navigation.navigate('Materias')}
          accessibilityRole="button"
          accessibilityLabel="Gestionar materias"
        >
          <Text style={styles.botonGestionarMateriasTexto}>📚 Gestionar materias</Text>
        </Pressable>
        <PruebaConexion />
        <SeccionCampus
          ajustes={ajustes}
          alGuardar={guardar}
          alUsarMiUbicacion={() => void usarMiUbicacion()}
        />
        <SeccionMinutos
          minutosAviso={ajustes.minutos_aviso}
          alCambiar={(n) => guardar({ ...ajustes, minutos_aviso: n })}
        />
        <PieAjustes
          mensaje={mensaje}
          alSincronizar={() => void sincronizar()}
          alSalir={() => void salir().then(() => navigation.navigate('Login'))}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, padding: 16 },
  titulo: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  rotulo: { fontWeight: '700', marginTop: 12, marginBottom: 4 },
  fila: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  campo: {
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 10,
    minHeight: 44,
    backgroundColor: '#fff',
  },
  campoCorto: { flex: 1 },
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
    justifyContent: 'center',
    marginTop: 8,
  },
  botonTexto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  paso: {
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  pasoTexto: { fontSize: 22, textAlign: 'center', fontWeight: '800' },
  valor: { fontWeight: '700', flex: 1, textAlign: 'center' },
  nota: { color: '#586272', fontSize: 12, marginTop: 6 },
  mensaje: { color: '#14532d', fontWeight: '600', marginTop: 8 },
  peligro: { backgroundColor: '#fee2e2' },
  textoPeligro: { color: '#b91c1c' },
  botonGestionarMaterias: {
    backgroundColor: '#6b7280',
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  botonGestionarMateriasTexto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
