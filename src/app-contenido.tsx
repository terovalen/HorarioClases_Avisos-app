/** Contenido de la app dentro de ProveedorSesion: navegación con react-navigation.
 *  Login si no hay sesión; Tabs (Hoy, Semana, Ajustes) si hay sesión.
 *  NuevaMateria se abre como pantalla del stack desde cualquiera de las pestañas. */
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

/** Pantalla de carga mientras se resuelve la sesión. */
function PantallaCarga(): ReactElement {
  return <EstadoCarga estado="cargando" />;
}

export function AppContenido(): ReactElement {
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {cargando ? (
          <Stack.Screen name="Carga" component={PantallaCarga} />
        ) : !usuario ? (
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
    </NavigationContainer>
  );
}
