import { afterEach, expect, it, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import webPushEn from '../../client/locales/en-US.js';
import { PushPreferences } from '../../client/components/preferences.js';
import { deviceKey } from '../../client/browser.js';

const mocks = vi.hoisted(() => ({ request: vi.fn(), toast: vi.fn() }));
vi.mock('@nocobase/app-client', () => ({
  useApiClient: () => ({ request: mocks.request }),
  useToaster: () => ({ show: mocks.toast }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useAppLocale: () => ({ locale: 'en-US' }),
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
  mocks.request.mockReset();
});

async function show(rows: object[] = [], faults = { key: false }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('PushManager', class {});
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('denied'),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {},
  });
  mocks.request.mockImplementation(async ({ path }) => {
    if (path === 'webPush/key' && faults.key)
      throw new Error('Connection failed.');
    return { data: path === 'webPush/key' ? { publicKey: 'public' } : rows };
  });
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'application', resources: { 'en-US': {} } },
    locale: 'en-US',
    namespaces: { '@nocobase/app-plugin-notification-web-push': webPushEn },
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TestI18nProvider runtime={runtime} namespace='application'>
        <MemoryRouter>
          <PushPreferences />
        </MemoryRouter>
      </TestI18nProvider>
    </QueryClientProvider>,
  );
}

it('shows one subscribe action and requests permission only after the click', async () => {
  await show();
  const button = await screen.findByRole('button', {
    name: 'Subscribe this device',
  });
  expect(
    screen.getAllByRole('button', { name: 'Subscribe this device' }),
  ).toHaveLength(1);
  expect(Notification.requestPermission).not.toHaveBeenCalled();
  fireEvent.click(button);
  expect(await screen.findByText(/Notifications are blocked/u)).toBeVisible();
  expect(mocks.request).not.toHaveBeenCalledWith(
    expect.objectContaining({ method: 'POST' }),
  );
});

it('updates the current device immediately and scopes its request to that record', async () => {
  localStorage.setItem(deviceKey('/', 'alice'), 'device1');
  await show([{ id: 'device1', name: 'My phone', enabled: true }]);
  const toggle = await screen.findByRole('switch', { name: 'My phone' });
  expect(screen.getByText('This device')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Subscribe this device' }),
  ).not.toBeInTheDocument();
  fireEvent.click(toggle);
  await waitFor(() =>
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: 'webPush/subscriptions/device1',
      json: { enabled: false },
    }),
  );
});

it('recovers a failed public-key read through Retry instead of leaving subscription disabled', async () => {
  const faults = { key: true };
  await show([], faults);
  const retry = await screen.findByRole('button', { name: 'Retry' });
  faults.key = false;
  fireEvent.click(retry);
  expect(
    await screen.findByRole('button', { name: 'Subscribe this device' }),
  ).toBeEnabled();
});
