/**
 * What Studio's git tests share: a token connection to the GitHub stand-in, a repository reached through it, and a
 * delivery signed as GitHub signs one.
 */
import { createHmac } from 'node:crypto';

import {
  ensureRepo,
  findRepoById,
  updateRepo,
  type RepoRow,
} from '../../server/git/store.js';
import type { GitConnection } from '../../shared/git.js';
import type { BridgeHarness } from '../agents/bridge-harness.js';

export const API = 'https://api.github.com';

/** A token connection whose token the stand-in accepts (and only it, once any token is set). */
export async function tokenConnection(
  h: BridgeHarness,
  token = 'ghp_read',
): Promise<GitConnection> {
  h.github.tokens.add(token);
  return h.gitConnections.create('alice', {
    kind: 'token',
    name: 'GitHub',
    token,
    account: 'acme',
  });
}

/** The repository's row, reached through a token connection. */
export async function connectedRepo(
  h: BridgeHarness,
  repo: string,
  connection?: GitConnection,
): Promise<RepoRow> {
  const via = connection ?? (await tokenConnection(h));
  const conn = h.projects.tx.read();
  const row = await ensureRepo(conn, API, repo);
  await updateRepo(conn, row.id, { connectionId: via.id });
  return (await findRepoById(conn, row.id))!;
}

/** A project working directory linked to `repo` through `connection`. */
export function bindingOf(connection: GitConnection, repo: string, id = '1') {
  return {
    provider: 'github',
    connectionId: connection.id,
    repoId: id,
    fullName: repo,
  };
}

/** `X-Hub-Signature-256` of a body under `secret`, as GitHub sends it. */
export function signBody(secret: string, body: string | Uint8Array): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}
