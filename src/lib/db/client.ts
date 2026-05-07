import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { runMigrations } from './migrate';

declare global {
  // eslint-disable-next-line no-var
  var __db: BetterSQLite3Database<typeof schema> | undefined;
  // eslint-disable-next-line no-var
  var __sqlite: Database.Database | undefined;
}

function resolveDbPath(): string {
  const url = process.env.DATABASE_URL || 'file:./data/app.db';
  const raw = url.startsWith('file:') ? url.slice(5) : url;
  return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
}

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function init(): { db: BetterSQLite3Database<typeof schema>; sqlite: Database.Database } {
  const dbPath = resolveDbPath();
  ensureDir(path.dirname(dbPath));

  // open with a small timeout so concurrent next-build workers don't immediately crash
  const sqlite = new Database(dbPath, { timeout: 5000 });
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('busy_timeout = 5000');

  const db = drizzle(sqlite, { schema });
  runMigrations(sqlite);

  return { db, sqlite };
}

function getDb(): BetterSQLite3Database<typeof schema> {
  if (!globalThis.__db || !globalThis.__sqlite) {
    const { db, sqlite } = init();
    globalThis.__db = db;
    globalThis.__sqlite = sqlite;
  }
  return globalThis.__db!;
}

function getSqlite(): Database.Database {
  if (!globalThis.__sqlite) {
    getDb();
  }
  return globalThis.__sqlite!;
}

// Lazy proxies: opening the DB is deferred until the first actual access. This
// avoids `next build`'s page-data collection (which loads every route module
// in parallel) from racing on a single SQLite file.
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_t, prop) {
    const real = getDb() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_t, prop) {
    const real = getSqlite() as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export { schema };
