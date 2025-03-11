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
  appVersion = '<1.6.0';
  on = 'beforeLoad';
  async up() {
    const { db } = this.context;
    const queryInterface = db.sequelize.getQueryInterface();
    await db.sequelize.transaction(async (transaction) => {
      const exists = await queryInterface.tableExists('users_jobs', { transaction });
      if (exists) {
        const newTableName = db.options.underscored ? 'workflow_manual_tasks' : 'workflowManualTasks';

        await queryInterface.renameTable('users_jobs', newTableName, { transaction });

        const indexes: any = await queryInterface.showIndex(newTableName, { transaction });

        for (const item of indexes) {
          if (item.name.startsWith('users_jobs')) {
            if (this.db.isPostgresCompatibleDialect()) {
              await db.sequelize.query(
                `ALTER INDEX "${item.name}" RENAME TO "${item.name.replace('users_jobs', 'workflow_manual_tasks')}";`,
                { transaction },
              );
            } else if (this.db.isMySQLCompatibleDialect()) {
              await db.sequelize.query(
                `ALTER TABLE ${newTableName} RENAME INDEX ${item.name} TO ${item.name.replace(
                  'users_jobs',
                  'workflow_manual_tasks',
                )};`,
                { transaction },
              );
            }
          }
        }
      }
    });
  }
}
