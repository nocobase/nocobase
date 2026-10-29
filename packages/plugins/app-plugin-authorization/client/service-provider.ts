import {
  apiClientToken,
  ClientApplication,
  realtimeClientToken,
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
  private unsubscribeGlobalPermissionsChanged?: () => void;
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
    const ready = new Set<string>();
    const topics = [
      AUTHORIZATION_PERMISSIONS_CHANGED_TOPIC,
      AUTHORIZATION_GLOBAL_PERMISSIONS_CHANGED_TOPIC,
    ];
    let gate = Promise.resolve();
    let resolve = () => {};
    let fallback = false;
    let open = false;
    let timer: ReturnType<typeof setTimeout>;
    const renew = () => {
      clearTimeout(timer);
      gate = new Promise<void>((done) => {
        resolve = done;
      });
      ready.clear();
      fallback = false;
      open = false;
      // A refused or unavailable socket must not prevent HTTP authorization.
      timer = setTimeout(() => {
        fallback = true;
        open = true;
        resolve();
      }, 1000);
    };
    renew();
    authz.waitForRealtime(() => gate);
    this.releaseReadiness = () => {
      clearTimeout(timer);
      resolve();
      authz.waitForRealtime(() => Promise.resolve());
    };
    const watch = (topic: string) =>
      realtime.watch(topic, {
        onEvent: () => authz.invalidate(),
        onReady: () => {
          ready.add(topic);
          if (ready.size !== topics.length) return;
          clearTimeout(timer);
          open = true;
          resolve();
          if (fallback) {
            fallback = false;
            authz.invalidate();
          }
        },
        onStateChange: (state) => {
          if (state === 'subscribed') return;
          if (open) {
            renew();
            authz.invalidate();
          }
          ready.delete(topic);
        },
        onError: () => {
          fallback = true;
          open = true;
          clearTimeout(timer);
          resolve();
        },
      });
    this.unsubscribePermissionsChanged = watch(topics[0]).close;
    this.unsubscribeGlobalPermissionsChanged = watch(topics[1]).close;
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    this.unsubscribePermissionsChanged?.();
    this.unsubscribePermissionsChanged = undefined;
    this.unsubscribeGlobalPermissionsChanged?.();
    this.unsubscribeGlobalPermissionsChanged = undefined;
    this.releaseReadiness?.();
    this.releaseReadiness = undefined;
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  AuthorizationServiceProvider,
];

export default serviceProviders;
