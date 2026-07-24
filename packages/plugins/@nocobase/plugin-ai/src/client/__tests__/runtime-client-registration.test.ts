/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { CodeWorkspaceContext } from '../../client-v2/ai-employees/context/code-workspace';
import { PluginAIClient } from '../index';

describe('plugin-ai runtime client registration', () => {
  it('registers workspace authoring context and clears tools when a surface unregisters', async () => {
    const registerWorkContext = vi.fn();
    const clear = vi.fn();
    let surfaceListener: ((event: { type: string; surfaceId: string }) => void) | undefined;
    const unsubscribe = vi.fn();
    const plugin = Object.create(PluginAIClient.prototype) as PluginAIClient;

    Object.assign(plugin, {
      app: {
        apiClient: {},
        aiManager: {
          toolsManager: { registerTools: vi.fn() },
          authoringSurfaces: {
            subscribe: vi.fn((listener) => {
              surfaceListener = listener;
              return unsubscribe;
            }),
          },
        },
        flowEngine: {
          context: {
            defineProperty: vi.fn(),
          },
        },
      },
      aiManager: {
        registerLLMProvider: vi.fn(),
        registerWorkContext,
        triggerTask: vi.fn(),
        triggerModelTask: vi.fn(),
        frontendTools: { clear },
      },
    });

    await plugin.setupAIFeatures();

    expect(registerWorkContext).toHaveBeenCalledWith('code-workspace', CodeWorkspaceContext);

    surfaceListener?.({ type: 'unregister', surfaceId: 'workspace-1' });
    expect(clear).toHaveBeenCalledWith('workspace-1');

    await plugin.beforeLoad();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
