import type {
  AppConfigAccessor,
  AppIdentityConfig,
} from '@nocobase/app-server/config';
import type { MailSenderFactory } from '@nocobase/app-server/mailers';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

import type { Auth } from './auth.js';
import type { AuthConfig } from './config.js';
import {
  collectAuthenticationSettings,
  configuredProviders,
  type AuthenticationSettings,
  type PasswordResetSenderDescription,
} from './settings.js';
import type { SignInMethodRegistry } from './sign-in-methods.js';

/** A single sign-on or social provider a person can link to their account. */
export interface AuthenticationProviderSummary {
  readonly id: string;
  readonly name: string;
}

/** What `GET /api/authentication/settings` and `GET /api/authentication/providers` answer. */
export interface AuthenticationSettingsService {
  read(): Promise<AuthenticationSettings>;
  providers(): Promise<readonly AuthenticationProviderSummary[]>;
}

export const authenticationSettingsServiceToken: ServiceToken<AuthenticationSettingsService> =
  createServiceToken<AuthenticationSettingsService>(
    '@nocobase/app/authentication/settings',
  );

export interface AuthenticationSettingsServiceOptions {
  readonly config: AppConfigAccessor;
  readonly authentication: () => Auth;
  readonly methods: SignInMethodRegistry;
  readonly resetSender: PasswordResetSenderDescription;
  readonly secretsReady: () => boolean;
  /** Better Auth's public path, such as `/main/api/auth`. */
  readonly authBasePath: string;
  /** Defaults to `process.env`. */
  readonly environment?: Readonly<Record<string, string | undefined>>;
}

export function createAuthenticationSettingsService(
  options: AuthenticationSettingsServiceOptions,
): AuthenticationSettingsService {
  return {
    read() {
      const app = options.config.get<AppIdentityConfig>('app');
      return collectAuthenticationSettings({
        auth: options.config.get<AuthConfig>('auth') ?? {},
        publicOrigin: app?.publicOrigin || undefined,
        authBasePath: options.authBasePath,
        layers: options.config.layers?.(),
        environmentVariables:
          options.config.sectionEnvironmentVariables?.() ?? {},
        environment: options.environment ?? process.env,
        authentication: options.authentication(),
        methods: options.methods,
        resetSender: options.resetSender,
        secretsReady: options.secretsReady(),
      });
    },
    async providers() {
      // Id and name only: how a provider is linked is the client's concern.
      return (await configuredProviders(options.authentication())).map(
        ({ id, name }) => ({ id, name }),
      );
    },
  };
}

/** Which sender password reset uses, by name only, in the precedence `createPasswordResetSender` applies. */
export function describeResetSender(
  snapshot: Pick<AuthConfig, 'email' | 'passwordReset'> | undefined,
  factory: Pick<MailSenderFactory, 'defaultMailer'>,
): PasswordResetSenderDescription {
  if (snapshot?.passwordReset?.mailer !== undefined)
    return { kind: 'mailer', mailer: snapshot.passwordReset.mailer };
  if (snapshot?.email)
    return {
      kind: 'inline',
      ...(typeof snapshot.email.provider === 'string'
        ? { provider: snapshot.email.provider }
        : {}),
    };
  if (snapshot?.passwordReset?.emailChannel !== undefined)
    return { kind: 'legacyChannel' };
  if (factory.defaultMailer)
    return { kind: 'mailer', mailer: factory.defaultMailer };
  return { kind: 'legacyChannel' };
}
