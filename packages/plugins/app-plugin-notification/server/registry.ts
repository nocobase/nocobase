import type {
  NotificationChannelDefinition,
  NotificationConfig,
  NotificationExtensionRegistry,
  NotificationProviderDefinition,
  NotificationTestTargetDescriptor,
  NotificationTestAdapter,
  NotificationI18nText,
} from './types.js';

import type { SendingRegistry } from '@nocobase/sending';

interface RegistrationOptions {
  readonly fallback?: boolean;
}
interface Metadata<T> {
  readonly value: T | undefined;
  readonly fallback: boolean;
}

/** Executable definitions have one owner; management metadata stays in notification. */
export class NotificationRegistry implements NotificationExtensionRegistry {
  private readonly channelDefinitions = new Map<
    string,
    NotificationChannelDefinition
  >();
  private readonly providerDefinitions = new Map<
    string,
    NotificationProviderDefinition
  >();
  private readonly fallbackChannels = new Set<string>();
  private readonly fallbackProviders = new Set<string>();
  private readonly tests = new Map<string, Metadata<NotificationTestAdapter>>();
  private readonly labels = new Map<
    string,
    Metadata<string | NotificationI18nText>
  >();
  private sealed = false;

  constructor(
    private readonly sending: SendingRegistry | undefined = undefined,
  ) {}

  seal(): void {
    this.sealed = true;
    this.sending?.seal();
  }

  private register<T>(
    map: Map<string, T>,
    defaults: Set<string>,
    type: string,
    definition: T,
    options: RegistrationOptions,
  ): void {
    if (map.has(type)) {
      if (options.fallback) return;
      if (!defaults.has(type))
        throw new Error(
          `Notification definition "${type}" is already registered.`,
        );
    }
    map.set(type, definition);
    if (options.fallback) defaults.add(type);
    else defaults.delete(type);
  }

  private metadata<T>(
    map: Map<string, Metadata<T>>,
    type: string,
    value: T | undefined,
    options: RegistrationOptions,
  ): void {
    if (options.fallback && map.has(type)) return;
    map.set(type, { value, fallback: options.fallback ?? false });
  }

  registerChannelTest(type: string, test: NotificationTestAdapter): this {
    if (this.sealed)
      throw new Error(
        'Notification metadata cannot change after runtime activation.',
      );
    if (!this.channel(type))
      throw new Error(`Channel "${type}" is not registered.`);
    const previous = this.tests.get(type);
    if (previous?.value && !previous.fallback)
      throw new Error(`Channel test "${type}" is already registered.`);
    this.metadata(this.tests, type, test, {});
    return this;
  }

  registerProviderLabel(
    type: string,
    label: string | NotificationI18nText,
  ): this {
    if (this.sealed)
      throw new Error(
        'Notification metadata cannot change after runtime activation.',
      );
    if (!this.provider(type))
      throw new Error(`Provider "${type}" is not registered.`);
    const previous = this.labels.get(type);
    if (previous?.value && !previous.fallback)
      throw new Error(`Provider label "${type}" is already registered.`);
    this.metadata(this.labels, type, label, {});
    return this;
  }

  registerChannel(
    definition: NotificationChannelDefinition,
    options: RegistrationOptions = {},
  ): this {
    if (this.sealed)
      throw new Error(
        'Notification definitions cannot change after runtime activation.',
      );
    const forwarded =
      this.sending &&
      (definition.deliveryLayer === 'sending' ||
        (definition.deliveryLayer !== 'notification' &&
          ['email', 'im'].includes(definition.type)));
    if (forwarded) {
      if (this.channelDefinitions.has(definition.type))
        throw new Error(
          `Channel "${definition.type}" is already owned by notification.`,
        );
      this.sending.registerChannel(
        {
          type: definition.type,
          ...(definition.validateConfig
            ? { validateConfig: (config) => definition.validateConfig!(config) }
            : {}),
          createChannel: (context, config) =>
            definition.createChannel(context, config),
        },
        options,
      );
    } else {
      if (this.sending?.channel(definition.type))
        throw new Error(
          `Channel "${definition.type}" is already owned by sending.`,
        );
      this.register(
        this.channelDefinitions,
        this.fallbackChannels,
        definition.type,
        definition,
        options,
      );
    }
    this.metadata(this.tests, definition.type, definition.test, options);
    return this;
  }

  registerProvider(
    definition: NotificationProviderDefinition,
    options: RegistrationOptions = {},
  ): this {
    if (this.sealed)
      throw new Error(
        'Notification definitions cannot change after runtime activation.',
      );
    if (
      !definition.type?.trim() ||
      definition.type !== definition.type.trim() ||
      !definition.messageType?.trim()
    )
      throw new Error(
        'Notification Provider requires a non-empty identifier and message type.',
      );
    const forwarded =
      this.sending &&
      (definition.deliveryLayer === 'sending' ||
        (definition.deliveryLayer !== 'notification' &&
          ['email', 'im'].includes(definition.messageType)));
    if (forwarded) {
      if (this.providerDefinitions.has(definition.type))
        throw new Error(
          `Provider "${definition.type}" is already owned by notification.`,
        );
      this.sending.registerProvider(
        {
          type: definition.type,
          messageType: definition.messageType,
          capabilities: definition.capabilities,
          ...(definition.validateConfig
            ? { validateConfig: (config) => definition.validateConfig!(config) }
            : {}),
          createProvider: (context, config) =>
            definition.createProvider(context, config),
        },
        options,
      );
    } else {
      if (this.sending?.provider(definition.type))
        throw new Error(
          `Provider "${definition.type}" is already owned by sending.`,
        );
      this.register(
        this.providerDefinitions,
        this.fallbackProviders,
        definition.type,
        definition,
        options,
      );
    }
    this.metadata(this.labels, definition.type, definition.label, options);
    return this;
  }

  channel(type: string): NotificationChannelDefinition | undefined {
    const definition =
      this.channelDefinitions.get(type) ?? this.sending?.channel(type);
    if (!definition) return undefined;
    // Never spread executable definitions: class methods and their receiver must survive.
    return {
      type: definition.type,
      test: this.tests.get(type)?.value,
      ...(definition.validateConfig
        ? { validateConfig: (config) => definition.validateConfig!(config) }
        : {}),
      createChannel: (context, config) =>
        definition.createChannel(context, config),
    };
  }

  provider(type: string): NotificationProviderDefinition | undefined {
    const definition =
      this.providerDefinitions.get(type) ?? this.sending?.provider(type);
    if (!definition) return undefined;
    return {
      type: definition.type,
      messageType: definition.messageType,
      capabilities: definition.capabilities,
      label: this.labels.get(type)?.value,
      ...(definition.validateConfig
        ? { validateConfig: (config) => definition.validateConfig!(config) }
        : {}),
      createProvider: (context, config) =>
        definition.createProvider(context, config),
    };
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
    for (const type of this.channelDefinitions.keys())
      if (this.sending?.channel(type))
        throw new Error(`Channel "${type}" has conflicting owners.`);
    for (const type of this.providerDefinitions.keys())
      if (this.sending?.provider(type))
        throw new Error(`Provider "${type}" has conflicting owners.`);

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

export function createNotificationRegistry(
  sending?: SendingRegistry,
): NotificationRegistry {
  return new NotificationRegistry(sending);
}
