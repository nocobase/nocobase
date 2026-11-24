import {
  createDriveManager,
  prepareDriveStorage,
  type AppDriveConfig,
} from '@nocobase/drive';
import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
import { resolveAppDriveConfig } from './config.js';
import { driveManagerToken } from './token.js';

export class DriveProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/drive';

  public override register(): void {
    const drive = this.getDriveConfig();
    this.app.container.singleton(driveManagerToken, () =>
      createDriveManager(drive),
    );
  }

  public override async boot(): Promise<void> {
    await prepareDriveStorage(this.getDriveConfig());
  }

  private getDriveConfig(): AppDriveConfig {
    return resolveAppDriveConfig(this.app.config)!;
  }
}
