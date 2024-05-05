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
  appVersion = '<0.19.0-alpha.4';
  on = 'afterSync';
  async up() {
    const { db } = this.context;

    const JobRepo = db.getRepository('jobs');
    await db.sequelize.transaction(async (transaction) => {
      const jobs = await JobRepo.find({
        appends: ['node.key'],
      });
      await jobs.reduce(
        (promise, job) =>
          promise.then(() => {
            if (job.nodeKey) {
              return;
            }
            return job.update(
              {
                nodeKey: job.node?.key,
              },
              {
                silent: true,
                transaction,
              },
            );
          }),
        Promise.resolve(),
      );
    });
  }
}
