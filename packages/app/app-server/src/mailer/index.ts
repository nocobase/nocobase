import { MailSenderFactory, type MailSender } from '../mailers/index.js';
import {
  isMailChannelConfig,
  type EmailMessage,
  type MailResult,
  type MailSendOptions,
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
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '../config/index.js';
import type { AppPluginApplication } from '../plugins/index.js';

/** @deprecated Import MailChannelsConfig from @nocobase/app-plugin-notification-providers/config. */
export interface MailChannelsConfig {
  readonly channels: Readonly<Record<string, unknown>>;
}

/** @deprecated Create an exclusive sender with MailSenderFactory from @nocobase/app-server/mailers. */
export interface Mailer {
  available(channel: string): boolean;
  send(
    channel: string,
    message: EmailMessage,
    options?: MailSendOptions,
  ): Promise<MailResult>;
  close(): Promise<void>;
}

/** @deprecated Create an exclusive sender with MailSenderFactory from @nocobase/app-server/mailers. */
export const mailerToken: ServiceToken<Mailer> = createServiceToken<Mailer>(
  '@nocobase/app-server/mailer',
);

/** @deprecated Import validateMailChannels from @nocobase/app-plugin-notification-providers/config. */
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

/** @deprecated Import defineMailChannelsConfig from @nocobase/app-plugin-notification-providers/config. */
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

/** @deprecated Create an exclusive sender with MailSenderFactory from @nocobase/app-server/mailers. */
export function createMailer(config: MailChannelsConfig): Mailer {
  // Legacy channel semantics: this mailer owns one sender per channel it has used.
  const factory = new MailSenderFactory();
  const transports = new Map<string, MailSender>();
  let closed = false;
  const available = (channel: string): boolean => {
    const value = mailChannel(config.channels[channel]);
    return !closed && value !== undefined && value.enabled !== false;
  };
  return {
    available,
    async send(channel, message, options): Promise<MailResult> {
      const value = mailChannel(config.channels[channel]);
      if (closed || !value || value.enabled === false)
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
        transport = factory.createFromConfig(value);
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

/** @deprecated Create an exclusive sender with MailSenderFactory from @nocobase/app-server/mailers. */
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
