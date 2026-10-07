import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

import { SecretsError } from './errors.js';
import {
  decodeSecretKey,
  type SecretKeyEntry,
  validateSecretKeys,
} from './keys.js';

/** HKDF salt of every derived key. A new derivation scheme gets a new salt. */
export const SECRETS_HKDF_SALT = 'nocobase/secrets/v1';

/** The envelope prefix, which also names the format version. */
export const SECRETS_ENVELOPE_PREFIX = 'nbs1';

const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

/** What a caller binds a secret to. `aad` is extra context, such as a record id, that must match on open. */
export interface SecretsSealOptions {
  readonly purpose: string;
  readonly aad?: readonly string[];
}

/** What an envelope says about itself without opening it. */
export interface SecretsEnvelopeInfo {
  readonly version: number;
}

/** A key derived for one purpose and one key version, as libraries with their own encryption take it. */
export interface DerivedSecret {
  readonly version: number;
  readonly value: string;
}

export interface Keyring {
  /** The version new secrets are sealed with: the first configured key. */
  readonly currentVersion: number;
  /** Every configured version, current first. */
  readonly versions: readonly number[];
  seal(plaintext: string, options: SecretsSealOptions): string;
  open(sealed: string, options: SecretsSealOptions): string;
  /** Every version's key for `purpose`, current first, base64url. */
  derive(purpose: string): DerivedSecret[];
}

/**
 * A keyring over configured master keys, the first being current. Throws `SECRETS_NOT_CONFIGURED` for an empty or
 * invalid list, naming what is wrong but never a key.
 */
export function createKeyring(keys: readonly SecretKeyEntry[]): Keyring {
  if (keys.length === 0) {
    throw new SecretsError(
      'SECRETS_NOT_CONFIGURED',
      'No secrets key is configured.',
    );
  }
  const issues = validateSecretKeys(keys);
  if (issues.length > 0) {
    throw new SecretsError(
      'SECRETS_NOT_CONFIGURED',
      `The secrets keys are invalid: ${issues
        .map((issue) =>
          issue.index === undefined
            ? issue.message
            : `keys[${issue.index}] ${issue.message}`,
        )
        .join(' ')}`,
    );
  }
  const material = new Map<number, Buffer>(
    keys.map((entry) => [entry.version, decodeSecretKey(entry.key)!]),
  );
  const versions = keys.map((entry) => entry.version);
  const currentVersion = versions[0];
  const cache = new Map<string, Buffer>();
  const keyFor = (version: number, purpose: string): Buffer => {
    const ikm = material.get(version);
    if (!ikm) {
      throw new SecretsError(
        'SECRETS_KEY_UNKNOWN',
        `The secret was sealed with key version ${version}, which is not configured.`,
      );
    }
    const cacheKey = `${version}\u0000${purpose}`;
    let key = cache.get(cacheKey);
    if (!key) {
      key = deriveKey(ikm, purpose);
      cache.set(cacheKey, key);
    }
    return key;
  };

  return {
    currentVersion,
    versions,
    seal(plaintext, options) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(
        'aes-256-gcm',
        keyFor(currentVersion, options.purpose),
        iv,
      );
      cipher.setAAD(additionalData(options));
      const ciphertext = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);
      return [
        SECRETS_ENVELOPE_PREFIX,
        String(currentVersion),
        iv.toString('base64url'),
        cipher.getAuthTag().toString('base64url'),
        ciphertext.toString('base64url'),
      ].join('.');
    },
    open(sealed, options) {
      const envelope = parseEnvelope(sealed);
      const decipher = createDecipheriv(
        'aes-256-gcm',
        keyFor(envelope.version, options.purpose),
        envelope.iv,
      );
      decipher.setAAD(additionalData(options));
      decipher.setAuthTag(envelope.tag);
      try {
        return Buffer.concat([
          decipher.update(envelope.ciphertext),
          decipher.final(),
        ]).toString('utf8');
      } catch (error) {
        throw new SecretsError(
          'SECRETS_AUTH_FAILED',
          'The secret failed authentication: it was altered, or sealed for another purpose or record.',
          { cause: error },
        );
      }
    },
    derive(purpose) {
      return versions.map((version) => ({
        version,
        value: keyFor(version, purpose).toString('base64url'),
      }));
    },
  };
}

/** Reads an envelope's key version without opening it. Throws `SECRETS_MALFORMED` for anything else. */
export function inspectSecret(sealed: string): SecretsEnvelopeInfo {
  return { version: parseEnvelope(sealed).version };
}

/** Whether `value` has the envelope's shape. It says nothing about whether it opens. */
export function isSealedSecret(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    parseEnvelope(value);
    return true;
  } catch {
    return false;
  }
}

function deriveKey(ikm: Buffer, purpose: string): Buffer {
  if (!purpose) {
    throw new SecretsError(
      'SECRETS_MALFORMED',
      'A secret purpose is required.',
    );
  }
  return Buffer.from(
    hkdfSync('sha256', ikm, SECRETS_HKDF_SALT, purpose, KEY_BYTES),
  );
}

function additionalData(options: SecretsSealOptions): Buffer {
  if (!options.purpose) {
    throw new SecretsError(
      'SECRETS_MALFORMED',
      'A secret purpose is required.',
    );
  }
  return Buffer.from(
    JSON.stringify([options.purpose, ...(options.aad ?? [])]),
    'utf8',
  );
}

interface ParsedEnvelope {
  readonly version: number;
  readonly iv: Buffer;
  readonly tag: Buffer;
  readonly ciphertext: Buffer;
}

const BASE64URL = /^[A-Za-z0-9_-]*$/;

function parseEnvelope(sealed: string): ParsedEnvelope {
  const parts = typeof sealed === 'string' ? sealed.split('.') : [];
  const [prefix, version, iv, tag, ciphertext] = parts;
  if (
    parts.length !== 5 ||
    prefix !== SECRETS_ENVELOPE_PREFIX ||
    !version ||
    !/^\d+$/.test(version) ||
    !iv ||
    !tag ||
    ciphertext === undefined ||
    ![iv, tag, ciphertext].every((part) => BASE64URL.test(part))
  ) {
    throw new SecretsError(
      'SECRETS_MALFORMED',
      'The value is not a sealed secret.',
    );
  }
  const parsed = {
    version: Number(version),
    iv: Buffer.from(iv, 'base64url'),
    tag: Buffer.from(tag, 'base64url'),
    ciphertext: Buffer.from(ciphertext, 'base64url'),
  };
  if (
    !Number.isSafeInteger(parsed.version) ||
    parsed.iv.length !== IV_BYTES ||
    parsed.tag.length !== TAG_BYTES
  ) {
    throw new SecretsError(
      'SECRETS_MALFORMED',
      'The value is not a sealed secret.',
    );
  }
  return parsed;
}
