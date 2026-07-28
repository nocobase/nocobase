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
import { AIMessage, createMiddleware, HumanMessage, ToolMessage } from 'langchain';
import { z } from 'zod';
import {
  EXECUTE_FRONTEND_TOOL_NAME,
  type FrontendToolInvokeResult,
  type FrontendToolManifest,
  isFrontendToolInvokeResult,
} from '../../../common/frontend-tools';

const WORKSPACE_APPLY_TOOL_NAME = 'workspaceApplyPreparedChanges';
const WORKSPACE_VALIDATE_TOOL_NAME = 'workspaceValidateDraft';
const MAX_VALIDATION_ATTEMPTS = 5;
const MAX_REPEATED_DIAGNOSTICS = 2;
const MAX_MODEL_REPAIR_PROMPTS = 2;
const MAX_DIAGNOSTICS_SUMMARY_LENGTH = 12_000;
const MAX_PROCESSED_TOOL_CALL_IDS = 100;

type WorkspaceValidationOutcome = 'none' | 'passed' | 'diagnostics' | 'stale' | 'error';

type WorkspaceValidationTracker = {
  surfaceId?: string;
  applyToolId?: string;
  validationToolId?: string;
  appliedSnapshotId?: string;
  validatedSnapshotId?: string;
  validationPassed: boolean | null;
  validationAttempts: number;
  diagnosticsHash?: string;
  diagnosticsSummary: string;
  repeatedDiagnosticsCount: number;
  lastValidationOutcome: WorkspaceValidationOutcome;
  processedToolCallIds: string[];
  terminalReason?: 'max_attempts' | 'repeated_diagnostics' | 'model_no_progress';
};

type WorkspaceToolPair = {
  surfaceId: string;
  applyToolId: string;
  validationToolId: string;
};

type WorkspaceValidationMiddlewareOptions = {
  frontendTools: FrontendToolManifest[];
  translate?: (key: string) => string;
};

const trackerSchema = z.object({
  surfaceId: z.string().optional(),
  applyToolId: z.string().optional(),
  validationToolId: z.string().optional(),
  appliedSnapshotId: z.string().optional(),
  validatedSnapshotId: z.string().optional(),
  validationPassed: z.boolean().nullable().default(null),
  validationAttempts: z.number().int().nonnegative().default(0),
  diagnosticsHash: z.string().optional(),
  diagnosticsSummary: z.string().default(''),
  repeatedDiagnosticsCount: z.number().int().nonnegative().default(0),
  lastValidationOutcome: z.enum(['none', 'passed', 'diagnostics', 'stale', 'error']).default('none'),
  processedToolCallIds: z.array(z.string()).default([]),
  terminalReason: z.enum(['max_attempts', 'repeated_diagnostics', 'model_no_progress']).optional(),
});

