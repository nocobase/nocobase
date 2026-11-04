import packageMetadata from '../../package.json' with { type: 'json' };
import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import { useSettingsLeave } from '../../client/pages/settings/hooks.js';
import { BodyPortal } from '../../client/components/body-portal.js';
import { ClientRoute } from '../../client/routing/client-route.js';
import { authorizationClientToken } from '@nocobase/app-plugin-authorization/client';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { PermissionManagementPage } from '../../client/pages/settings/permission-management-page.js';
import applicationRoutes from '../../client/routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const { routes } = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: applicationRoutes,
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
      {children}
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
it.each([''])(
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
  await mount('', 'default-access', false);
  await screen.findByRole('heading', { name: 'Permission management' });
  // The module has one view this viewer may open, so it shows that view without a tab bar.
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
    '/default-access',
  );
});
it('uses the agreed Chinese menu and tab names', async () => {
  await mount('', 'roles', true, 'zh-CN');
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
        route: '/roles',
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
          <Route path='/roles' element={<DraftPage />} />
          <Route
            path='/default-access'
            element={<Content tab='default-access' />}
          />
          <Route path='/settings' element={<h1>Settings destination</h1>} />
        </Routes>
      </Shell>,
      { route: '/roles' },
    );
    const draft = await screen.findByRole('textbox', { name: 'Draft' });
    await user.type(draft, 'Unsaved inline draft');
    const target =
      destination === 'tab'
        ? await screen.findByRole('tab', { name: 'Default data scopes' })
        : screen.getByRole('link', { name: 'System settings' });
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
          '/default-access',
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
