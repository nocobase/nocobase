import type { MailersConfig } from '@nocobase/app-server/mailers/config';
import type { UsersConfig } from '../tokens.js';

type InvitationConfig = UsersConfig['invitations'];

/** The sender and its safe configuration projection use the same precedence. */
export function selectInvitationEmailChannel(
  config: InvitationConfig,
  defaultMailer: string | undefined,
): { readonly kind: 'mailer' | 'legacy'; readonly name: string } {
  if (config?.mailer !== undefined)
    return { kind: 'mailer', name: config.mailer };
  if (config?.emailChannel !== undefined)
    return { kind: 'legacy', name: config.emailChannel };
  if (defaultMailer !== undefined)
    return { kind: 'mailer', name: defaultMailer };
  return { kind: 'legacy', name: 'system-email' };
}

export interface InvitationEmailChannelState {
  readonly name: string;
  readonly type: 'email';
  readonly configured: boolean;
  readonly enabled: boolean | null;
}

/** No sender allocation, credentials, recipient lookup, or network probe. */
export function describeInvitationEmailChannel(input: {
  readonly invitations?: InvitationConfig;
  readonly mailers?: MailersConfig;
  readonly channels?: Readonly<Record<string, { readonly enabled?: boolean }>>;
}): InvitationEmailChannelState {
  const selected = selectInvitationEmailChannel(
    input.invitations,
    input.mailers?.default,
  );
  const configuration =
    selected.kind === 'mailer'
      ? input.mailers?.[selected.name]
      : input.channels?.[selected.name];
  const configured =
    configuration !== null && typeof configuration === 'object';
  return {
    name: selected.name,
    type: 'email',
    configured,
    enabled: configured ? configuration.enabled !== false : null,
  };
}
