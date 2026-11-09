import { SnowflakeIdGenerator } from '@nocobase/snowflake';
import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
import { type SnowflakeIdGeneratorConfig } from './config.js';
import { idGeneratorToken } from './token.js';

export class IdGeneratorProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/id-generator';

  public override register(): void {
    const config =
      this.app.config.get<SnowflakeIdGeneratorConfig>('snowflake')!;
    this.app.container.singleton(
      idGeneratorToken,
      () => new SnowflakeIdGenerator(config),
    );
  }
}
