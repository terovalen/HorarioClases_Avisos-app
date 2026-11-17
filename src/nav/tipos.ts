/** Tipos de navegación para react-navigation. */
export type RootParamList = {
  Login: undefined;
  Tabs: undefined;
  NuevaMateria: { id?: string; bloque?: string } | undefined;
};

export type TabParamList = {
  Hoy: undefined;
  Semana: undefined;
  Ajustes: undefined;
};
