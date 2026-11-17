/** Contenido de la app dentro de ProveedorSesion: navegación con react-navigation.
 *  Stack principal con Login, Tabs (Hoy, Semana, Ajustes) y NuevaMateria.
 *  El flujo de auth se maneja dentro de cada pantalla con useEffect. */
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Notificaciones from 'expo-notifications';
import { useEffect, type ReactElement } from 'react';
import { Text } from 'react-native';
import { EstadoCarga } from './componentes/estado-carga';
import { useSesion } from './servicios/sesion';
import PantallaLogin from './screens/Login';
import PantallaHoy from './screens/Hoy';
import PantallaSemana from './screens/Semana';
import PantallaAjustes from './screens/Ajustes';
import PantallaNuevaMateria from './screens/NuevaMateria';
import PantallaMaterias from './screens/Materias';
import type { RootParamList, TabParamList } from './nav/tipos';

const Stack = createStackNavigator<RootParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function PantallaTabs(): ReactElement {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="Hoy"
        component={PantallaHoy}
        options={{
          title: 'Hoy',
          tabBarIcon: () => <Text>⏰</Text>,
        }}
      />
      <Tabs.Screen
        name="Semana"
        component={PantallaSemana}
        options={{
          title: 'Semana',
          tabBarIcon: () => <Text>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="Ajustes"
        component={PantallaAjustes}
        options={{
          title: 'Ajustes',
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tabs.Navigator>
  );
}

export function AppContenido(): ReactElement {
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

  const { usuario, cargando } = useSesion();

  if (cargando) {
    return <EstadoCarga estado="cargando" />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={usuario ? 'Tabs' : 'Login'}
      >
        <Stack.Screen name="Login" component={PantallaLogin} />
        <Stack.Screen name="Tabs" component={PantallaTabs} />
        <Stack.Screen
          name="NuevaMateria"
          component={PantallaNuevaMateria}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Materias"
          component={PantallaMaterias}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
