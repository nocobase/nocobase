import {
  defineSystemSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * The System settings home. Every page declared with `defineSystemSettingsRoutes()`, by the application or a plugin,
 * is mounted under `/settings` and joins one of the categories `@nocobase/app-client` builds in with `parent`, such as
 * `parent: SYSTEM_SETTINGS_CATEGORIES.account`. Their titles are `settings.categories.<id>` in this application's
 * locales; rename, reorder or hide one with `defineSettingsCategories()` rather than declaring it again. A module with
 * several views is a `kind: 'module'` group whose pages become its tabs (`SettingsModulePage`). A category the viewer
 * can open nothing in is not shown.
 */
const settingsShellRoutes: AppClientRouteContribution =
  defineSystemSettingsRoutes([
    {
      // Opens the first page the viewer may open, so it needs no grant of its own.
      name: 'settingsHome',
      path: '/',
      auth: 'required',
      authz: 'skip',
      componentLoader: () => import('./settings-home.js'),
    },
  ]);

export default settingsShellRoutes;

export {
  SETTINGS_SHELL_GROUP,
  withSettingsShell,
} from '../../routing/settings-shell.js';
