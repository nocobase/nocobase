import { databaseManagerToken } from '@nocobase/db';
import { loggingToken } from '@nocobase/app-server/logging';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { apiDocsToken } from '@nocobase/app-server/router';
import {
  ServiceProvider,
  type ServiceResolver,
} from '@nocobase/service-provider';
import {
  realtimeServiceToken,
  type RealtimePublicTopic,
  type RealtimeUserTopic,
} from '@nocobase/app-server/realtime';

import {
  createAppAuthorization,
  type AppAuthorization,
  type AuthorizationConfig,
} from '../authorization.js';
import { documentAuthorizationRoutes } from '../extension/http.js';
import { authorizationToken } from '../tokens.js';
import { reportAuthorizationUi } from '../ui.js';
import { reportStoredGrants, storedGrantProblems } from '../stored-grants.js';
import {
  AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC,
  AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC,
} from '../../shared.js';

export type AuthorizationProviderApplication = AppPluginApplication;

export class AuthorizationProvider<
  TApplication extends AuthorizationProviderApplication =
    AuthorizationProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-authorization';
  private instance?: AppAuthorization;
  private permissionsChangedTopic?: RealtimeUserTopic<{
    readonly type: 'permissions-changed';
  }>;
  private globalPermissionsChangedTopic?: RealtimePublicTopic<{
    readonly type: 'permissions-changed';
  }>;
  private removeApiRoutes?: () => void;

  public override register(): void {
    this.app.container.singleton(authorizationToken, (container) =>
      this.authorization(container),
    );
  }

  private authorization(container: ServiceResolver): AppAuthorization {
    this.instance ??= createAppAuthorization({
      database: container.has(databaseManagerToken)
        ? container.resolve(databaseManagerToken)
        : undefined,
      connection: container.has(databaseManagerToken)
        ? container.resolve(databaseManagerToken).connection()
        : undefined,
      config: this.app.config.get<AuthorizationConfig>('authorization'),
      onUserPermissionsChanged: (userId) => {
        this.permissionsChangedTopic?.publishFor(userId, {
          type: 'permissions-changed',
        });
      },
      onAuthenticatedPermissionsChanged: () => {
        this.globalPermissionsChangedTopic?.publish({
          type: 'permissions-changed',
        });
      },
      onInvalidGrant: (grant) =>
        this.warn(
          `Authorization: skipped a grant from ${grant.source.plugin}:${grant.source.id} on ${grant.resource.type}:${grant.resource.id}.${grant.action}, which no longer applies: ${grant.reason}`,
        ),
    });
    return this.instance;
  }

  private warn(message: string): void {
    if (this.app.container.has(loggingToken))
      this.app.container
        .resolve(loggingToken)
        .getLogger('authorization')
        .warn(message);
    else console.warn(message);
  }

  public override boot(): Promise<void> {
    // The settings routes sit behind the `/api/authorization` dispatcher, where the document generator cannot see them,
    // so every `authz.routes` registration is registered with the API documentation: each router forwarded to, and each
    // plain function as an undeclared route the API document check reports. Every rule plugin registers its routes
    // while the authorization instance is created, so they are all there by now.
    if (
      this.app.container.has(apiDocsToken) &&
      this.app.container.has(authorizationToken)
    ) {
      this.removeApiRoutes?.();
      this.removeApiRoutes = documentAuthorizationRoutes(
        this.app.container.resolve(apiDocsToken),
        this.app.container.resolve(authorizationToken).routes,
        (message) => this.warn(message),
      );
    }
    if (this.app.container.has(realtimeServiceToken)) {
      this.permissionsChangedTopic = this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic(AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC, {
          audience: 'user',
        });
      this.globalPermissionsChangedTopic = this.app.container
        .resolve(realtimeServiceToken)
        .defineTopic(AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC, {
          audience: 'public',
        });
    }
    return Promise.resolve();
  }

  /**
   * Every provider has booted, so every plugin has placed its resources:
   * check the workspace placements once. Errors throw in development and are
   * logged in production.
   */
  public override async start(): Promise<void> {
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    const options = {
      production: process.env.NODE_ENV === 'production',
      warn: (message: string) => this.warn(message),
    };
    const report = authz.ui.validate(authz);
    reportAuthorizationUi(
      {
        errors: report.errors,
        warnings: [
          ...report.warnings,
          ...authz.database.collections.warnings(),
        ],
      },
      options,
    );
    // Stored grants live in the database; without one there is nothing to scan.
    if (this.app.container.has(databaseManagerToken))
      reportStoredGrants(await storedGrantProblems(authz), options);
  }

  public override shutdown(): Promise<void> {
    this.removeApiRoutes?.();
    this.removeApiRoutes = undefined;
    this.permissionsChangedTopic?.close();
    this.permissionsChangedTopic = undefined;
    this.globalPermissionsChangedTopic?.close();
    this.globalPermissionsChangedTopic = undefined;
    return Promise.resolve();
  }
}
