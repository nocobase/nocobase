/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, createAgent, createMiddleware, HumanMessage, ToolMessage } from 'langchain';
import { tool } from '@langchain/core/tools';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { FrontendToolManifest } from '../../common/frontend-tools';
import { WORKSPACE_AUTHORING_TOOL_NAMES, resolveWorkspaceAuthoringToolSets } from '../../common/workspace-authoring';
import { workspaceValidationMiddleware } from '../ai-employees/middleware';
import {
  createWorkspaceValidationTracker,
  reduceWorkspaceValidationMessages,
} from '../ai-employees/middleware/workspace-validation-state';

const surfaceId = 'workspace-1';
const applyToolId = `${surfaceId}:workspaceApplyPreparedChanges`;
const validateToolId = `${surfaceId}:workspaceValidateDraft`;

const frontendTools: FrontendToolManifest[] = Object.values(WORKSPACE_AUTHORING_TOOL_NAMES).map((name) => ({
  id: `${surfaceId}:${name}`,
  blockUid: surfaceId,
  name,
  description: `${name} tool.`,
  permission: name === WORKSPACE_AUTHORING_TOOL_NAMES.applyPreparedChanges ? 'ASK' : 'ALLOW',
  inputSchema: { type: 'object' },
}));

function toolCallMessage(id: string, toolId: string) {
  return new AIMessage({
    id,
    content: '',
    tool_calls: [
      {
        id: `${id}-call`,
        name: 'executeFrontendTool',
        args: { toolId, args: toolId === applyToolId ? { planId: `${id}-plan` } : {} },
        type: 'tool_call',
      },
    ],
  });
}

function finalMessage(id: string, content: string) {
  return new AIMessage({ id, content });
}

function sequenceModelMiddleware(responses: AIMessage[]) {
  let index = 0;
  return createMiddleware({
    name: 'WorkspaceValidationSequenceModelMiddleware',
    wrapModelCall: async () => {
      const response = responses[index];
      index += 1;
      if (!response) {
        throw new Error('Unexpected model invocation');
      }
      return response;
    },
  });
}

