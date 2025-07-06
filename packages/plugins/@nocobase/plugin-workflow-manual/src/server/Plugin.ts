/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { Model } from '@nocobase/database';
import actions from '@nocobase/actions';
import { HandlerType } from '@nocobase/resourcer';
import WorkflowPlugin, { EXECUTION_STATUS, JOB_STATUS } from '@nocobase/plugin-workflow';

import * as jobActions from './actions';

import ManualInstruction from './ManualInstruction';
import { TASK_TYPE_MANUAL, TASK_STATUS } from '../common/constants';

export default class extends Plugin {
  onTaskSave = async (task: Model, { transaction }) => {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const workflowId = Array.from(workflowPlugin.enabledCache.keys());
    const ModelClass = task.constructor as unknown as Model;
    const pending = await ModelClass.count({
      where: {
        userId: task.userId,
        workflowId,
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
        workflowId,
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
    const userStatsMap = new Map();
    // 涉及人员集合
    const userId = [];
    for (const item of manualTasks) {
      userId.push(item.userId);
      userStatsMap.set(item.userId, { pending: 0, all: 0 });
    }

    // 调整所有任务中的负责人的统计数字
    const pendingCounts = await WorkflowManualTaskModel.count({
      where: {
        status: TASK_STATUS.PENDING,
        userId,
        workflowId: execution.workflowId,
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
    });
    const allCounts = await WorkflowManualTaskModel.count({
      where: {
        userId,
        workflowId: execution.workflowId,
      },
      col: 'id',
      group: ['userId'],
      transaction,
    });
    for (const row of pendingCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), pending: row.count });
    }
    for (const row of allCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), all: row.count });
    }
    for (const [userId, stats] of userStatsMap.entries()) {
      await workflowPlugin.updateTasksStats(userId, TASK_TYPE_MANUAL, stats, { transaction });
    }
  };

  onWorkflowStatusChange = async (workflow, { transaction }) => {
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    const WorkflowManualTaskModel = this.db.getModel('workflowManualTasks');
    const enalbedSet = new Set(workflowPlugin.enabledCache.keys());
    let pendingCounts = [];
    let allCounts = [];
    const userStatsMap = new Map();
    if (workflow.enabled) {
      enalbedSet.add(workflow.id);
      const workflowId = [...enalbedSet];
      pendingCounts = await WorkflowManualTaskModel.count({
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
      });
      allCounts = await WorkflowManualTaskModel.count({
        where: {
          workflowId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      });
    } else {
      enalbedSet.delete(workflow.id);
      const workflowId = [...enalbedSet];
      // 查找所有该工作流的人工任务
      const tasksByUser = await WorkflowManualTaskModel.count({
        col: 'userId',
        where: {
          status: TASK_STATUS.PENDING,
          workflowId: workflow.id,
        },
        distinct: true,
        group: ['userId'],
        transaction,
      });
      // 涉及人员集合
      const userId = [];
      for (const item of tasksByUser) {
        userId.push(item.userId);
        userStatsMap.set(item.userId, { pending: 0, all: 0 });
      }

      // 调整所有任务中的负责人的统计数字
      pendingCounts = await WorkflowManualTaskModel.count({
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
      });
      allCounts = await WorkflowManualTaskModel.count({
        where: {
          userId,
          workflowId,
        },
        col: 'id',
        group: ['userId'],
        transaction,
      });
    }
    for (const row of pendingCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), pending: row.count });
    }
    for (const row of allCounts) {
      if (!userStatsMap.get(row.userId)) {
        userStatsMap.set(row.userId, { pending: 0, all: 0 });
      }
      userStatsMap.set(row.userId, { ...userStatsMap.get(row.userId), all: row.count });
    }
    for (const [userId, stats] of userStatsMap.entries()) {
      await workflowPlugin.updateTasksStats(userId, TASK_TYPE_MANUAL, stats, { transaction });
    }
  };

  async load() {
    this.app.resourceManager.define({
      name: 'workflowManualTasks',
      actions: {
        list: {
          filter: {
            $or: [
              {
                'workflow.enabled': true,
              },
              {
                'workflow.enabled': false,
                status: {
                  $ne: JOB_STATUS.PENDING,
                },
              },
            ],
          },
          handler: actions.list as HandlerType,
        },
        ...jobActions,
      },
    });

    this.app.acl.allow('workflowManualTasks', ['list', 'listMine', 'get', 'submit'], 'loggedIn');

    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflowPlugin.registerInstruction('manual', ManualInstruction);

    this.db.on('workflowManualTasks.afterSave', this.onTaskSave);
    this.db.on('workflowManualTasks.afterDestroy', this.onTaskSave);
    this.db.on('executions.afterUpdate', this.onExecutionStatusChange);
    this.db.on('workflows.afterUpdate', this.onWorkflowStatusChange);
  }
}
