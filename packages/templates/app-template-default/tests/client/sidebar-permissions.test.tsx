import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { act, screen, waitFor } from '@testing-library/react';
import { apiClientToken } from '@nocobase/app-client';
import {
  AuthorizationClient,
  authorizationClientToken,
  type AuthorizationSnapshot,
} from '@nocobase/app-plugin-authorization/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import packageMetadata from '../../package.json' with { type: 'json' };
import enUS from '../../client/locales/en-US.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRouteNavigation,
  routeKey,
} from '../../client/routing/route-navigation';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu';
import { AppSidebarProvider } from '../../client/layouts/components/app-sidebar';

const sidebarPreference = createAppSidebarPreferenceStore('/main');

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());
function page(name: string): AppClientRegisteredRoute {
  return {
    id: name,
    name,
    path: `/${name}`,
    packageName: 'test',
    source: 'application',
    auth: 'required',
    authz: { resource: { type: 'page', id: name }, action: 'access' },
    navigation: { title: name },
    componentLoader: async () => ({ default: () => null }),
  };
}
const visible = page('Allowed');
const hidden = page('Denied');
const routes: AppClientRegisteredRoute[] = [
  { ...page('Group'), componentLoader: undefined, children: [visible, hidden] },
  { ...page('Empty'), componentLoader: undefined, children: [hidden] },
];
function Menu() {
  const { items, loading } = useRouteNavigation(routes);
  return (
    <section aria-label='Permission status' aria-busy={loading}>
      <NavigationMenu
        items={items}
        label='Navigation'
        selectedKey={routeKey(visible)}
      />
    </section>
  );
}
describe.each(['expanded', 'collapsed', 'mobile'])(
  'permissions in %s navigation',
  (mode) => {
    it('hides pending and denied entries, removes empty groups, and refreshes open menus', async () => {
      if (mode === 'mobile') vi.stubGlobal('innerWidth', 390);
      if (mode === 'collapsed')
        localStorage.setItem('nocobase:sidebar:collapsed:app:/main', 'true');
      const response = Promise.withResolvers<{ data: AuthorizationSnapshot }>();
      let permissions: AuthorizationSnapshot = {
        unrestricted: false,
        permissions: [],
      };
      let pending = true;
      const { app } = await renderWithApp(
        <SidebarPreferenceProvider value={sidebarPreference}>
          <AppSidebarProvider>
            <Menu />
          </AppSidebarProvider>
        </SidebarPreferenceProvider>,
        {
          namespace: packageMetadata.name,
          namespaces: {
            [packageMetadata.name]: enUS,
            test: {
              Allowed: 'Allowed',
              Denied: 'Denied',
              Group: 'Group',
              Empty: 'Empty',
            },
          },
          fetch: answerApi(({ path }) =>
            path === 'authorization/permissions'
              ? pending
                ? response.promise
                : { data: permissions }
              : new Response(null, { status: 404 }),
          ),
          services: (app) => {
            app.container.singleton(
              authorizationClientToken,
              (resolver) =>
                new AuthorizationClient(resolver.resolve(apiClientToken)),
            );
          },
        },
      );
      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      await act(async () => {
        permissions = {
          unrestricted: false,
          permissions: [
            { resource: { type: 'page', id: 'Allowed' }, actions: ['access'] },
          ],
        };
        pending = false;
        response.resolve({ data: permissions });
      });
      // Group is a section: its entries show in every mode, as icons in the collapsed sidebar.
      expect(
        await screen.findByRole('link', { name: 'Allowed' }),
      ).toHaveAttribute('href', '/Allowed');
      expect(screen.queryByText('Denied')).not.toBeInTheDocument();
      expect(screen.queryByText('Empty')).not.toBeInTheDocument();
      const allowedPermissions = permissions;
      await act(async () => {
        permissions = { unrestricted: false, permissions: [] };
        const authorization = app.container.resolve(authorizationClientToken);
        authorization.invalidate();
        await authorization.snapshot();
      });
      await waitFor(() =>
        expect(
          screen.getByRole('region', { name: 'Permission status' }),
        ).toHaveAttribute('aria-busy', 'false'),
      );
      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Allowed' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await act(async () => {
        permissions = allowedPermissions;
        const authorization = app.container.resolve(authorizationClientToken);
        authorization.invalidate();
        await authorization.snapshot();
      });
      expect(
        await screen.findByRole('link', { name: 'Allowed' }),
      ).toBeVisible();
    });
  },
);
