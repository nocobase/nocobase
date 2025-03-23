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

    const WorkflowRepo = db.getRepository('workflows');
    const WorkflowStatsModel = db.getModel('workflowStats');
    const WorkflowVersionStatsModel = db.getModel('workflowVersionStats');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        fields: ['id', 'key', 'executed', 'allExecuted'],
        transaction,
      });
      const counts = workflows.map((workflow) => workflow.get('executed'));
      await WorkflowVersionStatsModel.bulkCreate(
        counts.map((count, index) => ({
          id: workflows[index].get('id'),
          executed: count,
        })),
        { transaction },
      );

      const groupCounts = {};
      for (const workflow of workflows) {
        const key = workflow.get('key');
        groupCounts[key] = {
          key,
          executed: workflow.get('allExecuted') || 0,
        };
      }
      await WorkflowStatsModel.bulkCreate(Object.values(groupCounts), { transaction });
    });
  }
}
