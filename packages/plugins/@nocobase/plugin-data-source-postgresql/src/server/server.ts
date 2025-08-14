import { Plugin } from '@nocobase/server';
import { DataSourceManager } from '@nocobase/data-source-manager';
import { PostgreSqlDataSource } from './data-sources/postgresql';
import { PostgreSqlDialect } from './dialects/postgresql-dialect';

export class PluginDataSourcePostgreSqlServer extends Plugin {
  async afterLoad() {
    const dataSourceManager = this.app.getPlugin<DataSourceManager>('data-source-manager');
    if (dataSourceManager) {
      dataSourceManager.addDataSourceType('postgres', PostgreSqlDataSource);
    }
    this.app.db.registerDialect(PostgreSqlDialect);
  }

  async load() {
    // TODO: implement PostgreSQL-specific logic
  }
}

export default PluginDataSourcePostgreSqlServer;
