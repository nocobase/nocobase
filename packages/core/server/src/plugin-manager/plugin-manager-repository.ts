import { Repository } from '@nocobase/database';
import lodash from 'lodash';
import { PluginManager } from './plugin-manager';

export class PluginManagerRepository extends Repository {
  /**
   * @internal
   */
  pm: PluginManager;

  /**
   * @internal
   */
  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  /**
   * @deprecated
   */
  async remove(name: string | string[]) {
    await this.destroy({
      filter: {
        name,
      },
    });
  }

  /**
   * @deprecated
   */
  async enable(name: string | string[]) {
    const pluginNames = lodash.castArray(name);
    const plugins = pluginNames.map((name) => this.pm.get(name));

    for (const plugin of plugins) {
      const requiredPlugins = plugin.requiredPlugins();
      for (const requiredPluginName of requiredPlugins) {
        const requiredPlugin = this.pm.get(requiredPluginName);
        if (!requiredPlugin.enabled) {
          throw new Error(`${plugin.name} plugin need ${requiredPluginName} plugin enabled`);
        }
      }
    }

    for (const plugin of plugins) {
      await plugin.beforeEnable();
    }

    await this.update({
      filter: {
        name,
      },
      values: {
        enabled: true,
        installed: true,
      },
    });
    return pluginNames;
  }

  async updateVersions() {
    const items = await this.find();
    for (const item of items) {
      const json = await PluginManager.getPackageJson(item.packageName);
      item.set('version', json.version);
      await item.save();
    }
  }

  /**
   * @deprecated
   */
  async disable(name: string | string[]) {
    name = lodash.cloneDeep(name);

    const pluginNames = lodash.castArray(name);
    console.log(`disable ${name}, ${pluginNames}`);
    const filter = {
      name,
    };

    console.log(JSON.stringify(filter, null, 2));
    await this.update({
      filter,
      values: {
        enabled: false,
        installed: false,
      },
    });
    return pluginNames;
  }

  async getItems() {
    const exists = await this.collection.existsInDb();
    if (!exists) {
      return [];
    }
    return await this.find({
      sort: 'id',
    });
  }

  async init() {
    const items = await this.getItems();
    for (const item of items) {
      const { options, ...others } = item.toJSON();
      await this.pm.add(item.get('name'), {
        ...others,
        ...options,
      });
    }
  }
}
