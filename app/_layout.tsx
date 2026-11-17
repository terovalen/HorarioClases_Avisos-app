/** Layout raíz: GestureHandlerRootView, proveedor de sesión y redirección. */
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactElement } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { EstadoCarga } from '../src/componentes/estado-carga';
import { ProveedorSesion, useSesion } from '../src/servicios/sesion';
import * as Notificaciones from 'expo-notifications';

function RutasPorSesion(): ReactElement | null {
  const { usuario, cargando } = useSesion();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    const actual = segmentos[segmentos.length - 1];
    const enLogin = actual === 'login';
    if (!usuario && !enLogin) {
      router.replace('/login');
    } else if (usuario && enLogin) {
      router.replace('/(tabs)');
    }
  }, [usuario, cargando, segmentos, router]);

  if (cargando) return <EstadoCarga estado="cargando" />;
  return null;
}

export default function LayoutRaiz(): ReactElement {
  useEffect(() => {
    Notificaciones.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ProveedorSesion>
        <StatusBar style="auto" />
        <RutasPorSesion />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="materia/nueva" options={{ headerShown: false }} />
          <Stack.Screen name="ajustes" options={{ headerShown: false }} />
        </Stack>
      </ProveedorSesion>
    </GestureHandlerRootView>
  );
}
