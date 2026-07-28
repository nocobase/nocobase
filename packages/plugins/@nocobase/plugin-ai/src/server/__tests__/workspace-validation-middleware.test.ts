/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, createAgent, createMiddleware } from 'langchain';
import { tool } from '@langchain/core/tools';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { FrontendToolManifest } from '../../common/frontend-tools';
import { workspaceValidationMiddleware } from '../ai-employees/middleware';

const surfaceId = 'workspace-1';
const applyToolId = `${surfaceId}:workspaceApplyPreparedChanges`;
const validateToolId = `${surfaceId}:workspaceValidateDraft`;

const frontendTools: FrontendToolManifest[] = [
  {
    id: applyToolId,
    blockUid: surfaceId,
    name: 'workspaceApplyPreparedChanges',
    description: 'Apply changes.',
    permission: 'ASK',
    inputSchema: { type: 'object' },
  },
  {
    id: validateToolId,
    blockUid: surfaceId,
    name: 'workspaceValidateDraft',
    description: 'Validate draft.',
    permission: 'ALLOW',
    inputSchema: { type: 'object' },
  },
];

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
});
