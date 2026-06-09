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

export default class AddRolesAllowNewUiLayoutMigration extends Migration {
  on = 'afterSync';

  async up() {
    const rolesCollection = this.db.getCollection('roles');
    if (!rolesCollection) {
      return;
    }

    const field = rolesCollection.getField('allowNewUiLayout');
    if (!field || (await field.existsInDb())) {
      return;
    }

    await this.db.sequelize
      .getQueryInterface()
      .addColumn(rolesCollection.getTableNameWithSchema(), field.columnName(), {
        type: DataTypes.BOOLEAN,
      });
  }
}
