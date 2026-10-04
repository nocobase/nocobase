import {
  apiClientToken,
  ClientApplicationContext,
  type ClientApplication,
  createAppClientConfig,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  AuthorizationClient,
  type AuthorizationCheck,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';
import { Outlet, MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from '../../client/routing/app-router.tsx';
import { AppThemeProvider } from '../../client/theme/index.ts';

afterEach(() => vi.unstubAllGlobals());
describe('application shell', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches:
        query === '(prefers-color-scheme: dark)' ||
        query === '(min-width: 768px)',
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  it('wraps authenticated application pages with navigation and user controls', async () => {
    renderApplication('/', true);

    expect(
      await screen.findByRole('navigation', { name: 'Application navigation' }),
    ).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen
        .getByRole('complementary', { name: 'Application navigation' })
        .querySelector('[data-sidebar="sidebar"]'),
    ).toHaveClass('bg-sidebar');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'data-active',
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass(
      'data-active:bg-sidebar-primary',
      'data-active:text-sidebar-primary-foreground',
      'ring-sidebar-ring',
    );
    // The account menu exposes user details in its panel without a native tooltip.
    expect(
      await screen.findByRole('button', { name: 'Open account menu' }),
    ).not.toHaveAttribute('title');
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('AI builds freely.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute(
      'href',
      'https://www.nocobase.com',
    );
    expect(
      screen.getByText('NocoBase', { selector: 'a' }).parentElement,
    ).toHaveTextContent('NocoBase keeps it reliable.');
    expect(screen.getByText('Default Template')).toHaveClass('truncate');
    expect(screen.getByText('v0.0.0')).toHaveClass('truncate');
    // shadcn's edge rail, with a translated label in place of its built-in one.
    expect(
      screen.getByRole('button', { name: 'Expand or collapse navigation' }),
    ).toHaveAttribute('title', 'Expand or collapse navigation');
    expect(
      await screen.findByRole('heading', { name: 'App client is ready' }),
    ).toBeVisible();
  });

  it.each([true, false])(
    'shows the Settings entry only when a page is accessible (%s)',
    async (allowed) => {
      const can = vi.fn(
        async ({ resource }: AuthorizationCheck) =>
          resource.id !== 'preferences' || allowed,
      );
      renderApplication('/', true, [], {
        authorization: { can },
        settingsRouteTree: [
          createRoute(
            'preferences',
            '/settings/preferences',
            'required',
            () => <h2>Preferences</h2>,
            'plugin',
            'Preferences',
            true,
          ),
        ],
      });
      await screen.findByRole('heading', { name: 'App client is ready' });
      await waitFor(() =>
        expect(can).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: { type: 'page', id: 'preferences' },
            action: 'access',
          }),
        ),
      );
      if (allowed) {
        expect(
          await screen.findByRole('link', { name: 'Settings' }),
        ).toBeVisible();
      } else {
        expect(
          screen.queryByRole('link', { name: 'Settings' }),
        ).not.toBeInTheDocument();
      }
    },
  );

  it('renders nested pages through manual outlets and selects the nearest menu ancestor', async () => {
    const child = createRoute('detail', '/orders/42', 'required', () => (
      <h3>Order detail</h3>
    ));
    const parent = {
      ...createRoute('orders', '/orders', 'required', () => (
        <>
          <h2>Orders layout</h2>
          <Outlet />
        </>
      )),
      navigation: { title: 'Orders' },
      children: [child],
    };
    renderApplication('/orders/42', true, [parent]);
    expect(await screen.findByText('Order detail')).toBeVisible();
    expect(screen.getByText('Orders layout')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Orders' }).querySelector('svg'),
    ).toBeNull();
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('keeps a parent page link clickable independently of its menu disclosure', async () => {
    const child = {
      ...createRoute('reports', '/orders/reports', 'required', () => (
        <h3>Reports page</h3>
      )),
      navigation: { title: 'Reports' },
    };
    const parent = {
      ...createRoute('orders', '/orders', 'required', () => (
        <>
          <h2>Orders layout</h2>
          <Outlet />
        </>
      )),
      navigation: { title: 'Orders' },
      children: [child],
    };
    renderApplication('/orders', true, [parent]);
    expect(await screen.findByRole('link', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/orders',
    );
    const toggle = screen.getByRole('button', { name: 'Orders' });
    fireEvent.click(toggle);
    expect(
      screen.queryByRole('link', { name: 'Reports' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Orders' })).toBeVisible();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('link', { name: 'Reports' }));
    expect(await screen.findByText('Reports page')).toBeVisible();
    expect(screen.getByText('Orders layout')).toBeVisible();
  });

  it('collapses and expands the desktop navigation', async () => {
    renderApplication('/', true);

    const sidebar = await screen.findByRole('complementary', {
      name: 'Application navigation',
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse navigation' }),
    );
    expect(sidebar.closest('[data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );
    expect(
      screen.getByRole('button', { name: 'Expand navigation' }),
    ).toHaveAttribute('aria-pressed', 'true');
    // The footer keeps only its shield; focusing it shows the slogan, name and version.
    const footerIcon = screen.getByRole('img', {
      name: 'AI builds freely. NocoBase keeps it reliable. Default Template v0.0.0',
    });
    act(() => footerIcon.focus());
    expect(
      await screen.findByText('Default Template v0.0.0', {
        selector: '[data-slot="tooltip-content"] span',
      }),
    ).toBeVisible();

    // The edge rail switches the mode back.
    fireEvent.click(
      screen.getByRole('button', { name: 'Expand or collapse navigation' }),
    );
    expect(sidebar.closest('[data-state]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
    expect(
      screen.queryByRole('img', { name: /Default Template/ }),
    ).not.toBeInTheDocument();
  });

  it('opens and closes the mobile navigation without changing the route', async () => {
    vi.stubGlobal('innerWidth', 390);
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    renderApplication('/', true);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open navigation' }),
    );
    expect(
      await screen.findByRole('dialog', { name: 'Application navigation' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Application navigation' }),
      ).toBeNull(),
    );
  });

  it('keeps guest pages outside the application shell', async () => {
    renderApplication('/login', false, [
      createRoute('login', '/login', 'guest', GuestPage),
    ]);

    expect(await screen.findByText('Guest login page')).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Application navigation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appearance' })).toBeVisible();
  });
});

function renderApplication(
  initialEntry: string,
  authenticated: boolean,
  routes: readonly AppClientRegisteredRoute[] = [],
  options: {
    readonly authorization?: Pick<AuthorizationClient, 'can'>;
    readonly settingsRouteTree?: readonly AppClientRegisteredRoute[];
  } = {},
): void {
  const clientRoutes = [
    createRoute('home', '/', 'required', HomePage, 'application'),
    ...routes,
  ];
  const authClient = createTestAuthClient(authenticated);
  const authorizationClient = new AuthorizationClient({
    request: vi.fn(),
  } as never);
  vi.spyOn(authorizationClient, 'can').mockImplementation(
    (request) => options.authorization?.can(request) ?? Promise.resolve(true),
  );
  const apiClient = {
    request: vi.fn().mockResolvedValue({
      data: { fallback: false, locale: 'en-US', requestedLocale: 'en-US' },
    }),
  };
  const registered = new Map<unknown, unknown>([
    [apiClientToken, apiClient],
    [authenticationClientToken, authClient],
    [authorizationClientToken, authorizationClient],
  ]);
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
    runtime: { settingsRouteTree: options.settingsRouteTree ?? [] },
    services: {
      has: (token: unknown) => registered.has(token),
      resolve: (token: unknown) => {
        if (registered.has(token)) return registered.get(token);
        throw new Error(`Unexpected service token: ${String(token)}`);
      },
    },
  } as unknown as ClientApplication;
  render(
    <ClientApplicationContext.Provider value={app}>
      <AuthenticationProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <AppThemeProvider>
            <AppRouter
              devRouteTree={[]}
              clientRoutes={clientRoutes}
              settingsRouteTree={options.settingsRouteTree ?? []}
            />
          </AppThemeProvider>
        </MemoryRouter>
      </AuthenticationProvider>
    </ClientApplicationContext.Provider>,
  );
}

function createTestAuthClient(authenticated: boolean) {
  return {
    getSession: vi.fn().mockResolvedValue({
      data: authenticated
        ? {
            session: null,
            user: {
              email: 'alice@example.com',
              id: '1',
              image: null,
              name: 'Alice',
            },
          }
        : null,
    }),
    signOut: vi.fn().mockResolvedValue({ data: null }),
  };
}

function createRoute(
  name: string,
  path: string,
  auth: AppClientRegisteredRoute['auth'],
  Component: ComponentType,
  source: AppClientRegisteredRoute['source'] = 'plugin',
  navigationTitle?: string,
  protectedRoute: boolean = false,
): AppClientRegisteredRoute {
  const packageName =
    source === 'application'
      ? '@nocobase/app-template-default'
      : '@nocobase/app-plugin-test';
  return {
    auth,
    ...(name === 'home' ? { navigation: { title: 'Home' } } : {}),
    componentLoader: async () => ({ default: Component }),
    id: `${packageName}:${name}`,
    name,
    packageName,
    path,
    source,
    ...(navigationTitle ? { navigation: { title: navigationTitle } } : {}),
    ...(protectedRoute
      ? { authz: { resource: { type: 'page', id: name }, action: 'access' } }
      : { authz: 'skip' as const }),
  };
}

function HomePage(): ReactElement {
  return <h2>App client is ready</h2>;
}

function GuestPage(): ReactElement {
  return <div>Guest login page</div>;
}
