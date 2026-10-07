import { randomBytes } from 'node:crypto';

/** One configured master key. The first entry of a list is the current one. */
export interface SecretKeyEntry {
  readonly version: number;
  readonly key: string;
}

/** The fewest bytes a master key may decode to. */
export const MIN_SECRET_KEY_BYTES = 32;

const HEX = /^[0-9a-f]+$/i;
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;

/**
 * The bytes a master key stands for: hex when it is hex of at least 32 bytes, otherwise base64 or base64url when it
 * decodes to at least 32 bytes, otherwise its UTF-8 bytes. `undefined` when none of these reaches 32 bytes.
 *
 * The order is fixed, so one string always stands for the same bytes.
 */
export function decodeSecretKey(key: string): Buffer | undefined {
  const value = key.trim();
  if (
    HEX.test(value) &&
    value.length % 2 === 0 &&
    value.length >= MIN_SECRET_KEY_BYTES * 2
  ) {
    return Buffer.from(value, 'hex');
  }
  if (BASE64.test(value)) {
    const decoded = Buffer.from(value, 'base64');
    if (decoded.length >= MIN_SECRET_KEY_BYTES) return decoded;
  }
  const raw = Buffer.from(value, 'utf8');
  return raw.length >= MIN_SECRET_KEY_BYTES ? raw : undefined;
}

/** A new random master key: 32 bytes, hex. */
export function generateSecretKey(): string {
  return randomBytes(MIN_SECRET_KEY_BYTES).toString('hex');
}

/** A problem with a configured key list, with the index of the entry it is about when there is one. */
export interface SecretKeyIssue {
  readonly index?: number;
  readonly message: string;
}

/**
 * Checks a key list without throwing: versions must be distinct non-negative integers, and every key must decode to at
 * least 32 bytes. `isPlaceholder` lets the caller reject a shipped example value.
 */
export function validateSecretKeys(
  keys: unknown,
  options: { readonly isPlaceholder?: (key: string) => boolean } = {},
): SecretKeyIssue[] {
  if (keys === undefined || keys === null) return [];
  if (!Array.isArray(keys)) return [{ message: 'must be a list.' }];
  const issues: SecretKeyIssue[] = [];
  const seen = new Set<number>();
  keys.forEach((entry: unknown, index) => {
    const version: unknown =
      typeof entry === 'object' && entry !== null
        ? Reflect.get(entry, 'version')
        : undefined;
    const key: unknown =
      typeof entry === 'object' && entry !== null
        ? Reflect.get(entry, 'key')
        : undefined;
    if (typeof version !== 'number' || !Number.isSafeInteger(version)) {
      issues.push({ index, message: 'version must be an integer.' });
    } else if (version < 0) {
      issues.push({ index, message: 'version must not be negative.' });
    } else if (seen.has(version)) {
      issues.push({ index, message: `version ${version} appears twice.` });
    } else {
      seen.add(version);
    }
    if (typeof key !== 'string' || key.trim() === '') {
      issues.push({ index, message: 'key must be set.' });
    } else if (options.isPlaceholder?.(key)) {
      issues.push({
        index,
        message: 'key is still the placeholder from config.example.yml.',
      });
    } else if (!decodeSecretKey(key)) {
      issues.push({
        index,
        message: `key is too short: use at least ${MIN_SECRET_KEY_BYTES} random bytes, such as 64 hex characters.`,
      });
    }
  });
  return issues;
}

/**
 * Reads the `SECRETS_KEYS` form, `<version>:<key>` separated by commas with the current key first, such as
 * `2:abc…,1:def…`. Malformed entries are kept as they are written so that validation reports them.
 */
export function parseSecretKeysEnv(value: string): SecretKeyEntry[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '')
    .map((entry) => {
      const separator = entry.indexOf(':');
      if (separator === -1) return { version: Number.NaN, key: entry };
      const version = entry.slice(0, separator).trim();
      return {
        version: /^\d+$/.test(version) ? Number(version) : Number.NaN,
        key: entry.slice(separator + 1).trim(),
      };
    });
}
