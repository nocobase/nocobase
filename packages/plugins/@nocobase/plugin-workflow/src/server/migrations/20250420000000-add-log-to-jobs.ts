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
  appVersion = '<2.1.0-alpha.20';
  on = 'beforeLoad';

  async up() {
    const { db } = this.context;
    const jobsCollection = db.collection({
      name: 'jobs',
    });
    const tableNameWithQuotes = jobsCollection.getRealTableName(true);
    await db.sequelize.transaction(async (transaction) => {
      if (db.isPostgresCompatibleDialect()) {
        await db.sequelize.query(
          `ALTER TABLE ${tableNameWithQuotes} ADD COLUMN IF NOT EXISTS log text`,
          { transaction },
        );
        return;
      }
      if (db.isMySQLCompatibleDialect()) {
        const [results] = await db.sequelize.query(
          `SHOW COLUMNS FROM ${tableNameWithQuotes} LIKE 'log'`,
          { transaction },
        );
        if ((results as any[]).length === 0) {
          await db.sequelize.query(
            `ALTER TABLE ${tableNameWithQuotes} ADD COLUMN log LONGTEXT`,
            { transaction },
          );
        }
        return;
      }
      // SQLite
      const [results] = await db.sequelize.query(
        `PRAGMA table_info(${tableNameWithQuotes})`,
        { transaction },
      );
      const hasLog = (results as any[]).some((col) => col.name === 'log');
      if (!hasLog) {
        await db.sequelize.query(
          `ALTER TABLE ${tableNameWithQuotes} ADD COLUMN log TEXT`,
          { transaction },
        );
      }
    });
  }

  async down() {
    const { db } = this.context;
    const jobsCollection = db.collection({ name: 'jobs' });
    const tableNameWithQuotes = jobsCollection.getRealTableName(true);
    await db.sequelize.query(
      `ALTER TABLE ${tableNameWithQuotes} DROP COLUMN IF EXISTS log`,
    );
  }
}