describe('workspaceValidationMiddleware', () => {
  it('processes only appended messages even when the history exceeds one hundred entries', () => {
    const filler = Array.from({ length: 120 }, (_, index) => new HumanMessage(`history-${index}`));
    const applyCall = toolCallMessage('apply-history', applyToolId);
    const applyResult = new ToolMessage({
      tool_call_id: 'apply-history-call',
      content: JSON.stringify({
        status: 'success',
        content: { surfaceId, snapshotId: 'snapshot-history', changedPaths: ['src/index.ts'] },
      }),
    });
    const validateCall = toolCallMessage('validate-history', validateToolId);
    const validateResult = new ToolMessage({
      tool_call_id: 'validate-history-call',
      content: JSON.stringify({
        status: 'success',
        content: {
          surfaceId,
          snapshotId: 'snapshot-history',
          diagnostics: [{ severity: 'error', message: 'Still broken.' }],
          stale: false,
          validationPassed: false,
        },
      }),
    });
    const messages = [...filler, applyCall, applyResult, validateCall, validateResult];
    const toolSets = resolveWorkspaceAuthoringToolSets(frontendTools);
    const first = reduceWorkspaceValidationMessages(messages, createWorkspaceValidationTracker(), toolSets);
    const second = reduceWorkspaceValidationMessages([...messages, new HumanMessage('continue')], first, toolSets);

    expect(first).toMatchObject({
      cursor: messages.length,
      validationAttempts: 1,
      repeatedDiagnosticsCount: 1,
    });
    expect(second).toMatchObject({
      cursor: messages.length + 1,
      validationAttempts: 1,
      repeatedDiagnosticsCount: 1,
    });
  });

  it('forces validation after every applied snapshot and continues repairing until the current snapshot passes', async () => {
    const invokedToolIds: string[] = [];
    let applyCount = 0;
    let validationCount = 0;
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          applyCount += 1;
          return {
            status: 'success',
            content: { surfaceId, snapshotId: `snapshot-${applyCount}`, changedPaths: ['src/index.ts'] },
          };
        }
        validationCount += 1;
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: `snapshot-${applyCount}`,
            diagnostics:
              validationCount === 1
                ? [{ severity: 'error', code: 2339, message: "Property 'data' does not exist on type 'unknown'." }]
                : [],
            stale: false,
            validationPassed: validationCount > 1,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const responses = [
      toolCallMessage('apply-1', applyToolId),
      finalMessage('premature-1', 'The TypeScript errors are fixed.'),
      finalMessage('premature-2', 'Everything is done.'),
      toolCallMessage('apply-2', applyToolId),
      finalMessage('premature-3', 'The fix is complete.'),
      finalMessage('complete', 'The current draft now passes TypeScript validation.'),
    ];
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [workspaceValidationMiddleware({ frontendTools }), sequenceModelMiddleware(responses)],
    });

    const result = await agent.invoke({ messages: [{ role: 'user', content: 'Fix the TypeScript errors.' }] });

    expect(invokedToolIds).toEqual([applyToolId, validateToolId, applyToolId, validateToolId]);
    expect(result.messages.at(-1)?.content).toBe('The current draft now passes TypeScript validation.');
    expect(
      result.messages.some(
        (message) =>
          message.content === 'The TypeScript errors are fixed.' ||
          message.content === 'Everything is done.' ||
          message.content === 'The fix is complete.',
      ),
    ).toBe(false);
  });

  it('stops with an explicit failure instead of claiming success when diagnostics do not change across two rounds', async () => {
    const invokedToolIds: string[] = [];
    let applyCount = 0;
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          applyCount += 1;
          return {
            status: 'success',
            content: { surfaceId, snapshotId: `snapshot-${applyCount}`, changedPaths: ['src/index.ts'] },
          };
        }
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: `snapshot-${applyCount}`,
            diagnostics: [{ severity: 'error', code: 2339, message: 'The same diagnostic remains.' }],
            stale: false,
            validationPassed: false,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [
        workspaceValidationMiddleware({ frontendTools }),
        sequenceModelMiddleware([
          toolCallMessage('apply-1', applyToolId),
          finalMessage('validate-1', 'Done.'),
          toolCallMessage('apply-2', applyToolId),
          finalMessage('validate-2', 'Done again.'),
          toolCallMessage('apply-3', applyToolId),
        ]),
      ],
    });

    const result = await agent.invoke({ messages: [{ role: 'user', content: 'Fix the TypeScript errors.' }] });
    const finalContent = String(result.messages.at(-1)?.content ?? '');

    expect(invokedToolIds).toEqual([applyToolId, validateToolId, applyToolId, validateToolId]);
    expect(finalContent).toContain('Workspace validation did not pass');
    expect(finalContent).toContain('The same diagnostic remains.');
    expect(finalContent).not.toContain('Done');
  });

  it('retries an authoritative validation tool failure and never falls back to cached diagnostics', async () => {
    const invokedToolIds: string[] = [];
    let validationCount = 0;
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          return {
            status: 'success',
            content: { surfaceId, snapshotId: 'snapshot-1', changedPaths: ['src/index.ts'] },
          };
        }
        validationCount += 1;
        if (validationCount === 1) {
          return {
            status: 'error',
            content: { code: 'WORKSPACE_VALIDATION_FAILED', message: 'The validator was temporarily unavailable.' },
          };
        }
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: 'snapshot-1',
            diagnostics: [],
            stale: false,
            validationPassed: true,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [
        workspaceValidationMiddleware({ frontendTools }),
        sequenceModelMiddleware([
          toolCallMessage('apply-1', applyToolId),
          finalMessage('validate-1', 'The cached diagnostics are empty, so this is fixed.'),
          finalMessage('validate-2', 'The cached diagnostics are still empty.'),
          finalMessage('complete', 'The authoritative validation now passes.'),
        ]),
      ],
    });

    const result = await agent.invoke({ messages: [{ role: 'user', content: 'Fix the TypeScript errors.' }] });

    expect(invokedToolIds).toEqual([applyToolId, validateToolId, validateToolId]);
    expect(result.messages.at(-1)?.content).toBe('The authoritative validation now passes.');
    expect(
      result.messages.some(
        (message) =>
          message.content === 'The cached diagnostics are empty, so this is fixed.' ||
          message.content === 'The cached diagnostics are still empty.',
      ),
    ).toBe(false);
  });

  it('revalidates a stale result before allowing the model to complete', async () => {
    const invokedToolIds: string[] = [];
    let validationCount = 0;
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          return {
            status: 'success',
            content: { surfaceId, snapshotId: 'snapshot-1', changedPaths: ['src/index.ts'] },
          };
        }
        validationCount += 1;
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: 'snapshot-1',
            diagnostics: [],
            stale: validationCount === 1,
            validationPassed: validationCount > 1,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [
        workspaceValidationMiddleware({ frontendTools }),
        sequenceModelMiddleware([
          toolCallMessage('apply-1', applyToolId),
          finalMessage('premature-1', 'The draft is complete.'),
          finalMessage('premature-2', 'The stale result is good enough.'),
          finalMessage('complete', 'The current snapshot now passes validation.'),
        ]),
      ],
    });

    const result = await agent.invoke({ messages: [{ role: 'user', content: 'Finish the workspace.' }] });

    expect(invokedToolIds).toEqual([applyToolId, validateToolId, validateToolId]);
    expect(result.messages.at(-1)?.content).toBe('The current snapshot now passes validation.');
    expect(
      result.messages.some(
        (message) =>
          message.content === 'The draft is complete.' || message.content === 'The stale result is good enough.',
      ),
    ).toBe(false);
  });

  it('stops after five authoritative validations without a passing snapshot', async () => {
    const invokedToolIds: string[] = [];
    let applyCount = 0;
    let validationCount = 0;
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          applyCount += 1;
          return {
            status: 'success',
            content: { surfaceId, snapshotId: `snapshot-${applyCount}`, changedPaths: ['src/index.ts'] },
          };
        }
        validationCount += 1;
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: `snapshot-${applyCount}`,
            diagnostics: [{ severity: 'error', message: `Diagnostic round ${validationCount}.` }],
            stale: false,
            validationPassed: false,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const responses: AIMessage[] = [];
    for (let round = 1; round <= 5; round += 1) {
      responses.push(toolCallMessage(`apply-${round}`, applyToolId));
      responses.push(finalMessage(`validate-${round}`, `Round ${round} is complete.`));
    }
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [workspaceValidationMiddleware({ frontendTools }), sequenceModelMiddleware(responses)],
    });

    const result = await agent.invoke(
      { messages: [{ role: 'user', content: 'Fix every validation error.' }] },
      { recursionLimit: 50 },
    );
    const finalMessageResult = result.messages.at(-1) as AIMessage;

    expect(invokedToolIds).toEqual(Array.from({ length: 5 }, () => [applyToolId, validateToolId]).flat());
    expect(finalMessageResult.content).toContain('Workspace validation did not pass');
    expect(finalMessageResult.additional_kwargs.workspaceValidation).toMatchObject({
      passed: false,
      reason: 'max_attempts',
      snapshotId: 'snapshot-5',
    });
  });

  it('fails explicitly when two repair prompts produce no tool call', async () => {
    const invokedToolIds: string[] = [];
    const executeFrontendTool = tool(
      async ({ toolId }: { toolId: string }) => {
        invokedToolIds.push(toolId);
        if (toolId === applyToolId) {
          return {
            status: 'success',
            content: { surfaceId, snapshotId: 'snapshot-1', changedPaths: ['src/index.ts'] },
          };
        }
        return {
          status: 'success',
          content: {
            surfaceId,
            snapshotId: 'snapshot-1',
            diagnostics: [{ severity: 'error', message: 'A repair is still required.' }],
            stale: false,
            validationPassed: false,
          },
        };
      },
      {
        name: 'executeFrontendTool',
        description: 'Execute a frontend tool.',
        schema: z.object({ toolId: z.string(), args: z.record(z.string(), z.unknown()).default({}) }),
      },
    );
    const agent = createAgent({
      model: new FakeListChatModel({ responses: ['unused'] }),
      tools: [executeFrontendTool],
      middleware: [
        workspaceValidationMiddleware({ frontendTools }),
        sequenceModelMiddleware([
          toolCallMessage('apply-1', applyToolId),
          finalMessage('validate-1', 'The work is done.'),
          finalMessage('no-progress-1', 'No code change is necessary.'),
          finalMessage('no-progress-2', 'I will not call a tool.'),
          finalMessage('no-progress-3', 'Still no tool call.'),
        ]),
      ],
    });

    const result = await agent.invoke({ messages: [{ role: 'user', content: 'Fix the workspace.' }] });
    const finalMessageResult = result.messages.at(-1) as AIMessage;

    expect(invokedToolIds).toEqual([applyToolId, validateToolId]);
    expect(finalMessageResult.content).toContain('Workspace validation did not pass');
    expect(finalMessageResult.additional_kwargs.workspaceValidation).toMatchObject({
      passed: false,
      reason: 'model_no_progress',
      snapshotId: 'snapshot-1',
    });
  });
});
