import type {
  AppClientRegisteredRoute,
  AppClientRegisteredSetting,
  AppClientRegisteredSettingGroup,
  AppClientSettingIcon,
} from '@nocobase/app-client/plugins';
import {
  ClientApplicationContext,
  apiClientToken,
  realtimeClientToken,
  type ClientApplication,
} from '@nocobase/app-client';
import {
  AuthenticationProvider,
  authenticationClientToken,
} from '@nocobase/app-plugin-authentication/client';
import {
  AuthorizationClient,
  authorizationClientToken,
} from '@nocobase/app-plugin-authorization/client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Outlet, useParams } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from '../../client/routing/app-router.tsx';
import { HeaderActions } from '../../client/layouts/components/header-actions.tsx';
import { AppThemeProvider } from '../../client/theme/index.ts';

function WorkflowDetailTestPage(): ReactElement {
  return <h2>Workflow detail {useParams().workflowId}</h2>;
}

// Loading a lazy route and rendering its error boundary can take longer than Testing Library's one-second default on
// a loaded CI runner. A page that never renders still fails, well inside the 30-second test timeout.
const ROUTE_LOAD_TIMEOUT = { timeout: 10_000 };

describe('settings centre', () => {
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

  it.each(['settings', 'dev'] as const)(
    'opens a healthy %s page after another page fails to load',
    async (surface) => {
      const broken: AppClientRegisteredRoute = {
        id: 'broken',
        name: 'broken',
        path: `/${surface}/broken`,
        auth: 'required',
        authz: 'skip',
        packageName: 'test',
        source: 'application',
        navigation: { title: 'Broken page' },
        componentLoader: async () => {
          throw new Error('Module unavailable');
        },
      };
      const healthy: AppClientRegisteredRoute = {
        ...broken,
        id: 'healthy',
        name: 'healthy',
        path: `/${surface}/healthy`,
        navigation: { title: 'Healthy page' },
        componentLoader: async () => ({
          default: () => <h2>Healthy content</h2>,
        }),
      };
      const tree = [broken, healthy];
      renderApp(
        <AppRouter
          clientRoutes={[]}
          settingsRouteTree={surface === 'settings' ? tree : []}
          devRouteTree={surface === 'dev' ? tree : []}
        />,
        broken.path,
        surface === 'settings' ? tree : [],
      );
      expect(
        await screen.findByText('Unable to load page', {}, ROUTE_LOAD_TIMEOUT),
      ).toBeVisible();
      fireEvent.click(screen.getByRole('link', { name: 'Healthy page' }));
      expect(
        await screen.findByText('Healthy content', {}, ROUTE_LOAD_TIMEOUT),
      ).toBeVisible();
      expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
    },
  );

  it('shows the Settings entry when enabled by its layout', async () => {
    renderApp(
      <HeaderActions showSettings showDev />,
      '/',
      toRouteTree(SETTINGS, GROUPS),
    );

    expect(
      await screen.findByRole('link', { name: 'Settings' }),
    ).toHaveAttribute('href', '/settings');
  });

  it('renders the requested setting with a grouped navigation of the rest', async () => {
    renderSettings('/settings/authorization/default-access');

    expect(await screen.findByText('Default Access page')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeVisible();
    expect(screen.getByText('Authorization')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Workflow General' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: 'Default Access' })[0],
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getAllByRole('link', { name: 'Permission Sets' })[0],
    ).not.toHaveAttribute('aria-current');
    expect(
      screen.getAllByRole('link', { name: 'Back to app' })[0],
    ).toHaveAttribute('href', '/');
  });

  it('keeps both header entries visible inside settings', async () => {
    renderSettings('/settings/authorization/permission-sets');
    await screen.findByText('Permission Sets page');

    expect(
      await screen.findByRole('button', { name: 'Appearance' }),
    ).toBeVisible();
    // The account menu exposes user details in its panel without a native tooltip.
    expect(
      await screen.findByRole('button', { name: 'Open account menu' }),
    ).not.toHaveAttribute('title');
    expect(screen.getByRole('link', { name: 'Settings' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Component examples' }),
    ).toHaveAttribute('href', '/dev');
    expect(
      screen.getAllByRole('link', { name: 'Back to app' })[0],
    ).toHaveAttribute('href', '/');
  });

  it('hides the Settings entry in dev tools when no settings are registered', async () => {
    const devRoute: AppClientRegisteredSetting = {
      id: 'playground',
      authz: 'skip',
      navigation: true,
      packageName: '@nocobase/app-plugin-test',
      pageLoader: async () => ({
        default: (): ReactElement => <h2>Playground page</h2>,
      }),
      path: '/dev/playground',
      source: 'plugin',
      surface: 'dev',
      title: 'Playground',
    };

    renderApp(
      <AppRouter
        devRouteTree={toRouteTree([devRoute], [])}
        clientRoutes={[]}
        settingsRouteTree={[]}
      />,
      '/dev/playground',
    );

    expect(await screen.findByText('Playground page')).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Component examples' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Settings' }),
    ).not.toBeInTheDocument();
  });

  it('renders the icon a setting declares, and copes with one that declares none', async () => {
    renderSettings('/settings/authorization/permission-sets');
    await screen.findByText('Permission Sets page');

    const iconOf = (name: string) =>
      screen
        .getAllByRole('link', { name })[0]
        .querySelector('[data-testid="setting-icon"]');

    expect(iconOf('Permission Sets')).toBeInTheDocument();
    expect(iconOf('Default Access')).not.toBeInTheDocument();
  });

  it('opens the group holding the current page and collapses it on demand', async () => {
    renderSettings('/settings/authorization/default-access');
    await screen.findByText('Default Access page');

    const group = screen.getByText('Authorization').closest('details');
    expect(group).toHaveAttribute('open');

    fireEvent.click(screen.getByText('Authorization'));
    expect(group).not.toHaveAttribute('open');
  });

  it('renders an ungrouped page as a flat row rather than a disclosure', async () => {
    renderSettings('/settings/workflow');
    await screen.findByText('Workflow General page');

    const link = screen.getAllByRole('link', { name: 'Workflow General' })[0];
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.closest('details')).toBeNull();
  });

  it('renders a nested detail route inside settings and keeps its parent selected', async () => {
    renderSettings('/settings/workflow/item-1', undefined, SETTINGS, GROUPS, [
      {
        auth: 'required',
        authz: 'skip',
        id: '@nocobase/app-plugin-test:workflow-detail',
        name: 'workflow-detail',
        packageName: '@nocobase/app-plugin-test',
        path: '/settings/workflow/:workflowId',
        source: 'plugin',
        componentLoader: async () => ({
          default: WorkflowDetailTestPage,
        }),
      },
    ]);

    expect(await screen.findByText('Workflow detail item-1')).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: 'Workflow General' })[0],
    ).toHaveAttribute('aria-current', 'page');
  });

  it('retains the default App permission for pages mounted inside settings', async () => {
    const loader = vi.fn(async () => ({ default: () => <h3>App overlay</h3> }));
    renderSettings(
      '/settings/overlay',
      { can: async ({ resource }) => resource.id !== 'overlay' },
      [],
      [],
      [
        {
          auth: 'required',
          authz: {
            resource: { type: 'page', id: 'overlay' },
            action: 'access',
          },
          id: 'overlay',
          name: 'overlay',
          packageName: 'test',
          source: 'plugin',
          path: '/settings/overlay',
          componentLoader: loader,
        },
      ],
    );
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(loader).not.toHaveBeenCalled();
  });

  it.each([
    { unrestricted: false, opens: false },
    { unrestricted: true, opens: true },
  ])(
    'opens and lists an unrestricted-only page only for unrestricted identities: %j',
    async ({ unrestricted, opens }) => {
      const loader = vi.fn(async () => ({
        default: () => <h3>Root only content</h3>,
      }));
      const page = (
        name: string,
        authz: AppClientRegisteredRoute['authz'],
        componentLoader: AppClientRegisteredRoute['componentLoader'],
      ): AppClientRegisteredRoute => ({
        auth: 'required',
        authz,
        id: name,
        name,
        packageName: 'test',
        source: 'plugin',
        path: `/settings/${name}`,
        navigation: { title: name },
        componentLoader,
      });
      const snapshot = new AuthorizationClient({
        request: async () => ({ data: { unrestricted, permissions: [] } }),
      } as never);
      renderSettings(
        '/settings/root-only',
        { can: (requirement) => snapshot.can(requirement) },
        [],
        [],
        [],
        [
          page('open', 'skip', async () => ({ default: () => null })),
          page('root-only', 'unrestricted', loader),
        ],
      );
      expect(await screen.findByRole('link', { name: 'open' })).toBeVisible();
      if (opens) {
        expect(await screen.findByText('Root only content')).toBeVisible();
        expect(screen.getByRole('link', { name: 'root-only' })).toBeVisible();
      } else {
        // Hidden from the menu, so the settings centre moves on to a page the user may open.
        await waitFor(() =>
          expect(screen.getByRole('link', { name: 'open' })).toHaveAttribute(
            'aria-current',
            'page',
          ),
        );
        expect(
          screen.queryByRole('link', { name: 'root-only' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Root only content')).not.toBeInTheDocument();
        expect(loader).not.toHaveBeenCalled();
      }
    },
  );

  it('denies an unrestricted-only page opened by URL to anyone else', async () => {
    const loader = vi.fn(async () => ({ default: () => <h3>Root page</h3> }));
    const snapshot = new AuthorizationClient({
      request: async () => ({ data: { unrestricted: false, permissions: [] } }),
    } as never);
    renderSettings(
      '/settings/root-page',
      { can: (requirement) => snapshot.can(requirement) },
      [],
      [],
      [
        {
          auth: 'required',
          authz: 'unrestricted',
          id: 'root-page',
          name: 'root-page',
          packageName: 'test',
          source: 'plugin',
          path: '/settings/root-page',
          componentLoader: loader,
        },
      ],
    );
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(loader).not.toHaveBeenCalled();
  });

  it('does not bypass a denied parent when its child skips authorization', async () => {
    const parentLoader = vi.fn(async () => ({ default: () => <Outlet /> }));
    const childLoader = vi.fn(async () => ({
      default: () => <h3>Skipped child</h3>,
    }));
    const parent: AppClientRegisteredRoute = {
      auth: 'required',
      authz: { resource: { type: 'page', id: 'parent' }, action: 'access' },
      id: 'parent',
      name: 'parent',
      path: '/settings/parent',
      packageName: 'test',
      source: 'plugin',
      componentLoader: parentLoader,
      children: [
        {
          auth: 'required',
          authz: 'skip',
          id: 'child',
          name: 'child',
          path: '/settings/parent/child',
          packageName: 'test',
          source: 'plugin',
          navigation: { title: 'Skipped child' },
          componentLoader: childLoader,
        },
      ],
    };
    renderSettings(
      '/settings/parent/child',
      { can: async () => false },
      [],
      [],
      [],
      [parent],
    );
    expect(await screen.findByText('No settings available')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Skipped child' }),
    ).not.toBeInTheDocument();
    expect(parentLoader).not.toHaveBeenCalled();
    expect(childLoader).not.toHaveBeenCalled();
  });

  it('keeps the parent layout when a nested page denies access', async () => {
    const loader = vi.fn(async () => ({
      default: () => <h3>Secret child</h3>,
    }));
    const parent: AppClientRegisteredRoute = {
      auth: 'required',
      authz: 'skip',
      id: 'parent',
      name: 'parent',
      packageName: 'test',
      source: 'plugin',
      path: '/settings/parent',
      navigation: { title: 'Parent' },
      componentLoader: async () => ({
        default: () => (
          <>
            <h2>Parent layout</h2>
            <Outlet />
          </>
        ),
      }),
      children: [
        {
          auth: 'required',
          id: 'child',
          name: 'child',
          packageName: 'test',
          source: 'plugin',
          path: '/settings/parent/child',
          authz: { resource: { type: 'page', id: 'secret' }, action: 'access' },
          componentLoader: loader,
        },
      ],
    };
    renderSettings(
      '/settings/parent/child',
      { can: async ({ resource }) => resource.id !== 'secret' },
      [],
      [],
      [],
      [parent],
    );
    expect(await screen.findByText('Access denied')).toBeVisible();
    expect(screen.getByText('Parent layout')).toBeVisible();
    expect(loader).not.toHaveBeenCalled();
  });

  it('keeps developer pages inside their surface when wrapped in a pathless App group', async () => {
    renderSettings(
      '/settings/grouped',
      undefined,
      [],
      [],
      [
        {
          auth: 'required',
          authz: 'skip',
          id: 'group',
          name: 'group',
          path: '/',
          source: 'plugin',
          packageName: 'test',
          children: [
            {
              auth: 'required',
              authz: 'skip',
              id: 'page',
              name: 'page',
              path: '/settings/grouped',
              source: 'plugin',
              packageName: 'test',
              componentLoader: async () => ({
                default: () => <h2>Grouped surface page</h2>,
              }),
            },
          ],
        },
      ],
    );
    expect(await screen.findByText('Grouped surface page')).toBeVisible();
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeVisible();
  });

  it('drops a group whose every page the user is denied', async () => {
    renderSettings('/settings', {
      can: async ({ resource }) =>
        !(
          resource.type === 'settings' &&
          resource.id.startsWith('authorization.')
        ),
    });

    expect(await screen.findByText('Workflow General page')).toBeVisible();
    expect(screen.queryByText('Authorization')).not.toBeInTheDocument();
  });

  it('shows a group icon beside its title', async () => {
    renderSettings('/settings/authorization/default-access');
    await screen.findByText('Default Access page');

    expect(
      screen
        .getByText('Authorization')
        .closest('summary')
        ?.querySelector('[data-testid="setting-icon"]'),
    ).toBeInTheDocument();
  });

  it('redirects /settings itself to the first setting the user can open', async () => {
    renderSettings('/settings');

    expect(await screen.findByText('Permission Sets page')).toBeVisible();
  });

  it('sends an unknown settings path to the first accessible setting', async () => {
    renderSettings('/settings/nothing/here');

    expect(await screen.findByText('Permission Sets page')).toBeVisible();
  });

  it('hides a setting the authorization client denies, and does not land on it', async () => {
    renderSettings('/settings/authorization/permission-sets', {
      can: async ({ resource }) =>
        resource.id !== 'authorization.permission-sets',
    });

    // The denied setting is neither reachable directly nor listed, so the redirect falls through to the next one.
    expect(await screen.findByText('Default Access page')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Permission Sets' }),
    ).not.toBeInTheDocument();
  });

  it('treats a client that throws as a denial', async () => {
    renderSettings('/settings/authorization/permission-sets', {
      can: async ({ resource }) => {
        if (resource.id === 'authorization.permission-sets') {
          throw new Error('provider unavailable');
        }
        return true;
      },
    });

    expect(await screen.findByText('Default Access page')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Permission Sets' }),
    ).not.toBeInTheDocument();
  });

  it('explains itself when every setting is denied', async () => {
    renderSettings(
      '/settings',
      { can: async () => false },
      SETTINGS.filter((setting) => setting.authz !== 'skip'),
    );

    expect(
      await screen.findByRole('heading', { name: 'No settings available' }),
    ).toBeVisible();
  });

  it('leaves a setting without an access rule visible even when the provider denies everything', async () => {
    renderSettings('/settings', { can: async () => false });

    // `workflow/general` declares no access rule, so reaching the settings centre is the only check it has.
    expect(await screen.findByText('Workflow General page')).toBeVisible();
  });

  it('keeps ungoverned settings visible when no plugin registered a provider', async () => {
    renderSettings(
      '/settings',
      undefined,
      [createSetting('general', 'General')],
      [],
    );

    expect(await screen.findByText('General page')).toBeVisible();
  });

  it('navigates from the small-screen select without reloading the page', async () => {
    renderSettings('/settings/authorization/permission-sets');
    await screen.findByText('Permission Sets page');

    fireEvent.change(screen.getByLabelText('Settings page'), {
      target: { value: '/settings/workflow' },
    });

    expect(await screen.findByText('Workflow General page')).toBeVisible();
  });

  it('builds nav entries in declaration order, emitting each group once', () => {
    const first = createSetting('a', 'A', 'g1');
    const second = createSetting('b', 'B');
    const third = createSetting('c', 'C', 'g1');
    const group: AppClientRegisteredSettingGroup = {
      id: 'g1',
      packageName: '@nocobase/app-plugin-test',
      settings: [first, third],
      source: 'plugin',
      title: 'Group One',
    };

    expect(
      buildNavEntries([first, second, third], [group]).map((entry) =>
        entry.kind === 'group'
          ? ['group', entry.group.settings.map((s) => s.id)]
          : ['page', entry.setting.id],
      ),
    ).toEqual([
      ['group', ['a', 'c']],
      ['page', 'b'],
    ]);
  });

  it('renders a page flat when it names a group nobody registered', () => {
    const orphan = createSetting('a', 'A', 'missing');

    expect(buildNavEntries([orphan], [])).toEqual([
      { kind: 'page', setting: orphan },
    ]);
  });
});

const ICON: AppClientSettingIcon = ({ className }) => (
  <svg className={className} data-testid='setting-icon' />
);

const AUTHORIZATION: AppClientRegisteredSettingGroup = {
  icon: ICON,
  id: 'authorization',
  packageName: '@nocobase/app-plugin-test',
  settings: [
    createSetting(
      'permission-sets',
      'Permission Sets',
      'authorization',
      'authorization.permission-sets',
      ICON,
    ),
    createSetting(
      'default-access',
      'Default Access',
      'authorization',
      'authorization.default-access',
    ),
  ],
  source: 'plugin',
  surface: 'settings',
  title: 'Authorization',
};

// A group's pages are also in the flat list; that is what the router mounts.
const SETTINGS: readonly AppClientRegisteredSetting[] = [
  ...AUTHORIZATION.settings,
  createSetting('workflow', 'Workflow General'),
];

const GROUPS: readonly AppClientRegisteredSettingGroup[] = [AUTHORIZATION];

function renderSettings(
  initialEntry: string,
  authorization?: Pick<AuthorizationClient, 'can'>,
  settings: readonly AppClientRegisteredSetting[] = SETTINGS,
  groups: readonly AppClientRegisteredSettingGroup[] = GROUPS,
  routes: readonly AppClientRegisteredRoute[] = [],
  tree?: readonly AppClientRegisteredRoute[],
): void {
  const settingsRouteTree = tree ?? toRouteTree(settings, groups);
  renderWithAuthentication(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppThemeProvider>
        <AppRouter
          devRouteTree={[]}
          clientRoutes={routes}
          settingsRouteTree={settingsRouteTree}
        />
      </AppThemeProvider>
    </MemoryRouter>,
    settingsRouteTree,
    authorization,
  );
}

/** Renders a router subtree the way renderSettings does, for a surface other than the settings centre. */
function renderApp(
  element: ReactElement,
  initialEntry: string,
  settingsRouteTree: readonly AppClientRegisteredRoute[] = [],
): void {
  renderWithAuthentication(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AppThemeProvider>{element}</AppThemeProvider>
    </MemoryRouter>,
    settingsRouteTree,
  );
}

function renderWithAuthentication(
  element: ReactElement,
  settingsRouteTree: readonly AppClientRegisteredRoute[],
  authorization?: Pick<AuthorizationClient, 'can'>,
): void {
  const authClient = {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: null,
        user: {
          email: 'alice@example.com',
          id: '1',
          image: null,
          name: 'Alice',
        },
      },
    }),
    signOut: vi.fn().mockResolvedValue({ data: null }),
  };
  const authorizationClient = new AuthorizationClient({
    request: vi.fn(),
  } as never);
  const apiClient = { request: vi.fn().mockResolvedValue({ count: 0 }) };
  const realtimeClient = {
    subscribe: vi.fn(() => vi.fn()),
    onOpen: vi.fn(() => vi.fn()),
  };
  vi.spyOn(authorizationClient, 'can').mockImplementation(
    (request) => authorization?.can(request) ?? Promise.resolve(true),
  );
  const registered = new Map<unknown, unknown>([
    [apiClientToken, apiClient],
    [realtimeClientToken, realtimeClient],
    [authenticationClientToken, authClient],
    [authorizationClientToken, authorizationClient],
  ]);
  const app = {
    runtime: { settingsRouteTree },
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
      <AuthenticationProvider>{element}</AuthenticationProvider>
    </ClientApplicationContext.Provider>,
  );
}

