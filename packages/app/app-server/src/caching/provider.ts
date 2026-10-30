import { createCaching } from '@nocobase/caching';
import { ServiceProvider } from '@nocobase/service-provider';

import type { AppPluginApplication } from '../plugins/index.js';
import { type CachingConfig } from './config.js';
import { cachingToken } from './token.js';

export class CachingProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-server/caching';

  public override register(): void {
    const config = this.app.config.get<CachingConfig>('caching')!;
    this.app.container.singleton(cachingToken, () => createCaching(config));
  }

  public override boot(): Promise<void> {
    this.app.container.resolve(cachingToken).validateDefaultProvider();
    return Promise.resolve();
  }
  public override async shutdown(): Promise<void> {
    await this.app.container.resolveIfCreated(cachingToken)?.dispose();
  }
}
