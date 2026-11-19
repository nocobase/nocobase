import {
  defineAppRoutes,
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const routes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'index',
    path: '/routes-example',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'index' }, action: 'access' },
    componentLoader: () => import('./pages/routes-example-page.js'),
  },
]);

/**
 * A settings page contributed by the plugin. It names the application's System category with `parent`; its path is
 * relative to `/settings`, so it opens at `/settings/routes-example`. Without an `authz` of its own a settings page
 * admits only unrestricted administrators.
 */
export const settingsRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    parent: 'settingsSystem',
    name: 'exampleSettings',
    path: '/routes-example',
    navigation: {
      title: 'settingsTitle',
      description: 'settingsDescription',
    },
    breadcrumb: { title: 'settingsTitle' },
    componentLoader: () => import('./pages/routes-example-settings-page.js'),
  },
]);

export default routes;
