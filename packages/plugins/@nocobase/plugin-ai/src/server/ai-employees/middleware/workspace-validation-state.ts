/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, ToolMessage } from 'langchain';
import { z } from 'zod';
import {
  EXECUTE_FRONTEND_TOOL_NAME,
  type FrontendToolInvokeResult,
  isFrontendToolInvokeResult,
} from '../../../common/frontend-tools';
import {
  WORKSPACE_AUTHORING_TOOL_NAMES,
  isWorkspaceApplyResult,
  isWorkspaceValidationResult,
  type WorkspaceAuthoringToolSet,
} from '../../../common/workspace-authoring';

const MAX_DIAGNOSTICS_SUMMARY_LENGTH = 12_000;

export type WorkspaceValidationOutcome = 'none' | 'passed' | 'diagnostics' | 'stale' | 'error';
export type WorkspaceValidationTerminalReason = 'max_attempts' | 'repeated_diagnostics' | 'model_no_progress';

type PendingWorkspaceToolCall = {
  kind: 'apply' | 'validate';
  surfaceId: string;
};

export type WorkspaceValidationTracker = {
  cursor: number;
  pendingToolCalls: Record<string, PendingWorkspaceToolCall>;
  surfaceId?: string;
  appliedSnapshotId?: string;
  validatedSnapshotId?: string;
  validationPassed: boolean | null;
  validationAttempts: number;
  diagnosticsHash?: string;
  diagnosticsSummary: string;
  repeatedDiagnosticsCount: number;
  lastValidationOutcome: WorkspaceValidationOutcome;
};

export const workspaceValidationTrackerSchema = z.object({
  cursor: z.number().int().nonnegative().default(0),
  pendingToolCalls: z
    .record(
      z.string(),
      z.object({
        kind: z.enum(['apply', 'validate']),
        surfaceId: z.string(),
      }),
    )
    .default({}),
  surfaceId: z.string().optional(),
  appliedSnapshotId: z.string().optional(),
  validatedSnapshotId: z.string().optional(),
  validationPassed: z.boolean().nullable().default(null),
  validationAttempts: z.number().int().nonnegative().default(0),
  diagnosticsHash: z.string().optional(),
  diagnosticsSummary: z.string().default(''),
  repeatedDiagnosticsCount: z.number().int().nonnegative().default(0),
  lastValidationOutcome: z.enum(['none', 'passed', 'diagnostics', 'stale', 'error']).default('none'),
});

export function createWorkspaceValidationTracker(): WorkspaceValidationTracker {
  return {
    cursor: 0,
    pendingToolCalls: {},
    validationPassed: null,
    validationAttempts: 0,
    diagnosticsSummary: '',
    repeatedDiagnosticsCount: 0,
    lastValidationOutcome: 'none',
  };
}

export function reduceWorkspaceValidationMessages(
  messages: BaseMessage[],
  currentTracker: WorkspaceValidationTracker,
  toolSets: Map<string, WorkspaceAuthoringToolSet>,
): WorkspaceValidationTracker {
  let tracker = currentTracker.cursor > messages.length ? createWorkspaceValidationTracker() : currentTracker;
  if (tracker.cursor === messages.length) {
    return tracker;
  }

  const toolById = buildToolIdMap(toolSets);
  let pendingToolCalls = { ...tracker.pendingToolCalls };

  for (const message of messages.slice(tracker.cursor)) {
    if (AIMessage.isInstance(message)) {
      for (const toolCall of message.tool_calls || []) {
        if (toolCall.name !== EXECUTE_FRONTEND_TOOL_NAME || !toolCall.id || !isRecord(toolCall.args)) {
          continue;
        }
        const toolId = typeof toolCall.args.toolId === 'string' ? toolCall.args.toolId : undefined;
        const workspaceTool = toolId ? toolById.get(toolId) : undefined;
        if (workspaceTool) {
          pendingToolCalls[toolCall.id] = workspaceTool;
        }
      }
      continue;
    }

    if (!ToolMessage.isInstance(message) || !message.tool_call_id) {
      continue;
    }
    const pending = pendingToolCalls[message.tool_call_id];
    if (!pending) {
      continue;
    }
    const result = parseToolResult(message.content);
    tracker =
      pending.kind === 'apply'
        ? applyWorkspaceResult(tracker, pending.surfaceId, result)
        : applyValidationResult(tracker, pending.surfaceId, result);
    pendingToolCalls = { ...pendingToolCalls };
    delete pendingToolCalls[message.tool_call_id];
  }

  return {
    ...tracker,
    cursor: messages.length,
    pendingToolCalls,
  };
}

export function getWorkspaceValidationTerminalReason(
  tracker: WorkspaceValidationTracker,
  options: { maxAttempts: number; maxRepeatedDiagnostics: number },
): WorkspaceValidationTerminalReason | undefined {
  if (tracker.repeatedDiagnosticsCount >= options.maxRepeatedDiagnostics) {
    return 'repeated_diagnostics';
  }
  if (tracker.validationAttempts >= options.maxAttempts) {
    return 'max_attempts';
  }
  return undefined;
}

export function isCurrentWorkspaceSnapshotValidated(tracker: WorkspaceValidationTracker): boolean {
  return (
    !!tracker.appliedSnapshotId &&
    tracker.validatedSnapshotId === tracker.appliedSnapshotId &&
    tracker.validationPassed === true
  );
}

