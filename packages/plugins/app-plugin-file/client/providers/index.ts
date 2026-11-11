import { apiClientToken, type ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';
import type { FileUploadLimits } from '../../shared/upload-limits.js';
import { ClientFileRepositoryManager } from '../manager.js';
import {
  fileUploadLimitsToken,
  clientFileRepositoryManagerToken,
} from '../token.js';
export class ClientFileRepositoryServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-file';
  public override register(): void {
    this.app.container.singleton(
      clientFileRepositoryManagerToken,
      (container) =>
        new ClientFileRepositoryManager(container.resolve(apiClientToken)),
    );
  }
  public override boot(): Promise<void> {
    const drive = this.app.config.public.raw().drive as
      { uploadLimits?: FileUploadLimits } | undefined;
    if (drive?.uploadLimits)
      this.app.container.instance(fileUploadLimitsToken, drive.uploadLimits);
    return Promise.resolve();
  }
}
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  ClientFileRepositoryServiceProvider,
];
export default serviceProviders;
