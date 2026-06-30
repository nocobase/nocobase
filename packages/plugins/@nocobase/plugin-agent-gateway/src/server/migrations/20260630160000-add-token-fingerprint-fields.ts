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
    await this.addStringColumnIfMissing('agNodes', 'nodeTokenHash');
    await this.addStringColumnIfMissing('agNodes', 'tokenLast4');
    await this.addStringColumnIfMissing('agNodeInvitations', 'tokenLast4');
    await this.addStringColumnIfMissing('agRuns', 'claimTokenLast4');
  }

  private async addStringColumnIfMissing(collectionName: string, fieldName: string) {
    const collection = this.db.getCollection(collectionName);
    const field = collection.getField(fieldName);
    const tableName = collection.getTableNameWithSchema();
    const columnName = field.columnName();

    if (await field.existsInDb()) {
      return;
    }

    await this.queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }
}
