import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { TooltipProvider } from '../../client/components/ui/tooltip';

const mocks = vi.hoisted(() => ({
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  unread: 2,
  request: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: mocks.session, isPending: false }),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  const client = { request: mocks.request };
  const realtime = { subscribe: () => vi.fn(), onOpen: () => vi.fn() };
  return {
    ...actual,
    useApiClient: () => client,
    useService: (token: unknown) =>
      token === actual.realtimeClientToken ? realtime : client,
  };
});

import { InboxHeaderButton } from '../../client/components/inbox-header-button.tsx';
import InboxPage from '../../client/pages/inbox.tsx';

const messages = [
  {
    id: 'm1',
    deliveryId: 'd1',
    notificationId: 'n1',
    title: 'Weekly report is ready',
    body: 'The sales report for week 40 is ready.',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'm2',
    deliveryId: 'd2',
    notificationId: 'n2',
    title: 'Backup finished',
    body: 'All databases were backed up.',
    readAt: '2026-10-01T09:00:00.000Z',
    createdAt: '2026-10-01T07:00:00.000Z',
  },
];

let runtime: I18nRuntime;
beforeEach(async () => {
  mocks.session = { user: { id: 'user-1' } };
  mocks.unread = 2;
  mocks.request.mockReset();
  mocks.request.mockImplementation(
    async ({ path }: { readonly path: string }) => {
      if (path.endsWith('/unreadCount'))
        return { data: { count: mocks.unread } };
      if (path.startsWith('notificationInApp/messages?'))
        return { data: messages, meta: {} };
      return { data: { ...messages[0], readAt: '2026-10-01T10:00:00.000Z' } };
    },
  );
  runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
});

function Frame({
  children,
  path,
}: {
  readonly children: ReactElement;
  readonly path: string;
}): ReactElement {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={[path]}>
        <I18nProvider runtime={runtime}>
          <TooltipProvider>{children}</TooltipProvider>
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

it('links the header to the inbox with the unread count, for a signed-in person only', async () => {
  const view = render(
    <Frame path='/'>
      <InboxHeaderButton />
    </Frame>,
  );
  const link = await screen.findByRole('link', { name: 'Inbox, 2 unread' });
  expect(link).toHaveAttribute('href', '/inbox');
  expect(screen.getByText('2')).toBeInTheDocument();
  mocks.session = null;
  view.rerender(
    <Frame path='/'>
      <InboxHeaderButton />
    </Frame>,
  );
  expect(screen.queryByRole('link')).toBeNull();
});

it("lists the plugin's messages as notifications and marks one read when it is opened", async () => {
  render(
    <Frame path='/inbox'>
      <InboxPage />
    </Frame>,
  );
  expect(
    await screen.findByRole('heading', { name: /Notifications/u }),
  ).toBeInTheDocument();
  expect(screen.getByText('Backup finished')).toBeInTheDocument();
  // The first message is shown, and opening it marks it read.
  expect(
    screen.getByRole('heading', { name: 'Weekly report is ready', level: 2 }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByText('Weekly report is ready')[0]!);
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith({
      path: 'notificationInApp/messages/m1/markRead',
      method: 'POST',
    }),
  );
});
