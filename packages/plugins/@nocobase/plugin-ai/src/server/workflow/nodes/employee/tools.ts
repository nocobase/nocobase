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
            `Use this field to submit the final workflow result
            when the task is completed successfully.`,
        }
      : parsedOutputSchema;
  const schema = {
    type: 'object',
    properties: {
      alert: {
        type: 'object',
        description: `Use this field instead of \`result\` when there is no data to return to the workflow
          and the message is intended for a person instead, such as a status notice,
          a request for missing information, or a review prompt.
          Do not provide this field together with \`result\`.`,
        properties: {
          title: {
            type: 'string',
            description: `A short human-readable title summarizing the outcome or the action a person needs to take.`,
          },
          description: {
            type: 'string',
            description: `A human-readable message for the person reviewing this status, explaining what happened and whether any action is needed.`,
          },
          type: {
            type: 'string',
            enum: ['info', 'warning'],
            description: `The alert type.
              Use \`info\` for a person-facing notice when no workflow data needs to be returned
              and execution may continue.
              Use \`warning\` when a person needs to pay attention or take action,
              such as providing missing information or reviewing the outcome before execution can continue.`,
          },
        },
        required: ['title', 'description', 'type'],
        additionalProperties: false,
      },
      result: resultSchema,
    },
    additionalProperties: false,
  };

  if (config.requiresApproval === 'ai_decision') {
    (schema.properties as any).requiresApproval = {
      type: 'boolean',
      description: `This field is mandatory when present.
        Decide this based on whether the workflow still requires human intervention
        after this submission.
        Set it to \`true\` only when a person must still provide missing information,
        review the outcome, or make a decision before the workflow can proceed.
        Set it to \`false\` when the workflow can proceed or end without
        any further human intervention.
        Judge this independently from whether you used \`result\` or \`alert\`.
        A person-facing \`alert.type = info\` that only confirms execution may continue
        normally uses \`false\`.
        An \`alert.type = warning\` requesting missing information or review
        should use \`true\`.`,
    };
  }

  register.registerTools({
    scope: 'SPECIFIED',
    defaultPermission: config.requiresApproval !== 'no_required' ? 'ASK' : 'ALLOW',
    from: 'workflow',
    definition: {
      name: 'aiEmployeeWorkflowTaskOutput',
      description: `Use this tool to report the outcome of the current workflow step.
        Provide exactly one of \`result\` or \`alert\`.
        Use \`result\` when there is workflow data that must be passed back to the workflow
        for subsequent execution.
        Use \`alert\` when there is no workflow data to return and the message
        is intended for a person instead, such as a status notice, a request for missing information,
        or a review prompt.
        \`alert\` must be an object with \`title\`, \`description\`, and \`type\`.
        If \`requiresApproval\` is present, decide whether human intervention is still needed:
        set it to \`true\` when required information is missing and must be supplied by a person,
        or when the outcome must be reviewed before the workflow may continue.
        Set it to \`false\` when the available information is sufficient for you to complete the task independently
        and the workflow can continue without human intervention.`,
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
