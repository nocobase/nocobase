import { ServiceProvider } from '@nocobase/service-provider';
import { databaseManagerToken } from '@nocobase/db';

import type { AppPluginApplication } from '../plugins/index.js';
import { type AppSnowflakeConfig } from './config.js';
import { AppIdGenerator } from './lifecycle.js';
import { idGeneratorToken, idGeneratorLifecycleToken } from './token.js';

export class IdGeneratorProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/id-generator';

  public override register(): void {
    const generator = new AppIdGenerator(
      this.app.config.get<AppSnowflakeConfig>('snowflake')!,
    );
    this.app.container.instance(idGeneratorLifecycleToken, generator);
    this.app.container.singleton(idGeneratorToken, () => generator);
  }

  public override async boot(): Promise<void> {
    // With a database, its Provider initializes after storage preparation and before tasks.
    if (!this.app.container.has(databaseManagerToken)) {
      await this.app.container.resolve(idGeneratorLifecycleToken).initialize();
    }
  }

  public override async shutdown(): Promise<void> {
    await this.app.container
      .resolveIfCreated(idGeneratorLifecycleToken)
      ?.shutdown();
  }
}
