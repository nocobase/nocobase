import { existsSync } from 'node:fs';

import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceProvider } from '@nocobase/service-provider';

import { DefaultFoundationService } from '../services/foundation.js';
import { runtimeProviderEvidence } from '../provider-inventory.js';
import { foundationServiceToken } from '../tokens.js';

export class FoundationProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-foundation';

  public override register(): void {
    this.app.container.singleton(
      foundationServiceToken,
      () =>
        new DefaultFoundationService({
          container: this.app.container,
          config: this.app.config,
          rootDir: this.app.paths.rootDir,
          runtimeProviders: () => runtimeProviderEvidence(this.app),
          serverRegistrationsComplete: () =>
            Array.isArray(this.app.registeredServerPlugins),
          // A deployment serves its built client from `clientDir`; in development that build does not exist yet and
          // Vite serves the sources in `client/`.
          hasClient: [
            this.app.paths.clientDir,
            this.app.paths.root('client'),
          ].some((directory) => existsSync(directory)),
        }),
    );
  }
}
