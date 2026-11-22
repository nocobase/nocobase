import { resolveChannelType } from '@nocobase/app-server/config';
import type { ChannelRuntime } from './channel-manager.js';
import type {
  ChannelConfig,
  ChannelConfigSummaryItem,
  ChannelContext,
  ChannelTypeClass,
} from './channel-type.js';
import type {
  NotificationChannelConfigInput,
  NotificationI18nText,
  NotificationProviderConfig,
} from './types.js';

export interface RegisteredChannelType {
  readonly type: string;
  readonly label?: string | NotificationI18nText;
  readonly messageType: string;
  readonly contributor?: string;
  summarize(
    config: NotificationChannelConfigInput,
  ): readonly ChannelConfigSummaryItem[];
  validateConfig(config: NotificationChannelConfigInput): void;
  create(
    context: ChannelContext,
    config: NotificationChannelConfigInput,
  ): Promise<ChannelRuntime>;
}

export function channelConfig(
  config: NotificationChannelConfigInput,
): ChannelConfig {
  const { provider: _provider, ...rest } =
    config as NotificationChannelConfigInput & {
      readonly provider?: string;
    };
  return { ...rest, type: resolveChannelType(config) };
}

export function legacyChannelConfig(
  config: NotificationChannelConfigInput,
): NotificationProviderConfig {
  const { type: _type, ...rest } = config as NotificationChannelConfigInput & {
    readonly type?: string;
  };
  return { ...rest, provider: resolveChannelType(config) };
}

// Preserve the persisted message-family column and existing response descriptors for built-in types.
// New extensions need only a concrete type; they have no historical message-family identifier.
const historicalMessageTypes: ReadonlyMap<string, string> = new Map([
  ['smtp', 'email'],
  ['resend', 'email'],
  ['feishu-webhook', 'im'],
  ['dingtalk-webhook', 'im'],
]);

export function adaptChannelType<
  TConfig extends ChannelConfig,
  TMessage extends object,
  TRecipient extends object,
  TPrepared extends object,
>(
  Channel: ChannelTypeClass<TConfig, TMessage, TRecipient, TPrepared>,
): RegisteredChannelType {
  const messageType = historicalMessageTypes.get(Channel.type) ?? Channel.type;
  return {
    type: Channel.type,
    label: Channel.label,
    messageType,
    ...(Channel.contributor ? { contributor: Channel.contributor } : {}),
    summarize(config) {
      if (!Channel.summarize) return [];
      // A summary is display only: a type that cannot describe a configuration shows none rather than failing the page.
      try {
        return Channel.summarize(channelConfig(config) as TConfig).map(
          ({ label, value }) => ({ label, value: String(value) }),
        );
      } catch {
        return [];
      }
    },
    validateConfig(config) {
      Channel.validateConfig?.(channelConfig(config) as TConfig);
    },
    async create(context, config) {
      const instance = new Channel(context, channelConfig(config) as TConfig);
      try {
        await instance.initialize?.();
      } catch (error) {
        try {
          await instance.close?.();
        } catch (cleanupError) {
          throw new AggregateError(
            [error, cleanupError],
            'Notification Channel initialization and cleanup failed.',
            { cause: cleanupError },
          );
        }
        throw error;
      }
      return {
        ...(instance.resolveUsers || instance.compose
          ? {
              audience: {
                ...(instance.resolveUsers
                  ? {
                      resolveUsers: (userIds: readonly string[]) =>
                        instance.resolveUsers!(userIds),
                    }
                  : {}),
                ...(instance.compose
                  ? {
                      compose: (
                        content: Parameters<
                          NonNullable<typeof instance.compose>
                        >[0],
                        recipients: readonly object[],
                      ) =>
                        instance.compose!(
                          content,
                          recipients as readonly TRecipient[],
                        ),
                    }
                  : {}),
              },
            }
          : {}),
        channel: {
          type: messageType,
          validateMessage: (input) => instance.validateMessage(input),
          prepare: (input) =>
            instance.prepare({
              notificationId: input.notificationId,
              deliveryId: input.deliveryId,
              signal: input.signal,
              message: input.message as TMessage,
              recipient: input.recipient as TRecipient,
            }),
        },
        provider: {
          type: Channel.type,
          capabilities: instance.capabilities,
          send: (input) =>
            instance.send({ ...input, message: input.message as TPrepared }),
          close: instance.close ? () => instance.close!() : undefined,
        },
      };
    },
  };
}
