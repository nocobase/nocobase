import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

import SnowflakeField from './fields/SnowflakeField';

export class ShopPlugin extends Plugin {
  afterAdd() {
    this.db.registerFieldTypes({
      snowflake: SnowflakeField,
    });
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    await this.importCollections(path.resolve(__dirname, 'collections'));

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('orders', '*');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async install(options: InstallOptions) {
    // TODO
  }
}

export default ShopPlugin;
