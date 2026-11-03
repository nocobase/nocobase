import type {
  MailSender,
  MailSenderFactory,
} from '@nocobase/app-server/mailers';
import { resolveChannelType } from '@nocobase/app-server/config';
import {
  isMailChannelConfig,
  type EmailChannelConfig,
} from '@nocobase/mailer/config';
import { assertAuthEmailConfig, type AuthEmailConfig } from './email-config.js';
import type { PasswordResetConfig } from './password-reset.js';

export interface PasswordResetSenderSelection {
  readonly sender?: MailSender;
  /** Selected through a deprecated notification channel, which the policy announces once. */
  readonly legacy: boolean;
}

/**
 * Pick and create the built-in reset sender at an assembly boundary. Precedence: `auth.email` (reference or inline),
 * explicit `passwordReset.emailChannel`, `mailers.default`, then the implicit `system-email` channel. A custom
 * `sendResetPassword` still wins inside the policy; an invalid explicit reference throws even then. Creation is lazy
 * and allocates no transport until the first send. The caller owns and closes the returned sender.
 */
export function createPasswordResetSender(
  factory: MailSenderFactory,
  options: {
    readonly email?: AuthEmailConfig;
    readonly passwordReset?: PasswordResetConfig;
    readonly legacyChannels?: Readonly<Record<string, unknown>>;
  },
): PasswordResetSenderSelection {
  const { email, passwordReset, legacyChannels } = options;
  assertAuthEmailConfig(email);
  if (email)
    return {
      sender:
        'mailer' in email
          ? factory.create(email.mailer, 'auth.email.mailer')
          : factory.createFromConfig(email),
      legacy: false,
    };
  if (passwordReset?.emailChannel !== undefined)
    return {
      sender: legacySender(
        factory,
        legacyChannels?.[passwordReset.emailChannel],
      ),
      legacy: true,
    };
  if (factory.defaultMailer) return { sender: factory.create(), legacy: false };
  return {
    sender: legacySender(factory, legacyChannels?.['system-email']),
    legacy: true,
  };
}

/** Preserve legacy channel aliases, validation and enablement. */
function legacyEmailConfig(channel: object): EmailChannelConfig | undefined {
  try {
    const type: unknown = Reflect.get(channel, 'type');
    const provider: unknown = Reflect.get(channel, 'provider');
    const { type: _type, ...inline } = channel as Record<string, unknown>;
    const normalized = {
      ...inline,
      provider: resolveChannelType({ type, provider }),
    };
    return isMailChannelConfig(normalized) && normalized.enabled !== false
      ? normalized
      : undefined;
  } catch {
    return undefined;
  }
}

function legacySender(
  factory: MailSenderFactory,
  channel: unknown,
): MailSender | undefined {
  if (!channel || typeof channel !== 'object') return undefined;
  const enabled: unknown = Reflect.get(channel, 'enabled');
  if (
    enabled === false ||
    (enabled !== undefined && typeof enabled !== 'boolean')
  )
    return undefined;
  let type: string;
  try {
    type = resolveChannelType({
      type: Reflect.get(channel, 'type') as unknown,
      provider: Reflect.get(channel, 'provider') as unknown,
    });
  } catch {
    return undefined;
  }
  if (type === 'email') {
    if (
      Object.keys(channel).some(
        (key) => !['type', 'provider', 'enabled', 'mailer'].includes(key),
      )
    )
      throw new Error(
        'auth.passwordReset.emailChannel: Reference channel cannot include inline fields.',
      );
    const name: unknown = Reflect.get(channel, 'mailer');
    factory.assertReference(
      name ?? factory.defaultMailer,
      'auth.passwordReset.emailChannel',
    );
    return factory.create(name as string | undefined);
  }
  const config = legacyEmailConfig(channel);
  return config ? factory.createFromConfig(config) : undefined;
}
