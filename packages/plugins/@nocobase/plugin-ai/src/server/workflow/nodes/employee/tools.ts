/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { DynamicToolsProvider } from '@nocobase/ai';
import PluginWorkflowServer, { JOB_STATUS } from '@nocobase/plugin-workflow';
import { Plugin } from '@nocobase/server';

export type WorkflowTaskToolProvider = (plugin: Plugin) => DynamicToolsProvider;

export const getWorkflowTasks: WorkflowTaskToolProvider = (plugin) => async (register, filter) => {
  if (!filter?.sessionId) {
    return;
  }
  const workflowPlugin = plugin.app.pm.get('workflow') as PluginWorkflowServer;
  const task = await plugin.db.getRepository('aiWorkflowTasks').findOne({
    filter: {
      sessionId: filter?.sessionId,
    },
  });
  if (!task) {
    return;
  }
  const execution = await plugin.db.getRepository('executions').findByTargetKey(task.executionId);
  if (!execution) {
    return;
  }
  const flowNode = await plugin.db.getRepository('flow_nodes').findByTargetKey(task.nodeId);
  if (!flowNode) {
    return;
  }

  const processor = workflowPlugin.createProcessor(execution);
  const config = processor.getParsedValue(flowNode.config, flowNode.id);

  const outputSchema = config.structuredOutput.schema;
  const schema = {
    type: 'object',
    properties: {
      result: typeof outputSchema === 'string' ? JSON.parse(outputSchema) : outputSchema,
    },
    additionalProperties: false,
  };

  if (config.requiresApproval === 'ai_decision') {
    (schema.properties as any).requiresApproval = {
      type: 'boolean',
      description: 'If result need human to review and do some decision-making, set it to true',
    };
  }

  register.registerTools({
    scope: 'SPECIFIED',
    defaultPermission: config.requiresApproval !== 'no_required' ? 'ASK' : 'ALLOW',
    from: 'workflow',
    definition: {
      name: 'aiEmployeeWorkflowTaskOutput',
      description: 'When you finish workflow task, invoke this tool to output your result to workflow',
      schema,
    },
    invoke: async (_ctx: Context, args: Record<string, any>) => {
      const job = await plugin.db.getModel('jobs').findByPk(task.jobId);
      if (!job) {
        return {
          status: 'fail',
          message: 'job not existed',
        };
      }
      if (job.status === JOB_STATUS.ABORTED) {
        return {
          status: 'success',
        };
      }

      await plugin.db.getRepository('aiWorkflowTasks').update({
        values: {
          status: 'approved',
        },
        filter: {
          id: task.id,
          status: {
            $ne: 'aborted',
          },
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
};
