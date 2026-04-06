/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { ToolsRegistration } from '@nocobase/ai';
import PluginWorkflowServer, { JOB_STATUS } from '@nocobase/plugin-workflow';
import { Plugin } from '@nocobase/server';

export const getWorkflowTasks = (plugin: Plugin) => async (register: ToolsRegistration) => {
  const workflowPlugin = plugin.app.pm.get('workflow') as PluginWorkflowServer;
  const tasks = await plugin.db.getRepository('aiWorkflowTasks').find({
    filter: {
      status: {
        $ne: 'approved',
      },
    },
  });
  const flowNode = await plugin.db.getRepository('flow_nodes').find({
    filter: {
      id: {
        $in: tasks.map((it) => it.nodeId),
      },
    },
  });
  const tasksMap = Object.fromEntries(tasks.map((it) => it.toJSON()).map((it) => [it.nodeId, it]));

  for (const node of flowNode) {
    const config = node.config;
    if (!config?.structuredOutput?.schema) {
      continue;
    }

    const result =
      typeof config.structuredOutput.schema === 'string'
        ? JSON.parse(config.structuredOutput.schema)
        : config.structuredOutput.schema;
    const schema: any = {
      type: 'object',
      properties: {
        result,
      },
      additionalProperties: false,
    };
    if (config.requiresApproval === true) {
      schema.properties.requiresApproval = {
        type: 'boolean',
        description: 'If result need human to review and do some decision-making, set it to true',
      };
    }

    register.registerTools({
      scope: 'SPECIFIED',
      defaultPermission: config?.requiresApproval === true ? 'ASK' : 'ALLOW',
      from: 'workflow',
      definition: {
        name: 'aiEmployeeWorkflowTaskOutput@' + node.id,
        description: 'When you finish workflow task, invoke this tool to output your result to workflow',
        schema,
      },
      invoke: async (ctx: Context, args: Record<string, any>) => {
        const task = tasksMap[node.id];
        if (!task) {
          return {
            status: 'fail',
            message: 'task not existed',
          };
        }
        const job = await plugin.db.getModel('jobs').findOne({
          where: { id: task.jobId },
        });
        if (!job) {
          return {
            status: 'fail',
            message: 'job not existed',
          };
        }

        await plugin.db.getRepository('aiWorkflowTasks').update({
          values: {
            status: 'approved',
          },
          filter: {
            id: task.id,
            status: 'pending_approval',
          },
        });

        job.set({
          status: JOB_STATUS.RESOLVED,
          result: args.result,
        });
        await workflowPlugin.resume(job);
        return {
          status: 'success',
        };
      },
    });
  }
};
