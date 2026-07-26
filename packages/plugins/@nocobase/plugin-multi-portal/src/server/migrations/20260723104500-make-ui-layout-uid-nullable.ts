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
  on = 'afterLoad';

  async up() {
    const collection = this.db.getCollection('multiPortals');
    if (!collection) {
      return;
    }

    await this.db.sequelize
      .getQueryInterface()
      .changeColumn(collection.getTableNameWithSchema(), collection.model.getAttributes().uiLayoutUid.field, {
        type: DataTypes.STRING,
        allowNull: true,
      });
  }
}
