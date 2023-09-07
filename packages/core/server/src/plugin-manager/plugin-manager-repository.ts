import { Repository } from '@nocobase/database';
import lodash from 'lodash';
import { PluginManager } from './plugin-manager';
import { checkPluginPackage } from './utils';
import { PluginData } from './types';

export class PluginManagerRepository extends Repository {
  pm: PluginManager;

  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  async remove(name: string | string[]) {
    await this.destroy({
      filter: {
        name,
      },
    });
  }

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

  async upgrade(name: string, data: PluginData) {
    return this.update({
      filter: {
        name,
      },
      values: data,
    });
  }

  async disable(name: string | string[]) {
    name = lodash.cloneDeep(name);

    const pluginNames = lodash.castArray(name);
    console.log(`disable ${name}, ${pluginNames}`);
    const filter = {
      name,
    };

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
    try {
      // sort plugins by id
      return await this.find({
        sort: 'id',
      });
    } catch (error) {
      await this.collection.sync({
        alter: {
          drop: false,
        },
        force: false,
      });
      return await this.find({
        sort: 'id',
      });
    }
  }

  async init() {
    const exists = await this.collection.existsInDb();
    if (!exists) {
      return;
    }

    const items = await this.getItems();

    for (const item of items) {
      const json = item.toJSON();
      const { options, ...others } = item.toJSON();
      let hasError = false;
      try {
        await checkPluginPackage(json);
      } catch (e) {
        console.error(e);
        // if (json.enabled) {
        //   await this.disable(json.name);
        // }
        hasError = true;
      }

      // 如果插件资源有问题，跳过，否则会导致后续插件无法正常加载
      if (hasError) {
        continue;
      }
      try {
        await this.pm.add(item.get('name'), {
          ...others,
          ...options,
        });
      } catch (e) {
        console.error(e);
        // if (json.enabled) {
        //   await this.disable(json.name);
        // }
      }
    }
  }
}
