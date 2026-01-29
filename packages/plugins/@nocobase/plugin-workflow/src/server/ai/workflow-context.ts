/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';

type WorkflowContextItem = {
  id: string | number;
  content?: {
    workflow?: any;
    nodes?: any[];
  };
};

export async function resolveWorkflowContext(ctx: Context, contextItem: WorkflowContextItem) {
  try {
    const content = contextItem?.content;
    if (content) {
      return describeWorkflowContext(content);
    }
    const workflowId = Number(contextItem?.id);
    if (Number.isNaN(workflowId)) {
      return 'Workflow context is missing a valid workflow id.';
    }
    const workflow = await ctx.db.getRepository('workflows').findOne({
      filterByTk: workflowId,
      appends: ['nodes'],
    });
    if (!workflow) {
      return `Workflow ${workflowId} not found`;
    }
    return describeWorkflowContext({
      workflow: workflow.toJSON?.() ?? workflow,
      nodes: workflow.nodes ?? [],
    });
  } catch (error) {
    ctx.log.error(error, { module: 'workflow', subModule: 'workflow-context' });
    return 'Unable to resolve workflow context.';
  }
}

export function describeWorkflowContext(data: { workflow?: any; nodes?: any[] }) {
  const { workflow, nodes = [] } = data ?? {};
  if (!workflow) {
    return 'Workflow context is empty.';
  }
  const header = `Workflow #${workflow.id || ''} (${workflow.title || 'Untitled'})`;
  const trigger = `Trigger: ${workflow.type}. Config: ${limitString(JSON.stringify(workflow.config ?? {}))}`;
  const branchNotes =
    'branchIndex: null means main path, 0 means default/fallback branch, positive indexes correspond to ordered condition branches.';
  const nodeLines = nodes
    .map((node) => {
      const upstream = node.upstreamId == null ? 'root' : node.upstreamId;
      const downstream = node.downstreamId == null ? 'end' : node.downstreamId;
      return `[#${node.id}] ${node.title || node.type || 'Node'} <${
        node.type
      }> upstream=${upstream} downstream=${downstream} branchIndex=${
        node.branchIndex == null ? 'null' : node.branchIndex
      } config=${limitString(JSON.stringify(node.config ?? {}))}`;
    })
    .join('\n');
  return `${header}\n${trigger}\n${branchNotes}\nNodes:\n${nodeLines}`;
}

export function limitString(value: string, max = 400) {
  if (!value) {
    return '{}';
  }
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
