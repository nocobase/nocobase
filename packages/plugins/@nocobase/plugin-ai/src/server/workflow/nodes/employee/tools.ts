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
  const parsedOutputSchema = typeof outputSchema === 'string' ? JSON.parse(outputSchema) : outputSchema;
  const resultSchema =
    parsedOutputSchema && typeof parsedOutputSchema === 'object' && !Array.isArray(parsedOutputSchema)
      ? {
          ...parsedOutputSchema,
          description:
            parsedOutputSchema.description ||
            `Return the final structured output for this workflow task in this field.
            The value must match the required schema exactly so the workflow can continue.
            Do not include free-form text, extra fields, or any structure outside the defined schema.`,
        }
      : parsedOutputSchema;
  const schema = {
    type: 'object',
    properties: {
      result: resultSchema,
    },
    additionalProperties: false,
  };

  if (config.requiresApproval === 'ai_decision') {
    (schema.properties as any).requiresApproval = {
      type: 'boolean',
      description: `This field is mandatory.
      Set it to true whenever the human user still needs to review the result, confirm it, make a decision,
      provide missing information, answer your follow-up questions, or correct the result.
      Set it to false only when you have determined that the task is fully complete, the result you are returning fully satisfies the required schema and the task requirements,
      and no human user needs to review the result or provide any additional information before the workflow continues.
      Warning: if requiresApproval=false, this AI workflow node ends immediately, the workflow moves to the next node,
      and the human will no longer be able to continue this conversation with the AI.
      If a human may still need to say anything else, do not set it to false.`,
    };
  }

  register.registerTools({
    scope: 'SPECIFIED',
    defaultPermission: config.requiresApproval !== 'no_required' ? 'ASK' : 'ALLOW',
    from: 'workflow',
    definition: {
      name: 'aiEmployeeWorkflowTaskOutput',
      description: `Use this tool to return the structured output required by the workflow so execution can continue.
      Every time you call it, you must provide the final data strictly under result and match the result schema exactly.
      Do not return free-form text, extra fields, or any structure outside the defined result.`,
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
