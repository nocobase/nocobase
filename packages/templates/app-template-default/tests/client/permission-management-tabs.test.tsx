import packageMetadata from '../../package.json' with { type: 'json' };
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { RouteLeaveBoundary } from '../../client/routing/route-leave-boundary.js';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import { useSettingsData } from '../../client/pages/settings/hooks.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { useSettingsLeave } from '../../client/pages/settings/hooks.js';
import { BodyPortal } from '../../client/components/body-portal.js';
import { ClientRoute } from '../../client/routing/client-route.js';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { expect, it } from 'vitest';
import { PermissionManagementPage } from '../../client/pages/settings/permission-management-page.js';
import settingsRoutes from '../../client/pages/settings/routes.js';
import shellRoutes from '../../client/pages/settings/shell-routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const renderAuthenticatedClient = createAuthenticatedClientRenderer();

const { routes } = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: [shellRoutes, settingsRoutes],
  },
]);

/** The shell's route tree and permission check, as `AppLayout` provides them. */
function Shell({ children }: { children: ReactNode }) {
  const { denied, loading } = useRouteNavigation(routes);
  return (
    <RouteTreeProvider routes={routes} access={{ denied, loading }}>
      <output aria-label='Permission check'>
        {loading ? 'Checking' : 'Ready'}
      </output>
      <RouteLeaveBoundary hidden={loading}>{children}</RouteLeaveBoundary>
    </RouteTreeProvider>
  );
}

function mount(prefix: string, tab = 'roles', roles = true, locale = 'en-US') {
  return renderAuthenticatedClient(<Shell>{tree(prefix)}</Shell>, {
    route: `${prefix}/${tab}`,
    locale,
    member: true,
    grants: [
      'authorization.default-access',
      ...(roles ? ['authorization.permission-sets'] : []),
    ].map((id) => ({
      resource: { type: 'settings', id },
      actions: [{ action: 'read' }],
    })),
  });
}
function Content({ tab }: { tab: 'roles' | 'default-access' }) {
  const location = useLocation();
  return (
    <PermissionManagementPage tab={tab}>
      <output aria-label='Route'>{location.pathname}</output>
    </PermissionManagementPage>
  );
}
function tree(prefix: string) {
  return (
    <Routes>
      <Route
        path={`${prefix}/roles`}
        element={<Content key='roles' tab='roles' />}
      />
      <Route
        path={`${prefix}/default-access`}
        element={<Content key='default-access' tab='default-access' />}
      />
    </Routes>
  );
}
it.each(['/settings'])(
  'uses two URL-backed tabs under one heading at the existing %s URLs and keeps keyboard focus',
  async (prefix) => {
    const user = userEvent.setup();
    await mount(prefix);
    await screen.findByRole('tab', { name: 'Roles and permissions' });
    expect(
      screen.getByRole('heading', { name: 'Permission management' }),
    ).toBeVisible();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    await user.click(screen.getByRole('tab', { name: 'Default data scopes' }));
    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
        `${prefix}/default-access`,
      ),
    );
    expect(
      screen.getByRole('tab', { name: 'Default data scopes' }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('tabpanel', { name: 'Default data scopes' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Default data scopes' }),
      ).toHaveFocus(),
    );
    await user.keyboard('{ArrowLeft}');
    expect(
      screen.getByRole('tab', { name: 'Roles and permissions' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Roles and permissions' }),
      ).toHaveAttribute('aria-selected', 'true'),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: 'Roles and permissions' }),
      ).toHaveFocus(),
    );
  },
);
it('shows a readable view without a single-tab bar and keeps direct navigation on it', async () => {
  await mount('/settings', 'default-access', false);
  await screen.findByRole('heading', { name: 'Permission management' });
  // The module has one view this viewer may open, so it shows that view without a tab bar.
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
    '/settings/default-access',
  );
});
it('uses the agreed Chinese menu and tab names', async () => {
  await mount('/settings', 'roles', true, 'zh-CN');
  await screen.findByRole('tab', { name: '角色与权限' });
  expect(screen.getByRole('heading', { name: '权限管理' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '角色与权限' })).toBeVisible();
  expect(screen.getByRole('tab', { name: '默认数据范围' })).toBeVisible();
});

function Draft() {
  const [value, setValue] = useState('');
  const leave = useSettingsLeave(value !== '', false);
  return (
    <>
      <input
        aria-label='Draft'
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <BodyPortal>
        <div aria-label='Draft overlay' role='dialog'>
          {value}
        </div>
      </BodyPortal>
      {leave.dialog}
    </>
  );
}

function DraftPage() {
  return (
    <PermissionManagementPage tab='roles'>
      <Draft />
    </PermissionManagementPage>
  );
}

