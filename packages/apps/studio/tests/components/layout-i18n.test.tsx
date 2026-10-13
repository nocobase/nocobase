import {
  ClientApplicationContext,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import { act, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { AppLayout } from '../../client/layouts/app-layout.js';

// The agents' chat needs services these tests do not provide; the agent-chat block is tested in the UI Library.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../setup/agents-chat-stub.js'),
);
vi.mock(
  '../../client/agents/chat.js',
  () => import('../setup/agents-chat-stub.js'),
);
// The person's language and theme on the server: not what these tests are about.
vi.mock('../../client/account/preferences-sync.js', () => ({
  useUserPreferencesSync: () => undefined,
}));
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));

vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => null,
}));
// Inbox navigation needs the API and realtime; its own test covers its labels.
vi.mock('../../client/inbox/navigation.js', () => ({
  useInboxNavigation: () => ({ badge: null, label: 'Inbox', hint: 'Inbox' }),
}));
vi.mock('../../client/routing/route-navigation.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../client/routing/route-navigation.js')
  >()),
  useRouteNavigation: (routes: readonly AppClientRegisteredRoute[]) => ({
    items: routes.map((route) => ({ route, children: [] })),
    loading: false,
    denied: new Set<string>(),
  }),
}));

async function setup(children: ReactNode, path = '/') {
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: 'test-app',
  });
  runtime.registerApplicationNamespace('test-app', locales);
  await runtime.init('en-US');
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
  } as unknown as ClientApplication;
  render(
    <I18nProvider runtime={runtime}>
      <ClientApplicationContext.Provider value={app}>
        <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
      </ClientApplicationContext.Provider>
    </I18nProvider>,
  );
  return runtime;
}

describe('shell translations', () => {
  it('updates the header without remounting', async () => {
    const dashboard: AppClientRegisteredRoute = {
      id: 'dashboard',
      name: 'dashboard',
      packageName: 'test-app',
      source: 'application',
      auth: 'required',
      path: '/',
      breadcrumb: { title: 'navigation.dashboard' },
      componentLoader: async () => ({ default: () => null }),
    };
    const runtime = await setup(<AppLayout routes={[dashboard]} />);
    const header = screen.getByRole('banner');
    expect(within(header).getByText('Dashboard')).toBeVisible();
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(within(header).getByText('仪表盘')).toBeVisible();
    await act(() => runtime.changeLanguage('en-US'));
    expect(within(header).getByText('Dashboard')).toBeVisible();
  });
});
