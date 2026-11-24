import foundation from '@nocobase/app-plugin-foundation/client/plugin';
import {
  APP_CLIENT_NAMESPACE,
  ClientApplicationContext,
  createAppI18nRuntime,
  NavigationGuardProvider,
  usePageBreadcrumb,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
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
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { AppLayout } from '../../client/layouts/app-layout.js';
import { inApplication } from '../../client/routing/settings-shell.js';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));

vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: {
      user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
    },
  }),
}));
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

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

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

async function setup(children: ReactNode, initialEntry = '/') {
  const sidebarPreference = createAppSidebarPreferenceStore('/test-app');
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  // As an application starts: app-client's own namespace, which titles the built-in settings categories, comes along.
  const runtime = await createAppI18nRuntime({
    defaultLocale: 'en-US',
    initialLocale: 'en-US',
    contributions: [
      { packageName: 'test-app', source: 'application', locales },
      {
        packageName: '@nocobase/app-plugin-foundation',
        source: 'plugin',
        locales: foundation().locales!,
      },
    ],
  });
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
    runtime: {},
  } as unknown as ClientApplication;
  render(
    <I18nProvider runtime={runtime}>
      <ClientApplicationContext.Provider value={app}>
        <SidebarPreferenceProvider value={sidebarPreference}>
          <MemoryRouter initialEntries={[initialEntry]}>
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
    > & { readonly packageName?: string },
  ): AppClientRegisteredRoute => ({
    packageName: 'test',
    source: 'application',
    surface: 'systemSettings',
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
      id: `${APP_CLIENT_NAMESPACE}:systemSettings.account`,
      name: 'systemSettings.account',
      packageName: APP_CLIENT_NAMESPACE,
      kind: 'category',
      category: 'account',
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
  // The Settings entry stands apart from the application's menu, pinned below it outside the scrolling content.
  const entries = within(
    screen.getByRole('complementary', { name: 'Application navigation' }),
  ).getAllByRole('link');
  const entry = entries.find((link) => link.textContent === 'System settings');
  expect(entry).toHaveAttribute('href', '/settings');
  expect(entry?.closest('[data-slot="sidebar-content"]')).toBeNull();
  expect(entry?.closest('[data-sidebar="sidebar"]')).not.toBeNull();
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

/** The Settings fixture plus a personal settings area holding one category with one page. */
function personalSettingsFixture(): AppClientRegisteredRoute[] {
  const page = async () => ({ default: () => null });
  const personal = (
    route: Omit<
      AppClientRegisteredRoute,
      'packageName' | 'source' | 'surface' | 'auth' | 'authz'
    > & { readonly packageName?: string },
  ): AppClientRegisteredRoute => ({
    packageName: 'test',
    source: 'application',
    surface: 'personalSettings',
    auth: 'required',
    authz: 'skip',
    ...route,
  });
  return [
    ...settingsFixture(),
    personal({
      id: 'test:personalSettingsHome',
      name: 'personalSettingsHome',
      path: '/me',
      componentLoader: page,
    }),
    personal({
      id: `${APP_CLIENT_NAMESPACE}:personalSettings.account`,
      name: 'personalSettings.account',
      packageName: APP_CLIENT_NAMESPACE,
      kind: 'category',
      category: 'account',
      path: '/me',
      navigation: { title: 'settings.personal.categories.account' },
      children: [
        personal({
          id: 'test:personalAppearance',
          name: 'personalAppearance',
          path: '/me/preferences',
          navigation: { title: 'settings.personal.appearance.title' },
          componentLoader: page,
        }),
      ],
    }),
  ];
}

it('shows personal settings in their own navigation and keeps the way back across both settings areas', async () => {
  await setup(
    <>
      <AppLayout routes={personalSettingsFixture()} />
      <Link to='/me/preferences'>Open personal settings</Link>
      <Link to='/settings/users'>Open system settings</Link>
    </>,
  );
  const navigation = screen.getByRole('navigation', {
    name: 'Application navigation',
  });
  // Personal settings never join the application's menu; they open from the account menu.
  expect(within(navigation).queryByText('Personal settings')).toBeNull();
  fireEvent.click(within(navigation).getByRole('link', { name: 'Projects' }));
  await waitFor(() =>
    expect(
      within(navigation).getByRole('link', { name: 'Projects' }),
    ).toHaveAttribute('aria-current', 'page'),
  );

  fireEvent.click(screen.getByRole('link', { name: 'Open personal settings' }));
  const menu = await screen.findByRole('navigation', {
    name: 'Personal settings navigation',
  });
  expect(within(menu).getByText('Account')).toBeVisible();
  expect(
    within(menu).getByRole('link', { name: 'Preferences' }),
  ).toHaveAttribute('aria-current', 'page');
  expect(screen.getByText('Ada Lovelace')).toBeVisible();
  expect(screen.queryByRole('link', { name: 'System settings' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/projects',
  );

  // Moving on to system settings still leads back to the page left before either.
  fireEvent.click(screen.getByRole('link', { name: 'Open system settings' }));
  await screen.findByRole('navigation', { name: 'Settings navigation' });
  expect(screen.queryByText('Ada Lovelace')).toBeNull();
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/projects',
  );
});

it('returns to an application page under /settings when system settings are off', async () => {
  const reports: AppClientRegisteredRoute = {
    id: 'test:reports',
    name: 'reports',
    path: '/settings/reports',
    packageName: 'test',
    source: 'application',
    auth: 'required',
    authz: 'skip',
    navigation: { title: 'Reports' },
    componentLoader: async () => ({ default: () => null }),
  };
  await setup(
    <>
      <AppLayout
        routes={[
          ...personalSettingsFixture().filter(
            (route) => route.surface !== 'systemSettings',
          ),
          reports,
        ]}
      />
      <Link to='/settings/reports'>Open reports</Link>
      <Link to='/me/preferences'>Open personal settings</Link>
    </>,
  );
  fireEvent.click(screen.getByRole('link', { name: 'Open reports' }));
  // The application's page keeps the application's menu.
  await waitFor(() =>
    expect(
      screen.getByRole('navigation', { name: 'Application navigation' }),
    ).toBeVisible(),
  );
  fireEvent.click(screen.getByRole('link', { name: 'Open personal settings' }));
  await screen.findByRole('navigation', {
    name: 'Personal settings navigation',
  });
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/settings/reports',
  );
});

it('links the first breadcrumb level of personal settings back to /me', async () => {
  await setup(
    <AppLayout routes={personalSettingsFixture()} />,
    '/me/preferences',
  );
  const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });
  expect(
    within(trail).getByRole('link', { name: 'Personal settings' }),
  ).toHaveAttribute('href', '/me');
  expect(trail).toHaveTextContent('Preferences');
  expect(trail).not.toHaveTextContent('Account');
});

