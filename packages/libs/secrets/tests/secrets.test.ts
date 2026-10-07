import { hkdfSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  createKeyring,
  decodeSecretKey,
  generateSecretKey,
  inspectSecret,
  isSealedSecret,
  parseSecretKeysEnv,
  validateSecretKeys,
} from '../src/index.js';

const keyOne = 'a'.repeat(64);
const keyTwo = generateSecretKey();
const purpose = 'test/purpose';

describe('createKeyring', () => {
  it('seals with the current key and opens with any configured key', () => {
    const v1 = createKeyring([{ version: 1, key: keyOne }]);
    const sealed = v1.seal('hello', { purpose });
    expect(sealed).toMatch(/^nbs1\.1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(inspectSecret(sealed)).toEqual({ version: 1 });

    const rotated = createKeyring([
      { version: 2, key: keyTwo },
      { version: 1, key: keyOne },
    ]);
    expect(rotated.currentVersion).toBe(2);
    expect(rotated.open(sealed, { purpose })).toBe('hello');
    expect(inspectSecret(rotated.seal('hello', { purpose })).version).toBe(2);
  });

  it('round-trips an empty string', () => {
    const keyring = createKeyring([{ version: 0, key: keyOne }]);
    expect(keyring.open(keyring.seal('', { purpose }), { purpose })).toBe('');
  });

  it('binds the purpose and additional data', () => {
    const keyring = createKeyring([{ version: 1, key: keyOne }]);
    const sealed = keyring.seal('x', { purpose, aad: ['row-1'] });
    expect(keyring.open(sealed, { purpose, aad: ['row-1'] })).toBe('x');
    for (const options of [
      { purpose, aad: ['row-2'] },
      { purpose },
      { purpose: 'other', aad: ['row-1'] },
    ]) {
      expect(() => keyring.open(sealed, options)).toThrow(
        expect.objectContaining({ code: 'SECRETS_AUTH_FAILED' }),
      );
    }
  });

  it('reports an unknown version, a malformed value and tampering', () => {
    const v2 = createKeyring([{ version: 2, key: keyTwo }]);
    const v1 = createKeyring([{ version: 1, key: keyOne }]);
    const sealed = v1.seal('x', { purpose });
    expect(() => v2.open(sealed, { purpose })).toThrow(
      expect.objectContaining({ code: 'SECRETS_KEY_UNKNOWN' }),
    );
    expect(() => v1.open('v1.a.b.c', { purpose })).toThrow(
      expect.objectContaining({ code: 'SECRETS_MALFORMED' }),
    );
    expect(isSealedSecret(sealed)).toBe(true);
    expect(isSealedSecret('nbs1.x.a.b.c')).toBe(false);
    const parts = sealed.split('.');
    parts[4] = Buffer.from('y').toString('base64url');
    expect(() => v1.open(parts.join('.'), { purpose })).toThrow(
      expect.objectContaining({ code: 'SECRETS_AUTH_FAILED' }),
    );
  });

  it('derives one key per purpose and version with HKDF-SHA256', () => {
    const keyring = createKeyring([
      { version: 2, key: keyTwo },
      { version: 1, key: keyOne },
    ]);
    const derived = keyring.derive('lib/cookie');
    expect(derived.map((entry) => entry.version)).toEqual([2, 1]);
    expect(derived[1]!.value).toBe(
      Buffer.from(
        hkdfSync(
          'sha256',
          Buffer.from(keyOne, 'hex'),
          'nocobase/secrets/v1',
          'lib/cookie',
          32,
        ),
      ).toString('base64url'),
    );
    expect(keyring.derive('lib/other')[1]!.value).not.toBe(derived[1]!.value);
  });

  it('refuses an empty or invalid key list', () => {
    expect(() => createKeyring([])).toThrow(
      expect.objectContaining({ code: 'SECRETS_NOT_CONFIGURED' }),
    );
    expect(() => createKeyring([{ version: 1, key: 'short' }])).toThrow(
      expect.objectContaining({ code: 'SECRETS_NOT_CONFIGURED' }),
    );
  });
});

describe('keys', () => {
  it('decodes hex, base64 and raw keys of at least 32 bytes', () => {
    expect(decodeSecretKey(keyOne)).toHaveLength(32);
    expect(
      decodeSecretKey(Buffer.alloc(32, 7).toString('base64')),
    ).toHaveLength(32);
    expect(decodeSecretKey('x'.repeat(32))).toHaveLength(32);
    expect(decodeSecretKey('x'.repeat(31))).toBeUndefined();
  });

  it('validates versions and key strength', () => {
    expect(
      validateSecretKeys(
        [
          { version: 1, key: keyOne },
          { version: 1, key: keyTwo },
          { version: -1, key: 'short' },
          { version: 3, key: 'placeholder-value-of-many-characters' },
        ],
        { isPlaceholder: (key) => key.startsWith('placeholder') },
      ),
    ).toEqual([
      { index: 1, message: 'version 1 appears twice.' },
      { index: 2, message: 'version must not be negative.' },
      expect.objectContaining({ index: 2 }),
      expect.objectContaining({ index: 3 }),
    ]);
    expect(validateSecretKeys(undefined)).toEqual([]);
  });

  it('parses the SECRETS_KEYS form', () => {
    expect(parseSecretKeysEnv(`2:${keyTwo}, 1:${keyOne}`)).toEqual([
      { version: 2, key: keyTwo },
      { version: 1, key: keyOne },
    ]);
    expect(parseSecretKeysEnv('x:abc')[0]!.version).toBeNaN();
  });
});
