/**
 * The accounts of the authentication plugin, as this plugin needs them: display names and existence.
 *
 * Thin stand-in: the authentication plugin's `UserAdministrationService` reads one user at a time, so batches read its
 * `user` collection directly. Keep every such read in this file.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { oneOf, unique } from './db.js';

const USERS = 'user';

export interface UserSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
}

interface UserRow {
  readonly id: string;
  readonly name: string | null;
  readonly username: string | null;
  readonly email: string | null;
  readonly disabledAt: string | null;
  readonly deletedAt: string | null;
  /** `person`, or `service` for a service account (an API key's identity), which acts only through API keys. */
  readonly kind?: string | null;
}

/** A service account, the identity of an organization's API key, as the actor display names it. */
export interface ApiKeyActorSummary {
  readonly id: string;
  readonly name: string;
  readonly disabled: boolean;
}

const isService = (row: UserRow) => row.kind === 'service';

function summaryOf(row: UserRow): UserSummary {
  return {
    id: row.id,
    name: row.name || row.username || row.email || row.id,
    email: row.email,
  };
}

export interface UserDirectory {
  /** Display names by id; unknown ids are left out. */
  names(
    conn: DatabaseConnection,
    ids: Iterable<string | null | undefined>,
  ): Promise<Map<string, string>>;
  /** One account, active or not; undefined when it does not exist. */
  find(
    conn: DatabaseConnection,
    id: string,
  ): Promise<(UserSummary & { readonly active: boolean }) | undefined>;
  /** An account that exists and is neither disabled nor deleted. */
  isActive(conn: DatabaseConnection, id: string): Promise<boolean>;
  /** Account ids by address; addresses are compared lower-cased, as the authentication plugin stores them. */
  idsByEmail(
    conn: DatabaseConnection,
    emails: readonly string[],
  ): Promise<Map<string, string>>;
  /** Every active person, by name: service accounts are not people and are never offered in a picker. */
  listActive(conn: DatabaseConnection): Promise<UserSummary[]>;
  /** An active account that is a person, not a service account: someone who may be admitted, own or be notified. */
  isPerson(conn: DatabaseConnection, id: string): Promise<boolean>;
  /** Of `ids`, the ones that are people (not service accounts), in any state. */
  people(
    conn: DatabaseConnection,
    ids: Iterable<string | null | undefined>,
  ): Promise<Set<string>>;
  /** Every service account (an API key identity), deleted ones included, by name. */
  apiKeyActors(conn: DatabaseConnection): Promise<ApiKeyActorSummary[]>;
}

export function createUserDirectory(): UserDirectory {
  const users = (conn: DatabaseConnection) => conn.repository<UserRow>(USERS);
  const find: UserDirectory['find'] = async (conn, id) => {
    const row = await users(conn).findOne({ filter: { id } });
    return row
      ? { ...summaryOf(row), active: !row.disabledAt && !row.deletedAt }
      : undefined;
  };
  return {
    async names(conn, ids) {
      const wanted = unique(ids);
      if (wanted.length === 0) return new Map();
      const rows = await users(conn).findMany({
        filter: (f) => oneOf(f, 'id', wanted),
      });
      return new Map(rows.map((row) => [row.id, summaryOf(row).name]));
    },
    find,
    async isActive(conn, id) {
      return (await find(conn, id))?.active ?? false;
    },
    async idsByEmail(conn, emails) {
      const result = new Map<string, string>();
      if (emails.length === 0) return result;
      const rows = await users(conn).findMany({
        filter: (f) => oneOf(f, 'email', emails),
      });
      for (const row of rows) {
        const email = row.email?.toLowerCase();
        if (email && !result.has(email)) result.set(email, row.id);
      }
      return result;
    },
    async listActive(conn) {
      const rows = await users(conn).findMany({
        filter: (f) =>
          f.and([f.date('disabledAt').empty(), f.date('deletedAt').empty()]),
      });
      return rows
        .filter((row) => !isService(row))
        .map(summaryOf)
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async isPerson(conn, id) {
      const row = await users(conn).findOne({ filter: { id } });
      return Boolean(
        row && !row.disabledAt && !row.deletedAt && !isService(row),
      );
    },
    async people(conn, ids) {
      const wanted = unique(ids);
      if (wanted.length === 0) return new Set();
      const rows = await users(conn).findMany({
        filter: (f) => oneOf(f, 'id', wanted),
      });
      return new Set(
        rows.filter((row) => !isService(row)).map((row) => row.id),
      );
    },
    async apiKeyActors(conn) {
      // Deleted keys included: what they did keeps their name.
      const rows = await users(conn).findMany({
        filter: (f) => f.string('kind').eq('service'),
      });
      return rows
        .map((row) => ({
          id: row.id,
          name: summaryOf(row).name,
          disabled: Boolean(row.disabledAt),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  };
}
