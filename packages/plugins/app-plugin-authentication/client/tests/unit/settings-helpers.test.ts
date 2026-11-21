import { describe, expect, it } from 'vitest';

import {
  canUnlink,
  passwordSignInKnownOn,
} from '../../pages/linked-accounts.js';
import { providerEntries } from '../../pages/sign-in-entries.js';
import { ssoCallbackUrl, ssoConfig } from '../../pages/sso-config.js';
import type { AuthenticationSignInMethod } from '../../settings/data.js';

describe('ssoConfig', () => {
  it('never links a provider sign-in to an existing user by email', () => {
    for (const type of ['sso', 'social'] as const)
      for (const signUp of ['create', 'existing'] as const)
        expect(ssoConfig({ type, id: 'acme', signUp })).toContain(
          'accountLinking: { disableImplicitLinking: true }',
        );
  });

  it('turns every sign-up through the provider off for existing accounts only', () => {
    const social = ssoConfig({
      type: 'social',
      id: 'github',
      signUp: 'existing',
    });
    expect(social).toContain('disableSignUp: true');
    // `disableImplicitSignUp` still lets the browser ask for a sign-up explicitly.
    expect(social).not.toContain('disableImplicitSignUp');
    expect(
      ssoConfig({ type: 'sso', id: 'feishu', signUp: 'existing' }),
    ).toContain('disableSignUp: true');
    expect(
      ssoConfig({ type: 'sso', id: 'feishu', signUp: 'create' }),
    ).toContain('disableSignUp: false');
  });
});

describe('ssoCallbackUrl and the OIDC configuration', () => {
  it('returns every provider, social or genericOAuth(), to /callback/<id>', () => {
    expect(
      ssoCallbackUrl('https://apps.example.com/main/api/auth/', 'feishu'),
    ).toBe('https://apps.example.com/main/api/auth/callback/feishu');
  });

  it('asks for no browser plugin Better Auth does not ship', () => {
    const config = ssoConfig({ type: 'sso', id: 'feishu', signUp: 'create' });
    expect(config).not.toContain('genericOAuthClient');
    expect(config).not.toContain('client/config/auth.ts');
  });
});

describe('passwordSignInKnownOn', () => {
  const config = (values: Record<string, unknown>) => ({
    has: (path: string) => path in values,
    get: (path: string) => values[path],
  });

  it('counts a password only when the application publishes that password sign-in is on', () => {
    expect(
      passwordSignInKnownOn(config({ 'auth.emailAndPassword.enabled': true })),
    ).toBe(true);
    expect(
      passwordSignInKnownOn(config({ 'auth.emailAndPassword.enabled': false })),
    ).toBe(false);
    // An application without defineAuthConfig publishes nothing: password sign-in may be off.
    expect(passwordSignInKnownOn(config({}))).toBe(false);
  });

  it('keeps the only provider when the password switch is not published', () => {
    const accounts = [
      { id: 'a1', providerId: 'credential' },
      { id: 'a2', providerId: 'github' },
    ];
    expect(
      canUnlink(accounts[1]!, accounts, {
        password: passwordSignInKnownOn(config({})),
        providers: ['github'],
      }),
    ).toBe(false);
  });
});

describe('canUnlink', () => {
  const password = { id: 'a1', providerId: 'credential' };
  const github = { id: 'a2', providerId: 'github' };
  const feishu = { id: 'a3', providerId: 'feishu' };

  it('keeps the last usable way to sign in when another provider was removed', () => {
    const accounts = [github, feishu];
    const available = { password: true, providers: ['github'] };
    expect(canUnlink(github, accounts, available)).toBe(false);
    expect(canUnlink(feishu, accounts, available)).toBe(true);
  });

  it('does not count a password while password sign-in is off', () => {
    const accounts = [password, github];
    expect(
      canUnlink(github, accounts, { password: false, providers: ['github'] }),
    ).toBe(false);
    expect(
      canUnlink(github, accounts, { password: true, providers: ['github'] }),
    ).toBe(true);
  });
});

describe('providerEntries', () => {
  const methods = [
    { id: 'social', status: 'enabled', providers: ['github'] },
    { id: 'sso', status: 'notConfigured', providers: [] },
  ] as unknown as AuthenticationSignInMethod[];

  it('shows a configured provider on the sign-in page only when the application declares its button', () => {
    expect(providerEntries(methods, [])).toEqual({
      shown: [],
      withoutButton: ['github'],
    });
    expect(providerEntries(methods, ['github'])).toEqual({
      shown: ['github'],
      withoutButton: [],
    });
  });
});
