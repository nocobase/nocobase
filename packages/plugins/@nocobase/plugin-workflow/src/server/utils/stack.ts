/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type ExecutionModel from '../types/Execution';

type StackEntry = string | number | { [key: string]: any };

const STACK_DELIMITER = ':';

function encode(workflowId: number | string, executionId: number | string) {
  return `${workflowId}${STACK_DELIMITER}${executionId}`;
}

function getWorkflowFromEntry(entry: string) {
  const [workflowId] = entry.split(STACK_DELIMITER);
  return workflowId;
}

function normalizeEntry(entry: StackEntry): string {
  if (typeof entry === 'string') {
    return entry;
  }
  if (typeof entry === 'number') {
    return entry.toString();
  }
  if (entry && typeof entry === 'object') {
    const workflowId = entry.workflowId ?? entry['workflow_id'];
    const executionId = entry.executionId ?? entry.id ?? entry['execution_id'];
    if (workflowId != null && executionId != null) {
      return encode(workflowId, executionId);
    }
    if (executionId != null) {
      return executionId.toString();
    }
  }
  return String(entry ?? '');
}

export function buildExecutionStack(execution: ExecutionModel): string[] {
  const prev = (execution.stack as StackEntry[] | undefined)?.map(normalizeEntry) ?? [];
  const current = encode(execution.workflowId, execution.id);
  return Array.from(new Set(prev.concat(current)));
}

export function countWorkflowStackEntries(stack: StackEntry[] | undefined, workflowId: number) {
  if (!stack?.length) {
    return { count: 0, hasLegacy: false };
  }
  let count = 0;
  let hasLegacy = false;
  const workflowPrefix = `${workflowId}${STACK_DELIMITER}`;

  for (const entry of stack) {
    const normalized = normalizeEntry(entry);
    if (normalized.includes(STACK_DELIMITER)) {
      if (getWorkflowFromEntry(normalized) === String(workflowId)) {
        count += 1;
      }
    } else if (normalized) {
      hasLegacy = true;
    }
  }

  return { count, hasLegacy };
}
