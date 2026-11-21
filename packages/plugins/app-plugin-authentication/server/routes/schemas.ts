import { z } from 'zod';

import type { AuthenticationSettings } from '../settings.js';
import type { AuthenticationProviderSummary } from '../settings-service.js';
import type { ConfigOrigin, SignInMethodText } from '../sign-in-methods.js';

/** The public authentication capabilities returned without a session. */
export interface PasswordResetCapability {
  readonly passwordResetAvailable: boolean;
}

export const PasswordResetCapabilitySchema: z.ZodType<PasswordResetCapability> =
  z.object({ passwordResetAvailable: z.boolean() }).meta({
    ref: 'AuthenticationPasswordResetCapability',
    description: 'Whether email-based password reset is configured.',
  });

const ConfigOriginSchema: z.ZodType<ConfigOrigin> = z
  .object({
    path: z.string().meta({
      description: 'The configuration path, such as `auth.session.expiresIn`.',
    }),
    source: z.enum(['env', 'file', 'code', 'default']).meta({
      description:
        'Where the value comes from: an environment variable, `config.yml`, the application code, or the default.',
    }),
    env: z
      .string()
      .optional()
      .meta({ description: 'The environment variable, for `env`.' }),
  })
  .meta({ ref: 'AuthenticationConfigOrigin' });

const TextSchema: z.ZodType<SignInMethodText> = z
  .object({ key: z.string(), ns: z.string(), defaultValue: z.string() })
  .meta({
    ref: 'AuthenticationText',
    description: 'A translatable text and its English default.',
  });

const setting = <TValue extends z.ZodType>(schema: TValue) =>
  z.object({ value: schema, origin: ConfigOriginSchema });

export const AuthenticationSettingsSchema: z.ZodType<AuthenticationSettings> = z
  .object({
    issues: z.array(
      z.object({
        code: z.enum([
          'passwordResetUnavailable',
          'publicOriginMissing',
          'registrationFeedback',
        ]),
        path: z.string(),
      }),
    ),
    app: z.object({
      publicOrigin: setting(z.string().nullable()),
      authBasePath: z.string(),
      authBaseUrl: z.string().nullable(),
    }),
    methods: z.array(
      z.object({
        id: z.string(),
        title: TextSchema,
        description: TextSchema.optional(),
        config: z.string().optional(),
        status: z.enum(['enabled', 'notConfigured']),
        origin: ConfigOriginSchema.optional(),
        signInEntry: z.boolean(),
        detailsPath: z.string().optional(),
        providers: z.array(z.string()),
        guide: z.enum(['sso', 'social', 'twoFactor', 'passkey']).optional(),
      }),
    ),
    signInPage: z.object({
      password: z.boolean(),
      signUp: z.boolean(),
      forgotPassword: z.boolean(),
      providers: z.array(z.string()),
    }),
    registration: z.object({
      selfSignUp: setting(z.boolean()),
      autoSignIn: setting(z.boolean()),
      requireEmailVerification: setting(z.boolean()),
    }),
    password: z.object({
      minLength: setting(z.number()),
      maxLength: setting(z.number()),
      username: z
        .object({
          minLength: z.number(),
          maxLength: z.number(),
          origin: ConfigOriginSchema,
        })
        .nullable(),
    }),
    passwordReset: z.object({
      available: z.boolean(),
      passwordSignIn: z.boolean(),
      enabled: setting(z.boolean().nullable()),
      customSender: z.boolean(),
      sender: z.object({
        kind: z.enum(['mailer', 'inline', 'legacyChannel', 'custom', 'none']),
        mailer: z.string().optional(),
        provider: z.string().optional(),
        configured: z.boolean(),
        origin: ConfigOriginSchema,
      }),
      publicOrigin: z.boolean(),
    }),
    session: z.object({
      expiresIn: setting(z.number()),
      updateAge: setting(z.number()),
      storage: setting(z.enum(['database', 'cache'])),
      cookieCache: setting(z.boolean()),
      cookie: z.object({
        secure: z.boolean(),
        sameSite: z.string(),
        httpOnly: z.boolean(),
        origin: ConfigOriginSchema,
      }),
    }),
    security: z.object({
      signingKeys: z.object({
        kind: z.enum(['authSecrets', 'secretsKeys', 'authSecret']),
        origin: ConfigOriginSchema,
        versions: z.array(z.number()),
        currentVersion: z.number().nullable(),
        legacySecret: z.boolean(),
      }),
      encryptOAuthTokens: setting(z.boolean()),
      rateLimit: z.object({
        enabled: z.boolean(),
        window: z.number(),
        max: z.number(),
        origin: ConfigOriginSchema,
      }),
    }),
  })
  .meta({
    ref: 'AuthenticationSettings',
    description:
      'The effective sign-in and authentication settings, where each comes from, and the problems to fix. Never holds a secret, a signing key, a client secret or a mail credential.',
  });

export const AuthenticationProviderSchema: z.ZodType<AuthenticationProviderSummary> =
  z
    .object({
      id: z.string().meta({
        description: 'The provider id Better Auth links accounts with.',
      }),
      name: z.string(),
      type: z.enum(['oidc', 'social']),
    })
    .meta({
      ref: 'AuthenticationProvider',
      description: 'A single sign-on or social provider a person can link.',
    });

export const AuthenticationProvidersMetaSchema: z.ZodType<{ total: number }> =
  z.object({ total: z.number().int() });
