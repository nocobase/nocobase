import {
  authorizationPages,
  registeredPluginRoutes,
} from '../helpers/plugin-routes.js';
import packageMetadata from '../../package.json' with { type: 'json' };
import { createAuthenticatedClientRenderer } from '../helpers/authenticated-client.js';
import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { expect, it } from 'vitest';
import { Breadcrumbs } from '../../client/components/breadcrumbs.js';
import SettingsHomePage from '../../client/pages/settings/settings-home.js';
import userEvent from '@testing-library/user-event';
import WorkflowDefinitionsPage from '../../client/pages/settings/workflows/definitions.js';
import WorkflowExecutionsPage from '../../client/pages/settings/workflows/executions.js';
import workflowSettingsRoutes from '../../client/pages/settings/workflows/routes.js';
import shellRoutes from '../../client/pages/settings/shell-routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

const renderAuthenticatedClient = createAuthenticatedClientRenderer();

const { routes } = resolveAppClientContributions([
  {
    packageName: packageMetadata.name,
    source: 'application',
    routes: [shellRoutes, workflowSettingsRoutes],
  },
  registeredPluginRoutes('@nocobase/app-plugin-users'),
  authorizationPages(),
]);

function Shell({ children }: { children: ReactNode }) {
  const { denied, loading } = useRouteNavigation(routes);
  return (
    <RouteTreeProvider routes={routes} access={{ denied, loading }}>
      <Breadcrumbs denied={denied} />
      {children}
    </RouteTreeProvider>
  );
}

function Where() {
  return <output aria-label='Route'>{useLocation().pathname}</output>;
}

function mount(
  options: Parameters<typeof renderAuthenticatedClient>[1] = {},
  route = '/settings',
) {
  return renderAuthenticatedClient(
    <Shell>
      <Routes>
        <Route path='/settings' element={<SettingsHomePage />} />
        <Route
          path='/settings/workflows/definitions'
          element={<WorkflowDefinitionsPage />}
        />
        <Route
          path='/settings/workflows/executions'
          element={<WorkflowExecutionsPage />}
        />
        <Route path='*' element={<Where />} />
      </Routes>
    </Shell>,
    { route, ...options },
  );
}

it('opens the first system settings page an administrator may open', async () => {
  await mount();
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/users',
    ),
  );
});

it('opens a restricted viewer on the first page they may open', async () => {
  await mount({
    member: true,
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.default-access' },
        actions: [{ action: 'read' }],
      },
    ],
  });
  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Route' })).toHaveTextContent(
      '/settings/default-access',
    ),
  );
});

it('explains when there is nothing to manage', async () => {
  await mount({ member: true, locale: 'zh-CN' });
  expect(await screen.findByText('暂时没有你可以管理的设置。')).toBeVisible();
  expect(screen.queryByRole('status', { name: 'Route' })).toBeNull();
});

it('links the System settings breadcrumb back to the home from a module view', async () => {
  await mount({}, '/settings/roles');
  const trail = await screen.findByRole('navigation', { name: 'Breadcrumb' });
  expect(
    await within(trail).findByRole('link', { name: 'System settings' }),
  ).toHaveAttribute('href', '/main/settings');
  expect(within(trail).getByText('Roles & permissions')).toBeVisible();
});

it('opens workflow definitions and switches to execution history', async () => {
  const user = userEvent.setup();
  await mount({}, '/settings/workflows/definitions');
  expect(await screen.findByText('No data yet')).toBeVisible();
  expect(
    screen.getByText(/In your project repository, tell the Agent/),
  ).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'View documentation' }),
  ).toHaveAttribute(
    'href',
    'https://docs.nocobase.com/core/developing-apps/business-workflows/',
  );
  await user.click(await screen.findByRole('tab', { name: 'Executions' }));
  expect(
    await screen.findByText('No workflow executions have been recorded yet.'),
  ).toBeVisible();
  expect(screen.getByRole('tab', { name: 'Executions' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

it('shows the workflow management guidance and guide in Chinese', async () => {
  await mount({ locale: 'zh-CN' }, '/settings/workflows/definitions');
  expect(await screen.findByText('暂无数据')).toBeVisible();
  expect(screen.getByText(/在项目仓库中向 Agent 描述需求/)).toBeVisible();
  expect(screen.getByRole('link', { name: '查看文档' })).toHaveAttribute(
    'href',
    'https://docs.nocobase.com/zh-CN/core/developing-apps/business-workflows/',
  );
});

it('opens execution history directly in Chinese', async () => {
  await mount({ locale: 'zh-CN' }, '/settings/workflows/executions');
  expect(await screen.findByRole('tab', { name: '执行记录' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByText('暂无数据').closest('[role=status]')).toBeVisible();
  expect(screen.getByText('暂无流程执行记录。')).toBeVisible();
});
