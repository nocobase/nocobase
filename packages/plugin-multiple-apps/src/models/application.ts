import Database, { IDatabaseOptions, Model, TransactionAble } from '@nocobase/database';
import { Application } from '@nocobase/server';
import lodash from 'lodash';

export class ApplicationModel extends Model {
  getPluginByName(pluginName: string) {
    return require(pluginName).default;
  }

  async registerToMainApp(mainApp: Application, options: TransactionAble) {
    const { transaction } = options;
    const appName = this.get('name') as string;
    const app = mainApp.multiAppManager.createApplication(appName, ApplicationModel.initOptions(appName, mainApp));

    // @ts-ignore
    const plugins = await this.getPlugins({ transaction });

    for (const pluginInstance of plugins) {
      const plugin = this.getPluginByName(pluginInstance.get('name') as string);
      app.plugin(plugin);
    }
  }

  static initOptions(appName: string, mainApp: Application) {
    const rawDatabaseOptions = lodash.isPlainObject(mainApp.options.database)
      ? (mainApp.options.database as IDatabaseOptions)
      : (mainApp.options.database as Database).options;

    if (rawDatabaseOptions.dialect === 'sqlite') {
      // rawDatabaseOptions.storage = '';
    } else {
      rawDatabaseOptions.database = appName;
    }

    return {
      database: rawDatabaseOptions,
    };
  }
}
