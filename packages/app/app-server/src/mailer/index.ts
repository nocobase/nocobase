import { validateMailConfiguration } from '../config/mail.js';
import { loggingToken } from '../logging/token.js';
import {
  createMailTransport,
  isMailChannelConfig,
  type EmailMessage,
  type MailResult,
  type MailSendOptions,
  type MailTransport,
  type EmailChannelConfig,
} from '@nocobase/mailer';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';
import {
  defineAppConfig,
  resolveChannelType,
  envString,
  envInteger,
  envBoolean,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
  type EnvironmentMapping,
} from '../config/index.js';
import type { AppPluginApplication } from '../plugins/index.js';

/** Named outbound configurations; Mail plugin settings may coexist in this section. */
export type MailConfig = Readonly<Record<string, unknown>>;

/** Keep legacy channel identities distinct from mail names during migration. */
export const legacyMailerName = (name: string): string =>
  `notification.channels.${name}`;

export interface MailChannelsConfig {
  readonly channels: Readonly<Record<string, unknown>>;
}

export interface Mailer {
  provider?(name: string): 'smtp' | 'resend' | undefined;
  available(channel: string): boolean;
  send(
    channel: string,
    message: EmailMessage,
    options?: MailSendOptions,
  ): Promise<MailResult>;
  close(): Promise<void>;
}

export const mailerToken: ServiceToken<Mailer> = createServiceToken<Mailer>(
  '@nocobase/app-server/mailer',
);

