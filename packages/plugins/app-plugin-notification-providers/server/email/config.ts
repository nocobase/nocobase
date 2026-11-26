import {
  assertMailerReference,
  type MailersConfig,
} from '@nocobase/app-server/mailers/config';
import { validateEmailChannelReference } from './reference-config.js';
import { isMailChannelConfig } from '@nocobase/mailer/config';
import { validateSmsChannelConfig } from '../sms/config.js';
import type { SmsChannelConfig } from '../sms/types.js';
import {
  defineAppConfig,
  resolveChannelType,
  envString,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '@nocobase/app-server/config';

export interface MailChannelsConfig {
  readonly channels: Readonly<Record<string, unknown>>;
}

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
      if (Reflect.get(normalized, 'provider') === 'email') {
        validateEmailChannelReference(
          normalized as unknown as import('./reference-config.js').EmailChannelReferenceConfig,
        );
        if (Reflect.get(channel, 'enabled') !== false && context.get) {
          const mailers = (context.get('mailers') ?? {}) as MailersConfig;
          assertMailerReference(
            mailers,
            Reflect.get(channel, 'mailer') ?? mailers.default,
            `notification.channels.${name}.mailer`,
          );
        }
        continue;
      }
      if ('mailer' in channel)
        throw new Error('Inline channels cannot include a mailer reference.');
      if (Reflect.get(channel, 'enabled') === false) continue;
      const provider: unknown = Reflect.get(normalized, 'provider');
      if (provider === 'sms') {
        validateSmsChannelConfig(normalized as unknown as SmsChannelConfig);
        continue;
      }
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
      // Private SMS credentials and the signature of the conventional `system-sms` channel.
      SMS_ALIYUN_ACCESS_KEY_ID: envString(
        'channels.system-sms.aliyun.accessKeyId',
        { secret: true, required: false },
      ),
      SMS_ALIYUN_ACCESS_KEY_SECRET: envString(
        'channels.system-sms.aliyun.accessKeySecret',
        { secret: true, required: false },
      ),
      SMS_TENCENT_SECRET_ID: envString('channels.system-sms.tencent.secretId', {
        secret: true,
        required: false,
      }),
      SMS_TENCENT_SECRET_KEY: envString(
        'channels.system-sms.tencent.secretKey',
        { secret: true, required: false },
      ),
      SMS_SIGN_NAME: envString('channels.system-sms.signName', {
        required: false,
      }),
      ...definition.env,
    },
  });
}
