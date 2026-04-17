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
    for (const aiWorkflowTask of aiWorkflowTasks) {
      await plugin.db.getRepository('aiWorkflowTasks').update({
        values: { status: 'aborted' },
        filter: {
          id: aiWorkflowTask.id,
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

      if (values.status === 'pending_acceptance') {
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
