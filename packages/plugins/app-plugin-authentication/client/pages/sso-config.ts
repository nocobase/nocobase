export interface SsoConfigInput {
  readonly type: 'sso' | 'social';
  /** The provider id, such as `feishu` or `github`. */
  readonly id: string;
  readonly discoveryUrl?: string;
  /** `existing`: only people who already have an account, linked in Account and security, sign in with it. */
  readonly signUp: 'create' | 'existing';
}

/**
 * The callback URL to register with the identity provider. Better Auth 1.7 registers a `genericOAuth()` provider as
 * one more social provider, so both kinds return to `<auth base>/callback/<id>`, the `redirect_uri` its authorization
 * request sends.
 */
export function ssoCallbackUrl(authBase: string, id: string): string {
  return `${authBase.replace(/\/+$/u, '')}/callback/${id}`;
}

/** `feishu` → `AUTH_FEISHU`, the prefix of the environment variables that hold its client id and secret. */
export function variablePrefix(id: string): string {
  return `AUTH_${id.toUpperCase().replace(/[^A-Z0-9]+/gu, '_')}`;
}

/**
 * The configuration the single sign-on guide hands over. It keeps the guide's promises:
 * - accounts are matched by the provider's own identity, never merged into an existing user by email
 *   (`account.accountLinking.disableImplicitLinking`), while a person can still link the provider explicitly from
 *   Account and security;
 * - "existing accounts only" turns off every sign-up through the provider (`disableSignUp`), including one the browser
 *   asks for explicitly, which the social providers' `disableImplicitSignUp` would still allow.
 */
export function ssoConfig(input: SsoConfigInput): string {
  const prefix = variablePrefix(input.id);
  const existingOnly = input.signUp === 'existing';
  const accountLinking = [
    '// server/config/auth.ts → defaults: never link a sign-in to an existing user by email',
    'account: {',
    '  accountLinking: { disableImplicitLinking: true },',
    '},',
  ];
  if (input.type === 'social')
    return [
      ...accountLinking,
      '',
      '// server/config/auth.ts → defaults',
      'socialProviders: {',
      `  '${input.id}': {`,
      `    clientId: process.env.${prefix}_CLIENT_ID!,`,
      `    clientSecret: process.env.${prefix}_CLIENT_SECRET!,`,
      `    disableSignUp: ${existingOnly},`,
      '  },',
      '},',
    ].join('\n');
  return [
    ...accountLinking,
    '',
    "// server/config/auth.ts → plugins (import { genericOAuth } from 'better-auth/plugins')",
    'genericOAuth({ config: [{',
    `  providerId: '${input.id}',`,
    `  discoveryUrl: '${input.discoveryUrl ?? 'https://<issuer>/.well-known/openid-configuration'}',`,
    `  clientId: process.env.${prefix}_CLIENT_ID!,`,
    `  clientSecret: process.env.${prefix}_CLIENT_SECRET!,`,
    `  disableSignUp: ${existingOnly},`,
    '}] })',
    '',
    '// The browser needs no client plugin: sign-in and linking go through signIn.social and linkSocial.',
  ].join('\n');
}
