import databaseExplorerRoutes from './pages/settings/database-explorer/routes.js';
import { Home } from 'lucide-react';
import personalSettingsRoutes from './pages/me/routes.js';
import workflowSettingsRoutes from './pages/settings/workflows/routes.js';
import settingsShellRoutes from './pages/settings/shell-routes.js';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    // Every signed-in user reaches the landing page. `authz: 'skip'` takes it out of page authorization entirely, so
    // no permission change can leave a user signed in with nowhere to land.
    authz: 'skip',
    auth: 'required',
    componentLoader: () => import('./pages/home/index.js'),
    name: 'home',
    navigation: { title: 'navigation.home', icon: Home },
    path: '/',
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

// The System settings shell shows only the modules a viewer may open. The Users and Authorization plugins contribute
// their modules to the same shell as Workflow management and Database Explorer, and `@nocobase/app-plugin-notification`
// adds Messages › Notifications.
export function createApplicationRoutes(): readonly AppClientRouteContribution[] {
  return [
    appRoutes,
    settingsShellRoutes,
    personalSettingsRoutes,
    workflowSettingsRoutes,
    databaseExplorerRoutes,
  ];
}

const routes: readonly AppClientRouteContribution[] = createApplicationRoutes();

export default routes;
