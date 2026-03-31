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
  appVersion = '<1.8.0';
  on = 'afterLoad';
  async up() {
    const { db } = this.context;

    const WorkflowRepo = db.getRepository('workflows');
    const ExecutionRepo = db.getRepository('executions');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        filter: {
          current: true,
        },
        appends: ['stats'],
        transaction,
      });

      for (const workflow of workflows) {
        if (!workflow.stats) {
          const executed =
            (await ExecutionRepo.count({
              filter: {
                key: workflow.key,
              },
              transaction,
            })) ||
            workflow.allExecuted ||
            0;
          await workflow.createStats({ executed }, { transaction });
        }
      }
    });
  }
}
