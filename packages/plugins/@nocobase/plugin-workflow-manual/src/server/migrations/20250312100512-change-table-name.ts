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
  appVersion = '<1.6.2';
  on = 'beforeLoad';
  async up() {
    const { db } = this.context;
    const queryInterface = db.sequelize.getQueryInterface();
    const usersJobsCollection = db.collection({
      name: 'users_jobs',
      fields: [{ name: 'id', type: 'bigInt' }],
    });
    const workflowManualTasksCollection = db.collection({
      name: 'workflowManualTasks',
      fields: [{ name: 'id', type: 'bigInt' }],
    });
    const oldTableName = usersJobsCollection.getTableNameWithSchema();
    const oldTableNameWithQuotes = usersJobsCollection.getRealTableName(true);
    const newTableName = workflowManualTasksCollection.getTableNameWithSchema();
    const newTableNameWithQuotes = workflowManualTasksCollection.getRealTableName(true);
    await db.sequelize.transaction(async (transaction) => {
      const exists = await queryInterface.tableExists(oldTableName, { transaction });
      if (exists) {
        const newExists = await queryInterface.tableExists(newTableName, { transaction });
        if (newExists) {
          await queryInterface.dropTable(newTableName, { transaction });
        }
        if (this.db.isPostgresCompatibleDialect()) {
          await db.sequelize.query(
            `ALTER TABLE ${oldTableNameWithQuotes} RENAME TO "${db.options.tablePrefix || ''}${
              db.options.underscored ? 'workflow_manual_tasks' : 'workflowManualTasks'
            }";`,
            {
              transaction,
            },
          );
        } else {
          await queryInterface.renameTable(oldTableName, newTableName, { transaction });
        }

        const indexes: any = await queryInterface.showIndex(newTableName, { transaction });

        const oldIndexPrefix = `${db.options.tablePrefix || ''}users_jobs`;
        const newIndexPrefix = `${db.options.tablePrefix || ''}workflow_manual_tasks`;
        for (const item of indexes) {
          if (item.name.startsWith(oldIndexPrefix)) {
            if (this.db.isPostgresCompatibleDialect()) {
              await db.sequelize.query(
                `ALTER INDEX ${db.options.schema ? `"${db.options.schema}".` : ''}"${
                  item.name
                }" RENAME TO "${item.name.replace(oldIndexPrefix, newIndexPrefix)}";`,
                { transaction },
              );
            } else if (this.db.isMySQLCompatibleDialect()) {
              await db.sequelize.query(
                `ALTER TABLE ${newTableNameWithQuotes} RENAME INDEX ${item.name} TO ${item.name.replace(
                  oldIndexPrefix,
                  newIndexPrefix,
                )};`,
                { transaction },
              );
            }
          }
        }
      }
    });
    db.removeCollection('users_jobs');
    db.removeCollection('workflowManualTasks');
  }
}
