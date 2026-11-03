import {
  apiClientToken,
  ClientApplication,
  realtimeClientToken,
  watchReadiness,
} from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { AuthorizationClient } from './authorization-client.js';
import { authorizationClientToken } from './tokens.js';
import {
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

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  AuthorizationServiceProvider,
];

export default serviceProviders;
