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
      let selected: IdGeneratorService | undefined;
      const implementation = (): IdGeneratorService => {
        if (selected) return selected;
        // Select on first generation, not when an earlier provider resolves the service.
        selected = resolver.has(idGeneratorImplementationToken)
          ? resolver.resolve(idGeneratorImplementationToken)
          : new SnowflakeIdGenerator(
              this.app.config.get<SnowflakeIdGeneratorConfig>('snowflake')!,
            );
        return selected;
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
