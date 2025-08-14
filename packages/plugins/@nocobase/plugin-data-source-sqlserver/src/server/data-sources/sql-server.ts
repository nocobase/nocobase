/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, ICollectionManager } from '@nocobase/data-source-manager';
import sql from 'mssql';
import { SqlServerCollectionManager } from '../collection-managers/sql-server-collection-manager';

export class SqlServerDataSource extends DataSource {
  pool: sql.ConnectionPool;

  static async testConnection(options) {
    const pool = new sql.ConnectionPool(options);
    await pool.connect();
    await pool.close();
    return true;
  }

  createCollectionManager(options?: any): ICollectionManager {
    return new SqlServerCollectionManager();
  }

  async load() {
    this.pool = new sql.ConnectionPool(this.options);
    await this.pool.connect();
  }

  async getTables() {
    const request = this.pool.request();
    const result = await request.query(
      `SELECT table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE'`,
    );
    return result.recordset.map((row) => row.table_name);
  }

  async getColumns(tableName: string) {
    const request = this.pool.request();
    request.input('tableName', sql.NVarChar, tableName);
    const result = await request.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = @tableName`,
    );
    return result.recordset;
  }

  async close() {
    await this.pool.close();
  }
}
