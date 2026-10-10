// @vitest-environment jsdom
import { renderWithApp } from '@nocobase/app-testing/client';
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { InviteResults } from '../client/components/invite-dialog.js';
import { InvitationsPanel } from '../client/components/invitations-panel.js';
import users from '../client/plugin.js';

afterEach(cleanup);

it.each(['en-US', 'zh-CN'])(
  'copies successfully emailed links in %s',
  async (locale) => {
    const user = userEvent.setup();
    const inviteUrl = 'https://example.test/invite/new-token';
    await renderWithApp(
      <InviteResults
        results={[
          {
            email: 'new@example.test',
            outcome: 'invited',
            invitationId: 'i1',
            emailSent: true,
            inviteUrl,
          },
        ]}
      />,
      { plugins: [users()], locale },
    );
    expect(screen.getByDisplayValue(inviteUrl)).toBeTruthy();
    await user.click(
      screen.getByRole('button', {
        name: locale === 'zh-CN' ? '复制邀请链接' : 'Copy invitation link',
      }),
    );
    expect(await navigator.clipboard.readText()).toBe(inviteUrl);
  },
);

it('requests a fresh link without mail from the existing invitation menu', async () => {
  const user = userEvent.setup();
  const invitation = {
    id: 'i1',
    email: 'new@example.test',
    status: 'pending' as const,
    invitedBy: { id: 'admin', name: 'Admin' },
    roleScopes: {},
    data: {},
    summary: [],
    expiresAt: '2099-01-01T00:00:00Z',
    sentAt: null,
    createdAt: '2026-01-01T00:00:00Z',
  };
  const resend = vi.fn();
  await renderWithApp(
    <InvitationsPanel
      invitations={[invitation]}
      busy={false}
      canCopyLink={() => true}
      onResend={resend}
      onRevoke={vi.fn()}
    />,
    { plugins: [users()] },
  );
  await user.click(screen.getByRole('button'));
  await user.click(
    await screen.findByRole('menuitem', { name: 'Copy new link' }),
  );
  expect(resend).toHaveBeenCalledWith(invitation, false);
});
