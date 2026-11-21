import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { distributedStatusToken } from '../../server/index.js';

/** What an external plugin such as a worker-ID plugin does: adds a check and data only when this plugin is present. */
export class FixtureStatusExtension extends ServiceProvider<
  Pick<AppPluginApplication, 'container'>
> {
  public readonly name: string = 'fixture-status-extension';

  public override async boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(distributedStatusToken)) return;
    const status = container.resolve(distributedStatusToken);
    status.addCheck({
      id: 'fixture.instances',
      run: () => [
        {
          id: 'fixture.instances',
          level: 'ok',
          title: 'Running instances',
          detail: 'Two instances took worker IDs.',
        },
      ],
    });
    status.addData('fixture', () => ({ instances: ['node-a', 'node-b'] }));
  }
}
