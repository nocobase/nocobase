/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, ICollectionManager } from '@nocobase/data-source-manager';
import mysql from 'mysql2/promise';
import { MySqlCollectionManager } from '../collection-managers/mysql-collection-manager';

export class MySqlDataSource extends DataSource {
  pool: mysql.Pool;

  static async testConnection(options) {
    const connection = await mysql.createConnection(options);
    await connection.close();
    return true;
  }

  createCollectionManager(options?: any): ICollectionManager {
    return new MySqlCollectionManager();
  }

  async load() {
    this.pool = mysql.createPool(this.options);
  }

  async getTables() {
    const [rows] = await this.pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`,
    );
    return (rows as any[]).map((row) => row.table_name);
  }

  async getColumns(tableName: string) {
    const [rows] = await this.pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?`,
      [tableName],
    );
    return rows;
  }

  async close() {
    await this.pool.end();
  }
}
