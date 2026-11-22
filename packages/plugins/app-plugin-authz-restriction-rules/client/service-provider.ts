import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { AUTHORIZATION_NAMESPACE } from '@nocobase/app-plugin-authorization/client';
import {
  authorizationSettingsToken,
  loadRestrictionRules,
} from '@nocobase/app-plugin-authorization/client/settings';
import { ServiceProvider } from '@nocobase/service-provider';

/** Adds Restriction rules to the Data rules of the Roles and permissions page. */
export class RestrictionRulesServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-authz-restriction-rules/client';

  public override boot(): Promise<void> {
    this.app.container.resolve(authorizationSettingsToken).ruleTabs.add({
      key: 'restriction-rules',
      title: {
        key: 'settings.restrictionRules.title',
        ns: AUTHORIZATION_NAMESPACE,
      },
      order: 30,
      authz: {
        resource: { type: 'settings', id: 'authorization.restriction-rules' },
        action: 'read',
      },
      component: loadRestrictionRules,
    });
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  RestrictionRulesServiceProvider,
];

export default serviceProviders;
