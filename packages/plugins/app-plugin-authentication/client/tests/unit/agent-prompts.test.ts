import { describe, expect, it } from 'vitest';

import enUS from '../../locales/en-US.js';
import zhCN from '../../locales/zh-CN.js';
import {
  guideContext,
  methodPrompt,
  providerPrompt,
  type ProviderPromptInput,
  type Translate,
} from '../../pages/agent-prompts.js';

/** The plugin's `t` over one locale's resources; a missing key fails the test instead of showing the key. */
function translator(resources: object): Translate {
  return (key, values = {}) => {
    const text = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        resources,
      );
    if (typeof text !== 'string') throw new Error(`Missing translation ${key}`);
    return text.replace(/\{\{(\w+)\}\}/gu, (_match, name: string) =>
      String(values[name]),
    );
  };
}

const t = translator(enUS);
const feishu: ProviderPromptInput = {
  type: 'sso',
  id: 'feishu',
  name: 'Feishu',
  signUp: 'create',
  callbackUrl: 'https://crm.example.com/api/auth/callback/feishu',
  appName: 'Acme CRM',
  origin: 'https://crm.example.com',
};

describe('the prompts the guides hand to a development agent', () => {
  it('follow the chosen identity provider', () => {
    const sso = providerPrompt(t, feishu);
    expect(sso).toContain('single sign-on with Feishu');
    expect(sso).toContain('genericOAuth');
    expect(sso).toContain('providerId feishu');
    expect(sso).toContain(
      'AUTH_FEISHU_CLIENT_ID and AUTH_FEISHU_CLIENT_SECRET',
    );
    expect(sso).toContain(
      'The callback URL is https://crm.example.com/api/auth/callback/feishu.',
    );
    expect(sso).toContain(
      'Make sure app.publicOrigin is https://crm.example.com.',
    );
    expect(sso).not.toContain('genericOAuthClient');

    const github = providerPrompt(t, {
      ...feishu,
      type: 'social',
      id: 'github',
      name: 'GitHub',
      callbackUrl: 'https://crm.example.com/api/auth/callback/github',
    });
    expect(github).toContain('sign-in with GitHub');
    expect(github).toContain('add github to socialProviders');
    expect(github).toContain(
      'AUTH_GITHUB_CLIENT_ID and AUTH_GITHUB_CLIENT_SECRET',
    );
    expect(github).toContain('/api/auth/callback/github');
    expect(github).not.toContain('feishu');
    expect(github).not.toContain('genericOAuth');
  });

  it('follow the chosen first sign-in, and never merge accounts by email', () => {
    const create = providerPrompt(t, feishu);
    const existing = providerPrompt(t, { ...feishu, signUp: 'existing' });
    expect(create).toContain('create an account automatically');
    expect(create).toContain('disableSignUp: false');
    expect(create).not.toContain('disableSignUp: true');
    expect(existing).toContain('existing accounts only');
    expect(existing).toContain('disableSignUp: true');
    expect(existing).not.toContain('disableSignUp: false');
    for (const prompt of [create, existing]) {
      expect(prompt).toContain('issuer + subject');
      expect(prompt).toContain('disableImplicitLinking: true');
      expect(prompt).toContain('never write them into code');
      expect(prompt).toContain('lint, typecheck, test and build');
      expect(prompt).toContain(
        'which environment variables the deployment must set',
      );
    }
  });

  it('ask for two-factor authentication with the exports Better Auth ships and the sections the plugin lacks', () => {
    const prompt = methodPrompt(t, {
      method: 'twoFactor',
      appName: 'Acme CRM',
      origin: 'https://crm.example.com',
    });
    expect(prompt).toContain(
      "twoFactor({ issuer: 'Acme CRM' }) from better-auth/plugins",
    );
    expect(prompt).toContain(
      'twoFactorClient() from better-auth/client/plugins',
    );
    expect(prompt).toContain('database/main/migrations/');
    expect(prompt).toContain('Do not run better-auth’s own migrate');
    expect(prompt).toContain(
      'Confirm Account and security shows the Two-factor authentication section',
    );
    expect(prompt).toContain('twoFactorRedirect');
  });

  it('ask for passkeys from their own package, bound to app.publicOrigin, with the field mapping the columns need', () => {
    const prompt = methodPrompt(t, {
      method: 'passkey',
      appName: "Ada's app",
      origin: 'https://crm.example.com',
    });
    expect(prompt).toContain('Install @better-auth/passkey');
    expect(prompt).toContain('add passkey from @better-auth/passkey');
    expect(prompt).toContain('passkeyClient from @better-auth/passkey/client');
    expect(prompt).toContain("rpName 'Ada\\'s app'");
    expect(prompt).toContain('from app.publicOrigin instead of hard-coding');
    expect(prompt).toContain('the public address is https://crm.example.com');
    expect(prompt).toContain(
      "schema: { passkey: { fields: { credentialID: 'credentialId' } } }",
    );
    expect(prompt).toContain('Passkeys section');
    expect(prompt).toContain('signIn.passkey');
  });

  it('send a provider outside Better Auth’s built-in list through genericOAuth, never as a socialProviders key', () => {
    const other = providerPrompt(t, {
      ...feishu,
      type: 'oauth',
      id: 'custom',
      name: 'custom',
      callbackUrl: 'https://crm.example.com/api/auth/callback/custom',
    });
    expect(other).toContain('generic OAuth plugin (genericOAuth');
    expect(other).toContain('providerId custom');
    expect(other).toContain("providerId: 'custom'");
    expect(other).toContain('authorizationUrl');
    expect(other).toContain(
      'If custom publishes OIDC discovery, set its discoveryUrl and no accountSubject',
    );
    expect(other).toContain(
      'only when custom names its stable account id differently, such as user_id, add accountSubject',
    );
    expect(other).not.toContain('Better Auth reads profile.id');
    expect(other).toContain(
      'AUTH_CUSTOM_CLIENT_ID and AUTH_CUSTOM_CLIENT_SECRET',
    );
    expect(other).not.toContain('socialProviders: {');
    expect(other).toContain('/api/auth/callback/custom');
  });

  it('name the application and the address it is reached at, in all four prompts', () => {
    const lines = [
      providerPrompt(t, { ...feishu, appName: 'Northwind Ops' }),
      providerPrompt(t, {
        ...feishu,
        type: 'social',
        id: 'github',
        name: 'GitHub',
        appName: 'Northwind Ops',
      }),
      methodPrompt(t, {
        method: 'twoFactor',
        appName: 'Northwind Ops',
        origin: 'https://crm.example.com',
      }),
      methodPrompt(t, {
        method: 'passkey',
        appName: 'Northwind Ops',
        origin: 'https://crm.example.com',
      }),
    ];
    for (const prompt of lines)
      expect(prompt).toContain(
        'The application is Northwind Ops, reached at https://crm.example.com.',
      );
  });

  it('take the configured name and app.publicOrigin, or the browser’s when they are not set', () => {
    expect(
      guideContext({
        configuredTitle: 'Northwind Ops',
        documentTitle: 'Something else',
        publicOrigin: 'https://crm.example.com',
        browserOrigin: 'http://127.0.0.1:13000',
      }),
    ).toEqual({
      appName: 'Northwind Ops',
      origin: 'https://crm.example.com',
      originConfigured: true,
    });
    expect(
      guideContext({
        configuredTitle: undefined,
        documentTitle: 'Acme',
        publicOrigin: null,
        browserOrigin: 'http://127.0.0.1:13000',
      }),
    ).toEqual({
      appName: 'Acme',
      origin: 'http://127.0.0.1:13000',
      originConfigured: false,
    });
    const browsing = guideContext({
      configuredTitle: ' ',
      documentTitle: '',
      publicOrigin: null,
      browserOrigin: 'http://127.0.0.1:13000',
    });
    expect(browsing.appName).toBe('NocoBase');
    expect(methodPrompt(t, { method: 'passkey', ...browsing })).toContain(
      'the public address is http://127.0.0.1:13000',
    );
  });

  it('have every line in Chinese too', () => {
    const zh = translator(zhCN);
    for (const signUp of ['create', 'existing'] as const)
      for (const type of ['sso', 'social', 'oauth'] as const)
        expect(providerPrompt(zh, { ...feishu, type, signUp })).toContain(
          '请在这个 NocoBase 应用里开启',
        );
    for (const method of ['twoFactor', 'passkey'] as const)
      expect(
        methodPrompt(zh, {
          method,
          appName: 'Acme',
          origin: 'https://a.example',
        }),
      ).toContain('完成后告诉我改了哪些文件');
  });
});
