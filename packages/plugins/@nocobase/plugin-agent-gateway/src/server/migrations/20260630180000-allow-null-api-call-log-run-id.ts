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

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<2.1.15';

  async up() {
    const collection = this.db.getCollection('agApiCallLogs');
    const field = collection.getField('runId');

    await this.queryInterface.changeColumn(collection.getTableNameWithSchema(), field.columnName(), {
      type: DataTypes.UUID,
      allowNull: true,
    });
  }
}
