import { ServiceProvider } from '@nocobase/service-provider';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseTaskCoordinatorToken } from '@nocobase/app-server/database';
import { DefaultModulesService } from '../services/modules.js';
import { modulesServiceToken } from '../tokens.js';
export class ModulesProvider extends ServiceProvider<AppPluginApplication> {
  public readonly name: string = '@nocobase/app-plugin-modules';
  private readonly service = new DefaultModulesService(
    (packageName) =>
      this.app.registeredServerPlugins?.some(
        (plugin) =>
          plugin.packageName === packageName &&
          (plugin.contributions.migrations || plugin.contributions.seeds),
      ) ?? false,
  );
  public override register(): void {
    if (this.app.container.has(databaseTaskCoordinatorToken))
      throw new Error(
        'Modules requires the database task coordinator. Register module management through ModulesService.setManagement().',
      );
    this.app.container.instance(modulesServiceToken, this.service);
    this.app.container.singleton(
      databaseTaskCoordinatorToken,
      () => (context) => this.service.coordinate(context),
    );
  }
  public override async ready(): Promise<void> {
    await this.service.ready();
  }
  public override async shutdown(): Promise<void> {
    await this.service.shutdown();
  }
}
