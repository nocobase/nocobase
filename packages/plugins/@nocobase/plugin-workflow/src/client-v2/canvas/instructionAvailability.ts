/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SharedAddNodeAnchor } from './AddNodeContext.shared';

type WorkflowCapabilityContext = SharedAddNodeAnchor & {
  engine: {
    isWorkflowSync(workflow: unknown): boolean;
  };
  workflow?: unknown;
  syncOnly?: boolean;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

type AvailableInstruction = {
  async?: boolean;
  isAvailable?(ctx: Omit<WorkflowCapabilityContext, 'branchContext'>): boolean;
};

export function getInstructionUnavailableMessage(
  instruction: AvailableInstruction,
  ctx: WorkflowCapabilityContext,
  t: Translate,
) {
  if (instruction.async && ctx.engine.isWorkflowSync(ctx.workflow)) {
    return t('This type of node can not be used in current type of workflow or execute mode.');
  }

  const syncOnly = ctx.branchContext?.syncOnly ?? ctx.syncOnly ?? false;
  if (instruction.async && syncOnly) {
    return t('This branch does not support asynchronous nodes.');
  }

  if (instruction.isAvailable && !instruction.isAvailable({ ...ctx, syncOnly })) {
    return t('This type of node can not be used in current type of workflow or execute mode.');
  }

  return null;
}

export function getInstructionAvailable(
  instruction: AvailableInstruction,
  ctx: WorkflowCapabilityContext & { t: Translate },
) {
  const { t, ...context } = ctx;
  return getInstructionUnavailableMessage(instruction, context, t);
}
