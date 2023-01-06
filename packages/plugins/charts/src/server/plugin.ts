import { InstallOptions, Plugin } from '@nocobase/server';
import { getChartData } from './actions';

export class ChartsPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource({
      name: 'chartData',
      actions: {
        data: getChartData,
      }
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('users', '*');
    this.app.acl.allow('chartData', '*');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ChartsPlugin;
