/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class AddUserNameMigration extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.13.0-alpha.1';

  async up() {
    const collection = this.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'username',
        },
      ],
    });
    const tableNameWithSchema = collection.getTableNameWithSchema();
    const field = collection.getField('username');
    const exists = await field.existsInDb();
    if (!exists) {
      await this.db.sequelize.getQueryInterface().addColumn(tableNameWithSchema, field.columnName(), {
        type: DataTypes.STRING,
      });
    }
    try {
      await this.db.sequelize.getQueryInterface().addConstraint(tableNameWithSchema, {
        type: 'unique',
        fields: [field.columnName()],
      });
    } catch (error) {
      //
    }
    this.db.removeCollection('users');
  }
}
