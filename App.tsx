/** Punto de entrada de la app: navegación tradicional con react-navigation.
 *  Login si no hay sesión; Tabs (Hoy, Semana, Ajustes) si hay sesión.
 *  NuevaMateria se abre como pantalla del stack desde cualquiera de las pestañas. */
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { type ReactElement } from 'react';
import { ProveedorSesion } from './src/servicios/sesion';
import { AppContenido } from './src/app-contenido';

export default function App(): ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <ProveedorSesion>
        <AppContenido />
      </ProveedorSesion>
    </GestureHandlerRootView>
  );
}
