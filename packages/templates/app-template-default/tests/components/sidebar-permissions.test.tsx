import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useRouteNavigation,
  routeKey,
} from '../../client/routing/route-navigation';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu';
import { AppSidebarProvider } from '../../client/layouts/components/app-sidebar';

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
function Menu() {
  const { items } = useRouteNavigation(routes);
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
        localStorage.setItem('nocobase:sidebar:collapsed', 'true');
      const resolve: ((allowed: boolean) => void)[] = [];
      auth.client.can.mockImplementation(
        () => new Promise<boolean>((done) => resolve.push(done)),
      );
      const tree = () => (
        <MemoryRouter>
          <AppSidebarProvider>
            <Menu />
          </AppSidebarProvider>
        </MemoryRouter>
      );
      const { rerender } = render(tree());
      expect(screen.queryByText('Group')).not.toBeInTheDocument();
      await act(async () => {
        resolve.forEach((done, i) => done(i === 0));
      });
      const user = userEvent.setup();
      if (mode === 'collapsed') {
        await user.hover(await screen.findByRole('button', { name: 'Group' }));
        expect(
          within(await screen.findByRole('dialog')).getByRole('link', {
            name: 'Allowed',
          }),
        ).toHaveAttribute('href', '/Allowed');
      } else {
        expect(
          await screen.findByRole('link', { name: 'Allowed' }),
        ).toBeVisible();
      }
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
