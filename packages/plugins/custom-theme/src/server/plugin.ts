import { InstallOptions, Plugin } from '@nocobase/server';

export class CustomThemePlugin extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.db.collection({
      name: 'theme',
      fields: [
        {
          type: 'string',
          name: 'config',
        },
        {
          type: 'boolean',
          name: 'enabled',
        },
      ],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CustomThemePlugin;
