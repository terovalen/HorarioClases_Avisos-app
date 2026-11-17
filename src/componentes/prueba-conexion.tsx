/** Comprobación de conexión con la API: separa «no hay red» de «la API falló». */
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { apiUrl } from '../api/config';
import { ErrorApi, peticion } from '../api/cliente';

type Resultado = { ok: boolean; mensaje: string };

export function PruebaConexion(): ReactElement {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [probando, setProbando] = useState(false);

  const comprobar = async (): Promise<void> => {
    setProbando(true);
    const inicio = Date.now();
    try {
      const datos = await peticion<{ ok: boolean }>('/api/health');
      const ms = Date.now() - inicio;
      setResultado({
        ok: datos.ok === true,
        mensaje: `API accesible en ${ms} ms · ${apiUrl()}`,
      });
    } catch (error) {
      setResultado({
        ok: false,
        mensaje:
          error instanceof ErrorApi
            ? `HTTP ${error.estado}: ${error.message}`
            : 'No se pudo contactar con la API.',
      });
    } finally {
      setProbando(false);
    }
  };

  return (
    <View style={styles.base}>
      <Pressable
        style={styles.boton}
        onPress={() => void comprobar()}
        accessibilityRole="button"
        accessibilityLabel="Comprobar conexión con la API"
      >
        <Text style={styles.texto}>
          {probando ? 'Comprobando…' : '🌐 Comprobar conexión'}
        </Text>
      </Pressable>
      {resultado ? (
        <Text style={resultado.ok ? styles.ok : styles.error}>{resultado.mensaje}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { marginTop: 8 },
  boton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  texto: { color: '#1f2937', fontWeight: '700', textAlign: 'center' },
  ok: { color: '#14532d', fontWeight: '600', marginTop: 6 },
  error: { color: '#b91c1c', fontWeight: '600', marginTop: 6 },
});
