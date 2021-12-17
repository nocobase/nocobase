import { Plugin } from '@nocobase/server';
import { CollectionManager } from './collection-manager';

export default class PluginCollectionManager extends Plugin {
  name() {
    return 'collection-manager';
  }

  async load(this: Plugin) {
    await CollectionManager.import(this.app.db);
  }
}
