import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { AUTHORIZATION_NAMESPACE } from '@nocobase/app-plugin-authorization/client';
import {
  authorizationSettingsToken,
  loadSharingRules,
} from '@nocobase/app-plugin-authorization/client/settings';
import { ServiceProvider } from '@nocobase/service-provider';

/** Adds Sharing rules to the Data rules of the Roles and permissions page. */
export class SharingRulesServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-authz-sharing-rules/client';

  public override boot(): Promise<void> {
    this.app.container.resolve(authorizationSettingsToken).ruleTabs.add({
      key: 'sharing-rules',
      title: {
        key: 'settings.sharingRules.title',
        ns: AUTHORIZATION_NAMESPACE,
      },
      order: 20,
      authz: {
        resource: { type: 'settings', id: 'authorization.sharing-rules' },
        action: 'read',
      },
      component: loadSharingRules,
    });
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  SharingRulesServiceProvider,
];

export default serviceProviders;
