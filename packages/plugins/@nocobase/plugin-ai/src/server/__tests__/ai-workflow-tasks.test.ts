/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context, Next } from '@nocobase/actions';
import { describe, expect, it, vi } from 'vitest';
import { aiWorkflowTasks } from '../resource/aiWorkflowTasks';

type ResourceActionHandler = (ctx: Context, next: Next) => Promise<void>;

describe('aiWorkflowTasks.getBySession', () => {
  it('returns the workflow conversation employee even when the employee is disabled', async () => {
    const task = {
      id: 'task-1',
      nodeId: 'node-1',
      sessionId: 'session-1',
      status: 'pending_approval',
      acceptedUserId: 1,
      toJSON: () => ({
        id: 'task-1',
        sessionId: 'session-1',
        status: 'pending_approval',
      }),
    };
    const aiEmployee = {
      toJSON: () => ({
        username: 'atlas',
        nickname: 'Atlas',
        enabled: false,
      }),
    };
    const taskFindOne = vi.fn().mockResolvedValue(task);
    const nodeFindOne = vi.fn().mockResolvedValue({
      config: {
        username: 'atlas',
      },
    });
    const conversationFindOne = vi.fn().mockResolvedValue({ aiEmployee });
    const userTaskFindOne = vi.fn().mockResolvedValue({ read: true });
    const ctx = {
      auth: {
        user: {
          id: 1,
        },
      },
      action: {
        params: {
          values: {
            sessionId: 'session-1',
          },
        },
      },
      db: {
        getRepository: vi.fn((name: string) => {
          if (name === 'aiWorkflowTasks') {
            return { findOne: taskFindOne };
          }
          if (name === 'flow_nodes') {
            return { findOne: nodeFindOne };
          }
          if (name === 'aiConversations') {
            return { findOne: conversationFindOne };
          }
          throw new Error(`Unexpected repository: ${name}`);
        }),
        getModel: vi.fn().mockReturnValue({ findOne: userTaskFindOne }),
      },
      throw: (status: number, message?: string) => {
        throw Object.assign(new Error(message), { status });
      },
    } as unknown as Context;
    const getBySession = aiWorkflowTasks.actions?.getBySession as ResourceActionHandler;

    await getBySession(ctx, vi.fn() as Next);

    expect(conversationFindOne).toHaveBeenCalledWith({
      filter: {
        sessionId: 'session-1',
      },
      appends: ['aiEmployee'],
    });
    expect(ctx.body).toMatchObject({
      aiEmployee: {
        username: 'atlas',
        nickname: 'Atlas',
        enabled: false,
      },
    });
  });
});
