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
    register.registerTools({
      scope: 'SPECIFIED',
      defaultPermission: config?.requiresApproval === true ? 'ASK' : 'ALLOW',
      from: 'workflow',
      definition: {
        name: 'aiEmployeeWorkflowTaskOutput@' + node.id,
        description: 'When you finish workflow task, invoke this tool to output your result to workflow',
        schema: config.structuredOutput.schema,
      },
      invoke: async (ctx: Context, args: Record<string, any>) => {
        const task = tasksMap[node.id];
        const job = await plugin.db.getModel('jobs').findOne({
          where: { id: task.jobId },
        });
        job.set({
          status: JOB_STATUS.RESOLVED,
          result: args,
        });
        await workflowPlugin.resume(job);
        return {
          status: 'success',
        };
      },
    });
  }
};
