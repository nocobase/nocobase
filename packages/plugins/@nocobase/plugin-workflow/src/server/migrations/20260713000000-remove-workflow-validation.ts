/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import type { QueryInterface, QueryInterfaceOptions } from 'sequelize';

type TransactionalDescribeTable = (
  tableName: Parameters<QueryInterface['describeTable']>[0],
  options?: QueryInterfaceOptions,
) => ReturnType<QueryInterface['describeTable']>;

export default class extends Migration {
  on = 'afterSync';

  async up() {
    const { db } = this.context;
    const workflows = db.getCollection('workflows');
    const tableInfo = workflows.getTableNameWithSchema();

    await db.sequelize.transaction(async (transaction) => {
      const tableExists = await this.queryInterface.tableExists(tableInfo, { transaction });
      if (!tableExists) {
        return;
      }

      // Sequelize forwards query options at runtime, but the bundled describeTable type omits Transactionable.
      const describeTable = this.queryInterface.describeTable.bind(this.queryInterface) as TransactionalDescribeTable;
      const columns = await describeTable(tableInfo, { transaction });
      if (!columns.validation) {
        return;
      }

      await this.queryInterface.removeColumn(tableInfo, 'validation', { transaction });
      if (db.sequelize.getDialect() === 'sqlite') {
        const syncOptions = { hooks: false, transaction };
        await workflows.model.sync(syncOptions);
      }
    });
  }
}
