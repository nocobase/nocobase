import type { Config } from '@nocobase/config';

/** Resolve a named channel's type while accepting the legacy provider discriminator. */
export function resolveChannelType(config: {
  readonly type?: unknown;
  readonly provider?: unknown;
}): string {
  for (const key of ['type', 'provider'] as const) {
    const value = config[key];
    if (
      value !== undefined &&
      (typeof value !== 'string' || !value || value !== value.trim())
    )
      throw new Error(`Channel ${key} must be a non-empty trimmed string.`);
  }
  if (
    config.type !== undefined &&
    config.provider !== undefined &&
    config.type !== config.provider
  )
    throw new Error(
      'Channel type and provider must match when both are configured.',
    );
  const type = config.type ?? config.provider;
  if (typeof type !== 'string')
    throw new Error(
      'Channel type is required (legacy provider is also supported).',
    );
  return type;
}

/** Keep legacy application readers working without adding derived aliases to the source layers. */
export function normalizeNotificationChannelAliases(config: Config): void {
  const channels = config.get('notification.channels');
  if (!channels || typeof channels !== 'object' || Array.isArray(channels))
    return;
  const normalized = Object.fromEntries(
    Object.entries(channels as Record<string, unknown>).map(
      ([name, channel]) => {
        if (!channel || typeof channel !== 'object' || Array.isArray(channel))
          return [name, channel];
        let type: string;
        try {
          const typeValue: unknown = Reflect.get(channel, 'type');
          const provider: unknown = Reflect.get(channel, 'provider');
          type = resolveChannelType({ type: typeValue, provider });
        } catch {
          // Leave invalid input intact so startup validation and config check can report it.
          return [name, channel];
        }
        return [name, { ...channel, type, provider: type }];
      },
    ),
  );
  config.set('notification.channels', normalized);
}
