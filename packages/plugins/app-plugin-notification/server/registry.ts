import type {
  NotificationChannelDefinition,
  NotificationConfig,
  NotificationExtensionRegistry,
  NotificationProviderDefinition,
  NotificationTestTargetDescriptor,
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

  registerChannel(definition: NotificationChannelDefinition): this {
    if (this.channelDefinitions.has(definition.type))
      throw new Error(
        `Notification message type "${definition.type}" is already registered.`,
      );
    this.channelDefinitions.set(definition.type, definition);
    return this;
  }

  registerProvider(definition: NotificationProviderDefinition): this {
    if (
      !definition.type?.trim() ||
      definition.type !== definition.type.trim() ||
      !definition.messageType?.trim()
    )
      throw new Error(
        'Notification Provider requires a non-empty identifier and message type.',
      );
    if (this.providerDefinitions.has(definition.type))
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

  testTargets(
    config: NotificationConfig,
  ): readonly NotificationTestTargetDescriptor[] {
    return Object.entries(config.channels).flatMap(([name, channelConfig]) => {
      if (channelConfig.enabled === false) return [];
      const provider = this.provider(channelConfig.provider);
      const channel = provider && this.channel(provider.messageType);
      if (!channel?.test || !provider) return [];
      return [
        {
          channel: { name, type: provider.messageType, label: name },
          provider: {
            type: provider.type,
            label: provider.label ?? provider.type,
          },
          fields: channel.test.fields,
        },
      ];
    });
  }

  validate(config: NotificationConfig): void {
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
      for (const key of ['name', 'type', 'providers'])
        if (key in channelConfig)
          throw new Error(
            `Unsupported Notification Channel property "${key}".`,
          );
      if (
        channelConfig.enabled !== undefined &&
        typeof channelConfig.enabled !== 'boolean'
      )
        throw new Error('Notification Channel enabled must be a boolean.');
      if (channelConfig.enabled === false) continue;
      const providerType = channelConfig.provider;
      if (typeof providerType !== 'string' || !providerType.trim())
        throw new Error(
          `Notification Channel "${name}" is missing a Provider.`,
        );
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
      channel.validateConfig?.(channelConfig);
      provider.validateConfig?.(channelConfig);
    }
  }
}

export function createNotificationRegistry(): NotificationRegistry {
  return new NotificationRegistry();
}
