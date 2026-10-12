import type {
  SendingChannelDefinition,
  SendingConfig,
  SendingProviderDefinition,
} from './types.js';

export interface SendingRegistrationOptions {
  /** Framework defaults yield to one explicit application definition, regardless of order. */
  readonly fallback?: boolean;
}

/** Collects definitions without creating runtime resources. */
export class SendingRegistry {
  private sealed = false;
  private readonly fallbackChannels = new Set<string>();
  private readonly fallbackProviders = new Set<string>();
  seal(): void {
    this.sealed = true;
  }

  private register<T>(
    map: Map<string, T>,
    defaults: Set<string>,
    type: string,
    definition: T,
    options: SendingRegistrationOptions,
  ): void {
    // An existing fallback contributes no executable mutation, even after activation.
    if (options.fallback && map.has(type)) return;
    if (this.sealed)
      throw new Error(
        'Sending definitions cannot change after runtime activation.',
      );
    if (map.has(type)) {
      if (!defaults.has(type))
        throw new Error(`Sending definition "${type}" is already registered.`);
    }
    map.set(type, definition);
    if (options.fallback) defaults.add(type);
    else defaults.delete(type);
  }

  private readonly channelDefinitions = new Map<
    string,
    SendingChannelDefinition
  >();
  private readonly providerDefinitions = new Map<
    string,
    SendingProviderDefinition
  >();

  registerChannel(
    definition: SendingChannelDefinition,
    options: SendingRegistrationOptions = {},
  ): this {
    this.register(
      this.channelDefinitions,
      this.fallbackChannels,
      definition.type,
      definition,
      options,
    );
    return this;
  }

  registerProvider(
    definition: SendingProviderDefinition,
    options: SendingRegistrationOptions = {},
  ): this {
    if (
      !definition.type?.trim() ||
      definition.type !== definition.type.trim() ||
      !definition.messageType?.trim()
    )
      throw new Error(
        'Sending Provider requires a non-empty identifier and message type.',
      );
    this.register(
      this.providerDefinitions,
      this.fallbackProviders,
      definition.type,
      definition,
      options,
    );
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
