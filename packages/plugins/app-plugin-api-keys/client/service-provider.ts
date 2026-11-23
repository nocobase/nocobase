import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { authorizationSettingsToken } from '@nocobase/app-plugin-authorization/client/settings';
import { ServiceProvider } from '@nocobase/service-provider';

import { API_KEYS_NAMESPACE } from './namespace.js';

/**
 * Adds API keys to Roles and permissions › Permission check: a system key or a member's personal key is checked as a
 * request made with it, its holder's permissions narrowed by the key's.
 */
export class ApiKeysServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-api-keys/client';
  private readonly releases: (() => void)[] = [];

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(authorizationSettingsToken)) return Promise.resolve();
    const settings = container.resolve(authorizationSettingsToken);
    this.releases.push(
      settings.checkSubjects.add({
        key: 'systemKey',
        type: 'apiKey',
        title: { key: 'check.systemKey', ns: API_KEYS_NAMESPACE },
        order: 10,
        picker: () => import('./pages/pick-system-key.js'),
      }),
      settings.checkSubjects.add({
        key: 'personalKey',
        type: 'apiKey',
        title: { key: 'check.personalKey', ns: API_KEYS_NAMESPACE },
        order: 20,
        picker: () => import('./pages/pick-personal-key.js'),
      }),
    );
    return Promise.resolve();
  }

  public override shutdown(): Promise<void> {
    for (const release of this.releases.splice(0)) release();
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  ApiKeysServiceProvider,
];

export default serviceProviders;