const createTracker = (): WorkspaceValidationTracker => ({
  validationPassed: null,
  validationAttempts: 0,
  diagnosticsSummary: '',
  repeatedDiagnosticsCount: 0,
  lastValidationOutcome: 'none',
  processedToolCallIds: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function getWorkspaceToolPairs(frontendTools: FrontendToolManifest[]) {
  const pairs = new Map<string, Partial<WorkspaceToolPair> & Pick<WorkspaceToolPair, 'surfaceId'>>();
  for (const tool of frontendTools) {
    if (tool.name !== WORKSPACE_APPLY_TOOL_NAME && tool.name !== WORKSPACE_VALIDATE_TOOL_NAME) {
      continue;
    }
    const pair = pairs.get(tool.blockUid) ?? { surfaceId: tool.blockUid };
    if (tool.name === WORKSPACE_APPLY_TOOL_NAME) {
      pair.applyToolId = tool.id;
    } else {
      pair.validationToolId = tool.id;
    }
    pairs.set(tool.blockUid, pair);
  }
  return new Map(
    Array.from(pairs.entries()).filter(
      (entry): entry is [string, WorkspaceToolPair] => !!entry[1].applyToolId && !!entry[1].validationToolId,
    ),
  );
}

export function hasWorkspaceValidationTools(frontendTools: FrontendToolManifest[]) {
  return getWorkspaceToolPairs(frontendTools).size > 0;
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

function serializeDiagnostics(value: unknown) {
  let serialized: string;
  try {
    serialized = JSON.stringify(stableValue(value), null, 2);
  } catch (error) {
    serialized = String(value ?? '');
  }
  return serialized.length > MAX_DIAGNOSTICS_SUMMARY_LENGTH
    ? `${serialized.slice(0, MAX_DIAGNOSTICS_SUMMARY_LENGTH)}\n...[truncated]`
    : serialized;
}

function hashDiagnostics(value: unknown) {
  return createHash('sha256').update(serializeDiagnostics(value)).digest('hex');
}

function getString(value: unknown) {
  return typeof value === 'string' && value ? value : undefined;
}

function getToolCallMap(messages: BaseMessage[], pairs: Map<string, WorkspaceToolPair>) {
  const result = new Map<string, { pair: WorkspaceToolPair; kind: 'apply' | 'validate' }>();
  const pairByToolId = new Map<string, { pair: WorkspaceToolPair; kind: 'apply' | 'validate' }>();
  for (const pair of pairs.values()) {
    pairByToolId.set(pair.applyToolId, { pair, kind: 'apply' });
    pairByToolId.set(pair.validationToolId, { pair, kind: 'validate' });
  }
  for (const message of messages) {
    if (!AIMessage.isInstance(message)) {
      continue;
    }
    for (const toolCall of message.tool_calls ?? []) {
      if (toolCall.name !== EXECUTE_FRONTEND_TOOL_NAME || !isRecord(toolCall.args)) {
        continue;
      }
      const toolId = getString(toolCall.args.toolId);
      const workspaceTool = toolId ? pairByToolId.get(toolId) : undefined;
      if (workspaceTool && toolCall.id) {
        result.set(toolCall.id, workspaceTool);
      }
    }
  }
  return result;
}

function applyWorkspaceResult(
  tracker: WorkspaceValidationTracker,
  pair: WorkspaceToolPair,
  toolCallId: string,
  result: FrontendToolInvokeResult,
): WorkspaceValidationTracker {
  if (result.status !== 'success' || !isRecord(result.content)) {
    return tracker;
  }
  const snapshotId = getString(result.content.snapshotId) ?? `unknown:${toolCallId}`;
  const continuesRepairCycle =
    tracker.surfaceId === pair.surfaceId && !!tracker.appliedSnapshotId && tracker.validationPassed !== true;
  return {
    ...tracker,
    surfaceId: pair.surfaceId,
    applyToolId: pair.applyToolId,
    validationToolId: pair.validationToolId,
    appliedSnapshotId: snapshotId,
    validatedSnapshotId: undefined,
    validationPassed: null,
    validationAttempts: continuesRepairCycle ? tracker.validationAttempts : 0,
    diagnosticsHash: continuesRepairCycle ? tracker.diagnosticsHash : undefined,
    diagnosticsSummary: continuesRepairCycle ? tracker.diagnosticsSummary : '',
    repeatedDiagnosticsCount: continuesRepairCycle ? tracker.repeatedDiagnosticsCount : 0,
    lastValidationOutcome: 'none',
    terminalReason: undefined,
  };
}

function applyValidationResult(
  tracker: WorkspaceValidationTracker,
  pair: WorkspaceToolPair,
  result: FrontendToolInvokeResult | undefined,
): WorkspaceValidationTracker {
  if (tracker.surfaceId !== pair.surfaceId || !tracker.appliedSnapshotId) {
    return tracker;
  }
  const validationAttempts = tracker.validationAttempts + 1;
  if (!result || result.status !== 'success' || !isRecord(result.content)) {
    const details = result?.content ?? 'Workspace validation did not return a valid result.';
    return {
      ...tracker,
      validatedSnapshotId: undefined,
      validationPassed: false,
      validationAttempts,
      diagnosticsSummary: serializeDiagnostics(details),
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'error',
    };
  }

  const snapshotId = getString(result.content.snapshotId);
  const stale = result.content.stale === true || snapshotId !== tracker.appliedSnapshotId;
  if (stale) {
    return {
      ...tracker,
      validatedSnapshotId: snapshotId,
      validationPassed: false,
      validationAttempts,
      diagnosticsSummary: serializeDiagnostics(result.content.diagnostics ?? result.content),
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'stale',
    };
  }

  if (result.content.validationPassed === true) {
    return {
      ...tracker,
      validatedSnapshotId: snapshotId,
      validationPassed: true,
      validationAttempts,
      diagnosticsHash: undefined,
      diagnosticsSummary: '',
      repeatedDiagnosticsCount: 0,
      lastValidationOutcome: 'passed',
      terminalReason: undefined,
    };
  }

  const diagnostics = result.content.diagnostics ?? result.content;
  const diagnosticsHash = hashDiagnostics(diagnostics);
  const repeatedDiagnosticsCount =
    tracker.repeatedDiagnosticsCount > 0 && tracker.diagnosticsHash === diagnosticsHash
      ? tracker.repeatedDiagnosticsCount + 1
      : 1;
  return {
    ...tracker,
    validatedSnapshotId: snapshotId,
    validationPassed: false,
    validationAttempts,
    diagnosticsHash,
    diagnosticsSummary: serializeDiagnostics(diagnostics),
    repeatedDiagnosticsCount,
    lastValidationOutcome: 'diagnostics',
  };
}

function reduceWorkspaceToolResults(
  messages: BaseMessage[],
  currentTracker: WorkspaceValidationTracker,
  pairs: Map<string, WorkspaceToolPair>,
) {
  const toolCalls = getToolCallMap(messages, pairs);
  const processedToolCallIds = new Set(currentTracker.processedToolCallIds);
  let tracker = currentTracker;
  let changed = false;

  for (const message of messages) {
    if (!ToolMessage.isInstance(message) || !message.tool_call_id || processedToolCallIds.has(message.tool_call_id)) {
      continue;
    }
    const workspaceTool = toolCalls.get(message.tool_call_id);
    if (!workspaceTool) {
      continue;
    }
    const result = parseToolResult(message.content);
    tracker =
      workspaceTool.kind === 'apply'
        ? applyWorkspaceResult(
            tracker,
            workspaceTool.pair,
            message.tool_call_id,
            result ?? { status: 'error', content: '' },
          )
        : applyValidationResult(tracker, workspaceTool.pair, result);
    processedToolCallIds.add(message.tool_call_id);
    changed = true;
  }

  if (!changed) {
    return currentTracker;
  }
  return {
    ...tracker,
    processedToolCallIds: Array.from(processedToolCallIds).slice(-MAX_PROCESSED_TOOL_CALL_IDS),
  };
}

function getTerminalReason(tracker: WorkspaceValidationTracker) {
  if (tracker.repeatedDiagnosticsCount >= MAX_REPEATED_DIAGNOSTICS) {
    return 'repeated_diagnostics' as const;
  }
  if (tracker.validationAttempts >= MAX_VALIDATION_ATTEMPTS) {
    return 'max_attempts' as const;
  }
  return undefined;
}

function buildValidationToolCall(lastMessage: AIMessage, tracker: WorkspaceValidationTracker) {
  const callId = `workspace-validation-${createHash('sha256')
    .update(
      `${tracker.surfaceId}:${tracker.appliedSnapshotId}:${tracker.validationAttempts + 1}:${lastMessage.id ?? ''}`,
    )
    .digest('hex')
    .slice(0, 20)}`;
  return new AIMessage({
    id: lastMessage.id,
    content: '',
    tool_calls: [
      {
        id: callId,
        name: EXECUTE_FRONTEND_TOOL_NAME,
        args: { toolId: tracker.validationToolId, args: {} },
        type: 'tool_call',
      },
    ],
  });
}

function buildRepairPrompt(tracker: WorkspaceValidationTracker, attempt: number) {
  return new HumanMessage({
    id: `workspace-validation-repair-${tracker.validationAttempts}-${attempt}`,
    content: `<workspace_validation_gate>
The authoritative TypeScript validation failed for the current workspace snapshot (${tracker.appliedSnapshotId}).
Do not claim completion. Continue repairing the concrete diagnostics below. Prepare and apply a real code change; the system will validate the new snapshot automatically.

${tracker.diagnosticsSummary || 'No diagnostic details were returned.'}
</workspace_validation_gate>`,
  });
}

function buildFailureMessage(
  lastMessage: AIMessage | undefined,
  tracker: WorkspaceValidationTracker,
  translate: WorkspaceValidationMiddlewareOptions['translate'],
  terminalReason: WorkspaceValidationTracker['terminalReason'],
) {
  const t = translate ?? ((key: string) => key);
  const diagnostics = tracker.diagnosticsSummary || t('No diagnostic details were returned.');
  return new AIMessage({
    id: lastMessage?.id,
    content: `${t('Workspace validation did not pass.')}\n\n${t(
      'Automatic repair stopped before TypeScript validation succeeded.',
    )}\n\n${t('Remaining diagnostics:')}\n${diagnostics}`,
    additional_kwargs: {
      workspaceValidation: {
        passed: false,
        snapshotId: tracker.appliedSnapshotId,
        reason: terminalReason,
      },
    },
  });
}

function isCurrentSnapshotValidated(tracker: WorkspaceValidationTracker) {
  return (
    !!tracker.appliedSnapshotId &&
    tracker.validatedSnapshotId === tracker.appliedSnapshotId &&
    tracker.validationPassed === true
  );
}

export function workspaceValidationMiddleware(options: WorkspaceValidationMiddlewareOptions) {
  const pairs = getWorkspaceToolPairs(options.frontendTools);
  return createMiddleware({
    name: 'WorkspaceValidationMiddleware',
    stateSchema: z.object({
      _workspaceValidation: trackerSchema.optional(),
    }),
    beforeModel: (state) => {
      const currentTracker = state._workspaceValidation ?? createTracker();
      const nextTracker = reduceWorkspaceToolResults(state.messages, currentTracker, pairs);
      if (nextTracker === currentTracker) {
        return;
      }
      return { _workspaceValidation: nextTracker };
    },
    wrapModelCall: async (request, handler) => {
      const tracker = request.state._workspaceValidation ?? createTracker();
      const terminalReason = getTerminalReason(tracker);
      if (tracker.appliedSnapshotId && !isCurrentSnapshotValidated(tracker) && terminalReason) {
        return buildFailureMessage(undefined, tracker, options.translate, terminalReason);
      }
      let response = await handler(request);
      if (!tracker.appliedSnapshotId || isCurrentSnapshotValidated(tracker)) {
        return response;
      }
      if (response.tool_calls?.length) {
        return response;
      }
      if (
        tracker.validatedSnapshotId !== tracker.appliedSnapshotId ||
        tracker.lastValidationOutcome === 'none' ||
        tracker.lastValidationOutcome === 'stale' ||
        tracker.lastValidationOutcome === 'error'
      ) {
        return buildValidationToolCall(response, tracker);
      }

      const retryMessages = [...request.messages];
      for (let attempt = 1; attempt <= MAX_MODEL_REPAIR_PROMPTS; attempt += 1) {
        const repairPrompt = buildRepairPrompt(tracker, attempt);
        retryMessages.push(response, repairPrompt);
        response = await handler({
          ...request,
          messages: retryMessages,
        });
        if (response.tool_calls?.length) {
          return response;
        }
      }

      return buildFailureMessage(response, tracker, options.translate, 'model_no_progress');
    },
  });
}
