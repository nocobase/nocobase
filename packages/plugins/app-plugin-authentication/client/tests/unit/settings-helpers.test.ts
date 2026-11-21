import { describe, expect, it } from 'vitest';

import { canUnlink } from '../../pages/linked-accounts.js';
import { providerEntries } from '../../pages/sign-in-entries.js';
import { ssoConfig } from '../../pages/sso-config.js';
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
