import {
  definePersonalSettingsRoutes,
  PERSONAL_SETTINGS_CATEGORIES,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * The personal settings home and built-in pages. Every page declared with `definePersonalSettingsRoutes()`, by the
 * application or a plugin, is mounted under `/me`, opens from the account menu and joins one of the categories
 * `@nocobase/app-client` builds in with `parent`, such as `parent: PERSONAL_SETTINGS_CATEGORIES.preferences`. Their
 * titles are `settings.personal.categories.<id>` in this application's locales. Personal settings belong to whoever is
 * signed in: a page declares no `authz`, stays out of page permissions, and reads only the current person's data. A
 * category the viewer can open nothing in is not shown.
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
      parent: PERSONAL_SETTINGS_CATEGORIES.preferences,
      name: 'personalAppearance',
      path: '/preferences',
      navigation: { title: 'settings.personal.appearance.title' },
      breadcrumb: { title: 'settings.personal.appearance.title' },
      componentLoader: () => import('./appearance.js'),
    },
  ]);

export default personalSettingsRoutes;
