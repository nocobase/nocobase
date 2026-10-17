import type { InvitationResult } from '../../../../shared/invitations.js';

/** Translate the safe Users delivery explanations without displaying provider details. */
export function invitationEmailError(
  t: (key: string) => string,
  result: InvitationResult,
): string {
  if (result.emailError === 'Email not sent: no email channel configured')
    return t('invitations.outcome.noEmailChannel');
  if (result.emailError === 'Email not sent: email delivery failed')
    return t('invitations.outcome.deliveryFailed');
  return t('invitations.outcome.notSent');
}
