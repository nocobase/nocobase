/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Model, type Transaction } from '@nocobase/database';
import WorkflowPlugin, { EXECUTION_STATUS } from '@nocobase/plugin-workflow';

import * as jobActions from './actions';

import ManualInstruction from './ManualInstruction';
import { TASK_TYPE_MANUAL, TASK_STATUS } from '../common/constants';

type TaskStats = {
  pending: number;
  all: number;
};

type UserGroupedCountRow = {
  userId: number;
  count: number;
};

export default class extends Plugin {
  private async updateManualTaskStats(userIds: number[], transaction?: Transaction) {
    if (!userIds.length) {
      return;
    }

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
    const userStatsMap = new Map<number, TaskStats>(uniqueUserIds.map((userId) => [userId, { pending: 0, all: 0 }]));

    const pendingCounts = (await WorkflowManualTaskModel.count({
      where: {
        status: TASK_STATUS.PENDING,
        userId: uniqueUserIds,
      },
      include: [
        {
          association: 'execution',
          attributes: [],
          where: {
            status: EXECUTION_STATUS.STARTED,
          },
          required: true,
        },
      ],
      col: 'id',
      group: ['userId'],
      transaction,
    })) as UserGroupedCountRow[];
    const allCounts = (await WorkflowManualTaskModel.count({
      where: {
        userId: uniqueUserIds,
      },
      col: 'id',
      group: ['userId'],
      transaction,
    })) as UserGroupedCountRow[];

    for (const row of pendingCounts) {
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), pending: Number(row.count) || 0 });
    }
    for (const row of allCounts) {
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), all: Number(row.count) || 0 });
    }

    for (const [userId, stats] of userStatsMap.entries()) {
      await workflowPlugin.updateTasksStats(userId, TASK_TYPE_MANUAL, stats, { transaction });
    }
  }

  onTaskSave = async (task: Model, { transaction }) => {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const ModelClass = task.constructor as unknown as Model;
    const pending = await ModelClass.count({
      where: {
        userId: task.userId,
        status: TASK_STATUS.PENDING,
      },
      include: [
        {
          association: 'execution',
          attributes: [],
          where: {
            status: EXECUTION_STATUS.STARTED,
          },
          required: true,
        },
      ],
      col: 'id',
      distinct: true,
      transaction,
    });
    const all = await ModelClass.count({
      where: {
        userId: task.userId,
      },
      col: 'id',
      transaction,
    });
    await workflowPlugin.updateTasksStats(task.userId, TASK_TYPE_MANUAL, { pending, all }, { transaction });
  };

  onExecutionStatusChange = async (execution, { transaction }) => {
    if (!execution.status) {
      return;
    }
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    if (!execution.workflow) {
      execution.workflow =
        workflowPlugin.enabledCache.get(execution.workflowId) || (await execution.getWorkflow({ transaction }));
    }
    if (!execution.workflow) {
      return;
    }
    if (!execution.workflow.nodes) {
      execution.workflow.nodes = await execution.workflow.getNodes({ transaction });
    }
    const manualNodes = execution.workflow.nodes.filter((node) => node.type === 'manual');
    if (!manualNodes.length) {
      return;
    }
    const manualNodeIds = new Set(manualNodes.map((node) => node.id));

    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const manualTasks = await WorkflowManualTaskModel.findAll({
      attributes: ['id', 'userId'],
      where: {
        nodeId: Array.from(manualNodeIds),
        executionId: execution.id,
      },
      transaction,
    });

    const userIds = manualTasks.map((item) => item.userId).filter(Boolean);
    if (execution.status === EXECUTION_STATUS.ABORTED) {
      await WorkflowManualTaskModel.update(
        {
          status: TASK_STATUS.ABORTED,
        },
        {
          where: {
            id: manualTasks.map((item) => item.id),
            status: TASK_STATUS.PENDING,
          },
          transaction,
        },
      );
    }

    await this.updateManualTaskStats(userIds, transaction);
  };

  onWorkflowStatusChange = async (workflow, { transaction }) => {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const enalbedSet = new Set(workflowPlugin.enabledCache.keys());
    let pendingCounts: UserGroupedCountRow[] = [];
    let allCounts: UserGroupedCountRow[] = [];
    const userStatsMap = new Map<number, TaskStats>();
    if (workflow.enabled) {
      enalbedSet.add(workflow.id);
      const workflowId = [...enalbedSet];
      pendingCounts = (await WorkflowManualTaskModel.count({
        where: {
          status: TASK_STATUS.PENDING,
          workflowId,
        },
        include: [
          {
            association: 'execution',
            attributes: [],
            where: {
              status: EXECUTION_STATUS.STARTED,
            },
            required: true,
          },
        ],
        col: 'id',
        group: ['userId'],
        transaction,
      })) as UserGroupedCountRow[];
      allCounts = (await WorkflowManualTaskModel.count({
        where: {
          workflowId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      })) as UserGroupedCountRow[];
    } else {
      enalbedSet.delete(workflow.id);
      const workflowId = [...enalbedSet];
      // 查找所有该工作流的人工任务
      const tasksByUser = (await WorkflowManualTaskModel.count({
        col: 'userId',
        where: {
          status: TASK_STATUS.PENDING,
          workflowId: workflow.id,
        },
        distinct: true,
        group: ['userId'],
        transaction,
      })) as UserGroupedCountRow[];
      // 涉及人员集合
      const userId: number[] = [];
      for (const item of tasksByUser) {
        userId.push(item.userId);
        userStatsMap.set(item.userId, { pending: 0, all: 0 });
      }

      // 调整所有任务中的负责人的统计数字
      pendingCounts = (await WorkflowManualTaskModel.count({
        where: {
          status: TASK_STATUS.PENDING,
          userId,
          workflowId,
        },
        include: [
          {
            association: 'execution',
            attributes: [],
            where: {
              status: EXECUTION_STATUS.STARTED,
            },
            required: true,
          },
        ],
        col: 'id',
        group: ['userId'],
        transaction,
      })) as UserGroupedCountRow[];
      allCounts = (await WorkflowManualTaskModel.count({
        where: {
          userId,
          workflowId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      })) as UserGroupedCountRow[];
    }
    for (const row of pendingCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), pending: Number(row.count) || 0 });
    }
    for (const row of allCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), all: Number(row.count) || 0 });
    }
    for (const [userId, stats] of userStatsMap.entries()) {
      await workflowPlugin.updateTasksStats(userId, TASK_TYPE_MANUAL, stats, { transaction });
    }
  };

  async load() {
    this.app.resourceManager.define({
      name: 'workflowManualTasks',
      actions: jobActions,
    });

    this.app.acl.allow('workflowManualTasks', ['listMine', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);

    this.db.on('workflowManualTasks.afterSave', this.onTaskSave);
    this.db.on('workflowManualTasks.afterDestroy', this.onTaskSave);
    this.db.on('executions.afterUpdate', this.onExecutionStatusChange);
    // NOTE: no need re-calculate tasks after workflow status changed
    // this.db.on('workflows.afterUpdate', this.onWorkflowStatusChange);
  }
}
