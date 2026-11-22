import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';

import { distributedStatusSlotsToken } from '../../client/index.js';

class FixtureSlotsProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = 'fixture-status-slots';

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(distributedStatusSlotsToken)) return;
    container.resolve(distributedStatusSlotsToken).register({
      slot: 'idGeneration',
      id: 'fixture:instances',
      load: () => import('./instances-block.js'),
    });
  }
}

/** An external plugin that inserts a block into the status page. */
export const fixtureClientPlugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/fixture-distributed-extension',
  serviceProviders: [FixtureSlotsProvider],
});
