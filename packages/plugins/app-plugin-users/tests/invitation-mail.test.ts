import { expect, it } from 'vitest';

import { buildInvitationEmail } from '../server/invitations/mail.js';
import locales from '../server/locales/index.js';

it('includes every server language for an invitee without a saved language', async () => {
  const email = await buildInvitationEmail({
    to: 'invitee@example.com',
    appTitle: 'Example',
    inviterName: '<Inviter>',
    summary: ['Team'],
    url: 'https://example.com/invite?token=test&view=accept',
    expiresAt: new Date('2030-01-01T00:00:00Z'),
  });
  expect(Object.keys(locales)).toHaveLength(10);
  for (const load of Object.values(locales)) {
    const { default: resource } = (await load()) as {
      default: { invitationEmail: { action: string } };
    };
    expect(email.html).toContain(
      resource.invitationEmail.action.replaceAll("'", '&#39;'),
    );
  }
  expect(email.html).toContain('&lt;Inviter&gt;');
  expect(email.html).toContain('token=test&amp;view=accept');
  expect(email.text).not.toContain('{{');
});
