/**
 * Git credentials at rest — a connection's private key, client secret, token and webhook secret, its installation
 * tokens, people's tokens, a repository's webhook secret — and the state of an authorization in flight, sealed with the application's secrets
 * service (`secrets.keys`), each bound to the record it belongs to. Without keys, storing one fails with
 * `SECRETS_KEY_MISSING`, which says what to configure.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import {
  createSecretsTableStore,
  type SecretsService,
  type SecretsStore,
} from '@nocobase/app-server/secrets';
import type { DatabaseConnection } from '@nocobase/db';

export const GIT_SECRET_PURPOSES = {
  privateKey: 'studio/git/private-key',
  clientSecret: 'studio/git/client-secret',
  connectionToken: 'studio/git/connection-token',
  connectionWebhookSecret: 'studio/git/connection-webhook-secret',
  accessToken: 'studio/git/access-token',
  refreshToken: 'studio/git/refresh-token',
  repoWebhookSecret: 'studio/git/repo-webhook-secret',
  authorizationState: 'studio/git/authorization-state',
  installationToken: 'studio/git/installation-token',
} as const;

export type GitSecretPurpose =
  (typeof GIT_SECRET_PURPOSES)[keyof typeof GIT_SECRET_PURPOSES];

/** What Studio's git integration needs of the secrets service. */
export type GitSecretsService = Pick<SecretsService, 'ready' | 'seal' | 'open'>;

export interface GitSecrets {
  /** False without secrets keys: nothing can be stored. */
  readonly ready: boolean;
  /** Throws `SECRETS_KEY_MISSING` without secrets keys. */
  seal(
    plaintext: string,
    purpose: GitSecretPurpose,
    aad: readonly string[],
  ): string;
  /** Null when there is nothing sealed, no keys, or it was sealed for another record or is damaged. */
  open(
    sealed: string | null,
    purpose: GitSecretPurpose,
    aad: readonly string[],
  ): string | null;
}

export function createGitSecrets(
  secrets: GitSecretsService | undefined,
): GitSecrets {
  return {
    ready: !!secrets?.ready,
    seal(plaintext, purpose, aad) {
      if (!secrets?.ready)
        throw new ProtocolError(
          'SECRETS_KEY_MISSING',
          'Secrets need a key: set secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
        );
      return secrets.seal(plaintext, { purpose, aad });
    },
    open(sealed, purpose, aad) {
      if (!sealed || !secrets?.ready) return null;
      try {
        return secrets.open(sealed, { purpose, aad });
      } catch {
        return null;
      }
    },
  };
}

const id = (row: Record<string, unknown>) => [String(row.id)];

/** The connections', people's and repositories' sealed values, for `nocobase secrets status` and `secrets rotate`. */
export function createGitSecretsStores(
  connection: () => DatabaseConnection,
): SecretsStore[] {
  const P = GIT_SECRET_PURPOSES;
  return [
    createSecretsTableStore({
      name: 'studio/git/connections',
      table: 'studioGitConnections',
      columns: [
        { column: 'privateKeySealed', purpose: P.privateKey, aad: id },
        { column: 'clientSecretSealed', purpose: P.clientSecret, aad: id },
        { column: 'tokenSealed', purpose: P.connectionToken, aad: id },
        {
          column: 'webhookSecretSealed',
          purpose: P.connectionWebhookSecret,
          aad: id,
        },
      ],
      connection,
    }),
    createSecretsTableStore({
      name: 'studio/git/user-auths',
      table: 'studioGitUserAuths',
      select: ['userId', 'connectionId'],
      columns: (
        [
          ['accessTokenSealed', P.accessToken],
          ['refreshTokenSealed', P.refreshToken],
        ] as const
      ).map(([column, purpose]) => ({
        column,
        purpose,
        aad: (row: Record<string, unknown>) => [
          String(row.userId),
          String(row.connectionId),
        ],
      })),
      connection,
    }),
    createSecretsTableStore({
      name: 'studio/git/installation-tokens',
      table: 'studioGitInstallationTokens',
      select: ['connectionId'],
      columns: [
        {
          column: 'valueSealed',
          purpose: P.installationToken,
          aad: (row: Record<string, unknown>) => [
            String(row.connectionId),
            String(row.id),
          ],
        },
      ],
      connection,
    }),
    createSecretsTableStore({
      name: 'studio/git/repos',
      table: 'studioGitRepos',
      columns: [
        {
          column: 'webhookSecretSealed',
          purpose: P.repoWebhookSecret,
          aad: id,
        },
      ],
      connection,
    }),
  ];
}
