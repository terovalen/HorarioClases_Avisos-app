/** Proveedor de sesión: tokens en SecureStore, expuestos por contexto. */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  cerrarSesion,
  iniciarSesion,
  registrarUsuario,
  usuarioActual,
} from '../api/auth';
import type { UsuarioSesion } from '../api/tokens';

type EstadoSesion = {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  iniciar: (email: string, password: string) => Promise<void>;
  registrar: (email: string, password: string) => Promise<void>;
  salir: () => Promise<void>;
};

const SesionContexto = createContext<EstadoSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }): ReactNode {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    usuarioActual()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const iniciar = async (email: string, password: string): Promise<void> => {
    setUsuario(await iniciarSesion(email, password));
  };
  const registrar = async (email: string, password: string): Promise<void> => {
    setUsuario(await registrarUsuario(email, password));
  };
  const salir = async (): Promise<void> => {
    await cerrarSesion();
    setUsuario(null);
  };

  return (
    <SesionContexto.Provider value={{ usuario, cargando, iniciar, registrar, salir }}>
      {children}
    </SesionContexto.Provider>
  );
}

export function useSesion(): EstadoSesion {
  const valor = useContext(SesionContexto);
  if (!valor) throw new Error('useSesion fuera de ProveedorSesion');
  return valor;
}
