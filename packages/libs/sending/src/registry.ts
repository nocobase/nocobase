import type {
  SendingChannelDefinition,
  SendingConfig,
  SendingProviderDefinition,
} from './types.js';

/** Collects definitions without creating runtime resources. */
export class SendingRegistry {
  private readonly channelDefinitions = new Map<
    string,
    SendingChannelDefinition
  >();
  private readonly providerDefinitions = new Map<
    string,
    SendingProviderDefinition
  >();

  registerChannel(definition: SendingChannelDefinition): this {
    if (this.channelDefinitions.has(definition.type))
      throw new Error(
        `Sending message type "${definition.type}" is already registered.`,
      );
    this.channelDefinitions.set(definition.type, definition);
    return this;
  }

  registerProvider(definition: SendingProviderDefinition): this {
    if (
      !definition.type?.trim() ||
      definition.type !== definition.type.trim() ||
      !definition.messageType?.trim()
    )
      throw new Error(
        'Sending Provider requires a non-empty identifier and message type.',
      );
    if (this.providerDefinitions.has(definition.type))
      throw new Error(
        `Sending Provider "${definition.type}" is already registered.`,
      );
    this.providerDefinitions.set(definition.type, definition);
    return this;
  }

  channel(type: string): SendingChannelDefinition | undefined {
    return this.channelDefinitions.get(type);
  }

  provider(type: string): SendingProviderDefinition | undefined {
    return this.providerDefinitions.get(type);
  }

  validate(config: SendingConfig): void {
    if (
      !config.channels ||
      typeof config.channels !== 'object' ||
      Array.isArray(config.channels)
    )
      throw new Error('Sending channels must be a name-to-configuration map.');
    for (const [name, channelConfig] of Object.entries(config.channels)) {
      if (!name.trim() || name !== name.trim() || name.length > 100)
        throw new Error(
          'Sending Channel names must be non-empty trimmed strings.',
        );
      if (
        !channelConfig ||
        typeof channelConfig !== 'object' ||
        Array.isArray(channelConfig)
      )
        throw new Error(`Invalid configuration for Sending Channel "${name}".`);
      for (const key of ['name', 'type', 'providers'])
        if (key in channelConfig)
          throw new Error(`Unsupported Sending Channel property "${key}".`);
      if (
        channelConfig.enabled !== undefined &&
        typeof channelConfig.enabled !== 'boolean'
      )
        throw new Error('Sending Channel enabled must be a boolean.');
      if (channelConfig.enabled === false) continue;
      const providerType = channelConfig.provider;
      if (typeof providerType !== 'string' || !providerType.trim())
        throw new Error(`Sending Channel "${name}" is missing a Provider.`);
      const provider = this.provider(providerType);
      if (!provider)
        throw new Error(
          `Sending Channel "${name}" Provider "${providerType}" is not registered.`,
        );
      const channel = this.channel(provider.messageType);
      if (!channel)
        throw new Error(
          `Sending message type "${provider.messageType}" is not registered.`,
        );
      channel.validateConfig?.(channelConfig);
      provider.validateConfig?.(channelConfig);
    }
  }
}

export function createSendingRegistry(): SendingRegistry {
  return new SendingRegistry();
}
