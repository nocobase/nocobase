import { Plugin } from '@nocobase/server';
import { DataSourceManager } from '@nocobase/data-source-manager';
import { OracleDataSource } from './data-sources/oracle';
import { OracleDialect } from './dialects/oracle-dialect';

export class PluginDataSourceOracleServer extends Plugin {
  async afterLoad() {
    const dataSourceManager = this.app.getPlugin<DataSourceManager>('data-source-manager');
    if (dataSourceManager) {
      dataSourceManager.addDataSourceType('oracle', OracleDataSource);
    }
    this.app.db.registerDialect(OracleDialect);
  }

  async load() {
    // TODO: implement Oracle-specific logic
  }
}

export default PluginDataSourceOracleServer;
