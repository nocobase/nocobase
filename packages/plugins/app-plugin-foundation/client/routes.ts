import {
  defineSystemSettingsRoutes,
  SYSTEM_SETTINGS_CATEGORIES,
  SYSTEM_SETTINGS_ROUTE_PATH,
  type AppClientRoutePageDefinition,
  type AppClientSystemSettingsRoutesContribution,
} from '@nocobase/app-client/plugins';
import { Blocks } from 'lucide-react';
import { createElement } from 'react';
import { Navigate, useLocation } from 'react-router';

import { PLUGINS_ACCESS } from '../shared/access.js';

/** Where the plugins page is mounted, below the System settings path. */
export const PLUGINS_PATH = '/plugins';

/**
 * System settings › System › Plugins. Its route id is `@nocobase/app-plugin-foundation:plugins`, so an application
 * replaces the whole page with `routeComponentOverrides: { plugins: MyPlugins }`.
 */
export const pluginsRoute: AppClientRoutePageDefinition = {
  name: 'plugins',
  path: PLUGINS_PATH,
  auth: 'required',
  authz: PLUGINS_ACCESS,
  navigation: {
    title: 'nav.plugins',
    description: 'nav.pluginsDescription',
    icon: Blocks,
    order: 10,
  },
  breadcrumb: { title: 'nav.plugins' },
  componentLoader: () => import('./pages/plugins-page.js'),
};

/** Earlier versions' pages, the overview and the capability guide with its details, which now open the plugins page. */
const LEGACY_PATHS = [
  ['legacyFoundation', '/foundation'],
  ['legacyCapabilities', '/capabilities'],
  ['legacyCapabilityDetail', '/capabilities/:entryId'],
] as const;

function legacyRedirect([
  name,
  path,
]: (typeof LEGACY_PATHS)[number]): AppClientRoutePageDefinition {
  return {
    name,
    path,
    auth: 'required',
    authz: PLUGINS_ACCESS,
    componentLoader: async () => ({
      default: function LegacyPluginsRedirect() {
        const { search, hash } = useLocation();
        return createElement(Navigate, {
          replace: true,
          to: {
            pathname: SYSTEM_SETTINGS_ROUTE_PATH + PLUGINS_PATH,
            search,
            hash,
          },
        });
      },
    }),
  };
}

const routes: AppClientSystemSettingsRoutesContribution =
  defineSystemSettingsRoutes(
    [pluginsRoute, ...LEGACY_PATHS.map(legacyRedirect)].map((route) => ({
      ...route,
      parent: SYSTEM_SETTINGS_CATEGORIES.system,
    })),
  );

export default routes;
