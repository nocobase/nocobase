import type { DatabaseConnection } from '@nocobase/db';
import type { AuthorizationPlugin } from '@nocobase/authorization/core';
import {
  sharingRulesPlugin,
  type SharingRulesAuthorizationApi,
  type SharingRuleStore,
} from '@nocobase/authorization/sharing-rules';
import {
  AUTHORIZATION_SETTINGS_SECTION,
  type DatabaseAuthorizationApi,
  type SettingsAuthorizationApi,
  type UiAuthorizationApi,
} from '@nocobase/app-plugin-authorization/server';
import { DatabaseConnectionHandle } from '@nocobase/app-plugin-authorization/server/extension';
import {
  createSharingRulesHandler,
  SHARING_RULES_PATH,
  SHARING_RULES_SETTINGS,
} from './handler.js';
import { DatabaseSharingRuleStore } from './stores/sharing-rules.js';

const NAMESPACE = '@nocobase/app-plugin-authz-sharing-rules';
const APP_NAMESPACE = '@nocobase/app-plugin-authorization';

export interface SharingRulesOptions {
  store?: SharingRuleStore<DatabaseConnection>;
}

/** The configuration factory: sharing rules with their settings item and routes. */
export function sharingRules(
  options: SharingRulesOptions = {},
): AuthorizationPlugin<
  SharingRulesAuthorizationApi<DatabaseConnection>,
  DatabaseConnection,
  SettingsAuthorizationApi & DatabaseAuthorizationApi & UiAuthorizationApi
> {
  const connection = new DatabaseConnectionHandle('Sharing Rules');
  const plugin = sharingRulesPlugin<DatabaseConnection>({
    store: options.store ?? new DatabaseSharingRuleStore(connection.resolve),
  });
  return {
    ...plugin,
    dependencies: ['settings', 'database', 'ui'],
    setup(authz) {
      connection.set(authz.connection);
      plugin.setup?.(authz);
      authz.settings.add({
        id: SHARING_RULES_SETTINGS,
        title: { key: 'resourceTitle', ns: NAMESPACE },
        actions: ['read', 'create', 'update', 'delete'].map((name) => ({
          name,
          title: { key: `options.actions.${name}`, ns: APP_NAMESPACE },
        })),
      });
      authz.ui.place(
        { type: 'settings', id: SHARING_RULES_SETTINGS },
        { section: AUTHORIZATION_SETTINGS_SECTION, order: 20 },
      );
      authz.routes.add(
        SHARING_RULES_PATH,
        createSharingRulesHandler(authz, plugin.authorizationApi!.sharingRules),
      );
    },
  };
}
