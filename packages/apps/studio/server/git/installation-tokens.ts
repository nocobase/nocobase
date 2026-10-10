/**
 * Where a GitHub App connection's installation tokens are kept between calls: `@octokit/auth-app`'s cache, in the
 * database (`studioGitInstallationTokens`) so every process and every restart reuses a token until shortly before it
 * expires, instead of minting one per call. Each value is sealed for its connection and row; a connection's tokens
 * are forgotten when its installation changes or it is removed.
 */
import { createHash } from 'node:crypto';

import type { DatabaseConnection } from '@nocobase/db';

import type { AppTokenCache } from './platform.js';
import { GIT_SECRET_PURPOSES, type GitSecrets } from './sealing.js';

export const INSTALLATION_TOKENS = 'studioGitInstallationTokens';

export interface InstallationTokens {
  /** The cache of one connection's tokens. */
  of(connectionId: string): AppTokenCache;
  /** Forgets every token of a connection. */
  forget(connectionId: string): Promise<void>;
}

export function createInstallationTokens(deps: {
  readonly conn: () => DatabaseConnection;
  readonly secrets: GitSecrets;
  readonly now: () => Date;
}): InstallationTokens {
  const { conn, secrets, now } = deps;
  const P = GIT_SECRET_PURPOSES.installationToken;
  const idOf = (connectionId: string, key: string) =>
    createHash('sha256').update(`${connectionId}\n${key}`).digest('hex');

  return {
    of(connectionId) {
      return {
        async get(key) {
          const id = idOf(connectionId, key);
          const row = await conn()
            .query.selectFrom(INSTALLATION_TOKENS)
            .select(['valueSealed', 'expiresAt'])
            .where('id', '=', id)
            .executeTakeFirst();
          if (!row) return undefined;
          if (new Date(row.expiresAt as string | Date) <= now())
            return undefined;
          return (
            secrets.open(row.valueSealed as string, P, [connectionId, id]) ??
            undefined
          );
        },
        async set(key, value, expiresAt) {
          // Without secrets keys nothing is kept: the next call mints again.
          if (!secrets.ready) return;
          const id = idOf(connectionId, key);
          const valueSealed = secrets.seal(value, P, [connectionId, id]);
          await conn()
            .query.deleteFrom(INSTALLATION_TOKENS)
            .where((eb) =>
              eb.or([eb('id', '=', id), eb('expiresAt', '<=', now())]),
            )
            .execute();
          await conn()
            .query.insertInto(INSTALLATION_TOKENS)
            .values({ id, connectionId, valueSealed, expiresAt })
            .execute()
            // Another call kept one at the same moment: either is as good.
            .catch(() => undefined);
        },
      };
    },
    async forget(connectionId) {
      await conn()
        .query.deleteFrom(INSTALLATION_TOKENS)
        .where('connectionId', '=', connectionId)
        .execute();
    },
  };
}
