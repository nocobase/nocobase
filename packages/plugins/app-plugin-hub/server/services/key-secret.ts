import { createDecipheriv, hkdfSync } from 'node:crypto';
import { assertSecretIsNotPlaceholder } from '@nocobase/app-server/config';
import type { SecretsService } from '@nocobase/app-server/secrets';

// This recoverable copy belongs to Hub. Authentication still uses the API Keys plugin's hash.

/** The purpose a Hub key's recoverable copy is sealed for with the secrets service. */
export const HUB_KEY_SECRET_PURPOSE =
  '@nocobase/app-plugin-hub/publishing-key-recovery';

/** The prefix of copies written before the secrets service, under a key derived from `auth.secret`. */
const LEGACY_PREFIX = 'v1.';

/**
 * What a Hub key's copy is sealed with: the application's secrets service for every new copy, and `auth.secret` to read
 * the `v1.` copies written before it.
 */
export interface HubKeySecrets {
  readonly secrets?: Pick<SecretsService, 'ready' | 'seal' | 'open'>;
  readonly legacySecret?: string;
}

/** Seals a key's copy, bound to the key and its owner. */
export function encryptKey(
  secret: string,
  id: string,
  owner: string,
  keys: HubKeySecrets,
): string {
  if (!keys.secrets?.ready)
    throw new Error(
      'Hub keys need secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
    );
  return keys.secrets.seal(secret, {
    purpose: HUB_KEY_SECRET_PURPOSE,
    aad: [id, owner],
  });
}

/** Opens a key's copy, sealed with the secrets service or, for an older one, under `auth.secret`. */
export function decryptKey(
  value: string,
  id: string,
  owner: string,
  keys: HubKeySecrets,
): string {
  if (isLegacyKeyCopy(value))
    return decryptLegacyKey(value, id, owner, keys.legacySecret);
  if (!keys.secrets?.ready)
    throw new Error(
      'Hub keys need secrets.keys in the application configuration, or SECRETS_KEYS in the environment.',
    );
  return keys.secrets.open(value, {
    purpose: HUB_KEY_SECRET_PURPOSE,
    aad: [id, owner],
  });
}

export function isLegacyKeyCopy(value: string): boolean {
  return value.startsWith(LEGACY_PREFIX);
}

function legacyKey(secret: string | undefined): Buffer {
  assertSecretIsNotPlaceholder(secret, 'auth.secret');
  if (!secret || secret.length < 32)
    throw new Error(
      'This Hub key was stored under auth.secret; keep the auth.secret it was stored with to read it.',
    );
  return Buffer.from(
    hkdfSync(
      'sha256',
      secret,
      'nocobase-hub',
      'publishing-key-recovery-v1',
      32,
    ),
  );
}

function decryptLegacyKey(
  value: string,
  id: string,
  owner: string,
  legacySecret: string | undefined,
): string {
  const [version, iv, tag, encrypted, extra] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !encrypted || extra !== undefined)
    throw new Error('Invalid encrypted Hub key.');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    legacyKey(legacySecret),
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAAD(Buffer.from(JSON.stringify([id, owner])));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
