import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
import {
  apiClientToken,
  ClientApplicationContext,
  NavigationGuardProvider,
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
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';
import { Link, Outlet, MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackButton } from '#components/back-button';
import { AppRouter } from '../../client/routing/app-router.tsx';
import { AppThemeProvider } from '../../client/theme/index.ts';

vi.mock('../../package.json', () => ({
  default: {
    name: 'team-portal',
    version: '9.0.0',
    nocobase: {
      templatePackage: '@nocobase/app-template-enterprise',
      defaultTemplateVersion: '1.2.3',
    },
  },
}));

afterEach(() => vi.unstubAllGlobals());

/** The sidebar's entries; the header's breadcrumb names the current page as well. */
const sidebar = (): HTMLElement =>
  document.querySelector<HTMLElement>('[data-slot=sidebar]') ?? document.body;
const findSidebarLink = (name: string): Promise<HTMLElement> =>
  waitFor(() => within(sidebar()).getByRole('link', { name }));

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
    expect(await findSidebarLink('Home')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen
        .getByRole('complementary', { name: 'Application navigation' })
        .querySelector('[data-sidebar="sidebar"]'),
    ).toHaveClass('bg-sidebar');
    expect(
      within(sidebar()).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('data-active');
    expect(within(sidebar()).getByRole('link', { name: 'Home' })).toHaveClass(
      'data-active:bg-sidebar-primary',
      'data-active:text-sidebar-primary-foreground',
      'ring-sidebar-ring',
    );
    // The account menu exposes user details in its panel without a native tooltip.
    expect(
      await screen.findByRole('button', { name: 'Open account menu' }),
    ).not.toHaveAttribute('title');
    expect(
      screen.queryByRole('button', { name: 'Theme' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Build reliable business systems')).toBeVisible();
    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute(
      'href',
      'https://www.nocobase.com',
    );
    expect(
      screen.getByText('NocoBase', { selector: 'a' }).parentElement,
    ).toHaveTextContent('AI + NocoBase');
    expect(
      screen.getByText('Based on the Enterprise template v1.2.3'),
    ).toBeVisible();
    // shadcn's edge rail, with a translated label in place of its built-in one.
    expect(
      screen.getByRole('button', { name: 'Expand or collapse navigation' }),
    ).toHaveAttribute('title', 'Expand or collapse navigation');
    expect(
      await screen.findByRole('heading', { name: 'App client is ready' }),
    ).toBeVisible();
  });

  it('omits settings and inbox shortcuts when their routes are absent', async () => {
    renderApplication('/', true);
    await screen.findByRole('heading', { name: 'App client is ready' });
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /inbox/i }),
    ).not.toBeInTheDocument();
  });

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
      within(sidebar())
        .getByRole('link', { name: 'Orders' })
        .querySelector('svg'),
    ).toBeNull();
    expect(
      within(sidebar()).getByRole('link', { name: 'Orders' }),
    ).toHaveAttribute('aria-current', 'page');
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
    expect(await findSidebarLink('Orders')).toHaveAttribute('href', '/orders');
    const toggle = screen.getByRole('button', { name: 'Orders' });
    fireEvent.click(toggle);
    expect(
      within(sidebar()).queryByRole('link', { name: 'Reports' }),
    ).not.toBeInTheDocument();
    expect(
      within(sidebar()).getByRole('link', { name: 'Orders' }),
    ).toBeVisible();
    fireEvent.click(toggle);
    fireEvent.click(within(sidebar()).getByRole('link', { name: 'Reports' }));
    expect(await screen.findByText('Reports page')).toBeVisible();
    expect(screen.getByText('Orders layout')).toBeVisible();
  });

  it('collapses and expands the desktop navigation', async () => {
    renderApplication('/', true);

    const sidebar = await screen.findByRole('complementary', {
      name: 'Application navigation',
    });

    // The toggle writes the shared sidebar preference, an external store the shell only re-renders from once its
    // subscription effect has run; after a lazily loaded mount that effect can still be pending when the click lands,
    // so the collapsed shell is awaited rather than read synchronously.
    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse navigation' }),
    );
    await waitFor(() =>
      expect(sidebar.closest('[data-state]')).toHaveAttribute(
        'data-state',
        'collapsed',
      ),
    );
    expect(
      await screen.findByRole('button', { name: 'Expand navigation' }),
    ).toHaveAttribute('aria-pressed', 'true');
    // The footer keeps only its shield; focusing it shows the slogan and version.
    const footerIcon = screen.getByRole('img', {
      name: 'AI + NocoBase Build reliable business systems Based on the Enterprise template v1.2.3',
    });
    act(() => footerIcon.focus());
    expect(
      await screen.findByText('Based on the Enterprise template v1.2.3', {
        selector: '[data-slot="tooltip-content"] span',
      }),
    ).toBeVisible();

    expect(
      screen.getByText('AI + NocoBase', {
        selector: '[data-slot="tooltip-content"] span',
      }),
    ).toBeVisible();
    expect(
      screen.getByText('Build reliable business systems', {
        selector: '[data-slot="tooltip-content"] span',
      }),
    ).toBeVisible();

    // The edge rail switches the mode back.
    fireEvent.click(
      screen.getByRole('button', { name: 'Expand or collapse navigation' }),
    );
    await waitFor(() =>
      expect(sidebar.closest('[data-state]')).toHaveAttribute(
        'data-state',
        'expanded',
      ),
    );
    expect(
      screen.queryByRole('img', { name: /AI \+ NocoBase/ }),
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
    const drawer = await screen.findByRole('dialog', {
      name: 'Application navigation',
    });
    expect(drawer).toBeVisible();
    expect(
      within(drawer).getByText('Based on the Enterprise template v1.2.3'),
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
    expect(
      screen.queryByRole('button', { name: 'Theme' }),
    ).not.toBeInTheDocument();
  });

  it('redirects a signed-out visitor from a standalone page to sign in', async () => {
    const route = standaloneReport();
    renderApplication('/report?format=print', false, [
      route,
      createRoute('login', '/login', 'guest', () => {
        const { pathname, search } = useLocation();
        return <p>{pathname + search}</p>;
      }),
    ]);

    expect(await screen.findByText(/^\/login\?/)).toHaveTextContent(
      encodeURIComponent('/report?format=print'),
    );
    expect(route.componentLoader).not.toHaveBeenCalled();
  });

  it('denies access to a protected standalone page before loading it', async () => {
    const route = standaloneReport();
    renderApplication('/report', true, [route], {
      authorization: { can: async () => false },
    });

    expect(
      await screen.findByRole('heading', { name: 'Access denied' }),
    ).toBeVisible();
    expect(route.componentLoader).not.toHaveBeenCalled();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('shows the standalone page and restores the application shell on an ordinary route', async () => {
    const route = standaloneReport();
    renderApplication('/report', true, [route], {
      authorization: { can: async () => true },
    });

    expect(
      await screen.findByRole('heading', { name: 'Print report' }),
    ).toBeVisible();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Application navigation' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to home' }));
    expect(await screen.findByText('App client is ready')).toBeVisible();
    expect(screen.getByRole('banner')).toBeVisible();
    expect(
      screen.getByRole('complementary', { name: 'Application navigation' }),
    ).toBeVisible();
  });

  it('lets a child page of a standalone page go back without the application shell', async () => {
    const parent = standaloneReport();
    const child = {
      ...createRoute('report-detail', '/report/detail', 'required', () => (
        <>
          <h2>Report detail</h2>
          <BackButton />
        </>
      )),
      layout: 'none' as const,
    };
    const page = {
      ...parent,
      componentLoader: async () => ({
        default: () => (
          <>
            <h2>Print report</h2>
            <Outlet />
          </>
        ),
      }),
      children: [child],
    };
    renderApplication('/report/detail', true, [page], {
      authorization: { can: async () => true },
    });

    const back = await screen.findByRole('link', { name: 'Back' });
    expect(
      screen.getByRole('heading', { name: 'Report detail' }),
    ).toBeVisible();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('complementary', { name: 'Application navigation' }),
    ).not.toBeInTheDocument();
    fireEvent.click(back);
    expect(
      await screen.findByRole('heading', { name: 'Print report' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Report detail' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });
});

function standaloneReport() {
  const report = createRoute('report', '/report', 'required', () => (
    <>
      <h2>Print report</h2>
      <Link to='/'>Back to home</Link>
    </>
  ));
  return {
    ...report,
    layout: 'none' as const,
    authz: { resource: { type: 'page', id: 'report' }, action: 'access' },
    componentLoader: vi.fn(report.componentLoader),
  };
}

function renderApplication(
  initialEntry: string,
  authenticated: boolean,
  routes: readonly AppClientRegisteredRoute[] = [],
  options: {
    readonly authorization?: Pick<AuthorizationClient, 'can'>;
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
    runtime: { headerActions: [], routes: clientRoutes },
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
            <SidebarPreferenceProvider
              value={createAppSidebarPreferenceStore('/main')}
            >
              <NavigationGuardProvider>
                <AppRouter clientRoutes={clientRoutes} />
              </NavigationGuardProvider>
            </SidebarPreferenceProvider>
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
            session: { id: 'session-1' },
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
