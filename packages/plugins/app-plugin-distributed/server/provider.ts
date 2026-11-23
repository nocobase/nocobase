import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createDistributedStatusRegistry,
  distributedStatusToken,
} from './registry.js';

/** Registers the extension registry so other plugins can add checks and data in their `boot()`. */
export class DistributedStatusProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-distributed/status';

  public override register(): void {
    this.app.container.singleton(distributedStatusToken, () =>
      createDistributedStatusRegistry(),
    );
  }
}
