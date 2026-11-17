/** Ajustes: campus, minutos de aviso, avisos, sincronización y sesión (RF-04/RF-06). */
import { useRouter } from 'expo-router';
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
import {
  ajustesPendientes,
  guardarAjustes,
  leerAjustes,
} from '../src/repositorios/ajustes';
import { pedirPermisoAvisos, reprogramarAvisos } from '../src/servicios/notificaciones';
import { listarBloques } from '../src/repositorios/bloques';
import { listarMaterias } from '../src/repositorios/materias';
import { sincronizarTodo } from '../src/servicios/sincronizacion';
import { useSesion } from '../src/servicios/sesion';
import { margenMetros } from '../src/logica/distancia';
import type { Ajustes } from '../src/logica/tipos';

const PASO_AVISO = 5;

/** Ubicación del campus: dos campos, botón de GPS y explicación del permiso. */
function SeccionCampus({
  ajustes,
  alGuardar,
  alUsarMiUbicacion,
}: {
  ajustes: Ajustes;
  alGuardar: (a: Ajustes) => void;
  alUsarMiUbicacion: () => void;
}): ReactElement {
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
        El permiso de ubicación se pide solo aquí, con esta explicación: sirve para
        calcular tu distancia al campus.
      </Text>
    </>
  );
}

/** Minutos de aviso con botones − / ＋ y la distancia de margen. */
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

/** Acciones de la pantalla: GPS del campus, avisos y sincronización. */
function useAccionesAjustes(
  ajustes: Ajustes,
  guardar: (a: Ajustes) => void,
  alMensaje: (m: string) => void,
): {
  usarMiUbicacion: () => Promise<void>;
  activarAvisos: () => Promise<void>;
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

  const activarAvisos = async (): Promise<void> => {
    const ok = await pedirPermisoAvisos();
    if (!ok) {
      alMensaje('Permiso de notificaciones denegado: los avisos no sonarán.');
      return;
    }
    const cantidad = await reprogramarAvisos(listarBloques(), listarMaterias(), ajustes);
    alMensaje(`Avisos programados: ${cantidad}.`);
  };

  const sincronizar = async (): Promise<void> => {
    try {
      const r = await sincronizarTodo();
      alMensaje(
        `Sincronizado · enviados ${r.enviados} · recibidos ${r.recibidos}` +
          (r.errores > 0 ? ` · ${r.errores} errores` : ''),
      );
    } catch {
      alMensaje('Sin conexión: tus cambios siguen pendientes en el teléfono.');
    }
  };

  return { usarMiUbicacion, activarAvisos, sincronizar };
}

/** Botones de avisos y sincronización + mensajes + cerrar sesión. */
function PieAjustes({
  mensaje,
  alActivarAvisos,
  alSincronizar,
  alSalir,
}: {
  mensaje: string | null;
  alActivarAvisos: () => void;
  alSincronizar: () => void;
  alSalir: () => void;
}): ReactElement {
  return (
    <>
      <Pressable
        style={styles.boton}
        onPress={alActivarAvisos}
        accessibilityRole="button"
        accessibilityLabel="Activar avisos semanales"
      >
        <Text style={styles.botonTexto}>🔔 Activar avisos semanales</Text>
      </Pressable>
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
  const router = useRouter();
  const [ajustes, setAjustes] = useState(leerAjustes());
  const [mensaje, setMensaje] = useState<string | null>(null);

  const guardar = (nuevos: Ajustes): void => {
    setAjustes(nuevos);
    guardarAjustes(nuevos);
    setMensaje('Guardado localmente; se sincroniza cuando haya conexión.');
  };

  const { usarMiUbicacion, activarAvisos, sincronizar } = useAccionesAjustes(
    ajustes,
    guardar,
    setMensaje,
  );

  return (
    <KeyboardAvoidingView style={styles.base} behavior="padding">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.titulo}>Ajustes</Text>
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
          alActivarAvisos={() => void activarAvisos()}
          alSincronizar={() => void sincronizar()}
          alSalir={() => void salir().then(() => router.replace('/login'))}
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
});
