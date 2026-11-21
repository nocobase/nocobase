import {
  apiClientToken,
  ClientApplication,
  realtimeClientToken,
  watchReadiness,
} from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { AuthorizationClient } from './authorization-client.js';
import {
  AuthorizationSettings,
  type AuthorizationSettingsOptions,
} from './settings/extensions.js';
import {
  authorizationClientToken,
  authorizationSettingsToken,
} from './tokens.js';
import {
  DATA_RULES_TAB,
  PERMISSION_CHECK_TAB,
  ROLES_TAB,
} from './settings/tab-keys.js';
import {
  AUTHORIZATION_NAMESPACE,
  AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC,
  AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC,
} from '../shared.js';

export class AuthorizationServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-authorization/client';
  private unsubscribePermissionsChanged?: () => void;
  private releaseReadiness?: () => void;

  public override register(): void {
    this.app.container.singleton(
      authorizationClientToken,
      (resolver) => new AuthorizationClient(resolver.resolve(apiClientToken)),
    );
  }

  public override boot(): Promise<void> {
    if (this.unsubscribePermissionsChanged) return Promise.resolve();
    const authz = this.app.container.resolve(authorizationClientToken);
    const realtime = this.app.container.resolve(realtimeClientToken);
    const barrier = watchReadiness(
      realtime,
      [
        AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC,
        AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC,
      ],
      {
        onEvent: () => authz.invalidate(),
        onRecovery: () => authz.invalidate(),
      },
    );
    authz.waitForRealtime(barrier.wait);
    this.unsubscribePermissionsChanged = barrier.close;
    this.releaseReadiness = () =>
      authz.waitForRealtime(() => Promise.resolve());
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.unsubscribePermissionsChanged?.();
    this.unsubscribePermissionsChanged = undefined;
    this.releaseReadiness?.();
    this.releaseReadiness = undefined;
    return Promise.resolve();
  }
}

/**
 * The Roles and permissions page's extension points, with the application's page catalog. Its own three top tabs are
 * registered first, so another package's tab follows them unless it gives a lower `order`.
 */
export function authorizationSettingsProvider(
  options: AuthorizationSettingsOptions,
): ClientServiceProviderConstructor {
  return class AuthorizationSettingsServiceProvider extends ServiceProvider<ClientApplication> {
    public readonly name: string =
      '@nocobase/app-plugin-authorization/client/settings';

    public override register(): void {
      this.app.container.singleton(authorizationSettingsToken, () => {
        const settings = new AuthorizationSettings(options);
        settings.pageTabs.add({
          key: ROLES_TAB,
          title: { key: 'settings.roles', ns: AUTHORIZATION_NAMESPACE },
          order: 10,
          path: '/roles',
          authz: {
            resource: { type: 'settings', id: 'authorization.permission-sets' },
            action: 'read',
          },
        });
        settings.pageTabs.add({
          key: DATA_RULES_TAB,
          title: { key: 'settings.dataRules', ns: AUTHORIZATION_NAMESPACE },
          order: 20,
          path: '/default-access',
          authz: {
            resource: { type: 'settings', id: 'authorization.default-access' },
            action: 'read',
          },
        });
        // Reading anyone's permissions is for an unrestricted role only, as the inspector it reads requires.
        settings.pageTabs.add({
          key: PERMISSION_CHECK_TAB,
          title: {
            key: 'settings.permissionCheck.title',
            ns: AUTHORIZATION_NAMESPACE,
          },
          order: 30,
          path: '/permission-check',
          authz: 'unrestricted',
        });
        return settings;
      });
    }
  };
}

export default function serviceProviders(
  options: AuthorizationSettingsOptions,
): readonly ClientServiceProviderConstructor[] {
  return [AuthorizationServiceProvider, authorizationSettingsProvider(options)];
}
