/**
 * Per-user preferences: small values a person chooses for themselves (their language, their theme, whether the inbox
 * chimes), kept on the server so they follow the person to every browser. Each value is JSON under a key the
 * application names; this service only stores them and never interprets one. Who may read or write whose preferences
 * is the caller's decision: the HTTP API serves only the signed-in person's own.
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

const TABLE = 'userPreferences';

/** A key: lower-case letters, digits, dots, dashes and underscores, starting with a letter, at most 100 characters. */
export const USER_PREFERENCE_KEY_PATTERN: RegExp = /^[a-z][a-z0-9._-]{0,99}$/u;

/** The longest a value may be once written as JSON. */
export const MAX_USER_PREFERENCE_BYTES = 4096;

/** At most this many preferences per person. */
export const MAX_USER_PREFERENCES = 200;

export type UserPreferenceValue =
  | string
  | number
  | boolean
  | null
  | readonly UserPreferenceValue[]
  | { readonly [key: string]: UserPreferenceValue };

export type UserPreferences = Readonly<Record<string, UserPreferenceValue>>;

export class UserPreferenceError extends Error {
  constructor(
    readonly code:
      | 'INVALID_PREFERENCE_KEY'
      | 'INVALID_PREFERENCE_VALUE'
      | 'TOO_MANY_PREFERENCES',
    message: string,
  ) {
    super(message);
    this.name = 'UserPreferenceError';
  }
}

export interface UserPreferencesService {
  /** Every preference of `userId`, by key. */
  list(userId: string): Promise<UserPreferences>;
  get(userId: string, key: string): Promise<UserPreferenceValue | undefined>;
  /** Stores one value, replacing what the key held. */
  set(userId: string, key: string, value: unknown): Promise<void>;
  /** Stores several values in one transaction. */
  setMany(
    userId: string,
    values: Readonly<Record<string, unknown>>,
  ): Promise<void>;
  remove(userId: string, key: string): Promise<void>;
  /** Every preference of `userId`, as when the account is deleted. */
  removeAll(userId: string): Promise<void>;
}

export interface UserPreferencesServiceOptions {
  readonly database: Pick<DatabaseManager, 'connection' | 'transaction'>;
}

interface PreferenceRow {
  readonly key: string;
  readonly value: string;
}

export function checkPreferenceKey(key: unknown): string {
  if (typeof key !== 'string' || !USER_PREFERENCE_KEY_PATTERN.test(key))
    throw new UserPreferenceError(
      'INVALID_PREFERENCE_KEY',
      'A preference key is 1 to 100 lower-case letters, digits, dots, dashes or underscores, starting with a letter.',
    );
  return key;
}

/** The value as stored: JSON text of at most `MAX_USER_PREFERENCE_BYTES`. */
export function encodePreferenceValue(value: unknown): string {
  let text: string | undefined;
  try {
    text = JSON.stringify(value);
  } catch {
    text = undefined;
  }
  if (text === undefined || value === undefined)
    throw new UserPreferenceError(
      'INVALID_PREFERENCE_VALUE',
      'A preference value must be JSON.',
    );
  if (new TextEncoder().encode(text).length > MAX_USER_PREFERENCE_BYTES)
    throw new UserPreferenceError(
      'INVALID_PREFERENCE_VALUE',
      `A preference value must be at most ${MAX_USER_PREFERENCE_BYTES} bytes of JSON.`,
    );
  return text;
}

function decode(text: string): UserPreferenceValue | undefined {
  try {
    return JSON.parse(text) as UserPreferenceValue;
  } catch {
    return undefined;
  }
}

export function createUserPreferencesService(
  options: UserPreferencesServiceOptions,
): UserPreferencesService {
  const { database } = options;

  async function write(
    connection: DatabaseConnection,
    userId: string,
    key: string,
    text: string,
  ): Promise<void> {
    const now = new Date();
    const existing = await connection.query
      .selectFrom(TABLE)
      .select('id')
      .where('userId', '=', userId)
      .where('key', '=', key)
      .executeTakeFirst();
    if (existing) {
      await connection.query
        .updateTable(TABLE)
        .set({ value: text, updatedAt: now })
        .where('userId', '=', userId)
        .where('key', '=', key)
        .execute();
      return;
    }
    // Bounded by the cap itself, so reading the keys is as cheap as counting them.
    const held = await connection.query
      .selectFrom(TABLE)
      .select('id')
      .where('userId', '=', userId)
      .limit(MAX_USER_PREFERENCES)
      .execute();
    if (held.length >= MAX_USER_PREFERENCES)
      throw new UserPreferenceError(
        'TOO_MANY_PREFERENCES',
        `A person keeps at most ${MAX_USER_PREFERENCES} preferences.`,
      );
    await connection.query
      .insertInto(TABLE)
      .values({
        id: randomUUID(),
        userId,
        key,
        value: text,
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  }

  return {
    async list(userId) {
      const rows = await database
        .connection()
        .query.selectFrom(TABLE)
        .select(['key', 'value'])
        .where('userId', '=', userId)
        .orderBy('key', 'asc')
        .execute();
      const result: Record<string, UserPreferenceValue> = {};
      for (const row of rows as unknown as PreferenceRow[]) {
        const value = decode(row.value);
        if (value !== undefined) result[row.key] = value;
      }
      return result;
    },

    async get(userId, key) {
      const row = await database
        .connection()
        .query.selectFrom(TABLE)
        .select(['key', 'value'])
        .where('userId', '=', userId)
        .where('key', '=', checkPreferenceKey(key))
        .executeTakeFirst<PreferenceRow>();
      return row ? decode(row.value) : undefined;
    },

    async set(userId, key, value) {
      const checked = checkPreferenceKey(key);
      const text = encodePreferenceValue(value);
      await database.transaction((connection) =>
        write(connection, userId, checked, text),
      );
    },

    async setMany(userId, values) {
      const entries = Object.entries(values).map(
        ([key, value]) =>
          [checkPreferenceKey(key), encodePreferenceValue(value)] as const,
      );
      await database.transaction(async (connection) => {
        for (const [key, text] of entries)
          await write(connection, userId, key, text);
      });
    },

    async remove(userId, key) {
      await database
        .connection()
        .query.deleteFrom(TABLE)
        .where('userId', '=', userId)
        .where('key', '=', checkPreferenceKey(key))
        .execute();
    },

    async removeAll(userId) {
      await database
        .connection()
        .query.deleteFrom(TABLE)
        .where('userId', '=', userId)
        .execute();
    },
  };
}
