/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
import { Migration } from '@nocobase/server';
import { TASK_TYPE_MANUAL, TASK_STATUS } from '../../common/constants';

export default class extends Migration {
  appVersion = '<1.7.0';
  async up() {
    const { db } = this.context;
    const UserTaskModel = db.getModel('userWorkflowTasks');
    const WorkflowManualTaskModel = db.getModel('workflowManualTasks');
    const WorkflowRepo = db.getRepository('workflows');
    const ExecutionRepo = db.getRepository('executions');
    await db.sequelize.transaction(async (transaction) => {
      const workflows = await WorkflowRepo.find({
        filter: {
          enabled: true,
        },
        fields: ['id'],
        transaction,
      });
      const workflowId = workflows.map((item) => item.id);

      const executions = await ExecutionRepo.find({
        filter: {
          status: EXECUTION_STATUS.STARTED,
          workflowId,
        },
        fields: ['id'],
        transaction,
      });
      const executionId = executions.map((item) => item.id);
      const pendingCounts = await WorkflowManualTaskModel.count({
        where: {
          status: TASK_STATUS.PENDING,
          workflowId,
          executionId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      });
      const allCounts = await WorkflowManualTaskModel.count({
        where: {
          workflowId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      });
      const userStatsMap = new Map();
      for (const row of pendingCounts) {
        if (!userStatsMap.get(row.userId)) {
          userStatsMap.set(row.userId, {});
        }
        userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), pending: row.count });
      }
      for (const row of allCounts) {
        if (!userStatsMap.get(row.userId)) {
          userStatsMap.set(row.userId, {});
        }
        userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), all: row.count });
      }
      for (const [userId, stats] of userStatsMap.entries()) {
        const existed = await UserTaskModel.findOne({
          where: {
            type: TASK_TYPE_MANUAL,
            userId,
          },
          transaction,
        });
        if (existed) {
          await existed.update(
            {
              stats,
            },
            {
              transaction,
            },
          );
        } else {
          await UserTaskModel.create(
            {
              type: TASK_TYPE_MANUAL,
              userId,
              stats,
            },
            {
              transaction,
            },
          );
        }
      }
    });
  }
}
