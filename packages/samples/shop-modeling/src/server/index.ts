import path from 'path';

import { InstallOptions, Plugin } from '@nocobase/server';

import SnowflakeField from './fields/SnowflakeField';

export class ShopPlugin extends Plugin {
  getName(): string {
    return this.getPackageName(__dirname);
  }

  initialize() {
    this.db.registerFieldTypes({
      snowflake: SnowflakeField
    });
  }

  beforeLoad() {
    // TODO
  }

  async load() {
    await this.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.acl.allow('products', '*');
    this.app.acl.allow('categories', '*');
    this.app.acl.allow('orders', '*');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ShopPlugin;
