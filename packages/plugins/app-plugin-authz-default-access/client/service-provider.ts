import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { AUTHORIZATION_NAMESPACE } from '@nocobase/app-plugin-authorization/client';
import {
  authorizationSettingsToken,
  loadDefaultAccessRules,
} from '@nocobase/app-plugin-authorization/client/settings';
import { ServiceProvider } from '@nocobase/service-provider';

/** Adds Default access to the Data rules of the Roles and permissions page. */
export class DefaultAccessServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-authz-default-access/client';

  public override boot(): Promise<void> {
    this.app.container.resolve(authorizationSettingsToken).ruleTabs.add({
      key: 'default-access',
      title: {
        key: 'settings.defaultAccess.title',
        ns: AUTHORIZATION_NAMESPACE,
      },
      order: 10,
      authz: {
        resource: { type: 'settings', id: 'authorization.default-access' },
        action: 'read',
      },
      component: loadDefaultAccessRules,
    });
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  DefaultAccessServiceProvider,
];

export default serviceProviders;
