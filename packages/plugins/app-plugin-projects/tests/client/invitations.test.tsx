import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { Invitation } from '../../shared/invitations.js';
import { api, clientMocks, me, resetApi, toasts } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

const { useCan } = await import('@nocobase/app-plugin-authorization/client');
const { InvitationsSection } =
  await import('../../client/pages/config/members/invitations-section.js');
const { pmKeys } = await import('../../client/api/keys.js');

const invitation: Invitation = {
  id: 'i1',
  email: 'ann@example.com',
  status: 'pending',
  projects: [],
  invitedBy: { userId: 'u1', name: 'Owner' },
  expiresAt: '2026-10-15T00:00:00.000Z',
  sentAt: '2026-10-08T00:00:00.000Z',
  createdAt: '2026-10-08T00:00:00.000Z',
};

let invitations: Invitation[];
beforeEach(() => {
  vi.mocked(useCan).mockReturnValue({
    can: true,
    isPending: false,
    error: undefined,
    retry: vi.fn(),
  });
  invitations = [invitation];
  resetApi({
    'projects/me': () => ({ data: me('admin') }),
    'projects/invitations': () => ({ data: invitations }),
  });
});
afterEach(cleanup);

it.each([true, false])(
  'shows a copyable new link when sendEmail is %s',
  async (sendEmail) => {
    const user = userEvent.setup();
    const url = 'https://example.test/invite/new-token';
    api.routes[`projects/invitations/i1/resend?sendEmail=${sendEmail}`] =
      () => ({
        data: {
          email: invitation.email,
          outcome: 'invited',
          emailSent: sendEmail,
          inviteUrl: url,
        },
      });
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <InvitationsSection />
      </QueryClientProvider>,
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'invitations.actionsFor(email=ann@example.com)',
      }),
    );
    await user.click(
      await screen.findByRole('menuitem', {
        name: sendEmail ? 'invitations.resend' : 'invitations.generateLink',
      }),
    );
    if (!sendEmail) {
      expect(
        screen.getByText('invitations.generateDescription'),
      ).toBeInTheDocument();
      expect(screen.queryByDisplayValue(url)).toBeNull();
      await user.click(
        screen.getByRole('button', { name: 'invitations.generateLink' }),
      );
    }
    expect(await screen.findByDisplayValue(url)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'invitations.copyLink' }),
    );
    expect(await navigator.clipboard.readText()).toBe(url);
    if (!sendEmail)
      expect(screen.getByText('invitations.linkReady')).toBeInTheDocument();
  },
);

it('keeps a row menu open when the list changes underneath it', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <InvitationsSection />
    </QueryClientProvider>,
  );
  await userEvent.click(
    await screen.findByRole('button', {
      name: 'invitations.actionsFor(email=ann@example.com)',
    }),
  );
  expect(await screen.findByRole('menu')).toBeInTheDocument();
  invitations = [
    invitation,
    { ...invitation, id: 'i2', email: 'bob@example.com' },
  ];
  await act(() => client.invalidateQueries({ queryKey: pmKeys.invitations }));
  expect(await screen.findByText('bob@example.com')).toBeInTheDocument();
  expect(screen.getByRole('menu')).toBeInTheDocument();
});

it('reports failed delivery without offering a missing link for another inviter', async () => {
  invitations = [
    { ...invitation, invitedBy: { userId: 'other', name: 'Other' } },
  ];
  api.routes['projects/invitations/i1/resend?sendEmail=true'] = () => ({
    data: { email: invitation.email, outcome: 'invited', emailSent: false },
  });
  const user = userEvent.setup();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <InvitationsSection />
    </QueryClientProvider>,
  );
  await user.click(
    await screen.findByRole('button', {
      name: 'invitations.actionsFor(email=ann@example.com)',
    }),
  );
  expect(
    screen.queryByRole('menuitem', { name: 'invitations.generateLink' }),
  ).toBeNull();
  expect(
    screen.queryByRole('menuitem', { name: 'invitations.manualLink' }),
  ).toBeNull();
  await user.click(
    await screen.findByRole('menuitem', { name: 'invitations.resend' }),
  );
  await waitFor(() =>
    expect(toasts).toContainEqual({
      type: 'warning',
      title: 'invitations.outcome.notSent',
    }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByText('invitations.newLinkDescription')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'invitations.copyLink' }),
  ).toBeNull();
});

it('explains when a concurrently changed invitation has no link to copy', async () => {
  api.routes['projects/invitations/i1/resend?sendEmail=false'] = () => ({
    data: { email: invitation.email, outcome: 'invited', emailSent: false },
  });
  const user = userEvent.setup();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <InvitationsSection />
    </QueryClientProvider>,
  );
  await user.click(
    await screen.findByRole('button', {
      name: 'invitations.actionsFor(email=ann@example.com)',
    }),
  );
  await user.click(
    await screen.findByRole('menuitem', { name: 'invitations.generateLink' }),
  );
  await user.click(
    screen.getByRole('button', { name: 'invitations.generateLink' }),
  );
  await waitFor(() =>
    expect(toasts).toContainEqual({
      type: 'warning',
      title: 'invitations.linkUnavailable',
    }),
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});
