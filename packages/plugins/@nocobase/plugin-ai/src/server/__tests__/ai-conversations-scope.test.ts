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

  it('defines a nullable portalName field and queryable scope field on aiConversations', () => {
    const scopeField = aiConversationsCollection.fields?.find((field) => field.name === 'scope');
    const portalNameField = aiConversationsCollection.fields?.find((field) => field.name === 'portalName');

    expect(scopeField).toMatchObject({
      name: 'scope',
      type: 'string',
      index: true,
    });
    expect(portalNameField).toMatchObject({
      name: 'portalName',
      type: 'string',
      allowNull: true,
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
        get: () => undefined,
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
        portalName: 'admin',
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
        portalName: 'admin',
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
        portalName: 'admin',
      },
    });
    expect(mocks.list).toHaveBeenCalledTimes(3);
  });

  it('filters list by the x-portal header when present', async () => {
    const mergeParams = vi.fn();
    const ctx = {
      auth: {
        user: {
          id: 7,
        },
      },
      get: (name: string) => (name === 'x-portal' ? 'sales-portal' : ''),
      action: {
        params: {
          filter: {},
        },
        mergeParams,
      },
    } as unknown as Context;

    await getAction('list')(ctx, vi.fn());

    expect(mergeParams).toHaveBeenCalledWith({
      filter: {
        userId: 7,
        from: 'main-agent',
        category: 'chat',
        portalName: 'sales-portal',
      },
    });
  });

  it('defaults conversation unread counts to the admin portal when x-portal is absent', async () => {
    const conversationCount = vi.fn().mockResolvedValue(3);
    const workflowTaskCount = vi.fn().mockResolvedValue(2);
    const ctx = {
      auth: {
        user: {
          id: 7,
        },
      },
      db: {
        getModel: vi.fn((name: string) => ({
          count: name === 'aiConversations' ? conversationCount : workflowTaskCount,
        })),
      },
      get: () => undefined,
    } as unknown as Context;
    const next = vi.fn();

    await getAction('unreadCounts')(ctx, next);

    expect(conversationCount).toHaveBeenCalledWith({
      where: {
        userId: 7,
        read: false,
        from: 'main-agent',
        category: 'chat',
        portalName: 'admin',
      },
    });
    expect(workflowTaskCount).toHaveBeenCalledWith({
      where: {
        userId: 7,
        read: false,
      },
    });
    expect(ctx.body).toEqual({
      conversationUnreadCount: 3,
      workflowTaskUnreadCount: 2,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('defaults the unread count to the admin portal when x-portal is absent', async () => {
    const count = vi.fn().mockResolvedValue(3);
    const ctx = {
      auth: {
        user: {
          id: 7,
        },
      },
      db: {
        getModel: vi.fn(() => ({ count })),
      },
      get: () => undefined,
    } as unknown as Context;
    const next = vi.fn();

    await getAction('unreadCount')(ctx, next);

    expect(count).toHaveBeenCalledWith({
      where: {
        userId: 7,
        read: false,
        from: 'main-agent',
        category: 'chat',
        portalName: 'admin',
      },
    });
    expect(ctx.body).toEqual({ count: 3 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('defaults new conversations to the admin portal when x-portal is absent', async () => {
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
      get: () => undefined,
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
      portalName: 'admin',
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

  it('writes portalName and scope when creating a conversation through the manager', async () => {
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
      portalName: 'sales-portal',
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
        portalName: 'sales-portal',
        scope: 'chat-box-1',
        category: 'chat',
      },
      transaction: undefined,
    });
  });
});
