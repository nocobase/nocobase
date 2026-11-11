import {
  SnowflakeIdGenerator,
  type IdGeneratorService,
} from '@nocobase/snowflake';
import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
import { type SnowflakeIdGeneratorConfig } from './config.js';
import { idGeneratorImplementationToken, idGeneratorToken } from './token.js';

export class IdGeneratorProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/id-generator';

  public override register(): void {
    this.app.container.singleton(idGeneratorToken, (resolver) => {
      let manual: IdGeneratorService | undefined;
      const implementation = (): IdGeneratorService => {
        // Do not cache an absent extension: later providers may still register it.
        if (resolver.has(idGeneratorImplementationToken)) {
          return resolver.resolve(idGeneratorImplementationToken);
        }
        manual ??= new SnowflakeIdGenerator(
          this.app.config.get<SnowflakeIdGeneratorConfig>('snowflake')!,
        );
        return manual;
      };
      return {
        generate: () => implementation().generate(),
        generateString: () => implementation().generateString(),
      };
    });
  }

  public override async boot(): Promise<void> {
    if (this.app.container.has(idGeneratorImplementationToken)) {
      await this.app.container
        .resolve(idGeneratorImplementationToken)
        .initialize();
    }
  }
}
