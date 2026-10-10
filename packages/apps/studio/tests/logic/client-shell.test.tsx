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
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';
import { Outlet, MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from '../../client/routing/app-router.tsx';
import { AppThemeProvider } from '../../client/theme/index.ts';

// Chat and inbox navigation need services these tests do not provide; their dedicated tests cover those behaviors.
vi.mock(
  '@nocobase/app-plugin-agents/client/chat',
  () => import('../setup/agents-chat-stub.js'),
);
vi.mock(
  '../../client/agents/chat.js',
  () => import('../setup/agents-chat-stub.js'),
);
vi.mock('../../client/inbox/navigation.js', () => ({
  useInboxNavigation: () => ({ badge: null, label: 'Inbox', hint: 'Inbox' }),
}));

/** The sidebar's navigation; the header's breadcrumb names the current page as well. */
const appNav = (): HTMLElement =>
  screen.getByRole('navigation', { name: 'Application navigation' });
const appNavigation = (): Promise<HTMLElement> =>
  screen.findByRole('navigation', { name: 'Application navigation' });

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
    expect(
      within(await appNavigation()).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('aria-current', 'page');
    // The shadcn sidebar, expanded, with the current page marked active.
    expect(document.querySelector('[data-slot=sidebar]')).toHaveAttribute(
      'data-state',
      'expanded',
    );
    expect(
      within(appNav()).getByRole('link', { name: 'Home' }),
    ).toHaveAttribute('data-active');
    expect(within(appNav()).getByRole('link', { name: 'Home' })).toHaveClass(
      'data-active:bg-sidebar-accent',
      'focus-visible:ring-2',
    );
    // The account menu exposes user details in its panel without a native tooltip.
    expect(
      await screen.findByRole('button', { name: 'Open account menu' }),
    ).not.toHaveAttribute('title');
    // Theme and density live in the account menu, not in a header button.
    expect(
      screen.queryByRole('button', { name: 'Appearance' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
    // The sidebar footer names the application and shows its version on a line of its own.
    expect(screen.getByText('Default Template')).toBeVisible();
    expect(screen.getByText('v0.0.0')).toBeVisible();
    expect(screen.queryByText('AI builds freely.')).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'App client is ready' }),
    ).toBeVisible();
  });

  it.each(['/settings', '/settings/workflow/workflows/7'])(
    'does not route the back-office settings (%s): the URL lands on the home page',
    async (path) => {
      // A plugin page registered as an App route under /settings, as the workflow plugin's details are.
      const detail = createRoute(
        'workflow-detail',
        '/settings/workflow/workflows/:id',
        'required',
        () => <h2>Workflow detail</h2>,
      );
      renderApplication(path, true, [detail]);

      expect(
        await screen.findByRole('heading', { name: 'App client is ready' }),
      ).toBeVisible();
      expect(screen.queryByText('Workflow detail')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Settings' }),
      ).not.toBeInTheDocument();
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
      within(appNav())
        .getByRole('link', { name: 'Orders' })
        .querySelector('svg'),
    ).toBeNull();
    expect(
      within(appNav()).getByRole('link', { name: 'Orders' }),
    ).toHaveAttribute('aria-current', 'page');
    // The header's trail names the menu page the detail sits under, the child having no title of its own.
    expect(
      within(screen.getByRole('banner')).getByRole('navigation', {
        name: 'Breadcrumb',
      }),
    ).toHaveTextContent('Orders');
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
    expect(
      within(await appNavigation()).getByRole('link', { name: 'Orders' }),
    ).toHaveAttribute('href', '/orders');
    const toggle = screen.getByRole('button', { name: 'Orders' });
    fireEvent.click(toggle);
    expect(
      within(appNav()).queryByRole('link', { name: 'Reports' }),
    ).not.toBeInTheDocument();
    expect(
      within(appNav()).getByRole('link', { name: 'Orders' }),
    ).toBeVisible();
    fireEvent.click(toggle);
    fireEvent.click(within(appNav()).getByRole('link', { name: 'Reports' }));
    expect(await screen.findByText('Reports page')).toBeVisible();
    expect(screen.getByText('Orders layout')).toBeVisible();
  });

  it('collapses and expands the desktop navigation', async () => {
    renderApplication('/', true);

    await screen.findByRole('navigation', { name: 'Application navigation' });
    const sidebar = document.querySelector('[data-slot=sidebar]');

    fireEvent.click(
      screen.getByRole('button', { name: 'Collapse navigation' }),
    );
    expect(sidebar).toHaveAttribute('data-collapsible', 'icon');
    expect(
      screen.getByRole('button', { name: 'Expand navigation' }),
    ).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
  });

  it('opens and closes the mobile navigation without changing the route', async () => {
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
    // The shadcn sidebar decides it is on a phone from the width.
    window.innerWidth = 500;
    renderApplication('/', true);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Open navigation' }),
    );
    const sheet = await screen.findByRole('dialog');
    expect(
      within(sheet).getByRole('navigation', { name: 'Application navigation' }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    window.innerWidth = 1024;
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
): void {
  const clientRoutes = [
    createRoute('home', '/', 'required', HomePage, 'application'),
    ...routes,
  ];
  const authClient = createTestAuthClient(authenticated);
  const authorizationClient = new AuthorizationClient({
    request: vi.fn(),
  } as never);
  vi.spyOn(authorizationClient, 'can').mockResolvedValue(true);
  const apiClient = {
    request: vi.fn().mockResolvedValue({
      fallback: false,
      locale: 'en-US',
      requestedLocale: 'en-US',
    }),
  };
  const registered = new Map<unknown, unknown>([
    [apiClientToken, apiClient],
    [authenticationClientToken, authClient],
    [authorizationClientToken, authorizationClient],
  ]);
  const app = {
    config: createAppClientConfig({ rawConfig: {} }),
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
            <AppRouter clientRoutes={clientRoutes} />
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
