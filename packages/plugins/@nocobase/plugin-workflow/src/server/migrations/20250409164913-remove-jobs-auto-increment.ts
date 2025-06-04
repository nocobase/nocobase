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
  appVersion = '<1.7.0';
  on = 'beforeLoad';
  async up() {
    const { db } = this.context;
    const jobCollection = db.collection({
      name: 'jobs',
    });
    const tableNameWithQuotes = jobCollection.getRealTableName(true);

    await db.sequelize.transaction(async (transaction) => {
      if (this.db.isPostgresCompatibleDialect()) {
        await db.sequelize.query(`ALTER TABLE ${tableNameWithQuotes} ALTER COLUMN id DROP DEFAULT`, {
          transaction,
        });
        return;
      }
      if (this.db.isMySQLCompatibleDialect()) {
        await db.sequelize.query(`ALTER TABLE ${tableNameWithQuotes} MODIFY COLUMN id BIGINT`, {
          transaction,
        });
        return;
      }
    });
  }
}
