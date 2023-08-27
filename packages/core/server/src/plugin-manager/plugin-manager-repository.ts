import { Repository, UpdateOrCreateOptions } from '@nocobase/database';
import lodash, { isBoolean } from 'lodash';
import { PluginManager } from './plugin-manager';

export class PluginManagerRepository extends Repository {
  pm: PluginManager;
  _authenticated: boolean;

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
    if (!(await this.authenticate())) {
      return [];
    }
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

  async authenticate() {
    if (!isBoolean(this._authenticated)) {
      this._authenticated = await this.collection.existsInDb();
    }
    return this._authenticated;
  }

  async updateOrCreate(options: UpdateOrCreateOptions) {
    if (!(await this.authenticate())) {
      return;
    }
    return super.updateOrCreate(options);
  }

  async init() {
    if (!(await this.authenticate())) {
      return;
    }

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
