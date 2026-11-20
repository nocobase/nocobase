import {
  definePersonalSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * The personal settings categories, home and built-in pages. Every page declared with `definePersonalSettingsRoutes()`,
 * by the application or a plugin, is mounted under `/me` and opens from the account menu; a page joins a category with
 * `parent` naming it, such as `parent: 'personalPreferences'`. The category names are shared by every package, so
 * plugins can rely on them: keep them, and rename or reorder a category through its title and `order`. Personal
 * settings belong to whoever is signed in: a page declares no `authz`, stays out of page permissions, and reads only the
 * current person's data. A category the viewer can open nothing in is not shown.
 */
const personalSettingsRoutes: AppClientRouteContribution =
  definePersonalSettingsRoutes([
    {
      // Opens the first personal settings page, so `/me` itself is a stable link.
      name: 'personalSettingsHome',
      path: '/',
      componentLoader: () => import('./personal-settings-home.js'),
    },
    {
      name: 'personalAccount',
      navigation: { title: 'settings.personal.categories.account', order: 10 },
      children: [],
    },
    {
      name: 'personalPreferences',
      navigation: {
        title: 'settings.personal.categories.preferences',
        order: 20,
      },
      children: [
        {
          name: 'personalAppearance',
          path: '/preferences',
          navigation: { title: 'settings.personal.appearance.title' },
          breadcrumb: { title: 'settings.personal.appearance.title' },
          componentLoader: () => import('./appearance.js'),
        },
      ],
    },
    {
      name: 'personalConnections',
      navigation: {
        title: 'settings.personal.categories.connections',
        order: 30,
      },
      children: [],
    },
  ]);

export default personalSettingsRoutes;
