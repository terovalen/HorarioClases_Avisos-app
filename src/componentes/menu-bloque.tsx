/** Menú de un bloque (alternativa por botón a los gestos): eliminar o
 *  ajustar la hora de fin en pasos de 15 minutos. */
import { useState, type ReactElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatearHora, minutosAHora, minutosDelDia, parseHora } from '../logica/tiempo';
import type { Bloque } from '../logica/tipos';
import type { Resultado } from '../hooks/use-semana';

type Props = {
  bloque: Bloque | null;
  alEliminar: (id: string) => Promise<void>;
  alAjustarFin: (id: string, hora_fin: string) => Promise<Resultado>;
  alCerrar: () => void;
};

/** Botón de acción del menú con etiqueta accesible. */
function TextoError({ mensaje }: { mensaje: string }): ReactElement {
  return (
    <Text role="alert" style={styles.error}>
      {mensaje}
    </Text>
  );
}

function BotonAccion({
  texto,
  etiqueta,
  peligro,
  alPulsar,
}: {
  texto: string;
  etiqueta: string;
  peligro?: boolean;
  alPulsar: () => void;
}): ReactElement {
  return (
    <Pressable
      style={[styles.boton, peligro && styles.peligro]}
      onPress={alPulsar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      <Text style={[styles.texto, peligro && styles.textoPeligro]}>{texto}</Text>
    </Pressable>
  );
}

export function MenuBloque({
  bloque,
  alEliminar,
  alAjustarFin,
  alCerrar,
}: Props): ReactElement {
  const [errores, setErrores] = useState<string[]>([]);

  if (!bloque) return <Modal visible={false} />;

  const finActual = minutosDelDia(parseHora(bloque.hora_fin) ?? { h: 0, m: 0 });

  const cambiarFin = async (delta: number): Promise<void> => {
    const nueva = formatearHora(minutosAHora(finActual + delta));
    const r = await alAjustarFin(bloque.id, nueva);
    if (!r.ok) setErrores(r.errores);
    else alCerrar();
  };

  const eliminarActual = (): void => {
    setErrores([]);
    void alEliminar(bloque.id).then(alCerrar);
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={alCerrar}>
      <View style={styles.velo}>
        <View style={styles.caja}>
          <Text style={styles.titulo}>{`${bloque.hora_inicio}–${bloque.hora_fin}`}</Text>
          {errores.map((e) => (
            <TextoError key={e} mensaje={e} />
          ))}
          <BotonAccion
            texto="Fin +30 min"
            etiqueta="Extender fin 30 minutos"
            alPulsar={() => void cambiarFin(30)}
          />
          <BotonAccion
            texto="Fin −30 min"
            etiqueta="Acortar fin 30 minutos"
            alPulsar={() => void cambiarFin(-30)}
          />
          <BotonAccion
            texto="Eliminar bloque"
            etiqueta="Eliminar bloque"
            peligro
            alPulsar={eliminarActual}
          />
          <BotonAccion texto="Cerrar" etiqueta="Cerrar menú" alPulsar={alCerrar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  velo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  caja: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8 },
  titulo: { fontSize: 16, fontWeight: '800' },
  error: { color: '#b91c1c', fontWeight: '600' },
  boton: {
    backgroundColor: '#f1f3f6',
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  texto: { fontWeight: '700', color: '#1f2937' },
  peligro: { backgroundColor: '#fee2e2' },
  textoPeligro: { color: '#b91c1c' },
});
