/** Banner de estado de conexión (rojo si no hay, verde si hay y se quita solo).
 *  Detecta la conexión haciendo pings a la API y muestra el estado automáticamente. */
import { useState, useEffect, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { peticion } from '../api/cliente';

/** Intervalo entre comprobaciones de conexión (ms). */
const INTERVALO_MS = 10000;

export function BannerConexion(): ReactElement | null {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [mostrarSinConexion, setMostrarSinConexion] = useState(false);

  useEffect(() => {
    let intervalo: NodeJS.Timeout | null = null;

    const comprobar = async (): Promise<void> => {
      try {
        await peticion<{ ok: boolean }>('/api/health');
        setConectado(true);
        setMostrarSinConexion(false);
      } catch {
        setConectado(false);
        setMostrarSinConexion(true);
      }
    };

    comprobar();
    intervalo = setInterval(comprobar, INTERVALO_MS);
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, []);

  if (conectado === null) return null;
  if (!mostrarSinConexion) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.texto}>
        🚨 Sin conexión · los cambios quedan guardados en el teléfono
      </Text>
      <Pressable style={styles.botonCerrar} onPress={() => setMostrarSinConexion(false)}>
        <Text style={styles.textoCerrar}>Descartar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  texto: { color: '#b91c1c', fontWeight: '700', fontSize: 14 },
  botonCerrar: { padding: 6 },
  textoCerrar: { color: '#b91c1c', fontWeight: '700' },
});
