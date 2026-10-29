import type {
  EmailChannelConfig,
  SmtpProviderConfig,
  ResendProviderConfig,
} from './types.js';

/** A safe configuration diagnostic with a field path relative to the sender. */
export class MailConfigError extends Error {
  public constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export function validateSmtpProviderConfig(config: SmtpProviderConfig): void {
  validateHeaders(config);
  if (typeof config.host !== 'string' || !config.host.trim())
    throw new MailConfigError('host', 'SMTP host is required.');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new MailConfigError(
      'port',
      'SMTP port must be an integer between 1 and 65535.',
    );
  if (config.secure !== undefined && typeof config.secure !== 'boolean')
    throw new MailConfigError('secure', 'SMTP secure must be a boolean.');
  if (
    config.auth !== undefined &&
    (typeof config.auth !== 'object' ||
      config.auth === null ||
      typeof config.auth.user !== 'string' ||
      typeof config.auth.pass !== 'string')
  )
    throw new MailConfigError('auth', 'SMTP authentication is invalid.');
}

export function validateResendProviderConfig(
  config: ResendProviderConfig,
): void {
  validateHeaders(config);
  if (typeof config.apiKey !== 'string' || !config.apiKey.trim())
    throw new MailConfigError('apiKey', 'Resend API key is required.');
  if (typeof config.from !== 'string' || !config.from.trim())
    throw new MailConfigError('from', 'Resend sender is required.');
}

function validateHeaders(config: {
  readonly from?: string;
  readonly replyTo?: string;
}): void {
  for (const field of ['from', 'replyTo'] as const) {
    const value = config[field];
    if (value !== undefined && (typeof value !== 'string' || !value.trim()))
      throw new MailConfigError(
        field,
        'Email sender or reply address is invalid.',
      );
  }
}

export function isMailChannelConfig(
  value: unknown,
): value is EmailChannelConfig {
  if (!value || typeof value !== 'object') return false;
  const provider: unknown = Reflect.get(value, 'provider');
  if (provider !== 'smtp' && provider !== 'resend') return false;
  try {
    const config = value as EmailChannelConfig;
    if (config.enabled !== undefined && typeof config.enabled !== 'boolean')
      return false;
    if (config.provider === 'smtp') validateSmtpProviderConfig(config);
    else validateResendProviderConfig(config);
    return true;
  } catch {
    return false;
  }
}

export type * from './types.js';
