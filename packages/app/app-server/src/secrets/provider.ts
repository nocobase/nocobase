import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
import type { SecretsConfig } from './config.js';
import { createSecretsService } from './service.js';
import { secretsServiceToken } from './token.js';

export class SecretsProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/secrets';

  public override register(): void {
    this.app.container.singleton(secretsServiceToken, () =>
      createSecretsService(
        this.app.config.get<SecretsConfig>('secrets') ?? { keys: [] },
      ),
    );
  }
}
