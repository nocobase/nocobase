import { DataTypes } from '@nocobase/database';
import { Migration } from '../migration';
import { PluginManager } from '../plugin-manager';

export default class extends Migration {
  async up() {
    const collection = this.db.getCollection('applicationPlugins');
    if (!collection) {
      return;
    }

    const repository = this.db.getRepository<any>('applicationPlugins');

    const plugins = await repository.find();

    for (const plugin of plugins) {
      const { name } = plugin;

      if (plugin.packageName) {
        continue;
      }

      const packageName = PluginManager.getPackageName(name);

      await repository.update({
        filter: {
          name,
        },
        values: {
          packageName,
        },
      });

      console.log(name, packageName);
    }
  }
}
