import {
  ClientApplicationContext,
  type ClientApplication,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { reactProviders } from '@nocobase/app-plugin-authorization/client/react-providers';
import { ServiceContainer } from '@nocobase/service-provider';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientRoute } from '../../client/routing/client-route.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const AuthorizationProvider = reactProviders[0].component;

const authentication = vi.hoisted(() => ({
  session: null as null | { user: { id: string }; session: { id: string } },
  isPending: false,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => authentication,
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
  NamespaceScope: ({ children }: { children: React.ReactNode }) => children,
}));
const routes: AppClientRegisteredRoute[] = ['apps', 'users'].map((name) => ({
  id: name,
  name,
  path: `/${name}`,
  auth: 'required',
  authz: { resource: { type: 'page', id: name }, action: 'access' },
  packageName: 'test',
  source: 'application',
  navigation: { title: name },
  componentLoader: async () => ({ default: () => <div>{name} content</div> }),
}));
const permissions = (admin: boolean) => ({
  data: {
    permissions: (admin ? ['apps', 'users'] : ['apps']).map((id) => ({
      resource: { type: 'page', id },
      actions: ['access'],
    })),
  },
});
function Menu() {
  const { items, loading } = useRouteNavigation(routes);
  return (
    <nav aria-label='Pages'>
      {loading
        ? 'Checking'
        : items.map(({ route }) => <span key={route.id}>{route.name}</span>)}
    </nav>
  );
}
function session(user: string, id = user) {
  authentication.session = { user: { id: user }, session: { id } };
}
function setup(
  request = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(permissions(authentication.session?.user.id === 'admin')),
    ),
) {
  const client = new AuthorizationClient({ request } as never);
  const container = new ServiceContainer();
  container.instance(authorizationClientToken, client);
  const app = { services: container } as unknown as ClientApplication;
  const tree = () => (
    <ClientApplicationContext.Provider value={app}>
      <MemoryRouter>
        <AuthorizationProvider>
          <Menu />
          <ClientRoute route={routes[1]} />
        </AuthorizationProvider>
      </MemoryRouter>
    </ClientApplicationContext.Provider>
  );
  const view = render(tree());
  return { client, request, rerender: () => view.rerender(tree()) };
}
async function expectMenu(admin: boolean) {
  await waitFor(() =>
    expect(screen.getByRole('navigation', { name: 'Pages' }).textContent).toBe(
      admin ? 'appsusers' : 'apps',
    ),
  );
  if (admin)
    await waitFor(() =>
      expect(screen.getByText('users content')).toBeInTheDocument(),
    );
  else {
    await waitFor(() =>
      expect(screen.getByText('Access denied')).toBeInTheDocument(),
    );
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
  }
}

describe('account permission changes without a browser reload', () => {
  beforeEach(() => {
    authentication.session = null;
    authentication.isPending = false;
  });

  it('updates menus and cached route guards from admin to operator and back', async () => {
    session('admin');
    const view = setup();
    await expectMenu(true);
    session('operator');
    view.rerender();
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
    await expectMenu(false);
    session('admin');
    view.rerender();
    await expectMenu(true);
  });

  it('clears permissions on logout and same-user re-login with a new session', async () => {
    session('admin', 'first');
    const view = setup();
    await expectMenu(true);
    authentication.isPending = true;
    view.rerender();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    authentication.session = null;
    authentication.isPending = false;
    view.rerender();
    await expectMenu(false);
    view.request.mockResolvedValue(permissions(false));
    session('admin', 'second');
    view.rerender();
    await expectMenu(false);
    expect(view.request).toHaveBeenCalledTimes(3);
  });

  it('updates a mounted menu and page when permissions change', async () => {
    session('admin');
    const view = setup();
    await expectMenu(true);
    view.request.mockResolvedValue(permissions(false));
    act(() => view.client.invalidate());
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
    await expectMenu(false);
    view.request.mockResolvedValue(permissions(true));
    act(() => view.client.invalidate());
    await expectMenu(true);
  });

  it('hides previously allowed pages when revalidation fails and recovers on retry', async () => {
    session('admin');
    const view = setup();
    await expectMenu(true);
    view.request.mockRejectedValue(new Error('Offline'));
    act(() => view.client.invalidate());
    await waitFor(() =>
      expect(
        screen.getByRole('navigation', { name: 'Pages' }).textContent,
      ).toBe(''),
    );
    await waitFor(() =>
      expect(screen.getByText('Access denied')).toBeInTheDocument(),
    );
    expect(screen.queryByText('users content')).not.toBeInTheDocument();
    view.request.mockResolvedValue(permissions(true));
    act(() => view.client.invalidate());
    await expectMenu(true);
  });

  it('does not restore admin menus when an old request returns after switching accounts', async () => {
    const old = Promise.withResolvers<ReturnType<typeof permissions>>();
    const request = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockResolvedValue(permissions(false));
    session('admin');
    const view = setup(request);
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    session('operator');
    view.rerender();
    await expectMenu(false);
    await act(async () => {
      old.resolve(permissions(true));
      await old.promise;
    });
    await expectMenu(false);
    expect(request).toHaveBeenCalledTimes(2);
  });
});
