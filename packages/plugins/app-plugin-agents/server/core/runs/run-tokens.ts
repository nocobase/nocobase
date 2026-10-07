/**
 * Run tokens: the credential an agent's CLI calls the server with during its run. A token is minted when a runner
 * claims the run, works only while that runner holds the run, and is revoked when the run leaves it (ends, or goes
 * back to the queue).
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import { later, type Clock } from '../../kernel/clock.js';
import {
  CREDENTIAL_PREFIX,
  createCredential,
  hashCredential,
} from '../../kernel/crypto.js';
import type { IdSource } from '../../kernel/ids.js';
import { RUN_TOKEN_TTL_MS } from './policy.js';
import {
  findRunRecord,
  isActive,
  tokensRepo,
  type RunRecord,
  type TokenRecord,
} from './run.store.js';

export interface MintedToken {
  readonly value: string;
  readonly expiresAt: string;
}

export async function mintRunToken(
  conn: DatabaseConnection,
  deps: { readonly ids: IdSource; readonly clock: Clock },
  run: RunRecord,
  runnerId: string,
): Promise<MintedToken> {
  const now = deps.clock.now();
  const value = createCredential(CREDENTIAL_PREFIX.runToken);
  const expiresAt = later(now, RUN_TOKEN_TTL_MS);
  await tokensRepo(conn).createOne({
    values: {
      id: deps.ids.next(),
      tokenHash: hashCredential(value),
      runId: run.id,
      runnerId,
      agentId: run.agentId,
      actorUserId: run.actorUserId,
      expiresAt,
      revokedAt: null,
      createdAt: now.toISOString(),
    },
  });
  return { value, expiresAt };
}

export interface RunTokenIdentity {
  readonly token: TokenRecord;
  readonly run: RunRecord;
}

/** The run a token belongs to, while it is valid; `RUN_TOKEN_INVALID` otherwise. */
export async function authenticateRunToken(
  conn: DatabaseConnection,
  clock: Clock,
  value: string,
): Promise<RunTokenIdentity> {
  const invalid = new ProtocolError(
    'RUN_TOKEN_INVALID',
    'The run token is not valid: the run ended or moved to another runner.',
  );
  if (!value) throw invalid;
  const token = await tokensRepo(conn).findOne({
    filter: { tokenHash: hashCredential(value) },
  });
  if (
    !token ||
    token.revokedAt ||
    Date.parse(token.expiresAt) <= clock.now().getTime()
  )
    throw invalid;
  const run = await findRunRecord(conn, token.runId);
  if (!run || !isActive(run.status) || run.runnerId !== token.runnerId)
    throw invalid;
  return { token, run };
}

/** Whether `runnerId` was ever given a token for the run, that is, ever held it. */
export async function everHeld(
  conn: DatabaseConnection,
  runId: string,
  runnerId: string,
): Promise<boolean> {
  return tokensRepo(conn).exists({ filter: { runId, runnerId } });
}
