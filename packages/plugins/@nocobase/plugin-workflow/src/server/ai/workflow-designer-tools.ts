/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { z } from 'zod';

import type { ToolOptions } from './types';

const workflowUpsertSchema = z
  .object({
    action: z.enum(['create', 'update']).describe('Create or update a workflow.'),
    workflowId: z.number().int().positive().optional().describe('Required when action = update.'),
    values: z.record(z.string(), z.any()).describe('Workflow fields for repository create/update.'),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'update' && !value.workflowId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'workflowId is required when action is update',
        path: ['workflowId'],
      });
    }
  });

const workflowNodeUpsertSchema = z
  .object({
    action: z.enum(['create', 'update']).describe('Create or update a workflow node.'),
    workflowId: z.number().int().positive().describe('Target workflow id.'),
    nodeId: z.number().int().positive().optional().describe('Required when action = update.'),
    values: z.record(z.string(), z.any()).describe('Node fields for repository create/update.'),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'update' && !value.nodeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'nodeId is required when action is update',
        path: ['nodeId'],
      });
    }
  });

function success(content: any) {
  return { status: 'success' as const, content: typeof content === 'string' ? content : JSON.stringify(content) };
}

function failure(message: string) {
  return { status: 'error' as const, content: message };
}

export const workflowUpsertTool: ToolOptions = {
  name: 'workflowUpsert',
  title: '{{t("Workflow create/update")}}',
  description: `{{t('Create or update workflows via repository create/update. Before calling, use "Search documentation" (searchDocs) and "Read documentation file" (readDocEntry) to review @nocobase/plugin-workflow docs in storage/ai/docs for fields and modeling rules.')}}`,
  schema: workflowUpsertSchema,
  async invoke(ctx: Context, args) {
    try {
      const input = workflowUpsertSchema.parse(args ?? {});
      const values = input.values ?? {};
      if (!values || Object.keys(values).length === 0) {
        throw new Error('values is required');
      }

      const repo = ctx.db.getRepository('workflows');

      if (input.action === 'create') {
        const workflow = await repo.create({ values });
        return success({
          action: 'create',
          workflowId: workflow?.id,
          workflow: workflow?.toJSON?.() ?? workflow,
        });
      }

      const existing = await repo.findOne({ filterByTk: input.workflowId });
      if (!existing) {
        throw new Error(`Workflow ${input.workflowId} not found`);
      }

      await repo.update({
        filterByTk: input.workflowId,
        values,
      });

      const workflow = await repo.findOne({ filterByTk: input.workflowId });
      return success({
        action: 'update',
        workflowId: input.workflowId,
        workflow: workflow?.toJSON?.() ?? workflow,
      });
    } catch (error) {
      ctx.log.error(error, { module: 'workflow', subModule: 'workflow-upsert' });
      return failure(error.message || 'Unable to create/update workflow');
    }
  },
};

export const workflowNodeUpsertTool: ToolOptions = {
  name: 'workflowNodeUpsert',
  title: '{{t("Workflow node create/update")}}',
  description: `{{t('Create or update workflow nodes via repository create/update. Before calling, use "Search documentation" (\`searchDocs\`) and "Read documentation file" (\`readDocEntry\`) to review @nocobase/plugin-workflow docs in storage/ai/docs for node fields and branching rules.')}}`,
  schema: workflowNodeUpsertSchema,
  async invoke(ctx: Context, args) {
    try {
      const input = workflowNodeUpsertSchema.parse(args ?? {});
      const values = input.values ?? {};
      if (!values || Object.keys(values).length === 0) {
        throw new Error('values is required');
      }

      const repo = ctx.db.getRepository('flow_nodes');

      if (input.action === 'create') {
        if (values.workflowId && values.workflowId !== input.workflowId) {
          throw new Error('values.workflowId must match workflowId');
        }
        const node = await repo.create({
          values: {
            ...values,
            workflowId: input.workflowId,
          },
        });
        return success({
          action: 'create',
          nodeId: node?.id,
          node: node?.toJSON?.() ?? node,
        });
      }

      const existing = await repo.findOne({ filterByTk: input.nodeId });
      if (!existing) {
        throw new Error(`Node ${input.nodeId} not found`);
      }
      if (existing.workflowId !== input.workflowId) {
        throw new Error(`Node ${input.nodeId} does not belong to workflow ${input.workflowId}`);
      }

      if (values.workflowId && values.workflowId !== input.workflowId) {
        throw new Error('values.workflowId must match workflowId');
      }
      const updateValues = { ...values } as Record<string, any>;
      delete updateValues.workflowId;

      if (Object.keys(updateValues).length === 0) {
        throw new Error('values is required');
      }

      await repo.update({
        filterByTk: input.nodeId,
        values: updateValues,
      });

      const node = await repo.findOne({ filterByTk: input.nodeId });
      return success({
        action: 'update',
        nodeId: input.nodeId,
        node: node?.toJSON?.() ?? node,
      });
    } catch (error) {
      ctx.log.error(error, { module: 'workflow', subModule: 'workflow-node-upsert' });
      return failure(error.message || 'Unable to create/update workflow node');
    }
  },
};
