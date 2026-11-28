import type { AppConfigLayers } from '@nocobase/app-server/config';
import type { AuthContext, BetterAuthOptions } from 'better-auth';

import type { Auth } from './auth.js';
import { registrationFeedbackWarning, type AuthConfig } from './config.js';
import type {
  AuthenticationSettings,
  AuthenticationSettingsIssue,
  AuthenticationSignInMethod,
  ConfigOrigin,
  PasswordResetSenderDescription,
  SettingValue,
  SignInMethodText,
} from '../shared/settings.js';
import type { SignInMethodRegistry } from './sign-in-methods.js';

/** What the collector reads. Every value it returns is picked field by field; nothing is spread from configuration. */
export interface AuthenticationSettingsInput {
  /** The application's `auth` section, as configured. */
  readonly auth: AuthConfig;
  readonly publicOrigin: string | undefined;
  /** Better Auth's public path, such as `/main/api/auth`. */
  readonly authBasePath: string;
  /** Configuration layers, when the application's configuration can tell them apart. */
  readonly layers?: AppConfigLayers;
  /** Every declared environment variable and the configuration path it sets. */
  readonly environmentVariables: Readonly<Record<string, string>>;
  /** The environment the configuration was loaded from, to tell which declared variables are set; values are not read. */
  readonly environment: Readonly<Record<string, string | undefined>>;
  readonly authentication: Auth;
  readonly methods: SignInMethodRegistry;
  readonly resetSender: PasswordResetSenderDescription;
  /** Whether the application's secrets service holds keys, which Better Auth's keys are then derived from. */
  readonly secretsReady: boolean;
}

const NAMESPACE = '@nocobase/app-plugin-authentication';
const text = (key: string, defaultValue: string): SignInMethodText => ({
  key: `settings.methods.${key}`,
  ns: NAMESPACE,
  defaultValue,
});

/** Tells where a configuration path's value comes from: an environment variable, `config.yml`, code, or a default. */
export function createOriginResolver(
  input: Pick<
    AuthenticationSettingsInput,
    'layers' | 'environmentVariables' | 'environment'
  > & { readonly current?: Readonly<Record<string, unknown>> },
): (path: string) => ConfigOrigin {
  const setVariables = Object.entries(input.environmentVariables).filter(
    ([variable]) => {
      const value = input.environment[variable];
      return value !== undefined && value !== '';
    },
  );
  return (path) => {
    const variable =
      setVariables.find(([, target]) => target === path) ??
      setVariables.find(
        ([, target]) =>
          target.startsWith(`${path}.`) || path.startsWith(`${target}.`),
      );
    if (variable) return { path, source: 'env', env: variable[0] };
    if (input.layers) {
      if (hasValue(input.layers.overrides, path))
        return { path, source: 'file' };
      if (hasValue(input.layers.defaults, path))
        return { path, source: 'code' };
      return { path, source: 'default' };
    }
    return {
      path,
      source: hasValue(input.current, path) ? 'code' : 'default',
    };
  };
}

function hasValue(
  map: Readonly<Record<string, unknown>> | undefined,
  path: string,
): boolean {
  let value: unknown = map;
  for (const segment of path.split('.')) {
    if (typeof value !== 'object' || value === null) return false;
    value = (value as Record<string, unknown>)[segment];
  }
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== '';
}

