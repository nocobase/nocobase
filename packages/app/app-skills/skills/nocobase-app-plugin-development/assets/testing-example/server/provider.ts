import { authorizationToken } from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import type { ReadingListConfig } from './config.js';
import { ReadingListService, readingListToken } from './service.js';

export class ReadingListProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@example/app-plugin-reading-list';

  public override register(): void {
    this.app.container.singleton(readingListToken, (resolver) => {
      const config = this.app.config.get<ReadingListConfig>('readingList');
      if (!config)
        throw new Error(
          'Register defineReadingListConfig() under readingList.',
        );
      return new ReadingListService(
        resolver.resolve(databaseManagerToken),
        config.pageSize,
      );
    });
  }

  public override async boot(): Promise<void> {
    const authz = this.app.container.resolve(authorizationToken);
    authz.resourceTypes.add({ type: 'readingList', actions: ['read'] });
    authz.ui.defaultSection('readingList', 'business');
  }
}
