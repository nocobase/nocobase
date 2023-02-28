import { Repository } from '@nocobase/database';
import { PluginManager } from './PluginManager';

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
    const pluginNames = typeof name === 'string' ? [name] : name;
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
    const pluginNames = typeof name === 'string' ? [name] : name;
    await this.update({
      filter: {
        name,
      },
      values: {
        enabled: false,
        installed: false,
      },
    });
    return pluginNames;
  }

  async load() {
    // sort plugins by id
    const items = await this.find({
      sort: 'id',
    });

    for (const item of items) {
      await this.pm.addStatic(item.get('name'), {
        ...item.get('options'),
        name: item.get('name'),
        version: item.get('version'),
        enabled: item.get('enabled'),
        async: true,
      });
    }
  }
}
