/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<2.1.0-beta.26';
  async up() {
    const { db } = this.context;
    const executionCollection = db.getCollection('executions');
    const tableInfo = executionCollection.getTableNameWithSchema();
    const statusColumn = executionCollection.getField('status').columnName();
    const expiresAtColumn = executionCollection.getField('expiresAt').columnName();
    const parentExecutionIdColumn = executionCollection.getField('parentExecutionId').columnName();

    await db.sequelize.transaction(async (transaction) => {
      const tableExists = await this.queryInterface.tableExists(tableInfo, { transaction });
      if (!tableExists) {
        return;
      }

      const indexes = (await this.queryInterface.showIndex(tableInfo, { transaction })) as any[];
      const indexNames = new Set(indexes.map((index) => index.name));

      if (!indexNames.has('executions_status_expires_at')) {
        await this.queryInterface.addIndex(tableInfo, [statusColumn, expiresAtColumn], {
          name: 'executions_status_expires_at',
          transaction,
        });
      }

      if (!indexNames.has('executions_parent_execution_status')) {
        await this.queryInterface.addIndex(tableInfo, [parentExecutionIdColumn, statusColumn], {
          name: 'executions_parent_execution_status',
          transaction,
        });
      }
    });
  }
}
