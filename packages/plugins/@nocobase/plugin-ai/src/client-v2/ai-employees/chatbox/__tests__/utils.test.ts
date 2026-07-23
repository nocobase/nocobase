/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { isCurrentLiveMessage, parseWorkContext } from '../utils';

describe('client-v2 chatbox utils', () => {
  it('matches live messages by rendered message id', () => {
    expect(isCurrentLiveMessage('message-1', 'message-1')).toBe(true);
    expect(isCurrentLiveMessage('message-1', 'message-2')).toBe(false);
  });

  it('matches streaming messages before the server assigns a message id', () => {
    expect(isCurrentLiveMessage(undefined, '')).toBe(true);
    expect(isCurrentLiveMessage(undefined, undefined)).toBe(true);
  });

  it('falls back to the tool call message id when the rendered message id is empty', () => {
    expect(isCurrentLiveMessage('message-1', '', 'message-1')).toBe(true);
    expect(isCurrentLiveMessage('message-1', '', 'message-2')).toBe(false);
  });

  it('parses frontend tool manifests from the selected work context provider', async () => {
    const frontendTool = {
      id: 'block-1:refresh_dashboard',
      blockUid: 'block-1',
      name: 'refresh_dashboard',
      description: 'Refresh the dashboard.',
      permission: 'ALLOW' as const,
      inputSchema: { type: 'object', properties: {} },
    };
    const app = {
      pm: {
        get: () => ({
          aiManager: {
            getWorkContext: () => ({
              getContent: async () => 'dashboard context',
              getFrontendTools: async () => [frontendTool],
            }),
          },
        }),
      },
    };

    await expect(parseWorkContext(app, [{ type: 'flow-model', uid: 'block-1' }])).resolves.toEqual([
      {
        type: 'flow-model',
        uid: 'block-1',
        content: 'dashboard context',
        frontendTools: [frontendTool],
      },
    ]);
  });

  it('refreshes code workspace content on every send even when lightweight content already exists', async () => {
    const getContent = vi
      .fn()
      .mockResolvedValueOnce({ surfaceId: 'workspace-1', revision: 'revision-1' })
      .mockResolvedValueOnce({ surfaceId: 'workspace-1', revision: 'revision-2' });
    const app = {
      pm: {
        get: () => ({
          aiManager: {
            getWorkContext: () => ({ getContent }),
          },
        }),
      },
    };
    const workContext = [{ type: 'code-workspace', uid: 'workspace-1', content: { title: 'Workspace' } }];

    await expect(parseWorkContext(app, workContext)).resolves.toEqual([
      {
        type: 'code-workspace',
        uid: 'workspace-1',
        content: { surfaceId: 'workspace-1', revision: 'revision-1' },
      },
    ]);
    await expect(parseWorkContext(app, workContext)).resolves.toEqual([
      {
        type: 'code-workspace',
        uid: 'workspace-1',
        content: { surfaceId: 'workspace-1', revision: 'revision-2' },
      },
    ]);
    expect(getContent).toHaveBeenCalledTimes(2);
  });
});