export const validateMailChannels: ConfigValidator<MailChannelsConfig> = (
  config,
  context,
) => {
  for (const [name, channel] of Object.entries(config.channels ?? {})) {
    if (!channel || typeof channel !== 'object') continue;
    if (
      Reflect.get(channel, 'enabled') === false &&
      Reflect.get(channel, 'type') === undefined &&
      Reflect.get(channel, 'provider') === undefined
    )
      continue;
    try {
      const normalized = normalizeChannel(channel);
      if (Reflect.get(channel, 'enabled') === false) continue;
      const provider: unknown = Reflect.get(normalized, 'provider');
      if (
        (provider === 'smtp' || provider === 'resend') &&
        !isMailChannelConfig(normalized)
      )
        context.error(
          `channels.${name}`,
          'Invalid built-in email channel configuration.',
        );
    } catch (error) {
      context.error(
        `channels.${name}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
};

function normalizeChannel(channel: object): object {
  const type: unknown = Reflect.get(channel, 'type');
  const provider: unknown = Reflect.get(channel, 'provider');
  return { ...channel, provider: resolveChannelType({ type, provider }) };
}

function mailChannel(channel: unknown): EmailChannelConfig | undefined {
  if (!channel || typeof channel !== 'object') return undefined;
  try {
    const normalized = normalizeChannel(channel);
    return isMailChannelConfig(normalized) ? normalized : undefined;
  } catch {
    return undefined;
  }
}

/** Declare the existing notification section without installing any notification plugin. */
export function defineMailChannelsConfig<T extends MailChannelsConfig>(
  definition: AppConfigDefinition<T>,
): AppConfigFactory<T> {
  const extra: readonly ConfigValidator<T>[] = definition.validate
    ? Array.isArray(definition.validate)
      ? (definition.validate as readonly ConfigValidator<T>[])
      : [definition.validate as ConfigValidator<T>]
    : [];
  return defineAppConfig<T>({
    ...definition,
    validate: [validateMailChannels, ...extra],
    env: {
      SMTP_PASSWORD: envString('channels.system-email.auth.pass', {
        secret: true,
        required: false,
      }),
      RESEND_API_KEY: envString('channels.system-email.apiKey', {
        secret: true,
        required: false,
      }),
      ...definition.env,
    },
  });
}

/** Environment parser errors must not echo operator-supplied values. */
function mailEnvironment(mapping: EnvironmentMapping): EnvironmentMapping {
  return {
    ...mapping,
    parse(value) {
      try {
        return mapping.parse ? mapping.parse(value) : value;
      } catch {
        throw new Error(
          `Invalid environment value at mail.${mapping.path}. Check the declared variable type.`,
        );
      }
    },
  };
}

/** Declare outbound mail without publishing credentials to the browser. */
export function defineMailConfig<T extends object = MailConfig>(
  definition: AppConfigDefinition<T> = { defaults: {} as T },
): AppConfigFactory<T> {
  return defineAppConfig({
    ...definition,
    public: [],
    env: {
      MAIL_PROVIDER: envString('default.provider', { required: false }),
      MAIL_HOST: envString('default.host', { required: false }),
      MAIL_PORT: mailEnvironment(
        envInteger('default.port', { required: false }),
      ),
      MAIL_SECURE: mailEnvironment(
        envBoolean('default.secure', { required: false }),
      ),
      MAIL_USER: envString('default.auth.user', { required: false }),
      MAIL_PASSWORD: envString('default.auth.pass', {
        secret: true,
        required: false,
      }),
      MAIL_FROM: envString('default.from', { required: false }),
      MAIL_API_KEY: envString('default.apiKey', {
        secret: true,
        required: false,
      }),
      ...definition.env,
    },
  });
}

export function createMailer(
  config: MailChannelsConfig = { channels: {} },
  mail?: MailConfig,
): Mailer {
  const transports = new Map<string, MailTransport>();
  let closed = false;
  const resolve = (name: string): EmailChannelConfig | undefined => {
    const prefix = 'notification.channels.';
    return name.startsWith(prefix)
      ? mailChannel(config.channels[name.slice(prefix.length)])
      : mail === undefined
        ? mailChannel(config.channels[name])
        : mailChannel(mail[name]);
  };
  return {
    provider(name) {
      return resolve(name)?.provider;
    },
    available(name) {
      const value = resolve(name);
      return !closed && value !== undefined && value.enabled !== false;
    },
    async send(name, message, options): Promise<MailResult> {
      const identity =
        mail === undefined && !name.startsWith('notification.channels.')
          ? legacyMailerName(name)
          : name;
      let transport = transports.get(identity);
      if (closed) transport = undefined;
      if (!transport) {
        const value = resolve(name);
        if (closed || !value || value.enabled === false)
          return {
            status: 'failed',
            disposition: 'never',
            error: {
              category: 'configuration',
              message: 'Mailer unavailable.',
            },
          };
        transport = createMailTransport(value);
        transports.set(identity, transport);
      }
      return transport.send(message, options);
    },
    async close(): Promise<void> {
      if (closed) return;
      closed = true;
      await Promise.all(
        [...transports.values()].map((transport) => transport.close()),
      );
    },
  };
}

export class MailerProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/mailer';
  private ownsMailer = false;
  public override register(): void {
    if (this.app.container.has(mailerToken)) return;
    this.ownsMailer = true;
    this.app.container.singleton(mailerToken, () =>
      createMailer(
        this.app.config.get<MailChannelsConfig>('notification') ?? {
          channels: {},
        },
        this.app.config.get<MailConfig>('mail') ?? {},
      ),
    );
  }
  public override async boot(): Promise<void> {
    if (!this.ownsMailer) return;
    const warning = validateMailConfiguration({
      mail: this.app.config.get('mail'),
      notification: this.app.config.get('notification'),
      auth: this.app.config.get('auth'),
    }).find((issue) => issue.level === 'warning');
    if (!warning) return;
    const message = `${warning.message} ${warning.fix}`;
    if (this.app.container.has(loggingToken))
      this.app.container
        .resolve(loggingToken)
        .getLogger('mail')
        .warn({}, message);
    else console.warn(message);
  }
  public override async shutdown(): Promise<void> {
    if (this.ownsMailer)
      await this.app.container.resolveIfCreated(mailerToken)?.close();
  }
}
