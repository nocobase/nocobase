import { Settings } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

/**
 * The System settings shell: one sidebar entry opening a home page of cards. Child groups are the home page's
 * categories; register an administration module with `parent` naming its category, such as
 * `parent: 'settingsAccount'`. A module with several views is a group whose pages become its tabs
 * (`SettingsModulePage`). A category the viewer can open nothing in is not shown, so a bare application shows only
 * what its plugins contribute, such as App Foundation for an unrestricted administrator.
 */
const settingsShellRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'settings',
    path: '/settings',
    navigation: { title: 'settings.title', icon: Settings, order: 100 },
    breadcrumb: { title: 'settings.title' },
    children: [
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
    ],
  },
]);

export default settingsShellRoutes;
