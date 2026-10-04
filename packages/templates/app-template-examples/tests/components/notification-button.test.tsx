import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import locales from '../../client/locales/index.js';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '../../client/components/ui/tooltip';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  count: 120,
  session: { user: { id: 'user-1' } } as { user: { id: string } } | null,
  cleanup: vi.fn(),
  request: vi.fn(),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: mocks.session, isPending: false }),
}));
vi.mock('@nocobase/app-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/app-client')>();
  const client = { request: mocks.request };
  const realtime = {
    subscribe: () => mocks.cleanup,
    onOpen: () => mocks.cleanup,
  };
  return {
    ...actual,
    useApiClient: () => client,
    useService: (token: unknown) =>
      token === actual.realtimeClientToken ? realtime : client,
  };
});
import { NotificationButton } from '../../client/components/notification-button.tsx';

let runtime: I18nRuntime;
beforeEach(async () => {
  mocks.count = 120;
  mocks.session = { user: { id: 'user-1' } };
  runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
});

it('caps the badge, follows the app base, refreshes unread state, and resets on account changes', async () => {
  mocks.request.mockImplementation(async () => ({
    data: { count: mocks.count },
  }));
  const renderButton = () => (
    <MemoryRouter basename='/demo' initialEntries={['/demo/']}>
      <I18nProvider runtime={runtime}>
        <TooltipProvider>
          <NotificationButton />
        </TooltipProvider>
      </I18nProvider>
    </MemoryRouter>
  );
  const view = render(renderButton());
  const link = await screen.findByRole('link', {
    name: 'Notifications, 120 unread',
  });
  expect(link).toHaveAttribute('href', '/demo/notifications');
  expect(screen.getByText('99+')).toBeInTheDocument();
  expect(screen.getByText('99+')).toHaveClass('h-4', 'min-w-5', 'rounded-full');
  mocks.count = 2;
  fireEvent(window, new Event('focus'));
  await screen.findByRole('link', { name: 'Notifications, 2 unread' });
  expect(screen.getByText('2')).toHaveClass('h-4', 'w-4', 'rounded-full');
  mocks.count = 0;
  mocks.session = { user: { id: 'user-2' } };
  view.rerender(renderButton());
  await screen.findByRole('link', { name: 'Notifications' });
  expect(screen.queryByText('2')).not.toBeInTheDocument();
  await waitFor(() => expect(mocks.cleanup).toHaveBeenCalledTimes(2));
  mocks.session = null;
  view.rerender(renderButton());
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

it.each(['hover', 'keyboard'] as const)(
  'shows a localized notification tooltip on %s',
  async (method) => {
    const user = userEvent.setup();
    mocks.request.mockResolvedValue({ data: { count: 2 } });
    render(
      <I18nProvider runtime={runtime}>
        <MemoryRouter>
          <TooltipProvider>
            <NotificationButton />
          </TooltipProvider>
        </MemoryRouter>
      </I18nProvider>,
    );
    const link = await screen.findByRole('link', {
      name: 'Notifications, 2 unread',
    });
    if (method === 'hover') await user.hover(link);
    else await user.tab();
    expect(await screen.findByText('Notifications, 2 unread')).toBeVisible();
    expect(link).not.toHaveAttribute('title');
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByText('通知中心，2 条未读')).toBeVisible();
    expect(link).toHaveAccessibleName('通知中心，2 条未读');
    mocks.request.mockResolvedValue({ data: { count: 0 } });
    fireEvent(window, new Event('focus'));
    await waitFor(() => expect(link).toHaveAccessibleName('通知中心'));
    expect(screen.getByText('通知中心')).toBeVisible();
    expect(link).toHaveAttribute('href', '/notifications');
  },
);
