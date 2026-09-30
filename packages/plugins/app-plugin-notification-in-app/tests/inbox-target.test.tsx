import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request: mocks.request }),
}));
vi.mock('../client/notification-in-app-runtime.js', () => ({
  useNotificationInAppRuntime: () => ({ revision: 0, unreadCount: 0 }),
}));
import { NotificationInAppInbox } from '../client/components/notification-in-app-inbox.js';
import enUS from '../client/locales/en-US.js';

// Rendered without a namespace scope, so the strict runtime only finds the keys if the inbox names its namespace itself.
const runtime = await createTestI18nRuntime({
  namespaces: { '@nocobase/app-plugin-notification-in-app': enUS },
});

afterEach(() => vi.unstubAllGlobals());

function Location() {
  return <output data-testid='location'>{useLocation().pathname}</output>;
}

it('adds the basename once for routes, preserves full URLs, and ignores old or invalid targets', async () => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  mocks.request.mockResolvedValue({
    data: [
      { target: { type: 'route', path: '/topics/123?q=1#reply' } },
      { target: { type: 'url', url: 'https://example.com/main/topics/456' } },
      { actionUrl: '/main/topics/old' },
      { target: { type: 'url', url: 'javascript:alert(1)' } },
      {},
    ].map((value, i) => ({
      id: String(i),
      title: `Message ${i}`,
      body: 'Body',
      createdAt: '2026-09-20T00:00:00Z',
      ...value,
    })),
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter basename='/main' initialEntries={['/main/notifications']}>
        <NotificationInAppInbox />
        <Location />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  const links = await screen.findAllByRole('link', { name: 'Open' });
  expect(links).toHaveLength(2);
  expect(links[0]).toHaveAttribute('href', '/main/topics/123?q=1#reply');
  expect(links[1]).toHaveAttribute(
    'href',
    'https://example.com/main/topics/456',
  );
  expect(links[1]).not.toHaveAttribute('target');
  fireEvent.click(links[0]);
  expect(screen.getByTestId('location')).toHaveTextContent('/topics/123');
});
