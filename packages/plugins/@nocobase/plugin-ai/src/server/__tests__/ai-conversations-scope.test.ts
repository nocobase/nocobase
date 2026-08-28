/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type PluginAIServer from '../plugin';
import aiConversationsCollection from '../collections/ai-conversations';
import { AIConversationsManager } from '../ai-employees/ai-conversations';
import aiConversationsResource from '../resource/aiConversations';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock('@nocobase/actions', () => ({
  default: {
    list: mocks.list,
  },
}));

type ResourceAction = (ctx: Context, next: Next) => Promise<unknown>;

const getAction = (name: keyof typeof aiConversationsResource.actions) =>
  aiConversationsResource.actions[name] as ResourceAction;

describe('aiConversations scope', () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.list.mockResolvedValue(undefined);
  });

  it('defines a queryable scope field on aiConversations', () => {
    const scopeField = aiConversationsCollection.fields?.find((field) => field.name === 'scope');

    expect(scopeField).toMatchObject({
      name: 'scope',
      type: 'string',
      index: true,
    });
  });

  it('filters list by non-empty scope only', async () => {
    const mergedParams: unknown[] = [];
    const createContext = (scope?: string) =>
      ({
        auth: {
          user: {
            id: 7,
          },
        },
        action: {
          params: {
            scope,
            filter: {
              title: {
                $includes: 'sales',
              },
            },
          },
          mergeParams: (params: unknown) => {
            mergedParams.push(params);
          },
        },
      }) as unknown as Context;
    const next = vi.fn();

    await getAction('list')(createContext('chat-box-1'), next);
    await getAction('list')(createContext(''), next);
    await getAction('list')(createContext(), next);

    expect(mergedParams[0]).toEqual({
      filter: {
        title: {
          $includes: 'sales',
        },
        userId: 7,
        from: 'main-agent',
        category: 'chat',
        scope: 'chat-box-1',
      },
    });
    expect(mergedParams[1]).toEqual({
      filter: {
        title: {
          $includes: 'sales',
        },
        userId: 7,
        from: 'main-agent',
        category: 'chat',
      },
    });
    expect(mergedParams[2]).toEqual({
      filter: {
        title: {
          $includes: 'sales',
        },
        userId: 7,
        from: 'main-agent',
        category: 'chat',
      },
    });
    expect(mocks.list).toHaveBeenCalledTimes(3);
  });

  it('passes scope from resource create to the conversations manager', async () => {
    const createConversation = vi.fn().mockResolvedValue({ sessionId: 'session-1', scope: 'chat-box-1' });
    const findEmployee = vi.fn().mockResolvedValue({ username: 'sales' });
    const ctx = {
      auth: {
        user: {
          id: 7,
        },
      },
      state: {
        currentRoles: ['root'],
      },
      app: {
        pm: {
          get: vi.fn(() => ({
            aiConversationsManager: {
              create: createConversation,
            },
          })),
        },
      },
      db: {
        getRepository: vi.fn(() => ({
          findOne: findEmployee,
        })),
      },
      action: {
        params: {
          values: {
            aiEmployee: {
              username: 'sales',
            },
            systemMessage: 'Use sales tone',
            scope: 'chat-box-1',
          },
        },
      },
    } as unknown as Context;
    const next = vi.fn();

    await getAction('create')(ctx, next);

    expect(createConversation).toHaveBeenCalledWith({
      userId: 7,
      aiEmployee: {
        username: 'sales',
      },
      scope: 'chat-box-1',
      options: {
        systemMessage: 'Use sales tone',
        skillSettings: undefined,
        conversationSettings: undefined,
        modelSettings: undefined,
      },
    });
    expect(ctx.body).toEqual({ sessionId: 'session-1', scope: 'chat-box-1' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('writes scope when creating a conversation through the manager', async () => {
    const create = vi.fn().mockResolvedValue({ sessionId: 'session-1' });
    const manager = new AIConversationsManager({
      db: {
        getRepository: vi.fn(() => ({
          create,
        })),
      },
    } as unknown as PluginAIServer);

    await manager.create({
      userId: '7',
      aiEmployee: {
        username: 'sales',
      },
      scope: 'chat-box-1',
    });

    expect(create).toHaveBeenCalledWith({
      values: {
        userId: '7',
        title: undefined,
        aiEmployee: {
          username: 'sales',
        },
        options: {},
        thread: 1,
        from: 'main-agent',
        scope: 'chat-box-1',
        category: 'chat',
      },
      transaction: undefined,
    });
  });
});
