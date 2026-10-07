import type { ClientApplication } from '@nocobase/app-client';
import type { ClientServiceProviderConstructor } from '@nocobase/app-client/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import {
  createDriverFormRegistry,
  hostDriverForm,
  releasesDriverFormsToken,
} from './driver-forms/index.js';

/** Binds the driver form registry, with the Host driver's form; driver packages add theirs when they boot. */
export class ReleasesClientServiceProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string = '@nocobase/app-plugin-releases/client';

  public override register(): void {
    this.app.container.singleton(releasesDriverFormsToken, () =>
      createDriverFormRegistry([hostDriverForm]),
    );
  }
}

const serviceProviders: readonly ClientServiceProviderConstructor[] = [
  ReleasesClientServiceProvider,
];

export default serviceProviders;
