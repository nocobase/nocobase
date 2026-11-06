import './subjects.js';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import {
  createAuthorization,
  type Authorization,
  type AuthorizationPlugin,
  type InvalidGrant,
} from '@nocobase/authorization/core';
import {
  permissionSetsPlugin,
  type PermissionSetsAuthorizationApi,
} from '@nocobase/authorization/permission-sets';
import { AUTHORIZATION_NAMESPACE } from '../shared.js';
import type { DatabaseAuthorizationApi } from './database/api.js';
import { databasePlugin } from './database/plugin.js';
import {
  pagesPlugin,
  type PagesAuthorizationApi,
} from './pages-authorization.js';
import { installAuthorizationAdministration } from './routes/administration.js';
import { settingsPlugin, type SettingsAuthorizationApi } from './settings.js';
import { uiPlugin, type UiAuthorizationApi } from './ui.js';
import { DatabaseConnectionHandle } from './stores/connection.js';
import { DatabasePermissionSetStore } from './stores/permission-sets.js';

export interface AppPermissionSetsConfig {
  /** The Permission Set that confers unrestricted access. */
  rootSet?: string;
  /** A separately configured global default set; `member` is now a direct creation default. */
  defaultSet?: string;
}

export interface AuthorizationConfig {
  permissionSets?: AppPermissionSetsConfig;
  /** Plugins added after the built-in ones, such as the rule plugins. */
  plugins?: readonly AuthorizationPlugin[];
}

export interface CreateAppAuthorizationOptions {
  database?: DatabaseManager;
  connection?: DatabaseConnection;
  onUserPermissionsChanged?(userId: string): void | Promise<void>;
  onAuthenticatedPermissionsChanged?(): void | Promise<void>;
  /** Told once per stored composite grant that no longer expands; see `createAuthorization`. */
  onInvalidGrant?(grant: InvalidGrant): void;
  config?: AuthorizationConfig;
}

/** The application's Authorization with its built-in APIs. */
export type AppAuthorization = Authorization &
  PermissionSetsAuthorizationApi<DatabaseConnection> &
  DatabaseAuthorizationApi &
  PagesAuthorizationApi &
  SettingsAuthorizationApi &
  UiAuthorizationApi;

const DEFAULT_ROOT_SET = 'root';
const MEMBER_SET = 'member';

const text = (key: string) => ({ key, ns: AUTHORIZATION_NAMESPACE });

export function createAppAuthorization(
  options: CreateAppAuthorizationOptions,
): AppAuthorization {
  const sets = options.config?.permissionSets;
  const connection = new DatabaseConnectionHandle(
    'Permission Sets',
    options.connection,
  );
  const authz: AppAuthorization = createAuthorization({
    connection: options.connection,
    onInvalidGrant: (grant) => options.onInvalidGrant?.(grant),
    plugins: [
      permissionSetsPlugin<DatabaseConnection>({
        store: new DatabasePermissionSetStore(connection.resolve),
        rootSet: {
          key: sets?.rootSet ?? DEFAULT_ROOT_SET,
          // `user` is this host's principal type: a superuser is an account.
          assignableTo: ['user'],
        },
        defaultSet:
          sets?.defaultSet === MEMBER_SET ? undefined : sets?.defaultSet,
      }),
      databasePlugin(options.database),
      pagesPlugin(),
      settingsPlugin(),
      uiPlugin(),
      ...(options.config?.plugins ?? []),
    ],
  });
  if ((sets?.rootSet ?? DEFAULT_ROOT_SET) === MEMBER_SET) {
    throw new Error(
      'The member Permission Set cannot confer unrestricted access',
    );
  }
  authz.permissionSets.protect({
    owner: '@nocobase/app-plugin-authorization',
    keys: [MEMBER_SET],
    allow: ['update', 'assign', 'revoke'],
    assignableTo: ['user'],
  });
  authz.subjects.add('authenticated', {
    filterActive: async (ids) => ids.filter((id) => id === '*'),
    administration: {
      title: text('options.subjectTypes.authenticated'),
      selection: { type: 'fixed', id: '*' },
    },
  });
  authz.use(async (request, next) => {
    const userId = readSessionUserId(request.http.var.auth);
    request.principal = { type: 'user', id: userId };
    request.subjects.add({ type: 'authenticated', id: '*' });
    for (const subject of await authz.subjects.resolveFor(request.principal))
      request.subjects.add(subject);
    await next();
  });
  authz.onGrantsChanged(async (subject) => {
    if (subject.type === 'user')
      await options.onUserPermissionsChanged?.(subject.id);
    // Any other subject reaches users through membership, which only its
    // owner can enumerate, so every client refreshes.
    else await options.onAuthenticatedPermissionsChanged?.();
  });
  installAuthorizationAdministration(authz);
  return authz;
}

function readSessionUserId(value: unknown): string {
  const user: unknown =
    value && typeof value === 'object' ? Reflect.get(value, 'user') : undefined;
  if (!user || typeof user !== 'object')
    throw new Error('Authorization requires an authenticated session');
  const id: unknown = Reflect.get(user, 'id');
  if (typeof id !== 'string' || id.length === 0)
    throw new Error('Authorization session user must have an id');
  return id;
}
