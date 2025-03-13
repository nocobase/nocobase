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
  on = 'afterLoad';
  async up() {
    const { db } = this.context;
    await db.sequelize.transaction(async (transaction) => {
      const FieldRepo = db.getCollection('fields').repository;
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

      db.removeCollection('fields');
    });
  }
}
