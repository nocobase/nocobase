import { InstallOptions, Plugin } from '@nocobase/server';

export class DatasetPlugin extends Plugin {
  afterAdd() {
  }

  beforeLoad() {
  }

  async load() {
    // create dataset collection
    this.db.collection({
      'name': 'datasets',
      fields: [
        {
          name: 'data_set_name',
          type: 'string',
        },
        {
          name: 'data_set_id',
          type: 'string',
        },
        {
          name: 'data_set_type',
          type: 'string',
        },
        {
          name: 'data_set_value',
          type: 'text',
        },
      ],
    });
    // sync database
    await this.db.sync();
    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('users', '*');
    this.app.acl.allow('datasets', '*');
  }

  async install(options?: InstallOptions) {
  }

  async afterEnable() {
  }

  async afterDisable() {
  }

  async remove() {
  }
}

export default DatasetPlugin;
