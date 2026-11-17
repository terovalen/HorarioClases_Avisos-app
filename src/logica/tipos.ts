/** Tipos de dominio compartidos por la lógica, los repositorios y las pantallas. */

export type Materia = {
  id: string;
  nombre: string;
  docente: string | null;
  salon: string | null;
  color: string;
};

export type Bloque = {
  id: string;
  materia_id: string;
  dia: number; // 1 = lunes … 7 = domingo
  hora_inicio: string; // "HH:MM" 24 h
  hora_fin: string; // "HH:MM" 24 h
  notificacion_id: string | null;
};

export type Ajustes = {
  campus_lat: number | null;
  campus_lng: number | null;
  minutos_aviso: number; // aviso N minutos antes de cada bloque
};

/** Bloque unido con su materia, para las vistas. */
export type BloqueConMateria = { bloque: Bloque; materia: Materia };

export type EstadoPantalla = 'cargando' | 'listo' | 'error';