function createSetting(
  id: string,
  title: string,
  groupId?: string,
  accessResource?: string,
  icon?: AppClientSettingIcon,
): AppClientRegisteredSetting {
  return {
    ...(accessResource === undefined
      ? { authz: 'skip' as const }
      : {
          authz: {
            resource: { type: 'settings', id: accessResource },
            action: 'read',
          },
        }),
    ...(icon === undefined ? {} : { icon }),
    ...(groupId === undefined ? {} : { groupId }),
    id,
    packageName: '@nocobase/app-plugin-test',
    pageLoader: async () => ({
      default: (): ReactElement => <h2>{title} page</h2>,
    }),
    path:
      groupId === undefined ? `/settings/${id}` : `/settings/${groupId}/${id}`,
    source: 'plugin',
    surface: 'settings',
    title,
  };
}

function toRouteTree(
  settings: readonly AppClientRegisteredSetting[],
  groups: readonly AppClientRegisteredSettingGroup[],
): AppClientRegisteredRoute[] {
  const page = (
    setting: AppClientRegisteredSetting,
  ): AppClientRegisteredRoute => ({
    id: setting.id,
    name: setting.id,
    path: setting.path,
    auth: 'required',
    packageName: setting.packageName,
    source: setting.source,
    componentLoader: setting.pageLoader,
    authz: setting.authz,
    ...(setting.navigation !== false
      ? { navigation: { title: setting.title, icon: setting.icon } }
      : {}),
  });
  return buildNavEntries(settings, groups)
    .map((entry): AppClientRegisteredRoute =>
      entry.kind === 'page'
        ? page(entry.setting)
        : {
            id: entry.group.id,
            name: entry.group.id,
            path: '/settings',
            auth: 'required',
            authz: 'skip',
            packageName: entry.group.packageName,
            source: entry.group.source,
            navigation: { title: entry.group.title, icon: entry.group.icon },
            children: entry.group.settings.map(page),
          },
    )
    .concat(
      settings.filter((setting) => setting.navigation === false).map(page),
    );
}

