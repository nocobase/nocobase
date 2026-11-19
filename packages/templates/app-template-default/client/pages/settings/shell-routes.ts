import {
  defineSettingsRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * The System settings categories and home. Every page declared with `defineSettingsRoutes()`, by the application or a
 * plugin, is mounted under `/settings`; a page joins a category with `parent` naming it, such as
 * `parent: 'settingsAccount'`. The category names are shared by every package, so plugins can rely on them: keep them,
 * and rename or reorder a category through its title and `order`. A module with several views is a group whose pages
 * become its tabs (`SettingsModulePage`). A category the viewer can open nothing in is not shown.
 */
const settingsShellRoutes: AppClientRouteContribution = defineSettingsRoutes([
  {
    // Lists only modules the viewer may open, so it needs no grant of its own.
    name: 'settingsHome',
    path: '/',
    auth: 'required',
    authz: 'skip',
    componentLoader: () => import('./settings-home.js'),
  },
  {
    name: 'settingsAccount',
    navigation: { title: 'settings.categories.account', order: 10 },
    children: [],
  },
  {
    name: 'settingsBusiness',
    navigation: { title: 'settings.categories.business', order: 20 },
    children: [],
  },
  {
    name: 'settingsAi',
    navigation: { title: 'settings.categories.ai', order: 30 },
    children: [],
  },
  {
    name: 'settingsSystem',
    navigation: { title: 'settings.categories.system', order: 40 },
    children: [],
  },
]);

export default settingsShellRoutes;

export {
  SETTINGS_SHELL_GROUP,
  withSettingsShell,
} from '../../routing/settings-shell.js';
