/** Botón «Activar avisos semanales»: pide el permiso de notificaciones y
 *  programa los avisos de todas las clases del horario. */
import { useState, type ReactElement } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { leerAjustes } from '../repositorios/ajustes';
import { listarBloques } from '../repositorios/bloques';
import { listarMaterias } from '../repositorios/materias';
import { pedirPermisoAvisos, reprogramarAvisos } from '../servicios/notificaciones';

export function BotonAvisos(): ReactElement {
  const [ocupado, setOcupado] = useState(false);

  const activar = async (): Promise<void> => {
    setOcupado(true);
    try {
      const permitido = await pedirPermisoAvisos();
      if (!permitido) {
        Alert.alert(
          'Avisos desactivados',
          'Activa las notificaciones de esta app en los ajustes del iPhone y vuelve a intentarlo.',
        );
        return;
      }
      const cantidad = await reprogramarAvisos(
        listarBloques(),
        listarMaterias(),
        leerAjustes(),
      );
      Alert.alert(
        'Avisos activados',
        cantidad === 0
          ? 'No hay clases en el horario: no hay avisos que programar.'
          : `Se programaron ${cantidad} avisos semanales.`,
      );
    } catch {
      Alert.alert(
        'Avisos no disponibles',
        'Este dispositivo no permite programar avisos (pasa por un build de desarrollo).',
      );
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Pressable
      style={styles.boton}
      onPress={() => void activar()}
      disabled={ocupado}
      accessibilityRole="button"
      accessibilityLabel="Activar avisos semanales"
    >
      <Text style={styles.texto}>
        {ocupado ? 'Activando avisos…' : '🔔 Activar avisos semanales'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    minHeight: 46,
    justifyContent: 'center',
  },
  texto: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});