export function shouldRequestWorkspaceValidation(tracker: WorkspaceValidationTracker): boolean {
  return (
    tracker.validatedSnapshotId !== tracker.appliedSnapshotId ||
    tracker.lastValidationOutcome === 'none' ||
    tracker.lastValidationOutcome === 'stale' ||
    tracker.lastValidationOutcome === 'error'
  );
}

function buildToolIdMap(toolSets: Map<string, WorkspaceAuthoringToolSet>) {
  const result = new Map<string, PendingWorkspaceToolCall>();
  for (const toolSet of toolSets.values()) {
    result.set(toolSet.toolIds[WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges], {
      kind: 'apply',
      surfaceId: toolSet.surfaceId,
    });
    result.set(toolSet.toolIds[WORKSPACE_AUTHORING_TOOL_NAMES.validateDraft], {
      kind: 'validate',
      surfaceId: toolSet.surfaceId,
    });
  }
  return result;
}

function applyWorkspaceResult(
  tracker: WorkspaceValidationTracker,
  surfaceId: string,
  result: FrontendToolInvokeResult | undefined,
): WorkspaceValidationTracker {
  if (
    result?.status !== 'success' ||
    !isWorkspaceApplyResult(result.content) ||
    result.content.surfaceId !== surfaceId
  ) {
    return tracker;
  }
  const continuesRepairCycle =
    tracker.surfaceId === surfaceId && !!tracker.appliedSnapshotId && tracker.validationPassed !== true;
  return {
    ...tracker,
    surfaceId,
    appliedSnapshotId: result.content.snapshotId,
    validatedSnapshotId: undefined,
    validationPassed: null,
    validationAttempts: continuesRepairCycle ? tracker.validationAttempts : 0,
    diagnosticsHash: continuesRepairCycle ? tracker.diagnosticsHash : undefined,
    diagnosticsSummary: continuesRepairCycle ? tracker.diagnosticsSummary : '',
    repeatedDiagnosticsCount: continuesRepairCycle ? tracker.repeatedDiagnosticsCount : 0,
    lastValidationOutcome: 'none',
  };
}

function applyValidationResult(
  tracker: WorkspaceValidationTracker,
  surfaceId: string,
  result: FrontendToolInvokeResult | undefined,
): WorkspaceValidationTracker {
  if (tracker.surfaceId !== surfaceId || !tracker.appliedSnapshotId) {
    return tracker;
  }
  const validationAttempts = tracker.validationAttempts + 1;
  if (
    result?.status !== 'success' ||
    !isWorkspaceValidationResult(result.content) ||
    result.content.surfaceId !== surfaceId
  ) {
    return {
      ...tracker,
      validatedSnapshotId: undefined,
      validationPassed: false,
      validationAttempts,
      diagnosticsSummary: serializeDiagnostics(
        result?.content ?? 'Workspace validation did not return a valid result.',
      ),
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'error',
    };
  }

  const validation = result.content;
  if (validation.stale || validation.snapshotId !== tracker.appliedSnapshotId) {
    return {
      ...tracker,
      validatedSnapshotId: validation.snapshotId,
      validationPassed: false,
      validationAttempts,
      diagnosticsSummary: serializeDiagnostics(validation.diagnostics),
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'stale',
    };
  }

  if (validation.validationPassed) {
    return {
      ...tracker,
      validatedSnapshotId: validation.snapshotId,
      validationPassed: true,
      validationAttempts,
      diagnosticsHash: undefined,
      diagnosticsSummary: '',
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'passed',
    };
  }

  const diagnosticsHash = hashDiagnostics(validation.diagnostics);
  const repeatedDiagnosticsCount =
    tracker.repeatedDiagnosticsCount > 0 && tracker.diagnosticsHash === diagnosticsHash
      ? tracker.repeatedDiagnosticsCount + 1
      : 1;
  return {
    ...tracker,
    validatedSnapshotId: validation.snapshotId,
    validationPassed: false,
    validationAttempts,
    diagnosticsHash,
    diagnosticsSummary: serializeDiagnostics(validation.diagnostics),
    repeatedDiagnosticsCount,
    lastValidationOutcome: 'diagnostics',
  };
}

function parseToolResult(content: ToolMessage['content']): FrontendToolInvokeResult | undefined {
  let value: unknown = content;
  if (typeof content === 'string') {
    try {
      value = JSON.parse(content);
    } catch {
      return undefined;
    }
  }
  return isFrontendToolInvokeResult(value) ? value : undefined;
}

function serializeDiagnostics(value: unknown) {
  let serialized: string;
  try {
    serialized = JSON.stringify(stableValue(value), null, 2);
  } catch (_) {
    serialized = String(value ?? '');
  }
  return serialized.length > MAX_DIAGNOSTICS_SUMMARY_LENGTH
    ? `${serialized.slice(0, MAX_DIAGNOSTICS_SUMMARY_LENGTH)}\n...[truncated]`
    : serialized;
}

function hashDiagnostics(value: unknown) {
  return createHash('sha256').update(serializeDiagnostics(value)).digest('hex');
}

function stableValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stableValue(item, seen));
  }
  if (!isRecord(value)) {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);
  const result = Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key], seen)]),
  );
  seen.delete(value);
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
