import { Plugin } from '@nocobase/server';
import { Collection } from '@nocobase/database';
import { SqlCollection } from './sql-collection';

export class PluginCollectionSqlServer extends Plugin {
  async beforeLoad() {
    this.app.db.collectionFactory.registerCollectionType(SqlCollection, {
      condition: (options) => {
        return options.sql;
      },

      async onSync() {
        return;
      },

      async onDump(dumper, collection: Collection) {
        return;
      },
    });
  }
}

export default PluginCollectionSqlServer;
