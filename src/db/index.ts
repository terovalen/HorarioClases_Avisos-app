/** Apertura de SQLite y migraciones. Esquema del documento (sección 8) con
 *  las columnas extra para sincronizar: remote_id, updated_at, deleted, pending. */
import * as SQLite from 'expo-sqlite';

let instancia: SQLite.SQLiteDatabase | null = null;

/** Cada tabla se crea por separado con CREATE TABLE IF NOT EXISTS, así es
 *  seguro ejecutar siempre aunque la base de datos ya exista. */
const ESQUEMA_TABLAS = [
  `CREATE TABLE IF NOT EXISTS materia (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    docente TEXT,
    salon TEXT,
    color TEXT NOT NULL DEFAULT '#2563eb',
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS bloque (
    id TEXT PRIMARY KEY,
    materia_id TEXT NOT NULL REFERENCES materia(id) ON DELETE CASCADE,
    dia INTEGER NOT NULL CHECK (dia BETWEEN 1 AND 7),
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    notificacion_id TEXT,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0,
    CHECK (hora_fin > hora_inicio)
  )`,
  `CREATE TABLE IF NOT EXISTS ajustes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    campus_lat REAL,
    campus_lng REAL,
    minutos_aviso INTEGER NOT NULL DEFAULT 15,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER DEFAULT 0,
    pending INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS sincro (
    recurso TEXT PRIMARY KEY,
    desde TEXT
  )`,
];

export function abrirBase(): SQLite.SQLiteDatabase {
  if (!instancia) {
    instancia = SQLite.openDatabaseSync('horario.db');
  }
  migrar(instancia);
  return instancia;
}

/** Migración por versión: crea todas las tablas si faltan (idempotente).
 *  Se ejecuta en cada apertura para recuperar bases de datos dañadas. */
function migrar(db: SQLite.SQLiteDatabase): void {
  try {
    db.execSync('PRAGMA foreign_keys = ON;');
  } catch {
    // PRAGMA puede fallar en algunos dispositivos; no bloquea.
  }
  for (const sentencia of ESQUEMA_TABLAS) {
    try {
      db.execSync(sentencia);
    } catch {
      // Cada CREATE TABLE IF NOT EXISTS es independiente; una falla no detiene las demás.
    }
  }
}

/** Solo para pruebas. */
export function cerrarBase(): void {
  instancia?.closeSync();
  instancia = null;
}
