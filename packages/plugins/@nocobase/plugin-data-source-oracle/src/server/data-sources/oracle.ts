/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, ICollectionManager } from '@nocobase/data-source-manager';
import oracledb from 'oracledb';
import { OracleCollectionManager } from '../collection-managers/oracle-collection-manager';

export class OracleDataSource extends DataSource {
  pool: oracledb.Pool;

  static async testConnection(options) {
    const connection = await oracledb.getConnection(options);
    await connection.close();
    return true;
  }

  createCollectionManager(options?: any): ICollectionManager {
    return new OracleCollectionManager();
  }

  async load() {
    this.pool = await oracledb.createPool(this.options);
  }

  async getTables() {
    const connection = await this.pool.getConnection();
    const result = await connection.execute(`SELECT table_name FROM user_tables`);
    await connection.close();
    return (result.rows as any[]).map((row) => row[0]);
  }

  async getColumns(tableName: string) {
    const connection = await this.pool.getConnection();
    const result = await connection.execute(
      `SELECT column_name, data_type FROM user_tab_columns WHERE table_name = :tableName`,
      [tableName],
    );
    await connection.close();
    return result.rows;
  }

  async close() {
    await this.pool.close();
  }
}
