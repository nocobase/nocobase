import { describe, expect, it } from 'vitest';

import { createSecretsService } from '@nocobase/app-server/secrets';

import { hashCredential } from '../server/kernel/crypto.js';
import {
  createSealer,
  MODEL_SERVICE_KEY_SECRET_PURPOSE,
  VARIABLES_SECRET_PURPOSE,
} from '../server/kernel/secrets.js';
import { testSecrets } from './harness.js';
import { truncateBytes } from '../server/kernel/values.js';

describe('sealer', () => {
  it('binds a value to its purpose and record', () => {
    const secrets = testSecrets();
    const variables = createSealer(secrets, VARIABLES_SECRET_PURPOSE);
    const sealed = variables.seal('s3cret', ['agent', 'a1', 'TOKEN']);
    expect(sealed).not.toContain('s3cret');
    expect(variables.open(sealed, ['agent', 'a1', 'TOKEN'])).toBe('s3cret');
    expect(() => variables.open(sealed, ['agent', 'a2', 'TOKEN'])).toThrow(
      expect.objectContaining({ code: 'SECRETS_AUTH_FAILED' }),
    );
    expect(() =>
      createSealer(secrets, MODEL_SERVICE_KEY_SECRET_PURPOSE).open(sealed, [
        'agent',
        'a1',
        'TOKEN',
      ]),
    ).toThrow(expect.objectContaining({ code: 'SECRETS_AUTH_FAILED' }));
  });

  it('needs secrets keys', () => {
    for (const secrets of [undefined, createSecretsService({ keys: [] })]) {
      expect(() =>
        createSealer(secrets, VARIABLES_SECRET_PURPOSE).seal('x', []),
      ).toThrow(
        expect.objectContaining({ code: 'SECRETS_KEY_MISSING', status: 503 }),
      );
    }
  });

  it('hashes credentials', () => {
    expect(hashCredential('a')).toMatch(/^[0-9a-f]{64}$/u);
    expect(hashCredential('a')).not.toBe(hashCredential('b'));
  });
});

describe('event content', () => {
  it('is cut by bytes without splitting a character', () => {
    expect(truncateBytes('abc', 10)).toEqual({ text: 'abc', truncated: false });
    expect(truncateBytes('é'.repeat(4), 5)).toEqual({
      text: 'éé',
      truncated: true,
    });
  });
});
