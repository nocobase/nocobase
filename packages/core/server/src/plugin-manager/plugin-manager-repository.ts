import { Repository } from '@nocobase/database';
import { PluginManager } from './plugin-manager';

export class PluginManagerRepository extends Repository {
  pm: PluginManager;

  setPluginManager(pm: PluginManager) {
    this.pm = pm;
  }

  list(appName: string, options: any = {}) {
    return this.find({
      filter: {
        appName,
        ...options,
      },
      sort: 'id',
    }).then((data) => data.map((item) => item.toJSON()));
  }
}
