/**
 * Credentials (runner keys, run tokens, registration tokens): random strings shown once; only their SHA-256 hash is
 * stored, and a presented credential is found by its hash. Values the server must read back are sealed instead
 * (`secrets.ts`).
 */
import { CREDENTIAL_PREFIXES } from '@nocobase/agent-protocol';
import { createHash, randomBytes } from 'node:crypto';

/**
 * The prefixes that tell credentials apart in logs and support requests. They are the protocol's, so every redactor
 * recognises a credential by its prefix without knowing its value.
 */
export const CREDENTIAL_PREFIX: typeof CREDENTIAL_PREFIXES =
  CREDENTIAL_PREFIXES;

/** A new credential: the prefix and 32 random bytes, base64url. */
export function createCredential(prefix: string): string {
  return `${prefix}${randomBytes(32).toString('base64url')}`;
}

/** The stored form of a credential. */
export function hashCredential(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** The first characters of a credential, safe to show. */
export function credentialPrefix(value: string): string {
  return value.slice(0, 12);
}