type SurfaceNavEntry =
  | { kind: 'group'; group: AppClientRegisteredSettingGroup }
  | { kind: 'page'; setting: AppClientRegisteredSetting };

export function buildNavEntries(
  visible: readonly AppClientRegisteredSetting[],
  groups: readonly AppClientRegisteredSettingGroup[],
): readonly SurfaceNavEntry[] {
  const visiblePaths = new Set(
    visible
      .filter((setting) => setting.navigation !== false)
      .map((setting) => setting.path),
  );
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const entries: SurfaceNavEntry[] = [];
  const seenGroups = new Set<string>();

  for (const setting of visible) {
    if (setting.navigation === false) {
      continue;
    }
    if (setting.groupId === undefined) {
      entries.push({ kind: 'page', setting });
      continue;
    }
    if (seenGroups.has(setting.groupId)) {
      continue;
    }
    const group = groupsById.get(setting.groupId);
    if (!group) {
      // A page naming a group nobody registered still has to be reachable, so it renders flat rather than vanishing.
      entries.push({ kind: 'page', setting });
      continue;
    }
    seenGroups.add(group.id);
    entries.push({
      kind: 'group',
      group: {
        ...group,
        settings: group.settings.filter((child) =>
          visiblePaths.has(child.path),
        ),
      },
    });
  }

  return entries;
}
