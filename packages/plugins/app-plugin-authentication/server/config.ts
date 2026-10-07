import {
  ApplicationNotConfiguredError,
  assertSecretIsNotPlaceholder,
  defineAppConfig,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '@nocobase/app-server/config';

export type AuthConfig = import('better-auth').BetterAuthOptions;

/**
 * The `auth` fields the browser may read, through `config.public`. `useSignUpAvailable()` on the client combines them;
 * keep the two in step.
 */
export const AUTH_PUBLIC_PATHS: readonly string[] = [
  'emailAndPassword.enabled',
  'emailAndPassword.disableSignUp',
];

/** The environment variables that set `auth` fields, which this plugin reads. */
const AUTH_ENVIRONMENT = {
  AUTH_SECRET: envString('secret', {
    description:
      'The legacy sign-in secret; keys are derived from SECRETS_KEYS when it is set.',
    secret: true,
    generate: 'secret',
  }),
};

const BOOLEAN_FIELDS = ['enabled', 'disableSignUp', 'autoSignIn'] as const;

/** The rules this plugin holds the `auth` section to, whichever application declares it. */
export const validateAuthConfig: ConfigValidator<AuthConfig> = (
  auth,
  context,
) => {
  const emailAndPassword: Record<string, unknown> =
    (auth.emailAndPassword as Record<string, unknown> | undefined) ?? {};
  for (const field of BOOLEAN_FIELDS) {
    const value = emailAndPassword[field];
    if (value !== undefined && typeof value !== 'boolean') {
      context.error(`emailAndPassword.${field}`, 'must be true or false.');
    }
  }
  if (
    emailAndPassword.enabled === false &&
    emailAndPassword.disableSignUp === false &&
    context.isUserProvided('emailAndPassword.disableSignUp')
  ) {
    context.warning(
      'emailAndPassword.disableSignUp',
      'has no effect while emailAndPassword.enabled is false.',
    );
  }
};

/**
 * Declares the `auth` section with this plugin's validation and public fields, in place of `defineAppConfig`.
 *
 * An application that keeps a plain `defineAppConfig` still starts, but its `auth` settings go unchecked and the
 * browser cannot tell whether sign-up is open, so the plugin warns about it at startup. A `validate` given here runs
 * after the plugin's own.
 */
export function defineAuthConfig(
  definition: AppConfigDefinition<AuthConfig>,
): AppConfigFactory<AuthConfig> {
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<AuthConfig>[])
        : [definition.validate as ConfigValidator<AuthConfig>];
  return defineAppConfig<AuthConfig>({
    defaults: definition.defaults,
    validate: [validateAuthConfig, ...extra],
    public: [...new Set([...AUTH_PUBLIC_PATHS, ...(definition.public ?? [])])],
    env: { ...AUTH_ENVIRONMENT, ...definition.env },
  });
}

/** The purpose Better Auth's keys are derived for from the application's secrets keys. */
export const BETTER_AUTH_SECRETS_PURPOSE =
  '@nocobase/app-plugin-authentication/better-auth';

/** What the secrets service offers this plugin; the subset `resolveAuthSecrets` reads. */
export interface AuthSecretsSource {
  readonly ready: boolean;
  keyring(purpose: string): { version: number; value: string }[];
}

/** The keys Better Auth signs and encrypts with, as its `secret` and `secrets` options take them. */
export interface ResolvedAuthSecrets {
  readonly secret?: string;
  readonly secrets?: { version: number; value: string }[];
}

/**
 * The keys sessions and tokens are signed and encrypted with, or a refusal to start without any.
 *
 * `auth.secrets` set by the application is used as it is. Otherwise Better Auth's versioned `secrets` are derived from
 * the application's secrets keys, so rotating those rotates these, and an `auth.secret` beside them is passed on as
 * Better Auth's legacy secret, which still decrypts what was encrypted before the keys were configured. Without
 * secrets keys, `auth.secret` alone works as it always did.
 */
export function resolveAuthSecrets(
  auth: Pick<AuthConfig, 'secret' | 'secrets'>,
  secrets: AuthSecretsSource | undefined,
): ResolvedAuthSecrets {
  // Checked ahead of everything else, because the placeholder is a non-empty string that would otherwise be taken as
  // a configured secret, and it is the same string in every installation that copied `config.example.yml`.
  assertSecretIsNotPlaceholder(auth.secret, 'auth.secret');
  const secret = auth.secret?.trim() ? auth.secret : undefined;

  if (auth.secrets?.length)
    return secret
      ? { secret, secrets: auth.secrets }
      : { secrets: auth.secrets };
  if (secrets?.ready) {
    const derived = secrets.keyring(BETTER_AUTH_SECRETS_PURPOSE);
    return secret ? { secret, secrets: derived } : { secrets: derived };
  }
  if (secret) return { secret };

  // The fact only: a standalone start adds `pnpm nocobase config init`, and a Hub shows this to an operator whose
  // configuration lives in the Hub, where that advice would be wrong.
  throw new ApplicationNotConfiguredError('secrets.keys is not set.', {
    key: 'secrets.keys',
    environmentVariable: 'SECRETS_KEYS',
  });
}

/**
 * `auth.secret` alone, or a refusal to start without it.
 *
 * @deprecated The provider reads `resolveAuthSecrets`, which also derives Better Auth's keys from `secrets.keys`.
 */
export function resolveAuthSecret(secret: string | undefined): string {
  assertSecretIsNotPlaceholder(secret, 'auth.secret');
  if (secret) return secret;
  throw new ApplicationNotConfiguredError('auth.secret is not set.', {
    key: 'auth.secret',
    environmentVariable: 'AUTH_SECRET',
  });
}
