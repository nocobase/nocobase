import { apiClientToken, ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { configureWorkflowClient } from './workflow-management/runtime.js';

export class WorkflowServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-dag-flow/client';

  public override boot(): Promise<void> {
    configureWorkflowClient(this.app.container.resolve(apiClientToken));
    return Promise.resolve();
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  WorkflowServiceProvider,
];

export default serviceProviders;
