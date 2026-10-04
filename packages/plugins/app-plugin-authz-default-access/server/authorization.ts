import type { DatabaseConnection } from '@nocobase/db';
import type { AuthorizationPlugin } from '@nocobase/authorization/core';
import {
  defaultAccessPlugin,
  type DefaultAccessAuthorizationApi,
  type DefaultAccessStore,
} from '@nocobase/authorization/default-access';
import {
  AUTHORIZATION_SETTINGS_SECTION,
  type DatabaseAuthorizationApi,
  type SettingsAuthorizationApi,
  type UiAuthorizationApi,
} from '@nocobase/app-plugin-authorization/server';
import { DatabaseConnectionHandle } from '@nocobase/app-plugin-authorization/server/extension';
import {
  createDefaultAccessHandler,
  DEFAULT_ACCESS_PATH,
  DEFAULT_ACCESS_SETTINGS,
} from './handler.js';
import { DatabaseDefaultAccessStore } from './stores/default-access.js';

const NAMESPACE = '@nocobase/app-plugin-authz-default-access';
const APP_NAMESPACE = '@nocobase/app-plugin-authorization';

export interface DefaultAccessOptions {
  store?: DefaultAccessStore<DatabaseConnection>;
}

/** The configuration factory: default access with its settings item and routes. */
export function defaultAccess(
  options: DefaultAccessOptions = {},
): AuthorizationPlugin<
  DefaultAccessAuthorizationApi<DatabaseConnection>,
  DatabaseConnection,
  SettingsAuthorizationApi & DatabaseAuthorizationApi & UiAuthorizationApi
> {
  const connection = new DatabaseConnectionHandle('Default Access');
  const plugin = defaultAccessPlugin<DatabaseConnection>({
    store: options.store ?? new DatabaseDefaultAccessStore(connection.resolve),
  });
  return {
    ...plugin,
    dependencies: ['settings', 'database', 'ui'],
    setup(authz) {
      connection.set(authz.connection);
      plugin.setup?.(authz);
      authz.settings.add({
        id: DEFAULT_ACCESS_SETTINGS,
        title: { key: 'resourceTitle', ns: NAMESPACE },
        actions: ['read', 'create', 'update', 'delete'].map((name) => ({
          name,
          title: { key: `options.actions.${name}`, ns: APP_NAMESPACE },
        })),
      });
      authz.ui.place(
        { type: 'settings', id: DEFAULT_ACCESS_SETTINGS },
        { section: AUTHORIZATION_SETTINGS_SECTION, order: 10 },
      );
      authz.routes.add(
        DEFAULT_ACCESS_PATH,
        createDefaultAccessHandler(
          authz,
          plugin.authorizationApi!.defaultAccess,
        ),
      );
    },
  };
}
