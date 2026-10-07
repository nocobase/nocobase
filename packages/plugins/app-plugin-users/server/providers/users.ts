import { createApplicationUserRoleScope } from '../services/permission-set-scope.js';
import { databaseManagerToken } from '@nocobase/db';
import {
  authorizationToken,
  grantBacked,
} from '@nocobase/app-plugin-authorization';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection } from '@nocobase/db';
import type { AppIdentityConfig } from '@nocobase/app-server/config';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';

import { createNotificationMailer } from '../invitations/notification-mailer.js';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  type UsersConfig,
  userManagementServiceToken,
  userPreferencesServiceToken,
  userRoleScopeRegistryToken,
} from '../tokens.js';
import { createUserPreferencesService } from '../preferences/service.js';
import {
  createUserManagementService,
  createUserRoleScopeRegistry,
} from '../services/users.js';

const USER_ACTIONS = new Set([
  'read',
  'invite',
  'create',
  'update',
  'disable',
  'delete',
  'enable',
  'assign-role',
  'reset-password',
  'revoke-sessions',
]);

/** The cap `UserAdministrationService.list` applies to a page. */
const ACCOUNT_PAGE_SIZE = 100;

export class UsersProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-users';
  private releasePermissionSetScope?: () => void;
  private releaseSubjectType?: () => void;

  public override register(): void {
    this.app.container.singleton(userRoleScopeRegistryToken, () =>
      createUserRoleScopeRegistry(),
    );
    this.app.container.singleton(userPreferencesServiceToken, (resolver) =>
      createUserPreferencesService({
        database: resolver.resolve(databaseManagerToken),
      }),
    );
    this.app.container.singleton(userManagementServiceToken, (resolver) => {
      // An application may be assembled without authorization; user
      // management still works, it just has no assignments to protect.
      const permissionSets = resolver.has(authorizationToken)
        ? resolver.resolve(authorizationToken).permissionSets
        : undefined;
      const identity = this.app.config.get<AppIdentityConfig>('app');
      return createUserManagementService({
        database: resolver.resolve(databaseManagerToken),
        mailer: createNotificationMailer(this.app),
        site: {
          ...(identity?.publicOrigin
            ? { publicOrigin: identity.publicOrigin }
            : {}),
          publicBasePath: this.app.publicBasePath,
          appTitle:
            this.app.config.get<string>('client.app.title') ?? this.app.appName,
        },
        users: resolver.resolve(userAdministrationServiceToken),
        roleScopes: resolver.resolve(userRoleScopeRegistryToken),
        ...(permissionSets === undefined ? {} : { permissionSets }),
        onRoleScopesChanged: (userId) =>
          permissionSets?.notifyAssignmentsChanged({
            type: 'user',
            id: userId,
          }),
      });
    });
  }

  public override boot(): Promise<void> {
    if (
      !this.releasePermissionSetScope &&
      this.app.container.has(authorizationToken) &&
      this.app.config.get<UsersConfig>('users')?.permissionSets !== false
    ) {
      this.releasePermissionSetScope = this.app.container
        .resolve(userRoleScopeRegistryToken)
        .register(
          createApplicationUserRoleScope(
            this.app.container.resolve(authorizationToken).permissionSets,
          ),
        );
    }
    // An application may be assembled without authorization, and boot may run twice.
    if (!this.app.container.has(authorizationToken) || this.releaseSubjectType)
      return Promise.resolve();
    const authorization = this.app.container.resolve(authorizationToken);
    // A disabled account can no longer act, so it holds nothing any more.
    this.releaseSubjectType = authorization.subjects.add<DatabaseConnection>(
      'user',
      {
        filterActive: (ids, connection) => this.enabledUserIds(ids, connection),
        administration: {
          title: {
            key: 'options.subjectTypes.user',
            ns: '@nocobase/app-plugin-authorization',
          },
          selection: {
            type: 'collection',
            list: async (query, context) => {
              await context.authz.require({
                resource: { type: 'user', id: '*' },
                action: 'read',
              });
              const users = this.app.container.resolve(
                userAdministrationServiceToken,
              );
              const result = await users.list({ ...query, status: 'enabled' });
              return {
                items: result.items.map((user) => ({
                  id: user.id,
                  title: user.name,
                  description: user.username ?? user.email,
                })),
                total: result.total,
              };
            },
            resolve: async (ids, context) => {
              await context.authz.require({
                resource: { type: 'user', id: '*' },
                action: 'read',
              });
              const users = this.app.container.resolve(
                userAdministrationServiceToken,
              );
              const result = await users.list({ userIds: ids, pageSize: 100 });
              return result.items.map((user) => ({
                id: user.id,
                title: user.name,
                description: user.username ?? user.email,
              }));
            },
          },
        },
      },
    );
    const scopes = this.app.container.has(userRoleScopeRegistryToken)
      ? this.app.container.resolve(userRoleScopeRegistryToken)
      : undefined;
    // A record type: the id is a user, and `delete` exists only while a role
    // scope can clean a deleted user up.
    authorization.resourceTypes.add({
      type: 'user',
      actions: [...USER_ACTIONS],
      authorize: grantBacked({
        also: async (request) =>
          request.action !== 'delete' ||
          (scopes
            ?.list()
            .some(
              (scope) =>
                typeof scope.assertCanDelete === 'function' &&
                typeof scope.onDelete === 'function',
            ) ??
            false),
      }),
    });
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.releasePermissionSetScope?.();
    this.releasePermissionSetScope = undefined;
    this.releaseSubjectType?.();
    this.releaseSubjectType = undefined;
    return Promise.resolve();
  }

  /**
   * Asks this plugin's own user administration which of these accounts are
   * still enabled, one page per batch rather than one query per account.
   */
  private async enabledUserIds(
    ids: readonly string[],
    connection?: DatabaseConnection,
  ): Promise<readonly string[]> {
    const service = this.app.container.resolve(userAdministrationServiceToken);
    const users = connection ? service.withConnection(connection) : service;
    const enabled: string[] = [];
    for (let start = 0; start < ids.length; start += ACCOUNT_PAGE_SIZE) {
      const page = await users.list({
        userIds: ids.slice(start, start + ACCOUNT_PAGE_SIZE),
        status: 'enabled',
        pageSize: ACCOUNT_PAGE_SIZE,
      });
      enabled.push(...page.items.map((user) => user.id));
    }
    return enabled;
  }
}