it('leads back home from a settings page opened directly in a tab that showed application pages before', async () => {
  // An earlier visit in this tab remembered a business page; this document starts on a settings page.
  sessionStorage.setItem('nocobase:settings-return-to', '/projects');
  await setup(<AppLayout routes={settingsFixture()} />, '/settings/users');
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/',
  );
});

it('returns only to paths inside the application', () => {
  expect(inApplication('/projects?tab=open#top')).toBe(
    '/projects?tab=open#top',
  );
  expect(inApplication('//evil.example/x')).toBeUndefined();
  expect(inApplication('/\\evil.example/x')).toBeUndefined();
  expect(inApplication('https://evil.example/x')).toBeUndefined();
  expect(inApplication('javascript:alert(1)')).toBeUndefined();
  expect(inApplication(null)).toBeUndefined();
});

it('renders plugin personal settings pages in the full main content area', async () => {
  const routes = personalSettingsFixture();
  await setup(
    <Routes>
      <Route element={<AppLayout routes={routes} />}>
        <Route path='/me/plugin' element={<p>Plugin page</p>} />
        <Route path='/projects' element={<p>Business page</p>} />
      </Route>
    </Routes>,
    '/me/plugin',
  );
  expect(screen.getByRole('main')).toContainElement(
    screen.getByText('Plugin page'),
  );
  expect(
    screen.getByText('Plugin page').closest('[class*="max-w-"]'),
  ).toBeNull();
});

/** A page declaring its whole trail, as the agents plugin's skill pages do. */
function DeclaredTrail({ list }: { readonly list: string }) {
  usePageBreadcrumb([{ label: 'Skills', to: list }, { label: 'New skill' }]);
  return <p>Declared trail</p>;
}

it.each([
  ['System settings', '/settings/skills/new', '/settings/skills', '/settings'],
  ['Personal settings', '/me/skills/new', '/me/skills', '/me'],
  [undefined, '/projects/skills/new', '/projects/skills', undefined],
] as const)(
  'keeps the settings area ahead of a trail a page declares (%s)',
  async (areaTitle, path, list, home) => {
    const surface = path.startsWith('/settings')
      ? 'systemSettings'
      : path.startsWith('/me')
        ? 'personalSettings'
        : undefined;
    // The skill library and its new page, mounted in the area under test.
    const skills: AppClientRegisteredRoute = {
      id: `test:skills:${list}`,
      name: 'skills',
      path: list,
      packageName: 'test',
      source: 'application',
      auth: 'required',
      authz: 'skip',
      ...(surface ? { surface } : {}),
      componentLoader: async () => ({ default: () => null }),
      children: [
        {
          id: `test:skillsNew:${list}`,
          name: 'skillsNew',
          path,
          packageName: 'test',
          source: 'application',
          auth: 'required',
          authz: 'skip',
          ...(surface ? { surface } : {}),
          componentLoader: async () => ({ default: () => null }),
        },
      ],
    };
    const routes = [...personalSettingsFixture(), skills];
    await setup(
      <Routes>
        <Route element={<AppLayout routes={routes} />}>
          <Route path={path} element={<DeclaredTrail list={list} />} />
        </Route>
      </Routes>,
      path,
    );
    await screen.findByText('Declared trail');
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const links = within(trail)
      .getAllByRole('link')
      .filter((link) => link.textContent && link.getAttribute('href'))
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      ...(areaTitle ? [[areaTitle, home]] : []),
      ['Skills', list],
    ]);
    expect(within(trail).getByText('New skill')).toHaveAttribute(
      'aria-current',
      'page',
    );
  },
);
