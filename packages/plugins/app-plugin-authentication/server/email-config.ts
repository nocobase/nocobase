import {
  MailConfigError,
  validateSmtpProviderConfig,
  validateResendProviderConfig,
  type SmtpProviderConfig,
  type ResendProviderConfig,
} from '@nocobase/mailer';

/** One private sender owned by Authentication, independent of notification channels. */
export type AuthEmailConfig =
  Omit<SmtpProviderConfig, 'enabled'> | Omit<ResendProviderConfig, 'enabled'>;

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
