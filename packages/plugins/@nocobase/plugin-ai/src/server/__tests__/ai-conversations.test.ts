/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type PluginAIServer from '../plugin';
import { parseWorkspaceCodingTargetMetadata } from '../../common/workspace-coding-target';
import { AIConversationsManager } from '../ai-employees/ai-conversations';
import { isAIEmployeeEnabled } from '../resource/aiConversations';

describe('aiConversations resource', () => {
  it('treats disabled AI employees as unavailable for conversation creation', () => {
    const employee = {
      get: (key: string) => (key === 'enabled' ? false : undefined),
    };

    expect(isAIEmployeeEnabled(employee as never)).toBe(false);
  });

  it('allows AI employees unless they are explicitly disabled', () => {
    const employee = {
      get: (key: string) => (key === 'enabled' ? true : undefined),
    };

    expect(isAIEmployeeEnabled(employee as never)).toBe(true);
    expect(isAIEmployeeEnabled(undefined)).toBe(true);
  });

  it('accepts only bounded workspace target metadata without application identity', () => {
    expect(
      parseWorkspaceCodingTargetMetadata({
        type: 'workspace',
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'Workspace A',
      }),
    ).toEqual({
      type: 'workspace',
      surfaceId: 'workspace-a',
      kind: 'light-extension',
      title: 'Workspace A',
    });
    expect(
      parseWorkspaceCodingTargetMetadata({
        type: 'workspace',
        applicationKey: 'must-not-cross-the-server-boundary',
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'Workspace A',
      }),
    ).toBeUndefined();
    expect(
      parseWorkspaceCodingTargetMetadata({
        type: 'workspace',
        surfaceId: ' ',
        kind: 'light-extension',
        title: 'Workspace A',
      }),
    ).toBeUndefined();
    expect(
      parseWorkspaceCodingTargetMetadata({
        type: 'workspace',
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'x'.repeat(513),
      }),
    ).toBeUndefined();
  });

  it('returns persisted workspace target metadata independently of the 200-message history window', async () => {
    const conversation = {
      options: {
        codingTarget: {
          type: 'workspace',
          surfaceId: 'workspace-a',
          kind: 'light-extension',
          title: 'Workspace A',
        },
      },
    };
    const findMessages = vi.fn(async ({ limit }: { limit: number }) => {
      expect(limit).toBe(200);
      return [];
    });
    const aiConversationsRepository = {
      findOne: vi.fn(async () => conversation),
      count: vi.fn(async () => 1),
    };
    const aiToolMessagesRepository = {
      find: vi.fn(async () => []),
    };
    const plugin = {
      db: {
        getRepository: (name: string) => {
          if (name === 'aiConversations') {
            return aiConversationsRepository;
          }
          if (name === 'aiConversations.messages') {
            return { find: findMessages };
          }
          if (name === 'aiToolMessages') {
            return aiToolMessagesRepository;
          }
          throw new Error(`Unexpected repository: ${name}`);
        },
      },
      aiManager: {
        toolManager: {
          listTools: vi.fn(async () => []),
        },
      },
    } as unknown as PluginAIServer;
    const manager = new AIConversationsManager(plugin);

    await expect(manager.getMessages({ userId: 'user-1', sessionId: 'session-1', paginate: false })).resolves.toEqual({
      rows: [],
      codingTarget: {
        type: 'workspace',
        surfaceId: 'workspace-a',
        kind: 'light-extension',
        title: 'Workspace A',
      },
    });
    expect(findMessages).toHaveBeenCalledOnce();
  });
});
