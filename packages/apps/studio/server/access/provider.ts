/**
 * Studio's roles: binds the access the plugins read (`projectsAccessToken`, and `agentsAccessToken` for how far the
 * agents plugin's business actions reach), Studio's own service and the organization's
 * API keys; at boot, registers Studio's own settings items (the plugins register their businesses themselves), protects the owner and admin
 * roles and every API key's own permission set, offers the roles to the Users plugin's pages, assembles the permission
 * groups API keys are scoped by (`key-scopes.ts`), and lets only holders of `studio.personalApiKeys` `create` make keys
 * of their own.
 */
import {
  apiKeyScopesToken,
  scopedApiKeysToken,
} from '@nocobase/app-plugin-api-keys/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { releasesKeyScopeObjects } from '@nocobase/app-plugin-releases/server';
import { releasesToken } from '@nocobase/app-plugin-releases/server/tokens';
import { projectsKeyScopeObjects } from '@nocobase/app-plugin-projects/server';
import { projectsAccessToken } from '@nocobase/app-plugin-projects/server/tokens';
import { agentsAccessToken } from '@nocobase/app-plugin-agents/server/tokens';
import { userRoleScopeRegistryToken } from '@nocobase/app-plugin-users/server/tokens';
import type { Application } from '@nocobase/app-server/application';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { ROLES } from '../../shared/access.js';
import { studioCiSetupToken } from '../builds/token.js';
import { managedKeys } from '../releases/ci.js';
import { createOrgApiKeyService, personalKeyPolicy } from './api-keys.js';
import { registerStudioKeyScopes } from './key-scopes.js';
import { createStudioAccess } from './service.js';
import { registerStudioSettings } from './settings.js';
import { studioAccessToken, studioApiKeysToken } from './token.js';
import { createStudioUserRoleScope } from './user-scope.js';

interface PermissionSetsConfig {
  readonly permissionSets?: {
    readonly rootSet?: string;
    readonly defaultSet?: string;
  };
}

export default class StudioAccessProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/access';
  private readonly releases: (() => void)[] = [];

  private sets(): { rootSet: string; defaultSet: string } {
    const config = this.app.config.get<PermissionSetsConfig>('authorization');
    return {
      rootSet: config?.permissionSets?.rootSet ?? 'root',
      defaultSet: config?.permissionSets?.defaultSet ?? 'member',
    };
  }

  public override register(): void {
    this.app.container.singleton(studioAccessToken, (resolver) =>
      createStudioAccess({
        authz: resolver.resolve(authorizationToken),
        database: resolver.resolve(databaseManagerToken),
        newKey: () => resolver.resolve(idGeneratorToken).generateString(),
        ...this.sets(),
      }),
    );
    this.app.container.singleton(
      projectsAccessToken,
      (resolver) => resolver.resolve(studioAccessToken).projects,
    );
    // The agents plugin's business actions are granted like every other on Studio's roles, narrowed by a key's scope.
    this.app.container.singleton(agentsAccessToken, (resolver) => ({
      scopeOf: async (identity, key) =>
        (await resolver.resolve(studioAccessToken).permissionsOf(identity))
          .scopes[key] ?? 'none',
    }));
    this.app.container.singleton(studioApiKeysToken, (resolver) =>
      createOrgApiKeyService({
        users: () => resolver.resolve(userAdministrationServiceToken),
        keys: () => resolver.resolve(scopedApiKeysToken),
        scopes: () => resolver.resolve(apiKeyScopesToken),
        authz: () => resolver.resolve(authorizationToken),
        access: () => resolver.resolve(studioAccessToken),
        database: resolver.resolve(databaseManagerToken),
        newId: () => resolver.resolve(idGeneratorToken).generateString(),
        // The keys Studio keeps for repositories' CI (`../builds/ci-setup.ts`).
        managedBy: (ids) =>
          managedKeys(resolver.resolve(databaseManagerToken).connection(), ids),
        onRevoked: (id, actorId, how) =>
          resolver.has(studioCiSetupToken)
            ? resolver.resolve(studioCiSetupToken).keyRevoked(id, actorId, how)
            : Promise.resolve(),
      }),
    );
  }

  public override async boot(): Promise<void> {
    const { container } = this.app;
    // An application may be assembled without authorization (as its own tests do), and boot may run twice.
    if (this.releases.length > 0 || !container.has(authorizationToken)) return;
    const authz = container.resolve(authorizationToken);
    registerStudioSettings(authz);
    this.releases.push(
      // The owners own everything: the generic surface may not change who holds it, and one stays.
      authz.permissionSets.protect({
        owner: 'studio',
        keys: [ROLES.owner],
        allow: ['update'],
        requireActiveAssignment: true,
        assignableTo: ['user'],
      }),
      authz.permissionSets.protect({
        owner: 'studio',
        keys: [ROLES.admin, ROLES.contributor],
        allow: ['update', 'assign', 'revoke'],
        assignableTo: ['user'],
      }),
    );
    if (
      container.has(scopedApiKeysToken) &&
      container.has(userAdministrationServiceToken)
    ) {
      this.releases.push(
        await container.resolve(studioApiKeysToken).protectAll(),
      );
      this.releases.push(
        container
          .resolve(scopedApiKeysToken)
          .setOwnKeyPolicy(
            personalKeyPolicy(() => container.resolve(studioAccessToken)),
          ),
      );
    }
    if (container.has(apiKeyScopesToken))
      this.releases.push(
        registerStudioKeyScopes(
          container.resolve(apiKeyScopesToken),
          {
            'rel.apps': container.has(releasesToken)
              ? releasesKeyScopeObjects(() => container.resolve(releasesToken))
              : undefined,
            'pm.projects': projectsKeyScopeObjects(container),
          },
          () => container.resolve(studioAccessToken).catalog(),
        ),
      );
    if (container.has(userRoleScopeRegistryToken))
      this.releases.push(
        container
          .resolve(userRoleScopeRegistryToken)
          .register(
            createStudioUserRoleScope(
              authz,
              container.resolve(studioAccessToken),
              this.sets().rootSet,
            ),
          ),
      );
  }

  public override shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    return Promise.resolve();
  }
}
