/** Inicio de sesión / registro mediado por la API. */
import {
  useNavigation,
  type NavigationProp,
  CommonActions,
} from '@react-navigation/native';
import { useState, type ReactElement } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { ErrorApi } from '../api/cliente';
import { useSesion } from '../servicios/sesion';
import type { RootParamList } from '../nav/tipos';

const CLAVE_MINIMA = 8;

function validarCredenciales(email: string, clave: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Escribe un correo válido.';
  if (clave.length < CLAVE_MINIMA) return 'La contraseña debe tener 8 caracteres o más.';
  return null;
}

type CamposProps = {
  email: string;
  setEmail: (v: string) => void;
  clave: string;
  setClave: (v: string) => void;
  error: string | null;
};

function CamposLogin(props: CamposProps): ReactElement {
  return (
    <>
      <TextInput
        style={styles.campo}
        placeholder="correo@ejemplo.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={props.email}
        onChangeText={props.setEmail}
        placeholderTextColor="#9ca3af"
        accessibilityLabel="Correo electrónico"
      />
      <TextInput
        style={styles.campo}
        placeholder="Contraseña (8 o más caracteres)"
        secureTextEntry
        value={props.clave}
        onChangeText={props.setClave}
        placeholderTextColor="#9ca3af"
        accessibilityLabel="Contraseña"
      />
      {props.error ? (
        <Text role="alert" style={styles.error}>
          {props.error}
        </Text>
      ) : null}
    </>
  );
}

function PieLogin({
  modoRegistro,
  ocupado,
  alEnviar,
  alCambiarModo,
}: {
  modoRegistro: boolean;
  ocupado: boolean;
  alEnviar: () => void;
  alCambiarModo: () => void;
}): ReactElement {
  return (
    <>
      <Pressable
        style={[styles.boton, ocupado && styles.botonOcupado]}
        onPress={alEnviar}
        disabled={ocupado}
        accessibilityRole="button"
        accessibilityLabel={modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
      >
        <Text style={styles.botonTexto}>
          {ocupado ? 'Enviando…' : modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
        </Text>
      </Pressable>
      <Pressable onPress={alCambiarModo} accessibilityRole="button">
        <Text style={styles.enlace}>
          {modoRegistro
            ? 'Ya tengo cuenta: iniciar sesión'
            : 'No tengo cuenta: registrarme'}
        </Text>
      </Pressable>
    </>
  );
}

export default function PantallaLogin(): ReactElement {
  const { iniciar, registrar } = useSesion();
  const navigation: NavigationProp<RootParamList> = useNavigation();
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (): Promise<void> => {
    const problema = validarCredenciales(email, clave);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setOcupado(true);
    try {
      if (modoRegistro) await registrar(email, clave);
      else await iniciar(email, clave);
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No hay conexión con la API.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.base} behavior="padding">
      <Text style={styles.titulo}>Horario de clases</Text>
      <Text style={styles.sub}>
        {modoRegistro ? 'Crea tu cuenta' : 'Entra con tu cuenta'}
      </Text>
      <CamposLogin
        email={email}
        setEmail={setEmail}
        clave={clave}
        setClave={setClave}
        error={error}
      />
      <PieLogin
        modoRegistro={modoRegistro}
        ocupado={ocupado}
        alEnviar={() => void enviar()}
        alCambiarModo={() => setModoRegistro(!modoRegistro)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 15, color: '#586272', textAlign: 'center', marginBottom: 8 },
  campo: {
    borderWidth: 1,
    borderColor: '#d6dbe2',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  error: { color: '#b91c1c', fontWeight: '600' },
  boton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  botonOcupado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  enlace: { color: '#2563eb', textAlign: 'center', padding: 8 },
});
