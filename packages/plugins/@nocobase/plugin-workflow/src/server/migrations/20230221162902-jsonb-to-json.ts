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
  appVersion = '<0.9.0-alpha.3';
  async up() {
    const match = await this.app.version.satisfies('<0.9.0-alpha.3');
    if (!match) {
      return;
    }

    const sequelize = this.sequelize;
    const queryInterface = this.queryInterface;

    const { db } = this.app;
    await sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        db.getCollection('workflows').model.getTableName(),
        'config',
        {
          type: DataTypes.JSON,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        db.getCollection('flow_nodes').model.getTableName(),
        'config',
        {
          type: DataTypes.JSON,
        },
        { transaction },
      );
    });
  }
}
