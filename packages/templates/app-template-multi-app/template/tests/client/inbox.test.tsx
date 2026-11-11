import { realtimeClientToken } from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  answerApi,
  renderWithApp,
  type ApiCall,
} from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import packageMetadata from '../../package.json' with { type: 'json' };
import locales from '../../client/locales/index.js';
import { TooltipProvider } from '../../client/components/ui/tooltip';
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

const api = vi.fn(({ path }: ApiCall) => {
  if (path === 'notificationInApp/unreadCount') return { data: { count: 2 } };
  if (path === 'notificationInApp/messages')
    return { data: messages, meta: {} };
  if (path === 'notificationInApp/messages/m1/markRead') {
    return { data: { ...messages[0], readAt: '2026-10-01T10:00:00.000Z' } };
  }
  return new Response(null, { status: 404 });
});

function renderInbox() {
  return renderWithApp(
    <AuthenticationProvider>
      <TooltipProvider>
        <InboxPage />
      </TooltipProvider>
    </AuthenticationProvider>,
    {
      route: '/inbox',
      namespace: packageMetadata.name,
      namespaces: { [packageMetadata.name]: locales },
      fetch: answerApi(api),
      services: (app) => {
        app.container.instance(authenticationClientToken, {
          getSession: async () => ({
            data: { user: { id: 'user-1' }, session: { id: 'session-1' } },
          }),
        });
        // Keep realtime hooks real while preventing a WebSocket connection in this page test.
        const realtime = app.container.resolve(realtimeClientToken);
        vi.spyOn(realtime, 'watch').mockReturnValue({ close: vi.fn() });
        vi.spyOn(realtime, 'subscribe').mockReturnValue(vi.fn());
        vi.spyOn(realtime, 'onOpen').mockReturnValue(vi.fn());
      },
    },
  );
}

it("lists the plugin's messages as notifications and marks one read when it is opened", async () => {
  await renderInbox();
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
    expect(api).toHaveBeenCalledWith({
      path: 'notificationInApp/messages/m1/markRead',
      method: 'POST',
    }),
  );
});
