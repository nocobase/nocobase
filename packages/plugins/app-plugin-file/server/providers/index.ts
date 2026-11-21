import { driveManagerToken } from '@nocobase/app-server/drive';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  ServerFileRepositoryManager,
  type FileDriveConfig,
} from '../repository.js';
import { serverFileRepositoryManagerToken } from '../token.js';

export class FileRepositoryServiceProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-file';
  public override register(): void {
    this.app.container.singleton(
      serverFileRepositoryManagerToken,
      (container) =>
        new ServerFileRepositoryManager(
          container.resolve(databaseManagerToken),
          container.resolve(driveManagerToken),
          this.app.config?.get<FileDriveConfig>('drive'),
        ),
    );
  }
}
const serviceProviders: readonly (typeof FileRepositoryServiceProvider)[] = [
  FileRepositoryServiceProvider,
];
export default serviceProviders;
