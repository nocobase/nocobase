import { InstallOptions, Plugin } from '@nocobase/server';
import { query } from './actions/query';
export class ChartsV2Plugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource({
      name: 'charts',
      actions: {
        query,
      },
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default ChartsV2Plugin;
