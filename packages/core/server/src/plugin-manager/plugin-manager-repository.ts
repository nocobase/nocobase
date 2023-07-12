import { Repository } from '@nocobase/database';
import { PluginManager } from './plugin-manager';
import { PluginData } from './types';

export class PluginManagerRepository extends Repository {
  pm: PluginManager;

  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  list(options: PluginData = {}) {
    return this.find({
      filter: {
        ...options,
      },
      sort: 'id',
    }).then((data) => data.map((item) => item.toJSON()));
  }
}
