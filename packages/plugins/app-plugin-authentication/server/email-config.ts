import {
  MailConfigError,
  validateSmtpProviderConfig,
  validateResendProviderConfig,
  type SmtpProviderConfig,
  type ResendProviderConfig,
} from '@nocobase/mailer';

/** Reference an application mailer, or retain a private legacy inline configuration. */
export type AuthEmailConfig =
  | { readonly mailer: string }
  | Omit<SmtpProviderConfig, 'enabled'>
  | Omit<ResendProviderConfig, 'enabled'>;

export function authEmailIssues(
  email: unknown,
): { path: string; message: string }[] {
  if (email === undefined) return [];
  const issues: { path: string; message: string }[] = [];
  const error = (field: string, message: string): void => {
    issues.push({ path: field ? `email.${field}` : 'email', message });
  };
  if (!email || typeof email !== 'object' || Array.isArray(email)) {
    error('', 'must be an SMTP or Resend configuration object.');
    return issues;
  }
  const config = email as Record<string, unknown>;
  if ('mailer' in config) {
    if (
      typeof config.mailer !== 'string' ||
      !config.mailer.trim() ||
      config.mailer !== config.mailer.trim()
    )
      error('mailer', 'must reference a named mailer.');
    if (Object.keys(config).some((key) => key !== 'mailer'))
      error('', 'cannot mix a mailer reference with inline configuration.');
    return issues;
  }
  if (config.provider !== 'smtp' && config.provider !== 'resend') {
    error(
      'provider',
      'must be smtp or resend. Set AUTH_EMAIL_PROVIDER or auth.email.provider.',
    );
    return issues;
  }
  const allowed =
    config.provider === 'smtp'
      ? ['provider', 'host', 'port', 'secure', 'auth', 'from', 'replyTo']
      : ['provider', 'apiKey', 'from', 'replyTo'];
  // Do not echo untrusted keys or values: either can contain credentials.
  if (Object.keys(config).some((key) => !allowed.includes(key)))
    error(
      '',
      'contains unsupported fields. Use only fields for the selected provider.',
    );
  try {
    if (config.provider === 'smtp')
      validateSmtpProviderConfig(email as SmtpProviderConfig);
    else validateResendProviderConfig(email as ResendProviderConfig);
  } catch (cause) {
    if (cause instanceof MailConfigError) error(cause.field, cause.message);
    else error('', 'must be a valid configuration for the selected provider.');
  }
  return issues;
}

export function assertAuthEmailConfig(email: unknown): void {
  const issues = authEmailIssues(email);
  if (issues.length)
    throw new Error(
      issues.map((issue) => `auth.${issue.path}: ${issue.message}`).join(' '),
    );
}

/** Rules shared by configuration checks and both Auth assembly paths. */
export function passwordResetMailerIssues(
  config:
    { readonly mailer?: unknown; readonly emailChannel?: unknown } | undefined,
  email: unknown,
): { path: string; message: string }[] {
  if (config?.mailer === undefined) return [];
  const path = 'passwordReset.mailer';
  const issues: { path: string; message: string }[] = [];
  if (
    typeof config.mailer !== 'string' ||
    !config.mailer.trim() ||
    config.mailer !== config.mailer.trim()
  )
    issues.push({ path, message: 'must reference a named mailer.' });
  if (
    email !== undefined &&
    (!email ||
      typeof email !== 'object' ||
      Array.isArray(email) ||
      !('mailer' in email) ||
      email.mailer !== config.mailer)
  )
    issues.push({
      path,
      message:
        'cannot coexist with auth.email unless both reference the same mailer. Remove the old selection after confirming the sender identity.',
    });
  if (config.emailChannel !== undefined)
    issues.push({
      path,
      message:
        'cannot coexist with auth.passwordReset.emailChannel. Remove the old selection after confirming the sender identity.',
    });
  return issues;
}
