/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BranchContextValue } from './BranchContext';
import { lang } from './locale';

export function linkNodes(nodes): void {
  const nodesMap = new Map();
  nodes.forEach((item) => nodesMap.set(item.id, item));
  for (const node of nodesMap.values()) {
    if (node.upstreamId) {
      node.upstream = nodesMap.get(node.upstreamId);
    }

    if (node.downstreamId) {
      node.downstream = nodesMap.get(node.downstreamId);
    }
  }
}

export function traverseSchema(schema, fn) {
  fn(schema);
  if (schema.properties) {
    Object.keys(schema.properties).forEach((key) => {
      traverseSchema(schema.properties[key], fn);
    });
  }
}

export function getWorkflowDetailPath(id: string | number) {
  return `/admin/settings/workflow/workflows/${id}`;
}

export function getWorkflowExecutionsPath(id: string | number) {
  return `/admin/settings/workflow/executions/${id}`;
}

type WorkflowCapabilityContext = {
  engine: {
    isWorkflowSync(workflow: any): boolean;
  };
  workflow: any;
  upstream: any;
  branchIndex: number | null;
  syncOnly?: boolean;
  branchContext?: Pick<BranchContextValue, 'syncOnly'> | null;
};

type AvailableInstruction = {
  async?: boolean;
  isAvailable?(ctx: WorkflowCapabilityContext): boolean;
};

export function getInstructionAvailable(instruction: AvailableInstruction, ctx: WorkflowCapabilityContext) {
  if (instruction.async && ctx.engine.isWorkflowSync(ctx.workflow)) {
    return lang('This type of node can not be used in current type of workflow or execute mode.');
  }

  const syncOnly = ctx.branchContext?.syncOnly ?? ctx.syncOnly ?? false;
  if (instruction.async && syncOnly) {
    return lang('This branch does not support asynchronous nodes.');
  }

  if (instruction.isAvailable && !instruction.isAvailable({ ...ctx, syncOnly })) {
    return lang('This type of node can not be used in current type of workflow or execute mode.');
  }

  return null;
}
