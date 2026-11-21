import {
  defineClientPlugin,
  type AppClientPluginFactory,
} from '@nocobase/app-client/plugins';
import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import type { ReactElement } from 'react';

import {
  distributedStatusSlotsToken,
  type DistributedStatusBlockProps,
} from '../../client/index.js';

function InstancesBlock({
  status,
}: DistributedStatusBlockProps): ReactElement {
  const data = status.extensions.fixture as { instances: string[] } | undefined;
  return <p>Running instances: {data?.instances.join(', ')}</p>;
}

class FixtureSlotsProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = 'fixture-status-slots';

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(distributedStatusSlotsToken)) return;
    container.resolve(distributedStatusSlotsToken).register({
      slot: 'idGeneration',
      id: 'fixture:instances',
      load: async () => ({ default: InstancesBlock }),
    });
  }
}

/** An external plugin that inserts a block into the status page. */
export const fixtureClientPlugin: AppClientPluginFactory = defineClientPlugin({
  packageName: '@nocobase/fixture-distributed-extension',
  serviceProviders: [FixtureSlotsProvider],
});
