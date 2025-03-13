/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction } from 'sequelize';
import { Migration } from '@nocobase/server';
import workflowManualTasks from '../collections/workflowManualTasks';

export default class extends Migration {
  appVersion = '<1.7.0';
  on = 'beforeLoad';
  async up() {
    const { db } = this.context;
    const queryInterface = db.sequelize.getQueryInterface();
    const usersJobsCollection = db.collection({
      ...workflowManualTasks,
      name: 'users_jobs',
    });
    const workflowManualTasksCollection = db.collection({
      ...workflowManualTasks,
    });
    const oldTableName = usersJobsCollection.getTableNameWithSchema();
    const oldTableNameWithQuotes = usersJobsCollection.getRealTableName(true);
    const newTableName = workflowManualTasksCollection.getTableNameWithSchema();
    const newTableNameWithQuotes = workflowManualTasksCollection.getRealTableName(true);

    const exists = await queryInterface.tableExists(oldTableName);
    if (!exists) {
      return;
    }
    // @ts-ignore
    const constraints: any = await queryInterface.showConstraint(oldTableName);
    // PG:
    // {
    //   constraintCatalog: 'nocobase_test',
    //   constraintSchema: 'public',
    //   constraintName: 'posts_tags_pkey',
    //   tableCatalog: 'nocobase_test',
    //   tableSchema: 'public',
    //   tableName: 'posts_tags',
    //   constraintType: 'PRIMARY KEY', // use this to determine
    //   isDeferrable: 'NO',
    //   initiallyDeferred: 'NO'
    // }
    // MYSQL:
    // {
    //   constraintCatalog: 'def',
    //   constraintName: 'PRIMARY',
    //   constraintSchema: 'nocobase_test',
    //   constraintType: 'PRIMARY KEY', // use this to determine
    //   tableName: 'posts_tags',
    //   tableSchema: 'nocobase_test'
    // }

    await db.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      },
      async (transaction) => {
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

        if (this.db.isPostgresCompatibleDialect()) {
          const primaryKeys = constraints.filter((item) => item.constraintType === 'PRIMARY KEY');
          if (primaryKeys.length) {
            for (const primaryKey of primaryKeys) {
              await queryInterface.removeConstraint(newTableName, primaryKey.constraintName, { transaction });
            }
          }
        } else if (this.db.isMySQLCompatibleDialect()) {
          await db.sequelize.query(`ALTER TABLE ${newTableNameWithQuotes} DROP PRIMARY KEY, ADD PRIMARY KEY (id)`, {
            transaction,
          });
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
      },
    );
    db.removeCollection('users_jobs');
    db.removeCollection('workflowManualTasks');
  }
}
