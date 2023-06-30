import { Cache, createCache } from '@nocobase/cache';
import { InstallOptions, Plugin } from '@nocobase/server';
import { query } from './actions/query';

export class DataVisualizationPlugin extends Plugin {
  cache: Cache;

  afterAdd() {}

  beforeLoad() {
    this.app.resource({
      name: 'charts',
      actions: {
        query,
      },
    });
    this.app.acl.allow('charts', 'query', 'loggedIn');
  }

  async load() {
    this.cache = createCache({
      ttl: 30, // seconds
      max: 1000,
      store: 'memory',
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default DataVisualizationPlugin;
