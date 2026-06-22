/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Instruction } from './Instruction';
import type { SharedAddNodeAnchor } from './AddNodeContext.shared';

type WorkflowCapabilityContext = SharedAddNodeAnchor & {
  engine: {
    isWorkflowSync(workflow: any): boolean;
  };
  workflow?: any;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function getInstructionUnavailableMessage(
  instruction: Pick<Instruction, 'async' | 'isAvailable'>,
  ctx: WorkflowCapabilityContext,
  t: Translate,
) {
  if (instruction.async && ctx.engine.isWorkflowSync(ctx.workflow)) {
    return t('This type of node can not be used in current type of workflow or execute mode.');
  }

  const syncOnly = ctx.branchContext?.syncOnly ?? false;
  if (instruction.async && syncOnly) {
    return t('This branch does not support asynchronous nodes.');
  }

  if (
    instruction.isAvailable &&
    !instruction.isAvailable({
      engine: ctx.engine,
      workflow: ctx.workflow,
      upstream: ctx.upstream,
      branchIndex: ctx.branchIndex ?? null,
      syncOnly,
    })
  ) {
    return t('This type of node can not be used in current type of workflow or execute mode.');
  }

  return null;
}
