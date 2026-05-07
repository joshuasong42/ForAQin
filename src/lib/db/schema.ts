import { sqliteTable, integer, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar'),
  createdAt: integer('created_at').notNull(),
});

export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const messagePhotos = sqliteTable('message_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  messageId: integer('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const albumEntries = sqliteTable('album_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  takenAt: integer('taken_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const albumPhotos = sqliteTable('album_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entryId: integer('entry_id').notNull().references(() => albumEntries.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const capsules = sqliteTable('capsules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  unlockAt: integer('unlock_at').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const capsulePhotos = sqliteTable('capsule_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  capsuleId: integer('capsule_id').notNull().references(() => capsules.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const anniversaries = sqliteTable('anniversaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  isLunar: integer('is_lunar').notNull().default(0),
  repeatYearly: integer('repeat_yearly').notNull().default(1),
  emoji: text('emoji'),
  color: text('color'),
  createdAt: integer('created_at').notNull(),
});

export const wishes = sqliteTable('wishes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  completed: integer('completed').notNull().default(0),
  completedAt: integer('completed_at'),
  coverPhoto: text('cover_photo'),
  createdAt: integer('created_at').notNull(),
});

export const moods = sqliteTable(
  'moods',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    authorId: integer('author_id').notNull().references(() => users.id),
    mood: text('mood').notNull(),
    note: text('note').notNull().default(''),
    logDate: text('log_date').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    uniq: uniqueIndex('moods_author_date_uniq').on(table.authorId, table.logDate),
  })
);

// 全局键值存储 - 用于 ❤️ 计数器等小数据
export const kv = sqliteTable('kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
