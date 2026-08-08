/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import { AIMessage, createMiddleware, HumanMessage } from 'langchain';
import { z } from 'zod';
import { EXECUTE_FRONTEND_TOOL_NAME, type FrontendToolManifest } from '../../../common/frontend-tools';
import {
  WORKSPACE_AUTHORING_TOOL_NAMES,
  resolveWorkspaceAuthoringToolSets,
  type WorkspaceAuthoringToolSet,
} from '../../../common/workspace-authoring';
import {
  createWorkspaceValidationTracker,
  getWorkspaceValidationTerminalReason,
  isCurrentWorkspaceSnapshotValidated,
  reduceWorkspaceValidationMessages,
  shouldRequestWorkspaceValidation,
  workspaceValidationTrackerSchema,
  type WorkspaceValidationTerminalReason,
  type WorkspaceValidationTracker,
} from './workspace-validation-state';

const MAX_VALIDATION_ATTEMPTS = 5;
const MAX_REPEATED_DIAGNOSTICS = 2;
const MAX_MODEL_REPAIR_PROMPTS = 2;

type WorkspaceValidationMiddlewareOptions = {
  frontendTools: FrontendToolManifest[];
  translate?: (key: string) => string;
};

export function hasWorkspaceValidationTools(frontendTools: FrontendToolManifest[]) {
  return resolveWorkspaceAuthoringToolSets(frontendTools).size > 0;
}

export function workspaceValidationMiddleware(options: WorkspaceValidationMiddlewareOptions) {
  const toolSets = resolveWorkspaceAuthoringToolSets(options.frontendTools);
  return createMiddleware({
    name: 'WorkspaceValidationMiddleware',
    stateSchema: z.object({
      _workspaceValidation: workspaceValidationTrackerSchema.optional(),
    }),
    beforeModel: (state) => {
      const currentTracker = state._workspaceValidation ?? createWorkspaceValidationTracker();
      const nextTracker = reduceWorkspaceValidationMessages(state.messages, currentTracker, toolSets);
      if (nextTracker === currentTracker) {
        return;
      }
      return { _workspaceValidation: nextTracker };
    },
    wrapModelCall: async (request, handler) => {
      const tracker = request.state._workspaceValidation ?? createWorkspaceValidationTracker();
      const terminalReason = getWorkspaceValidationTerminalReason(tracker, {
        maxAttempts: MAX_VALIDATION_ATTEMPTS,
        maxRepeatedDiagnostics: MAX_REPEATED_DIAGNOSTICS,
      });
      if (tracker.appliedSnapshotId && !isCurrentWorkspaceSnapshotValidated(tracker) && terminalReason) {
        return buildFailureMessage(undefined, tracker, options.translate, terminalReason);
      }

      let response = await handler(request);
      if (!tracker.appliedSnapshotId || isCurrentWorkspaceSnapshotValidated(tracker)) {
        return response;
      }
      if (response.tool_calls?.length) {
        return response;
      }

      const toolSet = tracker.surfaceId ? toolSets.get(tracker.surfaceId) : undefined;
      if (!toolSet) {
        return buildFailureMessage(response, tracker, options.translate, 'model_no_progress');
      }
      if (shouldRequestWorkspaceValidation(tracker)) {
        return buildValidationToolCall(tracker, toolSet);
      }

      const retryMessages = [...request.messages];
      for (let attempt = 1; attempt <= MAX_MODEL_REPAIR_PROMPTS; attempt += 1) {
        const repairPrompt = buildRepairPrompt(tracker, attempt);
        retryMessages.push(response, repairPrompt);
        response = await handler({ ...request, messages: retryMessages });
        if (response.tool_calls?.length) {
          return response;
        }
      }

      return buildFailureMessage(response, tracker, options.translate, 'model_no_progress');
    },
  });
}

function buildValidationToolCall(tracker: WorkspaceValidationTracker, toolSet: WorkspaceAuthoringToolSet) {
  const fingerprint = createHash('sha256')
    .update(`${tracker.surfaceId}:${tracker.appliedSnapshotId}:${tracker.validationAttempts + 1}`)
    .digest('hex')
    .slice(0, 20);
  return new AIMessage({
    id: `workspace-validation-message-${fingerprint}`,
    content: '',
    tool_calls: [
      {
        id: `workspace-validation-call-${fingerprint}`,
        name: EXECUTE_FRONTEND_TOOL_NAME,
        args: {
          toolId: toolSet.toolIds[WORKSPACE_AUTHORING_TOOL_NAMES.validateDraft],
          args: {},
        },
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
  terminalReason: WorkspaceValidationTerminalReason,
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
