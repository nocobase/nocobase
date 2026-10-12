import {
  createMailTransport,
  isMailChannelConfig,
  type EmailMessage,
  type MailResult,
  type MailSendOptions,
  type MailTransport,
} from '@nocobase/mailer';
import {
  createServiceToken,
  ServiceProvider,
  type ServiceToken,
} from '@nocobase/service-provider';
import {
  defineAppConfig,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '../config/index.js';
import type { AppPluginApplication } from '../plugins/index.js';

export interface MailChannelsConfig {
  readonly channels: Readonly<Record<string, unknown>>;
}

export interface Mailer {
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
    if (
      !channel ||
      typeof channel !== 'object' ||
      Reflect.get(channel, 'enabled') === false
    )
      continue;
    const provider: unknown = Reflect.get(channel, 'provider');
    if (
      (provider === 'smtp' || provider === 'resend') &&
      !isMailChannelConfig(channel)
    )
      context.error(
        `channels.${name}`,
        'Invalid built-in email channel configuration.',
      );
  }
};

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
      }),
      RESEND_API_KEY: envString('channels.system-email.apiKey', {
        secret: true,
      }),
      ...definition.env,
    },
  });
}

export function createMailer(config: MailChannelsConfig): Mailer {
  const transports = new Map<string, MailTransport>();
  let closed = false;
  const available = (channel: string): boolean => {
    const value = config.channels[channel];
    return !closed && isMailChannelConfig(value) && value.enabled !== false;
  };
  return {
    available,
    async send(channel, message, options): Promise<MailResult> {
      const value = config.channels[channel];
      if (!available(channel) || !isMailChannelConfig(value))
        return {
          status: 'failed',
          disposition: 'never',
          error: {
            category: 'configuration',
            message: 'Email channel unavailable.',
          },
        };
      let transport = transports.get(channel);
      if (!transport) {
        transport = createMailTransport(value);
        transports.set(channel, transport);
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
  public override register(): void {
    this.app.container.singleton(mailerToken, () =>
      createMailer(
        this.app.config.get<MailChannelsConfig>('notification') ?? {
          channels: {},
        },
      ),
    );
  }
  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(mailerToken)?.close();
  }
}
