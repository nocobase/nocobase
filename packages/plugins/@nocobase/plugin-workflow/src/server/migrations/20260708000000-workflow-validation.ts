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
  on = 'beforeLoad';

  async up() {
    const collection = this.db.getCollection('workflows');
    const field = collection.getField('validation');
    const tableName = collection.getTableNameWithSchema();

    await this.db.sequelize.transaction(async (transaction) => {
      if (!(await collection.existsInDb({ transaction })) || (await field.existsInDb({ transaction }))) {
        return;
      }

      await this.queryInterface.addColumn(tableName, field.columnName(), field.toSequelize(), { transaction });
    });
  }
}
