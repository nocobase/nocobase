/**
 * What the plugin must read back later — an environment's credentials, a registry's passwords — sealed with the
 * application's secrets service (`secrets.keys`), one purpose per use, the record's id bound as additional data so a
 * ciphertext cannot be moved to another record. Tokens the plugin only verifies (upload tickets) are stored as SHA-256
 * hashes instead.
 */
import { createHash, randomBytes } from 'node:crypto';

import type { SecretsService } from '@nocobase/app-server/secrets';

import { ReleasesError } from '../errors.js';

export type SecretPurpose =
  | 'environment-credentials'
  | 'registry-credentials'
  | 'variables'
  | 'deployment-env'
  | 'initial-admin';

/** What the plugin needs of the secrets service. */
export type ReleasesSecrets = Pick<SecretsService, 'ready' | 'seal' | 'open'>;

/** The purpose a kind of credentials is sealed for. */
export function secretPurpose(purpose: SecretPurpose): string {
  return `@nocobase/app-plugin-releases/${purpose}`;
}

function ready(secrets: ReleasesSecrets | undefined): ReleasesSecrets {
  if (!secrets?.ready)
    throw new ReleasesError(
      'Credentials cannot be stored or read: set secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
      'SECRETS_NOT_CONFIGURED',
      'UNAVAILABLE',
    );
  return secrets;
}

export function encryptText(
  plain: string,
  identity: readonly string[],
  secrets: ReleasesSecrets | undefined,
  purpose: SecretPurpose,
): string {
  return ready(secrets).seal(plain, {
    purpose: secretPurpose(purpose),
    aad: identity,
  });
}

export function decryptText(
  value: string,
  identity: readonly string[],
  secrets: ReleasesSecrets | undefined,
  purpose: SecretPurpose,
): string {
  return ready(secrets).open(value, {
    purpose: secretPurpose(purpose),
    aad: identity,
  });
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function randomToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('base64url');
}
