export interface EmailChannelReferenceConfig {
  readonly type: 'email';
  readonly enabled?: boolean;
  readonly mailer?: string;
}

export function validateEmailChannelReference(
  config: EmailChannelReferenceConfig,
): void {
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
