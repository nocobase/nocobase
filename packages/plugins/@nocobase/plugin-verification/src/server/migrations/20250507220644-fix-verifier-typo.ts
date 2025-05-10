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
  on = 'afterLoad'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<1.7.0';

  async up() {
    const oldRepo = await this.db.getRepository('verificators');
    const newRepo = await this.db.getRepository('verifiers');
    const oldThroughRepo = await this.db.getRepository('usersVerificators');
    const newThroughRepo = await this.db.getRepository('usersVerifiers');
    await this.db.sequelize.transaction(async (transaction) => {
      if (await newRepo.count({ transaction })) {
        return;
      }
      const oldRecords = await oldRepo.find({ transaction });
      if (!oldRecords.length) {
        return;
      }
      const newRecords = oldRecords.map((record) => ({
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        name: record.name,
        title: record.title,
        verificationType: record.verificationType,
        description: record.description,
        options: record.options,
      }));
      const model = await this.db.getModel('verifiers');
      await model.bulkCreate(newRecords, {
        transaction,
      });

      if (await newThroughRepo.count({ transaction })) {
        return;
      }
      const oldThroughRecords = await oldThroughRepo.find({ transaction });
      if (!oldThroughRecords.length) {
        return;
      }
      const newThroughRecords = oldThroughRecords.map((record) => ({
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        userId: record.userId,
        uuid: record.uuid,
        meta: record.meta,
        verifier: record.verificator,
        createdById: record.createdById,
        updatedById: record.updatedById,
      }));
      const throughModel = await this.db.getModel('usersVerifiers');
      await throughModel.bulkCreate(newThroughRecords, {
        transaction,
      });
    });
  }
}
