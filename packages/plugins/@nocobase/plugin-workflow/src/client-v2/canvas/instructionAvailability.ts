/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { BranchContextValue } from './BranchContext';

type WorkflowCapabilityContext = {
  engine: {
    isWorkflowSync(workflow: any): boolean;
  };
  workflow?: any;
  upstream?: any;
  branchIndex?: number | null;
  syncOnly?: boolean;
  branchContext?: Pick<BranchContextValue, 'syncOnly'> | null;
  t: (key: string) => string;
};

type AvailableInstruction = {
  async?: boolean;
  isAvailable?(ctx: Omit<WorkflowCapabilityContext, 't'>): boolean;
};

export function getInstructionAvailable(instruction: AvailableInstruction, ctx: WorkflowCapabilityContext) {
  if (instruction.async && ctx.engine.isWorkflowSync(ctx.workflow)) {
    return ctx.t('This type of node can not be used in current type of workflow or execute mode.');
  }

  const syncOnly = ctx.branchContext?.syncOnly ?? ctx.syncOnly ?? false;
  if (instruction.async && syncOnly) {
    return ctx.t('This branch does not support asynchronous nodes.');
  }

  if (instruction.isAvailable && !instruction.isAvailable({ ...ctx, syncOnly })) {
    return ctx.t('This type of node can not be used in current type of workflow or execute mode.');
  }

  return null;
}
