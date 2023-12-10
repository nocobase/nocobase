import { Plugin } from '@nocobase/server';
import { SqlCollection } from './sql-collection';

export class PluginCollectionSqlServer extends Plugin {
  async beforeLoad() {
    this.app.db.collectionFactory.registerCollectionType(SqlCollection, {
      condition: (options) => {
        return options.sql;
      },
    });
  }
}

export default PluginCollectionSqlServer;
