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
