import { ServiceProvider } from '@nocobase/service-provider';
import { databaseManagerToken } from '@nocobase/db';
import {
  defineServerPlugin,
  type AppServerPlugin,
  type AppPluginApplication,
} from '@nocobase/app-server/plugins';
import { modulesServiceToken } from '../../../server/index.js';
export const events: string[] = [];
class Provider extends ServiceProvider<AppPluginApplication> {
  public readonly name = 'fixture-module';
  public override register(): void {
    this.app.container.resolve(modulesServiceToken).register({
      id: 'fixture',
      packageName: '@example/app-module-fixture',
      namespace: 'fixture',
      entry: '/modules/fixture',
      icon: 'Box',
      tone: 1,
      start: async (onStop) => {
        for (const name of ['main', 'audit']) {
          const count = await this.app.container
            .resolve(databaseManagerToken)
            .connection(name)
            .repository('moduleRecords')
            .count();
          events.push(`${name}:${count}`);
        }
        onStop(() => {
          events.push('stop');
        });
      },
    });
  }
}
const plugin: AppServerPlugin = defineServerPlugin({
  packageName: '@example/app-module-fixture',
  baseDir: import.meta.dirname,
  serviceProviders: [Provider],
  database: { connections: { main: {}, audit: {} } },
});
export default plugin;
