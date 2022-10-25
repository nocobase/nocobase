import { Repository } from '@nocobase/database';
import { PluginManager } from './PluginManager';

export class PluginManagerRepository extends Repository {
  pm: PluginManager;

  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  async register() {
    const items = await this.find();
    for (const item of items) {
      await this.pm.addStatic(item.get('name'), {
        ...item.get('options'),
        name: item.get('name'),
        version: item.get('version'),
        enabled: item.get('enabled'),
      });
    }
  }
}
