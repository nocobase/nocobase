import type { DatabaseConnection } from '@nocobase/db';
import type { AuthorizationPlugin } from '@nocobase/authorization/core';
import {
  restrictionRulesPlugin,
  type RestrictionRulesAuthorizationApi,
  type RestrictionRuleStore,
} from '@nocobase/authorization/restriction-rules';
import {
  AUTHORIZATION_SETTINGS_SECTION,
  type DatabaseAuthorizationApi,
  type SettingsAuthorizationApi,
  type UiAuthorizationApi,
} from '@nocobase/app-plugin-authorization/server';
import { DatabaseConnectionHandle } from '@nocobase/app-plugin-authorization/server/extension';
import {
  createRestrictionRulesHandler,
  RESTRICTION_RULES_PATH,
  RESTRICTION_RULES_SETTINGS,
} from './handler.js';
import { DatabaseRestrictionRuleStore } from './stores/restriction-rules.js';

const NAMESPACE = '@nocobase/app-plugin-authz-restriction-rules';
const APP_NAMESPACE = '@nocobase/app-plugin-authorization';

export interface RestrictionRulesOptions {
  store?: RestrictionRuleStore<DatabaseConnection>;
}

/** The configuration factory: sharing rules with their settings item and routes. */
export function restrictionRules(
  options: RestrictionRulesOptions = {},
): AuthorizationPlugin<
  RestrictionRulesAuthorizationApi<DatabaseConnection>,
  DatabaseConnection,
  SettingsAuthorizationApi & DatabaseAuthorizationApi & UiAuthorizationApi
> {
  const connection = new DatabaseConnectionHandle('Restriction Rules');
  const plugin = restrictionRulesPlugin<DatabaseConnection>({
    store:
      options.store ?? new DatabaseRestrictionRuleStore(connection.resolve),
  });
  return {
    ...plugin,
    dependencies: ['settings', 'database', 'ui'],
    setup(authz) {
      connection.set(authz.connection);
      plugin.setup?.(authz);
      authz.settings.add({
        id: RESTRICTION_RULES_SETTINGS,
        title: { key: 'resourceTitle', ns: NAMESPACE },
        actions: ['read', 'create', 'update', 'delete'].map((name) => ({
          name,
          title: { key: `options.actions.${name}`, ns: APP_NAMESPACE },
        })),
      });
      authz.ui.place(
        { type: 'settings', id: RESTRICTION_RULES_SETTINGS },
        { section: AUTHORIZATION_SETTINGS_SECTION, order: 30 },
      );
      authz.routes.add(
        RESTRICTION_RULES_PATH,
        createRestrictionRulesHandler(
          authz,
          plugin.authorizationApi!.restrictionRules,
        ),
      );
    },
  };
}
