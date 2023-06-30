import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import localization from './actions/localization';

export class LocalizationManagementPlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });

    this.app.resource({
      name: 'localization',
      actions: localization,
    });

    this.app.acl.allow('localization', 'all', 'public');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.localization`,
      actions: ['localization:*'],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default LocalizationManagementPlugin;