it.each([false, true])(
  'preserves the mounted draft during permission rechecks (page guard: %s)',
  async (guarded) => {
    let hold = false;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const view = await renderAuthenticatedClient(
      <Shell>
        {guarded ? (
          <ClientRoute
            route={{
              id: 'draft',
              name: 'draft',
              path: '/draft',
              auth: 'required',
              authz: 'unrestricted',
              packageName: packageMetadata.name,
              source: 'application',
              componentLoader: async () => ({ default: DraftPage }),
            }}
          />
        ) : (
          <DraftPage />
        )}
      </Shell>,
      {
        route: '/settings/roles',
        beforeRequest: async (request) => {
          if (
            hold &&
            new URL(request.url).pathname.endsWith('/authorization/permissions')
          )
            await pending;
        },
      },
    );
    await screen.findByRole('tab', { name: 'Roles and permissions' });
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    await userEvent.type(draft, 'Keep this unsaved value');
    try {
      hold = true;
      act(() =>
        view.app.container.resolve(authorizationClientToken).invalidate(),
      );
      await waitFor(() =>
        expect(
          screen.getByRole('status', { name: 'Permission check' }),
        ).toHaveTextContent('Checking'),
      );
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
      expect(draft).toBeInTheDocument();
      if (guarded) {
        expect(draft).not.toBeVisible();
        expect(
          screen.queryByRole('dialog', { name: 'Draft overlay' }),
        ).not.toBeInTheDocument();
      }
      expect(draft).toHaveValue('Keep this unsaved value');
    } finally {
      hold = false;
      release();
    }
    await screen.findByRole('tab', { name: 'Roles and permissions' });
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('Keep this unsaved value');
  },
);

it.each(['tab', 'breadcrumb'])(
  'protects an inline module draft when leaving by %s',
  async (destination) => {
    const user = userEvent.setup();
    await renderAuthenticatedClient(
      <Shell>
        <Breadcrumbs />
        <Routes>
          <Route path='/settings/roles' element={<DraftPage />} />
          <Route
            path='/settings/default-access'
            element={<Content tab='default-access' />}
          />
          <Route path='/settings' element={<h1>Settings destination</h1>} />
        </Routes>
      </Shell>,
      { route: '/settings/roles' },
    );
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    await user.type(draft, 'Unsaved inline draft');
    await waitFor(() =>
      expect(
        screen.getByRole('status', { name: 'Permission check' }),
      ).toHaveTextContent('Ready'),
    );
    const target =
      destination === 'tab'
        ? await screen.findByRole('tab', { name: 'Default data scopes' })
        : await screen.findByRole('link', { name: 'System settings' });
    await user.click(target);
    expect(await screen.findByRole('alertdialog')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Cancel', exact: true }),
    );
    expect(draft).toHaveValue('Unsaved inline draft');
    await user.click(target);
    await user.click(
      await screen.findByRole('button', { name: 'Confirm', exact: true }),
    );
    if (destination === 'tab')
      await waitFor(() =>
        expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
          '/settings/default-access',
        ),
      );
    else
      expect(
        await screen.findByRole('heading', { name: 'Settings destination' }),
      ).toBeVisible();
    expect(
      screen.queryByRole('textbox', { name: 'Draft' }),
    ).not.toBeInTheDocument();
  },
);

function HistoryControls() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <button onClick={() => navigate(-1)}>Browser back</button>
      <button onClick={() => navigate('/settings')}>Open settings</button>
      <output aria-label='Current URL'>{location.pathname}</output>
    </>
  );
}
function NestedDraft() {
  const request = useSettingsData<{ data: unknown[] }>('users');
  return (
    <>
      <DraftPage />
      <output aria-label='Loaded users'>
        {request.data ? 'Ready' : 'Loading'}
      </output>
    </>
  );
}
const nestedRoute = {
  id: 'nested-draft',
  name: 'Nested draft',
  path: '/settings/roles/test/edit',
  auth: 'required',
  authz: {
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'read',
  },
  packageName: packageMetadata.name,
  source: 'application',
  componentLoader: async () => ({ default: NestedDraft }),
} as const;
const parentRoute = {
  ...nestedRoute,
  id: 'parent-draft',
  path: '/settings/roles',
  componentLoader: async () => ({ default: Outlet }),
};
function nestedTree() {
  return (
    <Shell>
      <Breadcrumbs />
      <HistoryControls />
      <Routes>
        <Route
          path='/settings'
          element={
            <>
              <h1>Settings destination</h1>
              <Link to='/settings/roles/test/edit'>Edit role</Link>
            </>
          }
        />
        <Route
          path='/settings/roles'
          element={<ClientRoute route={parentRoute} />}
        >
          <Route
            path='test/edit'
            element={<ClientRoute route={nestedRoute} />}
          />
        </Route>
      </Routes>
    </Shell>
  );
}
function beforeUnload() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

