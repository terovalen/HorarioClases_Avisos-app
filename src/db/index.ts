/** Apertura de SQLite y migraciones. Esquema del documento (sección 8) con
 *  las columnas extra para sincronizar: remote_id, updated_at, deleted, pending. */
import * as SQLite from 'expo-sqlite';

let instancia: SQLite.SQLiteDatabase | null = null;

const ESQUEMA_V1 = `
CREATE TABLE IF NOT EXISTS materia (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  docente TEXT,
  salon TEXT,
  color TEXT NOT NULL DEFAULT '#2563eb',
  remote_id TEXT,
  updated_at TEXT,
  deleted INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bloque (
  id TEXT PRIMARY KEY,
  materia_id TEXT NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
  dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 7),
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  notificacion_id TEXT,
  CHECK (hora_fin > hora_inicio),
  remote_id TEXT,
  updated_at TEXT,
  deleted INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ajustes (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  campus_lat REAL,
  campus_lng REAL,
  minutos_aviso INTEGER NOT NULL DEFAULT 15,
  remote_id TEXT,
  updated_at TEXT,
  deleted INTEGER DEFAULT 0,
  pending INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sincro (
  recurso TEXT PRIMARY KEY,
  desde TEXT
);
`;

export function abrirBase(): SQLite.SQLiteDatabase {
  if (instancia) return instancia;
  instancia = SQLite.openDatabaseSync('horario.db');
  migrar(instancia);
  return instancia;
}

/** Migración por versión (PRAGMA user_version): hoy v1, mañana se agregan
 *  pasos nuevos sin destruir los datos del usuario. El esquema usa
 *  CREATE TABLE IF NOT EXISTS, así es seguro ejecutarlo siempre. */
function migrar(db: SQLite.SQLiteDatabase): void {
  const fila = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;
  db.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  if (version < 1) {
    db.execSync(ESQUEMA_V1);
    db.execSync('PRAGMA user_version = 1;');
  }
  // Asegurar que existan todas las tablas aunque la base de datos ya exista
  // desde una versión previa (CREATE TABLE IF NOT EXISTS es idempotente).
  db.execSync(ESQUEMA_V1);
}

/** Solo para pruebas. */
export function cerrarBase(): void {
  instancia?.closeSync();
  instancia = null;
}