function pluginOptions(
  options: BetterAuthOptions,
  id: string,
): Record<string, unknown> | undefined {
  const plugin = options.plugins?.find(
    (candidate) => Reflect.get(candidate, 'id') === id,
  );
  if (!plugin) return undefined;
  const value: unknown = Reflect.get(plugin, 'options');
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

/** The single sign-on (`genericOAuth()`) and social providers the application configures, by id. */
export async function configuredProviders(
  authentication: Auth,
): Promise<readonly { id: string; name: string; type: 'oidc' | 'social' }[]> {
  const context =
    (await authentication.administrationContext()) as unknown as AuthContext;
  const providers = new Map<
    string,
    { id: string; name: string; type: 'oidc' | 'social' }
  >();
  const generic = pluginOptions(context.options, 'generic-oauth')?.config;
  if (Array.isArray(generic))
    for (const entry of generic) {
      const id: unknown = Reflect.get(entry as object, 'providerId');
      if (typeof id === 'string' && id)
        providers.set(id, { id, name: id, type: 'oidc' });
    }
  for (const provider of context.socialProviders ?? [])
    if (!providers.has(provider.id))
      providers.set(provider.id, {
        id: provider.id,
        name: provider.name || provider.id,
        type: 'social',
      });
  return [...providers.values()];
}

/**
 * The effective sign-in and authentication settings, their origins and the problems to fix. Values come from Better
 * Auth's resolved context where it holds them, so defaults are Better Auth's own. No secret, signing key, client
 * secret or mail credential is read into the result.
 */
export async function collectAuthenticationSettings(
  input: AuthenticationSettingsInput,
): Promise<AuthenticationSettings> {
  const originOf = createOriginResolver({
    ...input,
    current: { auth: input.auth },
  });
  const value = <TValue>(
    path: string,
    effective: TValue,
  ): SettingValue<TValue> => ({ value: effective, origin: originOf(path) });
  const context =
    (await input.authentication.administrationContext()) as unknown as AuthContext;
  const options = context.options;
  const diagnosis = input.authentication.passwordResetDiagnosis();
  const providers = await configuredProviders(input.authentication);
  const oidcProviders = providers
    .filter((provider) => provider.type === 'oidc')
    .map((provider) => provider.id);
  const socialProviders = providers
    .filter((provider) => provider.type === 'social')
    .map((provider) => provider.id);

  const passwordSignIn = options.emailAndPassword?.enabled !== false;
  const username = pluginOptions(options, 'username');
  const plugin = (id: string): boolean =>
    options.plugins?.some((entry) => Reflect.get(entry, 'id') === id) ?? false;

  const methods: AuthenticationSignInMethod[] = [
    {
      id: 'password',
      title: text('password.title', 'Password'),
      description: username
        ? text('password.description', 'Email or username and a password')
        : text('password.descriptionEmail', 'Email and a password'),
      config: username ? 'emailAndPassword · username()' : 'emailAndPassword',
      status: passwordSignIn ? 'enabled' : 'notConfigured',
      origin: originOf('auth.emailAndPassword.enabled'),
      signInEntry: true,
      providers: [],
    },
    {
      id: 'device',
      title: text('device.title', 'Command line sign-in'),
      description: text(
        'device.description',
        'Approve a command-line tool’s sign-in in the browser (/device)',
      ),
      config: plugin('bearer')
        ? 'deviceAuthorization() · bearer()'
        : 'deviceAuthorization()',
      status: plugin('device-authorization') ? 'enabled' : 'notConfigured',
      ...(plugin('device-authorization')
        ? { origin: originOf('auth.plugins') }
        : {}),
      signInEntry: false,
      providers: [],
    },
    ...input.methods.list().map((method): AuthenticationSignInMethod => {
      const state = method.describe();
      return {
        id: method.id,
        title: method.title,
        ...(method.description ? { description: method.description } : {}),
        ...(method.config ? { config: method.config } : {}),
        status: state.status,
        ...(state.configPath ? { origin: originOf(state.configPath) } : {}),
        signInEntry: method.signInEntry ?? false,
        ...(method.detailsPath ? { detailsPath: method.detailsPath } : {}),
        providers: [],
      };
    }),
    {
      id: 'sso',
      title: text('sso.title', 'Single sign-on (OIDC)'),
      description: text(
        'sso.description',
        'Feishu, DingTalk, WeCom, Okta, Microsoft Entra ID and more',
      ),
      config: 'genericOAuth()',
      status: oidcProviders.length ? 'enabled' : 'notConfigured',
      ...(oidcProviders.length ? { origin: originOf('auth.plugins') } : {}),
      signInEntry: true,
      providers: oidcProviders,
      guide: 'sso',
    },
    {
      id: 'social',
      title: text('social.title', 'Social accounts'),
      description: text(
        'social.description',
        'Google, GitHub, Microsoft and more',
      ),
      config: 'socialProviders',
      status: socialProviders.length ? 'enabled' : 'notConfigured',
      ...(socialProviders.length
        ? { origin: originOf('auth.socialProviders') }
        : {}),
      signInEntry: true,
      providers: socialProviders,
      guide: 'social',
    },
    {
      id: 'twoFactor',
      title: text('twoFactor.title', 'Two-factor authentication'),
      description: text(
        'twoFactor.description',
        'Enter a one-time code after the password',
      ),
      config: 'twoFactor() · database migration',
      status: plugin('two-factor') ? 'enabled' : 'notConfigured',
      ...(plugin('two-factor') ? { origin: originOf('auth.plugins') } : {}),
      signInEntry: false,
      providers: [],
      guide: 'twoFactor',
    },
    {
      id: 'passkey',
      title: text('passkey.title', 'Passkeys'),
      description: text(
        'passkey.description',
        'Sign in with a fingerprint, face or security key',
      ),
      config: 'passkey() · database migration',
      status: plugin('passkey') ? 'enabled' : 'notConfigured',
      ...(plugin('passkey') ? { origin: originOf('auth.plugins') } : {}),
      signInEntry: true,
      providers: [],
      guide: 'passkey',
    },
  ];

  const issues: AuthenticationSettingsIssue[] = [];
  if (passwordSignIn && !diagnosis.available)
    issues.push({
      code: 'passwordResetUnavailable',
      path: 'auth.passwordReset.enabled',
    });
  if (!input.publicOrigin)
    issues.push({ code: 'publicOriginMissing', path: 'app.publicOrigin' });
  if (registrationFeedbackWarning(input.auth))
    issues.push({
      code: 'registrationFeedback',
      path: 'auth.emailAndPassword.autoSignIn',
    });

  const sessionCookie = context.authCookies.sessionToken.attributes;
  const secretConfig = context.secretConfig;
  const versions =
    typeof secretConfig === 'object' ? [...secretConfig.keys.keys()] : [];
  const signingKind = input.auth.secrets?.length
    ? 'authSecrets'
    : input.secretsReady
      ? 'secretsKeys'
      : 'authSecret';

  return {
    issues,
    app: {
      publicOrigin: value('app.publicOrigin', input.publicOrigin ?? null),
      authBasePath: input.authBasePath,
      authBaseUrl: input.publicOrigin
        ? `${input.publicOrigin.replace(/\/+$/u, '')}${input.authBasePath}`
        : null,
    },
    methods,
    signInPage: {
      password: passwordSignIn,
      signUp:
        passwordSignIn && options.emailAndPassword?.disableSignUp !== true,
      forgotPassword: diagnosis.available,
    },
    registration: {
      selfSignUp: value(
        'auth.emailAndPassword.disableSignUp',
        passwordSignIn && options.emailAndPassword?.disableSignUp !== true,
      ),
      autoSignIn: value(
        'auth.emailAndPassword.autoSignIn',
        options.emailAndPassword?.autoSignIn !== false,
      ),
      requireEmailVerification: value(
        'auth.emailAndPassword.requireEmailVerification',
        options.emailAndPassword?.requireEmailVerification === true,
      ),
    },
    password: {
      minLength: value(
        'auth.emailAndPassword.minPasswordLength',
        context.password.config.minPasswordLength,
      ),
      maxLength: value(
        'auth.emailAndPassword.maxPasswordLength',
        context.password.config.maxPasswordLength,
      ),
      username: username
        ? {
            minLength: numberOr(username.minUsernameLength, 3),
            maxLength: numberOr(username.maxUsernameLength, 30),
            origin: originOf('auth.plugins'),
          }
        : null,
    },
    passwordReset: {
      available: diagnosis.available,
      passwordSignIn: diagnosis.passwordSignIn,
      enabled: value(
        'auth.passwordReset.enabled',
        diagnosis.enabled ? true : diagnosis.disabled ? false : null,
      ),
      customSender: diagnosis.customSender,
      sender: {
        ...(diagnosis.customSender
          ? { kind: 'custom' as const }
          : diagnosis.sender
            ? input.resetSender
            : { kind: 'none' as const }),
        configured: diagnosis.customSender || diagnosis.sender,
        origin: originOf(
          diagnosis.customSender
            ? 'auth.emailAndPassword.sendResetPassword'
            : input.resetSender.kind === 'inline'
              ? 'auth.email'
              : input.auth.passwordReset?.mailer !== undefined
                ? 'auth.passwordReset.mailer'
                : 'mailers.default',
        ),
      },
      publicOrigin: diagnosis.publicOrigin,
    },
    session: {
      expiresIn: value(
        'auth.session.expiresIn',
        context.sessionConfig.expiresIn,
      ),
      updateAge: value(
        'auth.session.updateAge',
        context.sessionConfig.updateAge,
      ),
      storage: value(
        'auth.session.storeSessionInDatabase',
        options.session?.storeSessionInDatabase || !context.secondaryStorage
          ? 'database'
          : 'cache',
      ),
      cookieCache: value(
        'auth.session.cookieCache.enabled',
        options.session?.cookieCache?.enabled === true,
      ),
      cookie: {
        secure: sessionCookie.secure === true,
        sameSite: String(sessionCookie.sameSite ?? 'lax').toLowerCase(),
        httpOnly: sessionCookie.httpOnly !== false,
        origin: originOf('auth.advanced.defaultCookieAttributes'),
      },
    },
    security: {
      signingKeys: {
        kind: signingKind,
        origin: originOf(
          signingKind === 'authSecrets'
            ? 'auth.secrets'
            : signingKind === 'secretsKeys'
              ? 'secrets.keys'
              : 'auth.secret',
        ),
        versions,
        currentVersion:
          typeof secretConfig === 'object' ? secretConfig.currentVersion : null,
        legacySecret:
          typeof secretConfig === 'object'
            ? Boolean(secretConfig.legacySecret)
            : true,
      },
      encryptOAuthTokens: value(
        'auth.account.encryptOAuthTokens',
        options.account?.encryptOAuthTokens === true,
      ),
      rateLimit: {
        enabled: context.rateLimit.enabled,
        window: context.rateLimit.window,
        max: context.rateLimit.max,
        origin: originOf('auth.rateLimit'),
      },
    },
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
