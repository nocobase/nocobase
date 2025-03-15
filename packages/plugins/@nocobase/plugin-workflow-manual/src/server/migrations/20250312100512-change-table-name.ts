/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QueryTypes } from 'sequelize';
import { Migration } from '@nocobase/server';
import workflowManualTasks from '../collections/workflowManualTasks';

export default class extends Migration {
  appVersion = '<1.7.0';
  on = 'afterSync';
  async up() {
    const { db } = this.context;
    const queryInterface = db.sequelize.getQueryInterface();
    const workflowManualTasksCollection = db.collection(workflowManualTasks);
    const usersJobs = db.collection({
      name: 'users_jobs',
      fields: workflowManualTasks.fields.filter((field) => field.name !== 'id'),
    });
    const FieldRepo = db.getRepository('fields');
    const exists = await queryInterface.tableExists(usersJobs.getTableNameWithSchema());
    if (!exists) {
      return;
    }
    await db.sequelize.transaction(async (transaction) => {
      const records = await db.sequelize.query(`SELECT * FROM ${usersJobs.getRealTableName(true)}`, {
        type: QueryTypes.SELECT,
        transaction,
        raw: true,
      });

      await workflowManualTasksCollection.model.bulkCreate(records as any[], {
        transaction,
      });

      await queryInterface.dropTable(usersJobs.getTableNameWithSchema(), {
        transaction,
      });

      await FieldRepo.destroy({
        filter: {
          collectionName: 'users',
          name: 'jobs',
        },
        transaction,
      });

      await FieldRepo.destroy({
        filter: {
          collectionName: 'jobs',
          name: 'users',
        },
        transaction,
      });
    });
  }
}
