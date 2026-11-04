import { renderAuthenticatedClient } from '../helpers/authenticated-client.js';
import {
  defineAppRoutes,
  resolveAppClientContributions,
} from '@nocobase/app-client/plugins';
import { screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { expect, it, vi } from 'vitest';
import { includeNotificationTemplateRoutes } from '../../client/pages/settings/notification-routes.js';
import NotificationTemplatesPage from '../../client/pages/settings/notification-templates.js';
import { SettingsModulePage } from '../../client/pages/settings/settings-module-page.js';
import shellRoutes from '../../client/pages/settings/shell-routes.js';
import { RouteTreeProvider } from '../../client/routing/route-context.js';
import { useRouteNavigation } from '../../client/routing/route-navigation.js';

// The directory itself is covered by the Notification plugin's tests; this file checks the settings module frame.
vi.mock('@nocobase/app-plugin-notification/client/templates', () => ({
  NotificationTemplates: () => <p>Template directory</p>,
}));

// An application that already has Delivery logs: the template directory joins the same module as a second tab.
const logs = defineAppRoutes([
  {
    parent: 'settingsSystem',
    name: 'notificationManagement',
    navigation: { title: 'settings.notificationManagement' },
    breadcrumb: { title: 'settings.notificationManagement' },
    children: [
      {
        name: 'notificationLogs',
        path: '/notifications/logs',
        auth: 'required',
        authz: {
          resource: { type: 'page', id: 'notification.logs' },
          action: 'access',
        },
        // Stands in for the application's own Delivery logs copy; any key the template's locale already has.
        navigation: { title: 'inboxButton.title' },
        componentLoader: () => import('../../client/pages/inbox.js'),
      },
    ],
  },
]);

const { routes } = resolveAppClientContributions([
  {
    packageName: '@nocobase/app-template-default',
    source: 'application',
    routes: includeNotificationTemplateRoutes([shellRoutes, logs], false),
  },
]);

function Shell() {
  const { denied, loading } = useRouteNavigation(routes);
  return (
    <RouteTreeProvider routes={routes} access={{ denied, loading }}>
      <Routes>
        <Route
          path='/settings/notifications/logs'
          element={
            <SettingsModulePage>
              <p>Delivery log list</p>
            </SettingsModulePage>
          }
        />
        <Route
          path='/settings/notifications/templates'
          element={<NotificationTemplatesPage />}
        />
      </Routes>
    </RouteTreeProvider>
  );
}

const page = (id: string) => ({
  resource: { type: 'page', id },
  actions: [{ action: 'access' }],
});

it('shows Delivery logs and Notification templates as tabs under one module heading', async () => {
  await renderAuthenticatedClient(<Shell />, {
    route: '/settings/notifications/templates',
    member: true,
    grants: [page('notification.logs'), page('notification.templates')],
  });
  await screen.findByRole('tab', { name: 'Notification templates' });
  expect(screen.getByText('Template directory')).toBeVisible();
  expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
    'Inbox',
    'Notification templates',
  ]);
  expect(
    screen.getByRole('tab', { name: 'Notification templates' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(
    screen.getByRole('heading', { level: 1, name: 'Notification management' }),
  ).toBeVisible();
});

it('shows the template directory without a tab bar to a viewer who may not open the logs', async () => {
  await renderAuthenticatedClient(<Shell />, {
    route: '/settings/notifications/templates',
    member: true,
    grants: [page('notification.templates')],
  });
  await screen.findByRole('heading', {
    level: 1,
    name: 'Notification management',
  });
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});

it('keeps the template tab out of the logs view for a viewer without the template grant', async () => {
  await renderAuthenticatedClient(<Shell />, {
    route: '/settings/notifications/logs',
    member: true,
    grants: [page('notification.logs')],
  });
  await screen.findByText('Delivery log list');
  await waitFor(() =>
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole('tab', { name: 'Notification templates' }),
  ).not.toBeInTheDocument();
});
