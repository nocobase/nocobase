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
  public override async boot(): Promise<void> {
    const { data } = await this.app.container
      .resolve(apiClientToken)
      .request<{ data: FileUploadLimits }>({
        path: 'file/uploadLimits',
        method: 'GET',
      });
    this.app.container.instance(fileUploadLimitsToken, data);
  }
}
const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  ClientFileRepositoryServiceProvider,
];
export default serviceProviders;
