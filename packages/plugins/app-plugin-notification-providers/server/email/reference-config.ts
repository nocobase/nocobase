export interface EmailChannelReferenceConfig {
  readonly type: 'email';
  readonly enabled?: boolean;
  readonly mailer?: string;
}

export function validateEmailChannelReference(
  config: EmailChannelReferenceConfig,
): void {
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean')
    throw new Error('Email channel enabled must be a boolean.');
  if (config.type !== undefined && config.type !== 'email')
    throw new Error('Email channel type must be email.');
  // `provider: email` can be added by the existing alias normalization, never inline provider fields.
  if (
    Object.keys(config).some(
      (key) => !['type', 'provider', 'enabled', 'mailer'].includes(key),
    ) ||
    ('provider' in config && config.provider !== 'email')
  )
    throw new Error(
      'Email channels cannot mix mailer references and inline configuration.',
    );
  if (
    config.mailer !== undefined &&
    (typeof config.mailer !== 'string' ||
      !config.mailer.trim() ||
      config.mailer !== config.mailer.trim())
  )
    throw new Error('Email channel mailer must be a named mailer.');
}
