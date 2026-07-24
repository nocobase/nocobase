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

const workspaceApplyTool = {
  id: 'workspace-1:workspaceApplyPreparedChanges',
  blockUid: 'workspace-1',
  name: 'workspaceApplyPreparedChanges',
  title: 'Apply prepared workspace changes',
  description: 'Apply a prepared plan without saving.',
  permission: 'ASK' as const,
  inputSchema: {
    type: 'object',
    required: ['planId'],
    properties: { planId: { type: 'string' } },
    additionalProperties: false,
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
    expect(shouldAutoExecuteFrontendTool([workspaceApplyTool], { toolId: workspaceApplyTool.id })).toBe(false);
  });

  it('keeps workspace apply bound to the first conversation catalog and accepts only planId', async () => {
    const conversation: { options: Record<string, unknown> } = {
      options: {
        codingTarget: {
          type: 'workspace',
          surfaceId: 'workspace-1',
          kind: 'runjs-studio',
          title: 'Workspace one',
        },
      },
    };
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'workspace-session',
            messages: [
              {
                role: 'user',
                workContext: [
                  {
                    type: 'code-workspace',
                    uid: 'workspace-1',
                    frontendTools: [workspaceApplyTool],
                  },
                ],
              },
            ],
          },
        },
      },
      db: {
        getRepository: (name: string) => {
          if (name !== 'aiConversations') {
            throw new Error(`Unexpected repository: ${name}`);
          }
          return {
            findOne: vi.fn().mockImplementation(async () => conversation),
            update: vi.fn().mockImplementation(async ({ values }) => {
              conversation.options = values.options;
              return [1];
            }),
          };
        },
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, workspaceApplyTool.id)).resolves.toEqual(workspaceApplyTool);
    expect(workspaceApplyTool.inputSchema).toEqual({
      type: 'object',
      required: ['planId'],
      properties: { planId: { type: 'string' } },
      additionalProperties: false,
    });

    ctx.action.params.values.messages = [
      {
        role: 'user',
        workContext: [
          {
            type: 'code-workspace',
            uid: 'workspace-2',
            frontendTools: [{ ...workspaceApplyTool, id: 'workspace-2:workspaceApplyPreparedChanges' }],
          },
        ],
      },
    ];
    await expect(findCurrentFrontendTool(ctx, 'workspace-2:workspaceApplyPreparedChanges')).resolves.toBeUndefined();
    await expect(findCurrentFrontendTool(ctx, workspaceApplyTool.id)).resolves.toEqual(workspaceApplyTool);
  });

  it('rejects a first frontend tool catalog from another surface when the request omits codingTarget', async () => {
    const updateConversation = vi.fn();
    const conversation = {
      options: {
        codingTarget: {
          type: 'workspace',
          surfaceId: 'workspace-1',
          kind: 'runjs-studio',
          title: 'Workspace one',
        },
      },
    };
    const mismatchedTool = {
      ...workspaceApplyTool,
      id: 'workspace-2:workspaceApplyPreparedChanges',
      blockUid: 'workspace-2',
    };
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'workspace-session',
            messages: [
              {
                role: 'user',
                workContext: [{ type: 'code-workspace', uid: 'workspace-2', frontendTools: [mismatchedTool] }],
              },
            ],
          },
        },
      },
      db: {
        getRepository: () => ({
          findOne: vi.fn().mockResolvedValue(conversation),
          update: updateConversation,
        }),
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, mismatchedTool.id)).resolves.toBeUndefined();
    expect(updateConversation).not.toHaveBeenCalled();

    ctx.action.params.values.messages = [
      {
        role: 'user',
        workContext: [{ type: 'code-workspace', uid: 'workspace-1', frontendTools: [workspaceApplyTool] }],
      },
    ];
    await expect(findCurrentFrontendTool(ctx, workspaceApplyTool.id)).resolves.toEqual(workspaceApplyTool);
    expect(updateConversation).toHaveBeenCalledWith({
      filter: { sessionId: 'workspace-session' },
      values: {
        options: {
          codingTarget: conversation.options.codingTarget,
          frontendTools: [workspaceApplyTool],
        },
      },
    });
  });

  it('does not expose a persisted frontend tool catalog from another surface', async () => {
    const mismatchedTool = {
      ...workspaceApplyTool,
      id: 'workspace-2:workspaceApplyPreparedChanges',
      blockUid: 'workspace-2',
    };
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'workspace-session',
          },
        },
      },
      db: {
        getRepository: () => ({
          findOne: vi.fn().mockResolvedValue({
            options: {
              codingTarget: {
                type: 'workspace',
                surfaceId: 'workspace-1',
                kind: 'runjs-studio',
                title: 'Workspace one',
              },
              frontendTools: [mismatchedTool],
            },
          }),
        }),
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, mismatchedTool.id)).resolves.toBeUndefined();
  });

  it('fails closed when a conversation has an invalid persisted coding target', async () => {
    const ctx = {
      action: {
        params: {
          values: {
            sessionId: 'workspace-session',
          },
        },
      },
      db: {
        getRepository: () => ({
          findOne: vi.fn().mockResolvedValue({
            options: {
              codingTarget: {
                type: 'workspace',
                surfaceId: '',
                kind: 'runjs-studio',
                title: 'Invalid workspace',
              },
              frontendTools: [workspaceApplyTool],
            },
          }),
        }),
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, workspaceApplyTool.id)).resolves.toBeUndefined();
  });

  it('fails closed when a sessionless request explicitly provides an invalid coding target', async () => {
    const ctx = {
      action: {
        params: {
          values: {
            codingTarget: {
              type: 'workspace',
              surfaceId: '',
              kind: 'runjs-studio',
              title: 'Invalid workspace',
            },
            messages: [
              {
                role: 'user',
                workContext: [
                  {
                    type: 'code-workspace',
                    uid: 'workspace-1',
                    frontendTools: [workspaceApplyTool],
                  },
                ],
              },
            ],
          },
        },
      },
    } as unknown as Context;

    await expect(findCurrentFrontendTool(ctx, workspaceApplyTool.id)).resolves.toBeUndefined();
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