it.each(['breadcrumb', 'back'])(
  'protects a nested draft when leaving across a permission recheck: %s',
  async (destination) => {
    const pending = Promise.withResolvers<void>();
    let hold = false;
    const view = await renderAuthenticatedClient(nestedTree(), {
      route: '/settings',
      beforeRequest: (request) =>
        hold && request.url.endsWith('/authorization/permissions')
          ? pending.promise
          : undefined,
    });
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Edit role' }));
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    await user.type(draft, 'Nested unsaved draft');
    hold = true;
    act(() =>
      view.app.container.resolve(authorizationClientToken).invalidate(),
    );
    try {
      await waitFor(() => expect(draft).not.toBeVisible());
      expect(beforeUnload()).toBe(true);
      expect(
        screen.queryByRole('link', { name: 'System settings' }),
      ).not.toBeInTheDocument();
      // Permission-sensitive breadcrumbs are absent during the check. Exercise
      // the same destination through the router, then the real breadcrumb after recovery.
      const leave = async (duringRecheck = false) => {
        await user.click(
          destination === 'breadcrumb'
            ? duringRecheck
              ? screen.getByRole('button', { name: 'Open settings' })
              : await screen.findByRole('link', { name: 'System settings' })
            : screen.getByRole('button', { name: 'Browser back' }),
        );
      };
      await leave(true);
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('status', { name: 'Current URL' }),
      ).toHaveTextContent('/settings/roles/test/edit');
      expect(beforeUnload()).toBe(true);
      hold = false;
      pending.resolve();
      await waitFor(() => expect(draft).toBeVisible());
      expect(draft).toHaveValue('Nested unsaved draft');
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      await leave();
      expect(await screen.findByRole('alertdialog')).toBeVisible();
      await user.click(
        screen.getByRole('button', { name: 'Cancel', exact: true }),
      );
      expect(
        screen.getByRole('status', { name: 'Current URL' }),
      ).toHaveTextContent('/settings/roles/test/edit');
      expect(draft).toHaveValue('Nested unsaved draft');
      expect(beforeUnload()).toBe(true);
      await leave();
      await user.click(
        screen.getByRole('button', { name: 'Confirm', exact: true }),
      );
      expect(
        await screen.findByRole('heading', { name: 'Settings destination' }),
      ).toBeVisible();
      expect(
        screen.getByRole('status', { name: 'Current URL' }),
      ).toHaveTextContent(/^\/settings$/);
      await waitFor(() => expect(beforeUnload()).toBe(false));
    } finally {
      hold = false;
      pending.resolve();
    }
  },
);

it('restores the draft and restarts only the mounted data effect after permission revalidation', async () => {
  const requests: string[] = [];
  const pending = Promise.withResolvers<void>();
  let hold = false;
  const view = await renderAuthenticatedClient(nestedTree(), {
    route: '/settings/roles/test/edit',
    beforeRequest(request) {
      requests.push(new URL(request.url).pathname);
      if (hold && request.url.endsWith('/authorization/permissions'))
        return pending.promise;
    },
  });
  const draft = await screen.findByRole('textbox', { name: 'Draft' });
  await screen.findByText('Ready', { selector: '[aria-label="Loaded users"]' });
  await userEvent.type(draft, 'Retained after cancel');
  const count = (suffix: string) =>
    requests.filter((path) => path.endsWith(suffix)).length;
  const permissions = count('/authorization/permissions');
  const users = count('/users');
  hold = true;
  act(() => view.app.container.resolve(authorizationClientToken).invalidate());
  try {
    await waitFor(() => expect(draft).not.toBeVisible());
    expect(count('/users')).toBe(users);
    expect(
      screen.queryByRole('link', { name: 'System settings' }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Open settings' }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Current URL' }),
    ).toHaveTextContent('/settings/roles/test/edit');
    expect(beforeUnload()).toBe(true);
  } finally {
    hold = false;
    pending.resolve();
  }
  await waitFor(() => expect(draft).toBeVisible());
  expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
  expect(draft).toHaveValue('Retained after cancel');
  await waitFor(() => expect(count('/users')).toBe(users + 1));
  expect(count('/authorization/permissions')).toBe(permissions + 1);
  expect(beforeUnload()).toBe(true);
});

it('drops a hidden draft and its shell guard when the final permission result denies access', async () => {
  const pending = Promise.withResolvers<void>();
  let hold = false;
  const view = await renderAuthenticatedClient(nestedTree(), {
    route: '/settings/roles/test/edit',
    member: true,
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        actions: [{ action: 'read' }],
      },
    ],
    beforeRequest: (request) =>
      hold && request.url.endsWith('/authorization/permissions')
        ? pending.promise
        : undefined,
  });
  const draft = await screen.findByRole('textbox', { name: 'Draft' });
  await userEvent.type(draft, 'Must be discarded on denial');
  hold = true;
  act(() => view.app.container.resolve(authorizationClientToken).invalidate());
  try {
    await waitFor(() => expect(draft).not.toBeVisible());
    expect(beforeUnload()).toBe(true);
    await view.server.application.container
      .resolve(authorizationToken)
      .permissionSets.update(view.permissionSetKey, {
        key: view.permissionSetKey,
        grants: [],
      });
  } finally {
    hold = false;
    pending.resolve();
  }
  expect(await screen.findByText('Access denied')).toBeVisible();
  expect(draft).not.toBeInTheDocument();
  await waitFor(() => expect(beforeUnload()).toBe(false));
  await userEvent.click(
    await screen.findByRole('link', { name: 'System settings' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Settings destination' }),
  ).toBeVisible();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
});
