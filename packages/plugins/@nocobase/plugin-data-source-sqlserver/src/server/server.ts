import { Plugin } from '@nocobase/server';
import { DataSourceManager } from '@nocobase/data-source-manager';
import { SqlServerDataSource } from './data-sources/sql-server';
import { SqlServerDialect } from './dialects/sql-server';

export class PluginDataSourceSqlServerServer extends Plugin {
  async afterLoad() {
    const dataSourceManager = this.app.getPlugin<DataSourceManager>('data-source-manager');
    if (dataSourceManager) {
      dataSourceManager.addDataSourceType('sqlserver', SqlServerDataSource);
    }
    this.app.db.registerDialect(SqlServerDialect);
  }

  async load() {
    // TODO: implement SQL Server-specific logic
  }
}

export default PluginDataSourceSqlServerServer;
