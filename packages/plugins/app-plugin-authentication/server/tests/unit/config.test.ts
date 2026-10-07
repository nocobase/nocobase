// @vitest-environment node

import {
  ApplicationNotConfiguredError,
  PLACEHOLDER_SECRET,
} from '@nocobase/app-server/config';
import { describe, expect, it } from 'vitest';
import { resolveAuthSecret, resolveAuthSecrets } from '../../config.js';

describe('resolveAuthSecret', () => {
  it('returns a configured secret', () => {
    expect(resolveAuthSecret('a-real-secret')).toBe('a-real-secret');
  });

  /**
   * `config.example.yml` declares `auth.secret` as a live key carrying this value, so that `config init` can fill it
   * in by replacing a value. A `config.yml` copied from the example by hand therefore arrives with a secret that is
   * present, non-empty, and identical across every installation — which every other check here would accept.
   */
  it.each([PLACEHOLDER_SECRET, ` ${PLACEHOLDER_SECRET} `])(
    'rejects a placeholder secret: %s',
    (secret) => {
      expect(() => resolveAuthSecret(secret)).toThrow(
        'auth.secret is still set to the placeholder',
      );
    },
  );

  /**
   * An unconfigured application used to be handed a temporary secret so it could boot far enough to serve an
   * installation page. Nothing serves that page now, and a secret regenerated on every boot invalidates every
   * session on restart — so this refuses, and names the command that writes one.
   */
  it.each([undefined, ''])('refuses to invent a secret for %j', (secret) => {
    expect(() => resolveAuthSecret(secret)).toThrow(
      expect.objectContaining({
        name: 'ApplicationNotConfiguredError',
        message: 'auth.secret is not set.',
        key: 'auth.secret',
        environmentVariable: 'AUTH_SECRET',
      }),
    );
  });

  /** A Hub shows this to an operator whose configuration lives in the Hub, so it carries no standalone advice. */
  it('states what is missing without prescribing a command', () => {
    expect(() => resolveAuthSecret(undefined)).toThrow(
      ApplicationNotConfiguredError,
    );
    expect(() => resolveAuthSecret(undefined)).not.toThrow('config init');
  });
});

describe('resolveAuthSecrets', () => {
  const keyring = [
    { version: 2, value: 'derived-two' },
    { version: 1, value: 'derived-one' },
  ];
  const secrets = {
    ready: true,
    keyring: (purpose: string) => {
      expect(purpose).toBe('@nocobase/app-plugin-authentication/better-auth');
      return keyring;
    },
  };

  it('derives Better Auth secrets from the secrets keys', () => {
    expect(resolveAuthSecrets({}, secrets)).toEqual({ secrets: keyring });
  });

  it('keeps auth.secret as the legacy secret beside derived keys', () => {
    expect(resolveAuthSecrets({ secret: 'old-secret' }, secrets)).toEqual({
      secret: 'old-secret',
      secrets: keyring,
    });
  });

  it('uses auth.secrets as configured', () => {
    const own = [{ version: 7, value: 'own' }];
    expect(resolveAuthSecrets({ secrets: own }, secrets)).toEqual({
      secrets: own,
    });
  });

  it('falls back to auth.secret without secrets keys', () => {
    expect(
      resolveAuthSecrets(
        { secret: 'only' },
        { ready: false, keyring: () => [] },
      ),
    ).toEqual({ secret: 'only' });
  });

  it('refuses to start with neither, naming secrets.keys', () => {
    expect(() => resolveAuthSecrets({}, undefined)).toThrow(
      expect.objectContaining({
        name: 'ApplicationNotConfiguredError',
        message: 'secrets.keys is not set.',
        key: 'secrets.keys',
        environmentVariable: 'SECRETS_KEYS',
      }),
    );
    expect(() =>
      resolveAuthSecrets({ secret: PLACEHOLDER_SECRET }, secrets),
    ).toThrow('auth.secret is still set to the placeholder');
  });
});
