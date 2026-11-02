import {
  createDriveManager,
  prepareDriveStorage,
  type AppDriveConfig,
} from '@nocobase/drive';
import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
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
    const config = this.app.config.get<AppDriveConfig>('drive')!;
    const s3 = config.disks.s3;
    if (typeof s3 === 'function' || s3?.driver !== 's3' || s3.bucket)
      return config;
    const { s3: _s3, ...disks } = config.disks;
    return { ...config, disks };
  }
}
