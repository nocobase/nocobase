import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  demoDataToken,
  demoModeServiceToken,
} from '@nocobase/app-plugin-demo-mode/server/tokens';
import { createDemoBusiness } from '../demo/business.js';
import { createDemoDataset } from '../demo/dataset.js';

export class DemoProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = 'app/demo-projects';
  public override async boot(): Promise<void> {
    const container = this.app.container;
    if (!container.resolve(demoModeServiceToken).enabled) return;
    container
      .resolve(demoDataToken)
      .register(
        createDemoDataset(
          createDemoBusiness(container.resolve(databaseManagerToken)),
        ),
      );
  }
}
