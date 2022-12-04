import path from 'path';

import {InstallOptions, Plugin} from '@nocobase/server';

import SnowflakeField from './fields/SnowflakeField';

export class ShopPlugin extends Plugin {

  afterAdd() {
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

    this.app.acl.skip('products', '*');
    this.app.acl.skip('categories', '*');
    this.app.acl.skip('orders', '*');
  }

  async install(options: InstallOptions) {
    // TODO
  }
}

export default ShopPlugin;
