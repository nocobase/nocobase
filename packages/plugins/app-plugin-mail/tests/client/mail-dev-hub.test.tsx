import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import {
  MailSendHubPage,
  MailComposeRedirect,
  MailLogsHubPage,
  MailBulkSendRedirect,
  MailSendLogsRedirect,
  MailSyncLogsRedirect,
} from '../../client/pages/mail-dev-hub-page.js';

vi.mock('../../client/pages/mail-send-page.js', () => ({
  default: () => <p>Compose content</p>,
}));

function createRouter(path: string) {
  return createMemoryRouter(
    [
      {
        path: '/main/dev/mail/send',
        element: <MailSendHubPage />,
        children: [
          { path: 'compose', element: <MailComposeRedirect /> },
          { path: 'bulk', element: <MailComposeRedirect /> },
        ],
      },
      {
        path: '/main/dev/mail/logs',
        element: <MailLogsHubPage />,
        children: [
          { path: 'send', element: <p>Send history</p> },
          { path: 'bulk', element: <p>Batch history</p> },
          { path: 'sync', element: <p>Sync history</p> },
        ],
      },
      { path: '/main/dev/mail/bulk-send', element: <MailBulkSendRedirect /> },
      { path: '/main/dev/mail/send-logs', element: <MailSendLogsRedirect /> },
      { path: '/main/dev/mail/sync-logs', element: <MailSyncLogsRedirect /> },
    ],
    { initialEntries: [path] },
  );
}

describe('mail send and log navigation', () => {
  it.each([
    [
      '/main/dev/mail/send/compose?source=test',
      '/main/dev/mail/send',
      'Compose content',
    ],
    [
      '/main/dev/mail/send/bulk?source=test',
      '/main/dev/mail/send',
      'Compose content',
    ],
    [
      '/main/dev/mail/logs?source=test',
      '/main/dev/mail/logs/sync',
      'Sync history',
    ],
    [
      '/main/dev/mail/bulk-send?source=test',
      '/main/dev/mail/send',
      'Compose content',
    ],
    [
      '/main/dev/mail/send-logs?source=test',
      '/main/dev/mail/logs/send',
      'Send history',
    ],
    [
      '/main/dev/mail/sync-logs?source=test',
      '/main/dev/mail/logs/sync',
      'Sync history',
    ],
  ])(
    'redirects %s once while retaining the query',
    async (path, target, content) => {
      const router = createRouter(path);
      render(<RouterProvider router={router} />);
      expect(await screen.findByText(content)).toBeVisible();
      expect(router.state.location.pathname).toBe(target);
      expect(router.state.location.search).toBe('?source=test');
      expect(router.state.historyAction).toBe('REPLACE');
    },
  );

  it('renders one composer without send tabs and opens sync logs by default', async () => {
    const router = createRouter('/main/dev/mail/send');
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Compose content')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Compose mail',
    );
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/main/dev/mail/send');
    fireEvent.click(screen.getByRole('link', { name: 'Mail logs' }));
    expect(await screen.findByText('Sync history')).toBeVisible();
  });

  it('restores the selected view on direct entry and browser back/forward', async () => {
    const router = createRouter('/main/dev/mail/logs/bulk?source=test');
    render(<RouterProvider router={router} />);
    expect(screen.getByText('Batch history')).toBeVisible();
    const links = screen.getAllByRole('link');
    expect(links[2]).toHaveAttribute('aria-current', 'page');
    fireEvent.click(links[0]);
    expect(await screen.findByText('Sync history')).toBeVisible();
    expect(router.state.location.search).toBe('?source=test');
    await act(() => router.navigate(-1));
    expect(await screen.findByText('Batch history')).toBeVisible();
    await act(() => router.navigate(1));
    await waitFor(() =>
      expect(links[0]).toHaveAttribute('aria-current', 'page'),
    );
  });
});
