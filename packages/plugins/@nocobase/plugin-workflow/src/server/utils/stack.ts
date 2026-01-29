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

type ParsedEntry = {
  workflowId?: string;
  executionId?: string;
};

function parseStackEntry(entry: StackEntry): ParsedEntry | null {
  if (entry == null) {
    return null;
  }

  if (typeof entry === 'string') {
    if (!entry) {
      return null;
    }
    if (entry.includes(STACK_DELIMITER)) {
      const [workflowId, executionId] = entry.split(STACK_DELIMITER);
      if (!executionId) {
        return null;
      }
      return { workflowId, executionId };
    }
    return { executionId: entry };
  }

  if (typeof entry === 'number') {
    return { executionId: entry.toString() };
  }

  if (typeof entry === 'object') {
    const workflowId = entry.workflowId ?? entry['workflow_id'];
    const executionId = entry.executionId ?? entry['execution_id'] ?? entry.id;
    if (executionId == null) {
      return null;
    }
    return {
      workflowId: workflowId != null ? String(workflowId) : undefined,
      executionId: String(executionId),
    };
  }

  return null;
}

function normalizeStackEntries(entries: StackEntry[] | undefined) {
  const normalized: string[] = [];
  const seen = new Set<string>();
  let hasLegacy = false;

  if (!Array.isArray(entries) || !entries.length) {
    return { normalized, hasLegacy };
  }

  for (const entry of entries) {
    const parsed = parseStackEntry(entry);
    if (!parsed?.executionId) {
      continue;
    }

    if (!parsed.workflowId) {
      hasLegacy = true;
      if (seen.has(parsed.executionId)) {
        continue;
      }
      seen.add(parsed.executionId);
      normalized.push(parsed.executionId);
      continue;
    }

    const encoded = encode(parsed.workflowId, parsed.executionId);
    if (seen.has(encoded)) {
      continue;
    }
    seen.add(encoded);
    normalized.push(encoded);
  }

  return { normalized, hasLegacy };
}

export function buildExecutionStack(execution: ExecutionModel): string[] {
  const { normalized } = normalizeStackEntries(execution.stack as StackEntry[] | undefined);
  const current = encode(execution.workflowId, execution.id);
  if (!normalized.includes(current)) {
    normalized.push(current);
  }
  return normalized;
}

export function countWorkflowStackEntries(stack: StackEntry[] | undefined, workflowId: number) {
  const { normalized, hasLegacy } = normalizeStackEntries(stack);
  if (!normalized.length) {
    return { count: 0, hasLegacy };
  }

  const workflowPrefix = `${workflowId}${STACK_DELIMITER}`;
  let count = 0;
  for (const entry of normalized) {
    if (entry.startsWith(workflowPrefix)) {
      count += 1;
    }
  }

  return { count, hasLegacy };
}
