/** Punto de entrada de la app: navegación tradicional con react-navigation.
 *  Login si no hay sesión; Tabs (Hoy, Semana, Ajustes) si hay sesión.
 *  NuevaMateria se abre como pantalla del stack desde cualquiera de las pestañas. */
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactElement } from 'react';
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notificaciones from 'expo-notifications';
import { EstadoCarga } from './src/componentes/estado-carga';
import { ProveedorSesion, useSesion } from './src/servicios/sesion';
import PantallaLogin from './src/screens/Login';
import PantallaHoy from './src/screens/Hoy';
import PantallaSemana from './src/screens/Semana';
import PantallaAjustes from './src/screens/Ajustes';
import PantallaNuevaMateria from './src/screens/NuevaMateria';
import type { RootParamList, TabParamList } from './src/nav/tipos';

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

export default function App(): ReactElement {
  const { usuario, cargando } = useSesion();

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

  if (cargando) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <EstadoCarga estado="cargando" />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <NavigationContainer>
        <ProveedorSesion>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!usuario ? (
              <Stack.Screen name="Login" component={PantallaLogin} />
            ) : (
              <Stack.Screen name="Tabs" component={PantallaTabs} />
            )}
            <Stack.Screen
              name="NuevaMateria"
              component={PantallaNuevaMateria}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </ProveedorSesion>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
