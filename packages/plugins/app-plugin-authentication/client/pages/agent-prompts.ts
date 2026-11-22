import { ssoConfig, variablePrefix } from './sso-config.js';

/** A translation function: the page passes the plugin's `t`, tests a lookup in the English resources. */
export type Translate = (
  key: string,
  values?: Readonly<Record<string, unknown>>,
) => string;

export type MethodGuide = 'twoFactor' | 'passkey';

/** The application the prompts are about, as the guide pages resolve it with `guideContext`. */
export interface GuideContext {
  /** The application's name: the configured `app.title`, as the browser shows it. */
  readonly appName: string;
  /** `app.publicOrigin`, or the address being browsed when it is not set. */
  readonly origin: string;
  /** Whether `origin` is the configured `app.publicOrigin`. */
  readonly originConfigured: boolean;
}

/** The application name and address every prompt states, from configuration first and the browser second. */
export function guideContext(input: {
  readonly configuredTitle: unknown;
  readonly documentTitle: string;
  readonly publicOrigin: string | null;
  readonly browserOrigin: string;
}): GuideContext {
  const appName =
    typeof input.configuredTitle === 'string' && input.configuredTitle.trim()
      ? input.configuredTitle.trim()
      : input.documentTitle.trim() || 'NocoBase';
  return input.publicOrigin
    ? { appName, origin: input.publicOrigin, originConfigured: true }
    : { appName, origin: input.browserOrigin, originConfigured: false };
}

export interface ProviderPromptInput {
  /** `oauth`: an OAuth 2.0 provider that is not one of Better Auth's built-in social providers. */
  readonly type: 'sso' | 'social' | 'oauth';
  /** The provider id, such as `feishu` or `github`. */
  readonly id: string;
  /** The provider's display name, such as `Feishu`. */
  readonly name: string;
  readonly discoveryUrl?: string;
  readonly signUp: 'create' | 'existing';
  readonly callbackUrl: string;
  readonly appName: string;
  /** `app.publicOrigin`, or the address being browsed when it is not set. */
  readonly origin: string;
}

export interface MethodPromptInput {
  readonly method: MethodGuide;
  readonly appName: string;
  /** `app.publicOrigin`, or the address being browsed when it is not set. */
  readonly origin: string;
}

/**
 * The prompt the single sign-on and social sign-in guides hand to a development agent working in the application's
 * repository. It follows the choices on the page and carries the configuration the guide promises: client id and
 * secret from environment variables, accounts matched by issuer + subject and never merged by email, and sign-up only
 * when "create an account" is chosen (`ssoConfig`, checked against Better Auth in the integration tests).
 */
export function providerPrompt(
  t: Translate,
  input: ProviderPromptInput,
): string {
  const prefix = variablePrefix(input.id);
  const values = {
    name: input.name,
    id: input.id,
    prefix,
    callback: input.callbackUrl,
    origin: input.origin,
    discovery:
      input.discoveryUrl ?? t('prompt.discoveryUnknown', { name: input.name }),
  };
  return [
    t(`prompt.${input.type}.intro`, values),
    t('prompt.application', { appName: input.appName, origin: input.origin }),
    '',
    t('prompt.followSignIn'),
    `1. ${t(`prompt.${input.type}.add`, values)}`,
    `2. ${t(`prompt.firstSignIn.${input.signUp}`, values)} ${t('prompt.matching')}`,
    `3. ${t('prompt.callback', values)}`,
    `4. ${t('prompt.checkProvider', values)}`,
    `5. ${t('prompt.testsProvider')}`,
    '',
    t('prompt.configIntro'),
    '',
    ssoConfig({
      type: input.type,
      id: input.id,
      discoveryUrl: input.discoveryUrl,
      signUp: input.signUp,
    }),
    '',
    t('prompt.doneProvider'),
  ].join('\n');
}

/**
 * The prompt the two-factor and passkey guides hand to a development agent. The exports it names are the ones Better
 * Auth 1.7 ships (`twoFactor` from `better-auth/plugins`, `twoFactorClient` from `better-auth/client/plugins`;
 * `passkey` and `passkeyClient` from the separate `@better-auth/passkey` package), and it asks for the Account and
 * security sections and the sign-in steps this plugin does not provide.
 */
export function methodPrompt(t: Translate, input: MethodPromptInput): string {
  // A string literal, as it goes into the configuration: twoFactor({ issuer: 'Acme' }).
  const appName = `'${input.appName.replace(/['\\]/gu, '\\$&')}'`;
  const values = { appName, origin: input.origin };
  const steps = ['add', 'migration', 'account', 'signIn', 'tests'] as const;
  return [
    t(`prompt.${input.method}.intro`),
    t('prompt.application', { appName: input.appName, origin: input.origin }),
    '',
    t('prompt.followPlugin'),
    ...steps.map(
      (step, index) =>
        `${index + 1}. ${t(`prompt.${input.method}.${step}`, values)}`,
    ),
    '',
    t('prompt.doneMethod'),
  ].join('\n');
}
