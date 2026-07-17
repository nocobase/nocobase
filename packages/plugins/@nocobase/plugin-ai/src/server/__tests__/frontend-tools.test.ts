/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { Context } from '@nocobase/actions';
import {
  extractFrontendToolManifests,
  findCurrentFrontendTool,
  prepareToolsForFrontendConversation,
  resolveFlowModelWorkContext,
  shouldAutoExecuteFrontendTool,
} from '../frontend-tools';
import loadFrontendTool from '../../ai/tools/loadFrontendTool';
import executeFrontendTool from '../../ai/tools/executeFrontendTool';

const frontendTool = {
  id: 'block-1:refresh_dashboard',
  blockUid: 'block-1',
  name: 'refresh_dashboard',
  title: 'Refresh dashboard',
  description: 'Refresh the current dashboard.',
  permission: 'ALLOW' as const,
  inputSchema: {
    type: 'object',
    properties: {
      force: { type: 'boolean' },
    },
  },
};

describe('frontend tools', () => {
  it('keeps the generic executor allowed while concrete tools control automatic execution', () => {
    expect(loadFrontendTool.execution).toBe('frontend');
    expect(loadFrontendTool.defaultPermission).toBe('ALLOW');
    expect(executeFrontendTool.defaultPermission).toBe('ALLOW');
    expect(shouldAutoExecuteFrontendTool([frontendTool], { toolId: frontendTool.id })).toBe(true);
    expect(shouldAutoExecuteFrontendTool([{ ...frontendTool, permission: 'ASK' }], { toolId: frontendTool.id })).toBe(
      false,
    );
    expect(shouldAutoExecuteFrontendTool([frontendTool], { toolId: 'block-1:unknown' })).toBe(false);
    expect(shouldAutoExecuteFrontendTool([frontendTool], null)).toBe(false);
  });

  it('exposes frontend tools only for bound conversations and keeps the catalog on the loader', () => {
    const tools = [
      { definition: { name: 'getSkill', description: 'Load a skill.' } },
      { definition: { name: 'loadFrontendTool', description: 'Load a frontend tool.' } },
      { definition: { name: 'executeFrontendTool', description: 'Execute a frontend tool.' } },
    ];

    expect(prepareToolsForFrontendConversation(tools, [])).toEqual([tools[0]]);
    const prepared = prepareToolsForFrontendConversation(tools, [frontendTool]);
    expect(prepared).toHaveLength(3);
    expect(prepared[1].definition.description).toContain('frontendToolCatalog');
    expect(prepared[1].definition.description).toContain(frontendTool.id);
    expect(prepared[1].definition.description).toContain('Do not ask the user for a separate confirmation');
    expect(prepared[1].definition.schema.safeParse({ toolId: frontendTool.id }).success).toBe(true);
    expect(prepared[1].definition.schema.safeParse({ toolId: 'block-1' }).success).toBe(false);
    expect(prepared[1].definition.schema.safeParse({ toolId: '__catalog__' }).success).toBe(false);
    expect(
      prepared[2].definition.schema.safeParse({ toolId: frontendTool.id, args: { riskLevel: 'high' } }).success,
    ).toBe(true);
    expect(prepared[2].definition.schema.safeParse({ toolId: '__catalog__', args: {} }).success).toBe(false);
  });

  it('extracts valid manifests but keeps tool metadata out of work context content', async () => {
    const workContext = {
      type: 'flow-model',
      uid: 'block-1',
      content: 'dashboard context',
      frontendTools: [frontendTool],
    };

    expect(extractFrontendToolManifests([workContext])).toEqual([frontendTool]);
    const resolved = await resolveFlowModelWorkContext({} as Context, workContext);

    expect(resolved).toContain('dashboard context');
    expect(resolved).not.toContain('frontendToolCatalog');
    expect(resolved).not.toContain(frontendTool.id);
    expect(resolved).not.toContain('inputSchema');
    expect(resolved).not.toContain('"force"');
  });

  it('binds the first frontend tool context to the conversation and reuses it for later messages', async () => {
    const conversation: { options: Record<string, unknown> } = { options: {} };
    const updateConversation = vi.fn(async ({ values }) => {
      conversation.options = values.options;
      return [1];
    });
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'session-1',
            messages: [
              {
                role: 'user',
                workContext: [
                  {
                    type: 'flow-model',
                    uid: 'block-1',
                    frontendTools: [frontendTool],
                  },
                ],
              },
            ],
          },
        },
      },
      db: {
        getRepository: (name: string) => {
          if (name === 'aiConversations') {
            return {
              findOne: vi.fn().mockResolvedValue(conversation),
              update: updateConversation,
            };
          }
          throw new Error(`Unexpected repository: ${name}`);
        },
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, frontendTool.id)).resolves.toEqual(frontendTool);
    expect(updateConversation).toHaveBeenCalledWith({
      filter: { sessionId: 'session-1' },
      values: {
        options: {
          frontendTools: [frontendTool],
        },
      },
    });

    ctx.action.params.values.messages = [
      {
        role: 'user',
        workContext: [
          {
            type: 'flow-model',
            uid: 'block-2',
            frontendTools: [{ ...frontendTool, id: 'block-2:refresh_dashboard', blockUid: 'block-2' }],
          },
        ],
      },
    ];
    await expect(findCurrentFrontendTool(ctx, frontendTool.id)).resolves.toEqual(frontendTool);
    await expect(findCurrentFrontendTool(ctx, 'block-2:refresh_dashboard')).resolves.toBeUndefined();
  });

  it('loads a selected tool schema and returns frontend results from the resume request', async () => {
    const conversation = {
      options: { frontendTools: [frontendTool] },
    };
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'session-1',
            toolCallResults: [
              { id: 'load-1', result: frontendTool },
              { id: 'tool-call-1', result: { refreshed: true } },
            ],
          },
        },
      },
      db: {
        getRepository: (name: string) => {
          if (name === 'aiConversations') {
            return {
              findOne: vi.fn().mockResolvedValue(conversation),
            };
          }
          throw new Error(`Unexpected repository: ${name}`);
        },
      },
    } as unknown as Context;

    await expect(
      loadFrontendTool.invoke(ctx, { toolId: frontendTool.id }, { toolCallId: 'load-1', writer: vi.fn() }),
    ).resolves.toEqual({
      status: 'success',
      content: {
        id: frontendTool.id,
        name: frontendTool.name,
        title: frontendTool.title,
        description: frontendTool.description,
        inputSchema: frontendTool.inputSchema,
        instructions:
          'Tool permission is enforced by the runtime. Do not ask the user for a separate confirmation in chat. Call executeFrontendTool directly; when approval is required, the UI will pause and show the Allow use action before execution.',
      },
    });
    await expect(
      executeFrontendTool.invoke(
        ctx,
        { toolId: frontendTool.id, args: { force: true } },
        { toolCallId: 'tool-call-1', writer: vi.fn() },
      ),
    ).resolves.toEqual({
      status: 'success',
      content: { refreshed: true },
    });
  });
});
