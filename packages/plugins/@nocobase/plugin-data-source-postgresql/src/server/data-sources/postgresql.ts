/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource, ICollectionManager } from '@nocobase/data-source-manager';
import { Pool } from 'pg';
import { PostgreSqlCollectionManager } from '../collection-managers/postgresql-collection-manager';

export class PostgreSqlDataSource extends DataSource {
  pool: Pool;

  static async testConnection(options) {
    const pool = new Pool(options);
    const client = await pool.connect();
    client.release();
    await pool.end();
    return true;
  }

  createCollectionManager(options?: any): ICollectionManager {
    return new PostgreSqlCollectionManager();
  }

  async load() {
    this.pool = new Pool(this.options);
  }

  async getTables() {
    const result = await this.pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    return result.rows.map((row) => row.table_name);
  }

  async getColumns(tableName: string) {
    const result = await this.pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [tableName],
    );
    return result.rows;
  }

  async close() {
    await this.pool.end();
  }
}
