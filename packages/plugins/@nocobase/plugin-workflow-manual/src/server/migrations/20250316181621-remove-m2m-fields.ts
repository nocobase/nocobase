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
    const usersJobsCollection = db.collection({
      name: 'users_jobs',
    });
    const fieldCollection = db.collection({
      name: 'fields',
      fields: [
        {
          name: 'collectionName',
          type: 'string',
        },
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    const oldTableExists = await db.sequelize
      .getQueryInterface()
      .tableExists(usersJobsCollection.getTableNameWithSchema());

    await db.sequelize.transaction(async (transaction) => {
      await fieldCollection.repository.destroy({
        filter: {
          collectionName: 'users',
          name: ['jobs', 'usersJobs'],
        },
        transaction,
      });

      await fieldCollection.repository.destroy({
        filter: {
          collectionName: 'jobs',
          name: ['users', 'usersJobs'],
        },
        transaction,
      });

      if (oldTableExists) {
        await db.sequelize.getQueryInterface().dropTable(usersJobsCollection.getTableNameWithSchema(), { transaction });
      }
    });

    db.removeCollection('fields');
  }
}
