import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import applicationRoutes from '../../client/routes.js';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRouteNavigation,
  routeKey,
} from '../../client/routing/route-navigation';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu';
import { AppSidebarProvider } from '../../client/layouts/components/app-sidebar';

const sidebarPreference = createAppSidebarPreferenceStore('/main');

const auth = vi.hoisted(() => ({ revision: 0, client: { can: vi.fn() } }));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationClient: () => auth.client,
  useAuthorizationRevision: () => auth.revision,
}));
vi.mock('@nocobase/i18n/client', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
beforeEach(() => {
  auth.revision = 0;
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
function Menu({
  entries = routes,
}: {
  readonly entries?: readonly AppClientRegisteredRoute[];
}) {
  const { items } = useRouteNavigation(entries);
  return (
    <NavigationMenu
      items={items}
      label='Navigation'
      selectedKey={routeKey(visible)}
    />
  );
}
describe.each(['expanded', 'collapsed', 'mobile'])(
  'permissions in %s navigation',
  (mode) => {
    it('hides pending and denied entries, removes empty groups, and refreshes open menus', async () => {
      if (mode === 'mobile') vi.stubGlobal('innerWidth', 390);
      if (mode === 'collapsed')
        localStorage.setItem('nocobase:sidebar:collapsed:app:/main', 'true');
      const resolve: ((allowed: boolean) => void)[] = [];
      auth.client.can.mockImplementation(
        () => new Promise<boolean>((done) => resolve.push(done)),
      );
      const tree = () => (
        <MemoryRouter>
          <SidebarPreferenceProvider value={sidebarPreference}>
            <AppSidebarProvider>
              <Menu />
            </AppSidebarProvider>
          </SidebarPreferenceProvider>
        </MemoryRouter>
      );
      const { rerender } = render(tree());
      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      await act(async () => {
        resolve.forEach((done, i) => done(i === 0));
      });
      // Group is a section: its entries show in every mode, as icons in the collapsed sidebar.
      expect(
        await screen.findByRole('link', { name: 'Allowed' }),
      ).toHaveAttribute('href', '/Allowed');
      expect(screen.queryByText('Denied')).not.toBeInTheDocument();
      expect(screen.queryByText('Empty')).not.toBeInTheDocument();
      auth.client.can.mockResolvedValue(false);
      auth.revision++;
      rerender(tree());
      await waitFor(() =>
        expect(screen.queryByText('Group')).not.toBeInTheDocument(),
      );
      expect(
        screen.queryByRole('link', { name: 'Allowed' }),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
);

const agentsRoutes = resolveAppClientContributions([
  {
    packageName: '@nocobase/app-template-examples',
    source: 'application',
    routes: [
      {
        ...applicationRoutes[0],
        routes: applicationRoutes[0].routes.filter(
          (route) => route.name === 'agentsNavigation',
        ),
      },
    ],
  },
]).routes;

it.each(['agents', 'runtimes', 'agents.services', null])(
  'shows only the permitted Agents settings entry for %s',
  async (allowed) => {
    auth.client.can.mockImplementation(
      async (requirement) => requirement.resource.id === allowed,
    );
    render(
      <MemoryRouter basename='/example' initialEntries={['/example/']}>
        <SidebarPreferenceProvider value={sidebarPreference}>
          <AppSidebarProvider>
            <Menu entries={agentsRoutes} />
          </AppSidebarProvider>
        </SidebarPreferenceProvider>
      </MemoryRouter>,
    );
    if (allowed) {
      const name = allowed === 'agents.services' ? 'models' : allowed;
      expect(
        await screen.findByRole('link', { name: `onlineAgent.${name}` }),
      ).toHaveAttribute('href', `/example/${name}`);
    }
    await waitFor(() => {
      expect(screen.queryAllByRole('link')).toHaveLength(allowed ? 3 : 2);
    });
    for (const name of ['agents', 'runtimes', 'models']) {
      const resource = name === 'models' ? 'agents.services' : name;
      if (resource !== allowed)
        expect(
          screen.queryByRole('link', { name: `onlineAgent.${name}` }),
        ).not.toBeInTheDocument();
    }
    expect(screen.getByText('onlineAgent.group')).toBeInTheDocument();
    for (const name of ['structuredExtraction', 'aiTranslation']) {
      expect(
        screen.getByRole('link', { name: `${name}.title` }),
      ).toBeInTheDocument();
    }
  },
);
