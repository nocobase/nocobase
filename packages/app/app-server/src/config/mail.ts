import { isMailChannelConfig } from '@nocobase/mailer';
import { resolveChannelType } from './channel-type.js';
import type { ConfigIssue } from './validation.js';

const mailboxSettings = new Set([
  'providers',
  'oauthCallbackUrl',
  'oauthReturnUrl',
  'automaticSyncIntervalMs',
  'syncBatchSize',
  'pushWebhookUrl',
  'pushWebhookSecret',
  'jobs',
]);
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** Cross-section checks run before startup, on reload and in config check, without network I/O. */
export function validateMailConfiguration(
  root: Record<string, unknown>,
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const error = (path: string, message: string, fix: string): void => {
    issues.push({ level: 'error', path, message, fix });
  };
  const mail = record(root.mail);
  if (
    root.mail !== undefined &&
    (root.mail === null ||
      typeof root.mail !== 'object' ||
      Array.isArray(root.mail))
  )
    error(
      'mail',
      'Must be an object.',
      'Configure mail.default with provider, sender and transport settings.',
    );
  for (const [name, value] of Object.entries(mail)) {
    if (mailboxSettings.has(name)) continue;
    const entry = record(value);
    if (entry.enabled === false) continue;
    if (!name.trim() || name.includes('.') || !isMailChannelConfig(value))
      error(
        `mail.${name}`,
        'Invalid outbound mail configuration.',
        'Use a simple name and provider: smtp with host/port, or provider: resend with apiKey/from.',
      );
  }
  const channels = record(record(root.notification).channels);
  let legacy = false;
  const reference = (name: unknown, path: string): void => {
    const target = typeof name === 'string' ? mail[name] : undefined;
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      !isMailChannelConfig(target) ||
      target.enabled === false
    )
      error(
        path,
        'Referenced mailer is missing, disabled or invalid.',
        'Configure the selected mail.<name> (mail.default when omitted), or disable this consumer.',
      );
  };
  for (const [name, value] of Object.entries(channels)) {
    const channel = record(value);
    if (channel.enabled === false) continue;
    let type: string;
    try {
      type = resolveChannelType(channel);
    } catch {
      continue;
    }
    if (type === 'email') {
      reference(
        channel.mailer ?? 'default',
        `notification.channels.${name}.mailer`,
      );
      if (
        ['host', 'port', 'auth', 'apiKey', 'from', 'secure', 'replyTo'].some(
          (key) => channel[key] !== undefined,
        )
      )
        error(
          `notification.channels.${name}`,
          'Email channels reference mail settings.',
          'Move transport and sender fields to mail.<name> and select it with mailer.',
        );
    }
    if (type === 'smtp' || type === 'resend') legacy = true;
  }
  const auth = record(root.auth);
  const reset = auth.passwordReset;
  const options = record(reset);
  if (
    reset !== undefined &&
    typeof reset !== 'boolean' &&
    (reset === null || typeof reset !== 'object' || Array.isArray(reset))
  )
    error(
      'auth.passwordReset',
      'Must be a boolean or an object.',
      'Use true, false or { mailer: <name> }.',
    );
  if (options.mailer !== undefined && options.emailChannel !== undefined)
    error(
      'auth.passwordReset',
      'mailer and emailChannel cannot be combined.',
      'Use mailer for mail.<name>, or keep emailChannel until migration.',
    );
  if (options.enabled !== undefined || options.emailChannel !== undefined)
    legacy = true;
  const enabled =
    reset === true ||
    (reset !== undefined &&
      typeof reset === 'object' &&
      reset !== null &&
      (options.enabled === true ||
        (options.enabled === undefined && options.emailChannel === undefined)));
  const custom =
    typeof record(auth.emailAndPassword).sendResetPassword === 'function';
  if (enabled && !custom) {
    const old =
      options.mailer === undefined &&
      (options.emailChannel !== undefined || options.enabled !== undefined);
    if (old) {
      const name =
        typeof options.emailChannel === 'string'
          ? options.emailChannel
          : 'system-email';
      const channel = record(channels[name]);
      let type: string | undefined;
      try {
        type = resolveChannelType(channel);
      } catch {
        /* Report a fixed diagnostic below. */
      }
      const normalized = { ...channel, provider: type };
      if (!isMailChannelConfig(normalized) || normalized.enabled === false)
        error(
          'auth.passwordReset.emailChannel',
          'Legacy email channel is missing, disabled or invalid.',
          'Configure notification.channels.<name>, or migrate to mail.default and passwordReset: true.',
        );
    } else reference(options.mailer ?? 'default', 'auth.passwordReset.mailer');
  }
  if (legacy)
    issues.push({
      level: 'warning',
      path: 'mail',
      message:
        'Legacy SMTP/Resend notification channels and passwordReset enabled/emailChannel are deprecated and will be removed in v4.0.0.',
      fix: 'Move sender settings to mail.<name>; use notification provider: email with mailer, and auth.passwordReset: true or { mailer: <name> }.',
    });
  return issues;
}
