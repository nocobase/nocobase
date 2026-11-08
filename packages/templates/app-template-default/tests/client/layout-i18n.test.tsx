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
    expect(screen.queryByText('Default Template')).not.toBeInTheDocument();
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('navigation', { name: '面包屑' })).toBeVisible();
    expect(screen.getByText('Build reliable business systems')).toBeVisible();
    expect(screen.queryByText('Default Template')).not.toBeInTheDocument();
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

it('keeps the features link outside the scrolling business menu and translates it', async () => {
  const guide: AppClientRegisteredRoute = {
    ...overview,
    id: 'capabilityGuide',
    name: 'capabilityGuide',
    path: '/capabilities',
    packageName: '@nocobase/app-plugin-foundation',
    source: 'plugin',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'nav.capabilityGuide' },
  };
  const runtime = await setup(<AppLayout routes={[overview, guide]} />);
  const resources = screen.getByRole('navigation', { name: 'Resources' });
  const link = within(resources).getByRole('link', {
    name: 'Features and extensions',
  });
  expect(link).toHaveAttribute('href', '/capabilities');
  expect(link.closest('[data-slot="sidebar-content"]')).toBeNull();
  expect(
    within(
      screen.getByRole('navigation', { name: 'Application navigation' }),
    ).queryByRole('link', { name: 'Features and extensions' }),
  ).not.toBeInTheDocument();
  fireEvent.click(link);
  await waitFor(() =>
    expect(
      within(resources).getByRole('link', { name: 'Features and extensions' }),
    ).toHaveAttribute('aria-current', 'page'),
  );
  await act(() => runtime.changeLanguage('zh-CN'));
  expect(
    within(screen.getByRole('navigation', { name: '参考资料' })).getByRole(
      'link',
      { name: '功能与扩展' },
    ),
  ).toHaveAttribute('href', '/capabilities');
});

it('closes the mobile sidebar after opening Features and extensions', async () => {
  vi.stubGlobal('innerWidth', 375);
  const guide: AppClientRegisteredRoute = {
    ...overview,
    id: 'capabilityGuide',
    name: 'capabilityGuide',
    path: '/capabilities',
    packageName: '@nocobase/app-plugin-foundation',
    source: 'plugin',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'nav.capabilityGuide' },
  };
  await setup(<AppLayout routes={[overview, guide]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  const resources = await screen.findByRole('navigation', {
    name: 'Resources',
  });
  fireEvent.click(
    within(resources).getByRole('link', { name: 'Features and extensions' }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole('navigation', { name: 'Resources' }),
    ).not.toBeInTheDocument(),
  );
});
