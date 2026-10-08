import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import type { Invitation } from '../../shared/invitations.js';
import { clientMocks, me, resetApi } from './fake-client.js';

vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
vi.mock('@nocobase/app-plugin-authorization/client', () =>
  clientMocks.authorization(),
);

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
  invitations = [invitation];
  resetApi({
    'projects/me': () => ({ data: me('admin') }),
    'projects/invitations': () => ({ data: invitations }),
  });
});
afterEach(cleanup);

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
