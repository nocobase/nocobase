import databaseExplorerRoutes from './pages/settings/database-explorer/routes.js';
import settingsShellRoutes from './pages/settings/shell-routes.js';
import { createAppClientConfig } from '@nocobase/app-client';
import { readAppClientRuntimeConfig } from '@nocobase/app-client/runtime';
import { includeNotificationTemplateRoutes } from './pages/settings/notification-routes.js';
import systemSettingsRoutes from './pages/settings/routes.js';
import { Home } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'externalApps',
    path: '/multi-app/external-apps',
    auth: 'required',
    authz: 'unrestricted',
    breadcrumb: { title: 'portal.management' },
    componentLoader: () => import('./pages/template-portal/external-layout.js'),
    children: [
      {
        name: 'externalApps.create',
        path: 'new',
        auth: 'required',
        authz: 'unrestricted',
        componentLoader: () =>
          import('./pages/template-portal/external-create.js'),
      },
    ],
  },
  {
    name: 'externalApps.detail',
    path: '/multi-app/external-apps/:id',
    auth: 'required',
    authz: 'unrestricted',
    breadcrumb: { title: 'external.title' },
    componentLoader: () => import('./pages/template-portal/external-apps.js'),
  },
  {
    name: 'identityLogin',
    path: '/identity/login',
    auth: 'required',
    authz: 'skip',
    componentLoader: () => import('./pages/identity-login.js'),
  },
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/template-portal/my-apps.js'),
    children: [
      {
        name: 'portal.create',
        path: 'create',
        auth: 'required',
        authz: {
          resource: { type: 'composite', id: 'multiApp.instances' },
          action: 'provision',
        },
        componentLoader: () => import('./pages/template-portal/create.js'),
      },
    ],
    name: 'home',
    navigation: { title: 'portal.myApps', icon: Home },
    path: '/',
  },
  {
    // Declares no navigation, so the application decides where its entry goes (for example a sidebar item with an
    // unread badge). The plugin's API answers each person's own messages only, so the page needs no authorization of
    // its own.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/inbox.js'),
    name: 'inbox',
    path: '/inbox',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/login.js'),
    name: 'login',
    path: '/login',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/register.js'),
    name: 'register',
    path: '/register',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/forgot-password.js'),
    name: 'forgot-password',
    path: '/forgot-password',
  },
  {
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/reset-password.js'),
    name: 'reset-password',
    path: '/reset-password',
  },
  {
    // Where a command line's sign-in sends the person to approve it (`pages/auth/device.tsx`). Optional rather than
    // required so it renders outside the shell, like the sign-in pages; the page sends a guest to sign in and back.
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/auth/device.js'),
    name: 'device',
    path: '/device',
  },
]);

export function createApplicationRoutes(
  rawConfig: unknown = readAppClientRuntimeConfig(),
): readonly AppClientRouteContribution[] {
  const config = createAppClientConfig({ rawConfig });
  return includeNotificationTemplateRoutes(
    [
      appRoutes,
      settingsShellRoutes,
      systemSettingsRoutes,
      databaseExplorerRoutes,
    ],
    config.get<boolean>('notificationTemplates.invitationConfigured') === true,
  );
}
const routes = createApplicationRoutes();

export default routes;
