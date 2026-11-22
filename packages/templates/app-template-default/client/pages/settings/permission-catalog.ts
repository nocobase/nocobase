import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { PermissionPageCatalog } from '@nocobase/app-plugin-authorization/client/settings';

import { SETTINGS_GROUP, SETTINGS_HOME } from '#lib/navigation-transform';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
} from '../../routing/route-navigation.js';
import { withSettingsShell } from '../../routing/settings-shell.js';

/**
 * The pages the role editor lists, as this application's menu and System settings arrange them. The authorization
 * plugin reads it through its `pageCatalog` option in `client/plugins.ts`.
 */
export function permissionPageCatalog(
  registered: readonly AppClientRegisteredRoute[],
): PermissionPageCatalog {
  const routes = withSettingsShell(registered);
  return {
    routes,
    navigation: buildRouteNavigation(routes, new Set()).filter(
      (item) => ![SETTINGS_GROUP, SETTINGS_HOME].includes(item.route.name),
    ),
    settings: buildSettingsCatalog(routes, new Set()),
  };
}
