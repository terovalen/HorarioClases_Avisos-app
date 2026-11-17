/** Tipos de navegación para react-navigation. */
export type RootParamList = {
  Login: undefined;
  Tabs: undefined;
  Carga: undefined;
  NuevaMateria: { id?: string; bloque?: string } | undefined;
  Materias: undefined;
};

export type TabParamList = {
  Hoy: undefined;
  Semana: undefined;
  Ajustes: undefined;
};
