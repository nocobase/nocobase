/**
 * People as this plugin shows them: names for owners and audit lines, whom to pick from when an agent is shared with
 * some people, and who can no longer act (whose runners stop authenticating). The plugin keeps no users of its own;
 * the application plugs its directory in (its members, say). Without one, people are shown by id, there is no one to
 * pick and nobody is inactive.
 */
import type { DatabaseConnection } from '@nocobase/db';

import type { UserRef } from '../../shared/agents.js';

export interface PeopleSource {
  names(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<ReadonlyMap<string, string>>;
  list(conn: DatabaseConnection): Promise<readonly UserRef[]>;
  /**
   * Of `ids`, the people who can no longer act (an account disabled or deleted). A runner whose owner is among them
   * stops authenticating. Without it, nobody is.
   */
  inactive?(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<ReadonlySet<string>>;
}

export interface People {
  /** Sets the directory; returns what removes it. */
  provide(source: PeopleSource): () => void;
  /** The names of `ids` that the directory knows. */
  names(
    conn: DatabaseConnection,
    ids: readonly (string | null | undefined)[],
  ): Promise<ReadonlyMap<string, string>>;
  list(conn: DatabaseConnection): Promise<readonly UserRef[]>;
  /** Of `ids`, those the directory says can no longer act; none without a directory that says. */
  inactive(
    conn: DatabaseConnection,
    ids: readonly (string | null | undefined)[],
  ): Promise<ReadonlySet<string>>;
}

export function createPeople(): People {
  let source: PeopleSource | undefined;
  return {
    provide(next) {
      source = next;
      return () => {
        if (source === next) source = undefined;
      };
    },
    async names(conn, ids) {
      const wanted = [
        ...new Set(ids.filter((id): id is string => Boolean(id))),
      ];
      if (!source || wanted.length === 0) return new Map();
      return source.names(conn, wanted);
    },
    list: async (conn) => (source ? source.list(conn) : []),
    async inactive(conn, ids) {
      const wanted = [
        ...new Set(ids.filter((id): id is string => Boolean(id))),
      ];
      if (!source?.inactive || wanted.length === 0) return new Set();
      return source.inactive(conn, wanted);
    },
  };
}
