import 'server-only';
import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import {
  DEFAULT_ANNIVERSARIES,
  HE,
  SHE,
  LEGACY_COLOR_MAP,
  REMOVED_DEFAULT_ANNIVERSARIES,
} from '../const';

/**
 * Idempotently create tables and seed defaults. Called once when the db client
 * is first initialised.
 */
export function runMigrations(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS messages_created_idx ON messages(created_at DESC);

    CREATE TABLE IF NOT EXISTS message_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS message_photos_msg_idx ON message_photos(message_id);

    CREATE TABLE IF NOT EXISTS album_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      taken_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS album_taken_idx ON album_entries(taken_at DESC);

    CREATE TABLE IF NOT EXISTS album_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_id INTEGER NOT NULL REFERENCES album_entries(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS album_photos_entry_idx ON album_photos(entry_id);

    CREATE TABLE IF NOT EXISTS capsules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      unlock_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS capsules_unlock_idx ON capsules(unlock_at);

    CREATE TABLE IF NOT EXISTS capsule_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      capsule_id INTEGER NOT NULL REFERENCES capsules(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS anniversaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      is_lunar INTEGER NOT NULL DEFAULT 0,
      repeat_yearly INTEGER NOT NULL DEFAULT 1,
      emoji TEXT,
      color TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at INTEGER,
      cover_photo TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL REFERENCES users(id),
      mood TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      log_date TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS moods_author_date_uniq ON moods(author_id, log_date);

    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  seedDefaults(sqlite);
}

function seedDefaults(sqlite: Database.Database) {
  const now = Date.now();

  // Seed users
  const userCount = (sqlite.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
  if (userCount === 0) {
    const passA = process.env.USER_A_PASSWORD;
    const passB = process.env.USER_B_PASSWORD;
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 16) {
      throw new Error('[setup] JWT_SECRET 必须设置且长度 >= 16，请编辑 .env');
    }
    if (!passA || !passB) {
      throw new Error('[setup] USER_A_PASSWORD 与 USER_B_PASSWORD 必须在 .env 中设置');
    }

    const insert = sqlite.prepare(
      `INSERT INTO users (username, password_hash, display_name, avatar, created_at) VALUES (?, ?, ?, ?, ?)`
    );
    insert.run(
      process.env.USER_A_USERNAME || HE.username,
      bcrypt.hashSync(passA, 10),
      process.env.USER_A_NAME || HE.name,
      null,
      now
    );
    insert.run(
      process.env.USER_B_USERNAME || SHE.username,
      bcrypt.hashSync(passB, 10),
      process.env.USER_B_NAME || SHE.name,
      null,
      now
    );
    // eslint-disable-next-line no-console
    console.log('[setup] seeded 2 users');
  }

  // Seed default anniversaries (skip if same title already exists)
  const existing = sqlite
    .prepare(`SELECT title FROM anniversaries`)
    .all() as Array<{ title: string }>;
  const existingTitles = new Set(existing.map((r) => r.title));
  const insertAnn = sqlite.prepare(
    `INSERT INTO anniversaries (title, date, is_lunar, repeat_yearly, emoji, color, created_at) VALUES (?,?,?,?,?,?,?)`
  );
  for (const a of DEFAULT_ANNIVERSARIES) {
    if (!existingTitles.has(a.title)) {
      insertAnn.run(a.title, a.date, a.is_lunar, a.repeat_yearly, a.emoji, a.color, now);
    }
  }

  // 一次性迁移：把旧的浅色调换成深一档（只动那些跟旧默认值精确匹配的行，
  // 用户自定义颜色不会被改）
  const updateColor = sqlite.prepare(`UPDATE anniversaries SET color = ? WHERE color = ?`);
  for (const [oldHex, newHex] of Object.entries(LEGACY_COLOR_MAP)) {
    updateColor.run(newHex, oldHex);
  }

  // 一次性清理：删除非情侣相关的旧默认节日（仅删除 title+date+is_lunar 完全匹配
  // 旧默认值的行；用户自己改过日期或新增的同名条目不动）
  const deleteOldDefault = sqlite.prepare(
    `DELETE FROM anniversaries WHERE title = ? AND date = ? AND is_lunar = ?`
  );
  for (const r of REMOVED_DEFAULT_ANNIVERSARIES) {
    deleteOldDefault.run(r.title, r.date, r.is_lunar);
  }

  // Seed kv defaults
  sqlite
    .prepare(`INSERT OR IGNORE INTO kv (key, value, updated_at) VALUES ('love_count', '0', ?)`)
    .run(now);
}
