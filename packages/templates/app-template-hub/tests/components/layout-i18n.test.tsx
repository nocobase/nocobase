import {
  ClientApplicationContext,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider } from '@nocobase/i18n/client';
import userEvent from '@testing-library/user-event';
import { act, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import locales from '../../client/locales/index.js';
import { AppLayout } from '../../client/layouts/app-layout.js';
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));
import { SettingsLayout } from '../../client/layouts/settings-layout.js';

vi.mock('../../client/routing/client-route.js', () => ({
  ClientRoute: () => <p>Preferences content</p>,
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

const route: AppClientRegisteredRoute = {
  id: 'preferences',
  name: 'preferences',
  path: '/settings/preferences',
  packageName: 'test',
  source: 'application',
  auth: 'optional',
  navigation: { title: 'Preferences' },
  componentLoader: async () => ({ default: () => <p>Preferences content</p> }),
};

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
    runtime: { settingsRouteTree: [route] },
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
  it('updates header, footer, tooltips and accessible labels without remounting', async () => {
    const runtime = await setup(<AppLayout routes={[overview]} />);
    // The header's trail, where a tagline used to be.
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveTextContent('Overview');
    expect(screen.getByText('AI builds freely.')).toBeVisible();
    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('navigation', { name: '面包屑' })).toBeVisible();
    expect(screen.getByText('AI 自由构建。')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'NocoBase' }).parentElement,
    ).toHaveTextContent('NocoBase 保障可靠。');
    expect(
      screen.getByRole('button', { name: '展开或收起导航' }),
    ).toHaveAttribute('title', '展开或收起导航');
    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute(
      'href',
      'https://www.nocobase.com',
    );
    const user = userEvent.setup();
    const settings = screen.getByRole('link', { name: '设置' });
    expect(settings).not.toHaveAttribute('title');
    await user.hover(settings);
    expect(
      await screen.findByText('设置', {
        selector: '[data-slot=tooltip-content]',
      }),
    ).toBeVisible();
    await user.unhover(settings);
    await act(() => runtime.changeLanguage('en-US'));
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toBeVisible();
    act(() => settings.focus());
    expect(
      await screen.findByText('Settings', {
        selector: '[data-slot=tooltip-content]',
      }),
    ).toBeVisible();
  });

  it.each([
    [
      'settings',
      SettingsLayout,
      '暂无可用设置',
      '没有已启用的插件提供你有权访问的设置页面。',
    ],
  ] as const)(
    'translates the %s empty state',
    async (surface, Layout, title, description) => {
      const runtime = await setup(<Layout routeTree={[]} />, `/${surface}`);
      await act(() => runtime.changeLanguage('zh-CN'));
      expect(screen.getByRole('heading', { name: title })).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.getByRole('link', { name: '返回应用' })).toHaveAttribute(
        'href',
        '/',
      );
    },
  );

  it.each(['settings'] as const)(
    'translates the %s page header',
    async (surface) => {
      const Layout = SettingsLayout;
      const page = { ...route, path: `/${surface}/preferences` };
      const runtime = await setup(
        <Routes>
          <Route
            path={`/${surface}/*`}
            element={<Layout routeTree={[page]} />}
          />
        </Routes>,
        page.path,
      );
      await screen.findByText('Preferences content');
      await act(() => runtime.changeLanguage('zh-CN'));
      expect(screen.getByRole('link', { name: '返回应用' })).toHaveAttribute(
        'href',
        '/',
      );
      expect(
        screen.getByRole('navigation', {
          name: '设置',
        }),
      ).toBeVisible();
    },
  );
});
