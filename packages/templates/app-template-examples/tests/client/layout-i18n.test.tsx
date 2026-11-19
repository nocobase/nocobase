import foundation from '@nocobase/app-plugin-foundation/client/plugin';
import {
  ClientApplicationContext,
  NavigationGuardProvider,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
vi.mock('../../client/components/online-agent/provider.js', () => ({
  OnlineAgentProvider: ({ children }: { readonly children: ReactNode }) =>
    children,
}));
import { AppLayout } from '../../client/layouts/app-layout.js';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));

vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => null,
}));
vi.mock('../../client/routing/route-navigation.js', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../client/routing/route-navigation.js')
    >();
  return {
    ...actual,
    // Everything allowed, without an authorization client.
    useRouteNavigation: (routes: readonly AppClientRegisteredRoute[]) => ({
      items: actual.buildRouteNavigation(routes, new Set()),
      loading: false,
      denied: new Set<string>(),
    }),
  };
});

afterEach(() => vi.unstubAllGlobals());

/** The page the shell opens on: the header names it. */
const overview: AppClientRegisteredRoute = {
  id: 'overview',
  name: 'overview',
  path: '/',
  packageName: 'test',
  source: 'application',
  auth: 'optional',
  breadcrumb: { title: 'Overview' },
  componentLoader: async () => ({ default: () => null }),
};

async function setup(children: ReactNode) {
  const sidebarPreference = createAppSidebarPreferenceStore('/test-app');
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
  runtime.registerNamespace(
    '@nocobase/app-plugin-foundation',
    foundation().locales!,
  );
  await runtime.init('en-US');
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
    runtime: {},
  } as unknown as ClientApplication;
  render(
    <I18nProvider runtime={runtime}>
      <ClientApplicationContext.Provider value={app}>
        <SidebarPreferenceProvider value={sidebarPreference}>
          <MemoryRouter initialEntries={['/']}>
            <NavigationGuardProvider>{children}</NavigationGuardProvider>
          </MemoryRouter>
        </SidebarPreferenceProvider>
      </ClientApplicationContext.Provider>
    </I18nProvider>,
  );
  return runtime;
}

describe('shell translations', () => {
  it('updates header, footer and accessible labels without remounting', async () => {
    const runtime = await setup(<AppLayout routes={[overview]} />);
    // The header's trail, where a tagline used to be.
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveTextContent('Overview');
    expect(screen.getByText('Build reliable business systems')).toBeVisible();
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('navigation', { name: '面包屑' })).toBeVisible();
    expect(screen.getByText('Build reliable business systems')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'NocoBase' }).parentElement,
    ).toHaveTextContent('AI + NocoBase');
    expect(
      screen.getByRole('button', { name: '展开或收起导航' }),
    ).toHaveAttribute('title', '展开或收起导航');
    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute(
      'href',
      'https://www.nocobase.com',
    );
    await act(() => runtime.changeLanguage('en-US'));
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
  });
});

/** A business page and a Settings area holding one category with one page. */
function settingsFixture(): AppClientRegisteredRoute[] {
  const page = async () => ({ default: () => null });
  const settings = (
    route: Omit<
      AppClientRegisteredRoute,
      'packageName' | 'source' | 'surface' | 'auth' | 'authz'
    >,
  ): AppClientRegisteredRoute => ({
    packageName: 'test',
    source: 'application',
    surface: 'settings',
    auth: 'required',
    authz: 'skip',
    ...route,
  });
  return [
    {
      ...overview,
      id: 'test:projects',
      name: 'projects',
      path: '/projects',
      navigation: { title: 'Projects' },
    },
    settings({
      id: 'test:settingsHome',
      name: 'settingsHome',
      path: '/settings',
      componentLoader: page,
    }),
    settings({
      id: 'test:settingsAccount',
      name: 'settingsAccount',
      path: '/settings',
      navigation: { title: 'settings.categories.account' },
      children: [
        settings({
          id: 'test:settingsUsers',
          name: 'settingsUsers',
          path: '/settings/users',
          navigation: { title: 'settings.users' },
          componentLoader: page,
        }),
      ],
    }),
  ];
}

it('opens the settings navigation from the Settings entry and leads back', async () => {
  const routes = settingsFixture();
  const runtime = await setup(<AppLayout routes={routes} />);
  const navigation = screen.getByRole('navigation', {
    name: 'Application navigation',
  });
  fireEvent.click(within(navigation).getByRole('link', { name: 'Projects' }));
  await waitFor(() =>
    expect(
      within(navigation).getByRole('link', { name: 'Projects' }),
    ).toHaveAttribute('aria-current', 'page'),
  );
  // The Settings entry stands apart from the application's menu, at its end.
  const entries = within(
    screen.getByRole('complementary', { name: 'Application navigation' }),
  ).getAllByRole('link');
  const entry = entries.find((link) => link.textContent === 'System settings');
  expect(entry).toHaveAttribute('href', '/settings');
  expect(entry?.closest('[data-slot="sidebar-content"]')).not.toBeNull();
  expect(within(navigation).queryByText('System settings')).toBeNull();
  expect(
    screen.queryByRole('navigation', { name: 'Resources' }),
  ).not.toBeInTheDocument();

  fireEvent.click(entry!);
  const menu = await screen.findByRole('navigation', {
    name: 'Settings navigation',
  });
  // Categories head their modules; the application's own menu is gone.
  expect(within(menu).getByText('Accounts and permissions')).toBeVisible();
  const users = within(menu).getByRole('link', { name: 'Users' });
  expect(users).toHaveAttribute('href', '/settings/users');
  expect(screen.queryByRole('link', { name: 'Projects' })).toBeNull();
  const back = screen.getByRole('link', { name: 'Back' });
  expect(back).toHaveAttribute('href', '/projects');

  fireEvent.click(users);
  await waitFor(() =>
    expect(
      within(
        screen.getByRole('navigation', { name: 'Settings navigation' }),
      ).getByRole('link', { name: 'Users' }),
    ).toHaveAttribute('aria-current', 'page'),
  );
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(
    within(screen.getByRole('navigation', { name: '设置导航' })).getByRole(
      'link',
      { name: '用户管理' },
    ),
  ).toHaveAttribute('href', '/settings/users');
  fireEvent.click(screen.getByRole('link', { name: '返回' }));
  expect(
    await screen.findByRole('navigation', { name: '应用导航' }),
  ).toBeVisible();
});

it('shows the settings navigation in the mobile drawer', async () => {
  vi.stubGlobal('innerWidth', 375);
  await setup(<AppLayout routes={settingsFixture()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const drawer = await screen.findByRole('dialog');
  fireEvent.click(
    within(drawer).getByRole('link', { name: 'System settings' }),
  );
  // Opening a page closes the drawer; opened again, it holds the settings menu.
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const menu = await screen.findByRole('navigation', {
    name: 'Settings navigation',
  });
  expect(within(menu).getByRole('link', { name: 'Users' })).toHaveAttribute(
    'href',
    '/settings/users',
  );
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/',
  );
});
