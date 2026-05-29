/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JOB_STATUS } from '@nocobase/plugin-workflow';
import _ from 'lodash';
import PluginAIServer from '../../../plugin';
import { Model, Transactionable } from '@nocobase/database';
import { AI_WORKFLOW_TASK_STATUS } from './constants';

export const registerOnJobAbortedHandler = (plugin: PluginAIServer) => {
  plugin.db.on('jobs.afterBulkUpdate', async (options: any) => {
    const { model, attributes, where, transaction } = options;
    if (attributes.status !== JOB_STATUS.ABORTED) {
      return;
    }
    const jobs = await model.findAll({ where, transaction });
    const aiWorkflowTasks = await plugin.db.getRepository('aiWorkflowTasks').find({
      filter: {
        jobId: jobs.map((it) => it.id),
      },
      transaction,
    });
    if (!aiWorkflowTasks.length) {
      return;
    }
    const sessionIds = aiWorkflowTasks.map((task) => task.sessionId).filter(Boolean);
    for (const aiWorkflowTask of aiWorkflowTasks) {
      await plugin.db.getRepository('aiWorkflowTasks').update({
        values: { status: AI_WORKFLOW_TASK_STATUS.ABORTED },
        filter: {
          id: aiWorkflowTask.id,
        },
        transaction,
      });
    }
    if (sessionIds.length) {
      await plugin.db.getRepository('aiToolMessages').update({
        values: {
          invokeStatus: 'done',
          status: 'error',
          content: 'Workflow execution aborted.',
          invokeEndTime: new Date(),
        },
        filter: {
          sessionId: {
            $in: sessionIds,
          },
          invokeStatus: {
            $in: ['init', 'interrupted', 'waiting', 'pending'],
          },
        },
        transaction,
      });
    }
  });
};

export const registerAIEmployeeTaskNotification = (plugin: PluginAIServer) => {
  plugin.db.on('aiWorkflowTasks.beforeSave', async (model: Model, options: Transactionable) => {
    if (!model.isNewRecord && !model.changed('status')) {
      return;
    }
    const values = model.toJSON();
    options.transaction?.afterCommit(async () => {
      const assignees = await plugin.db.getRepository('usersAiWorkflowTasks').find({
        filter: {
          aiWorkflowTaskId: values.id,
        },
      });
      if (!assignees?.length) {
        return;
      }

      if (values.status === AI_WORKFLOW_TASK_STATUS.PENDING_ACCEPTANCE) {
        await plugin.db.getRepository('usersAiWorkflowTasks').update({
          values: {
            read: false,
          },
          filter: {
            aiWorkflowTaskId: values.id,
          },
        });
      }

      for (const assignee of assignees) {
        plugin.app.emit('ws:sendToUser', {
          userId: assignee.userId,
          message: {
            type: 'ai-employee-tasks:status',
            payload: {
              taskId: values.id,
              sessionId: values.sessionId,
              status: values.status,
            },
          },
        });
      }
    });
  });
};
