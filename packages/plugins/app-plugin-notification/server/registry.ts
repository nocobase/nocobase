import { resolveChannelType } from '@nocobase/app-server/config';
import {
  adaptChannelType,
  legacyChannelConfig,
  type RegisteredChannelType,
} from './channel-type-adapter.js';
import type { ChannelConfig, ChannelTypeClass } from './channel-type.js';
import type {
  NotificationChannelDefinition,
  NotificationConfigInput,
  NotificationExtensionRegistry,
  NotificationProviderDefinition,
} from './types.js';

/** Collects definitions without creating runtime resources. */
export class NotificationRegistry implements NotificationExtensionRegistry {
  private readonly channelDefinitions = new Map<
    string,
    NotificationChannelDefinition
  >();
  private readonly providerDefinitions = new Map<
    string,
    NotificationProviderDefinition
  >();

  private readonly channelTypes = new Map<string, RegisteredChannelType>();

  registerChannelType<
    C extends ChannelConfig,
    M extends object,
    R extends object,
    P extends object,
  >(Channel: ChannelTypeClass<C, M, R, P>): this {
    if (!Channel.type?.trim() || Channel.type !== Channel.type.trim())
      throw new Error(
        'Notification Channel type requires a non-empty trimmed identifier.',
      );
    if (
      this.channelTypes.has(Channel.type) ||
      this.providerDefinitions.has(Channel.type)
    )
      throw new Error(
        `Notification Channel type "${Channel.type}" is already registered.`,
      );
    this.channelTypes.set(Channel.type, adaptChannelType(Channel));
    return this;
  }

  channelType(type: string): RegisteredChannelType | undefined {
    return this.channelTypes.get(type);
  }

  /** @deprecated Register a ChannelInstance class with registerChannelType instead. */
  registerChannel(definition: NotificationChannelDefinition): this {
    if (this.channelDefinitions.has(definition.type))
      throw new Error(
        `Notification message type "${definition.type}" is already registered.`,
      );
    this.channelDefinitions.set(definition.type, definition);
    return this;
  }

  /** @deprecated Register a ChannelInstance class with registerChannelType instead. */
  registerProvider(definition: NotificationProviderDefinition): this {
    if (
      !definition.type?.trim() ||
      definition.type !== definition.type.trim() ||
      !definition.messageType?.trim()
    )
      throw new Error(
        'Notification Provider requires a non-empty identifier and message type.',
      );
    if (
      this.providerDefinitions.has(definition.type) ||
      this.channelTypes.has(definition.type)
    )
      throw new Error(
        `Notification Provider "${definition.type}" is already registered.`,
      );
    this.providerDefinitions.set(definition.type, definition);
    return this;
  }

  channel(type: string): NotificationChannelDefinition | undefined {
    return this.channelDefinitions.get(type);
  }

  provider(type: string): NotificationProviderDefinition | undefined {
    return this.providerDefinitions.get(type);
  }

  validate(config: NotificationConfigInput): void {
    if (
      config.retry !== undefined &&
      (!config.retry ||
        typeof config.retry !== 'object' ||
        Array.isArray(config.retry))
    )
      throw new Error('Notification retry must be an object.');
    if (
      config.retry?.maxAttempts !== undefined &&
      (!Number.isInteger(config.retry.maxAttempts) ||
        config.retry.maxAttempts < 1)
    )
      throw new Error(
        'Notification retry maxAttempts must be an integer >= 1.',
      );
    if (
      config.retry?.intervalMs !== undefined &&
      (!Number.isInteger(config.retry.intervalMs) ||
        config.retry.intervalMs < 0)
    )
      throw new Error('Notification retry intervalMs must be an integer >= 0.');
    if (
      !config.channels ||
      typeof config.channels !== 'object' ||
      Array.isArray(config.channels)
    )
      throw new Error(
        'Notification channels must be a name-to-configuration map.',
      );
    for (const [name, channelConfig] of Object.entries(config.channels)) {
      if (!name.trim() || name !== name.trim() || name.length > 100)
        throw new Error(
          'Notification Channel names must be non-empty trimmed strings.',
        );
      if (
        !channelConfig ||
        typeof channelConfig !== 'object' ||
        Array.isArray(channelConfig)
      )
        throw new Error(
          `Invalid configuration for Notification Channel "${name}".`,
        );
      for (const key of ['name', 'providers'])
        if (key in channelConfig)
          throw new Error(
            `Unsupported Notification Channel property "${key}".`,
          );
      if (
        channelConfig.enabled !== undefined &&
        typeof channelConfig.enabled !== 'boolean'
      )
        throw new Error('Notification Channel enabled must be a boolean.');
      if (
        channelConfig.enabled === false &&
        Reflect.get(channelConfig, 'type') === undefined &&
        Reflect.get(channelConfig, 'provider') === undefined
      )
        continue;
      let providerType: string;
      try {
        providerType = resolveChannelType(channelConfig);
      } catch (error) {
        throw new Error(
          `Invalid Notification Channel "${name}": ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      if (channelConfig.enabled === false) continue;
      const registered = this.channelType(providerType);
      if (registered) {
        registered.validateConfig(channelConfig);
        continue;
      }
      const provider = this.provider(providerType);
      if (!provider)
        throw new Error(
          `Notification Channel "${name}" Provider "${providerType}" is not registered.`,
        );
      const channel = this.channel(provider.messageType);
      if (!channel)
        throw new Error(
          `Notification message type "${provider.messageType}" is not registered.`,
        );
      channel.validateConfig?.(legacyChannelConfig(channelConfig));
      provider.validateConfig?.(legacyChannelConfig(channelConfig));
    }
  }
}

export function createNotificationRegistry(): NotificationRegistry {
  return new NotificationRegistry();
}
