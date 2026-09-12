/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginAIClient from '../index';

describe('AI employee v1 action model entry', () => {
  it('registers the AI employee action model loader for v1 routes', async () => {
    const registerModelLoaders = vi.fn();
    const app = {
      use: vi.fn(),
      addComponents: vi.fn(),
      apiClient: {},
      ai: {
        toolsManager: {
          registerTools: vi.fn(),
        },
      },
      aiManager: {
        toolsManager: {},
      },
      flowEngine: {
        context: {
          defineProperty: vi.fn(),
        },
        registerModels: vi.fn(),
        registerModelLoaders,
      },
      pluginSettingsManager: {
        add: vi.fn(),
      },
      pm: {
        get: vi.fn((name: unknown) => {
          if (name === 'workflow') {
            return {
              registerTrigger: vi.fn(),
              registerInstructionGroup: vi.fn(),
              registerInstruction: vi.fn(),
            };
          }
          if (name === 'data-source-manager') {
            return {
              extensionManager: {
                registerManagerAction: vi.fn(),
              },
            };
          }
          return null;
        }),
      },
    };
    const plugin = Object.assign(Object.create(PluginAIClient.prototype), {
      app,
      addPluginSettings: vi.fn(),
      setupAIFeatures: vi.fn(),
      setupWorkflow: vi.fn(),
    }) as PluginAIClient;

    await plugin.load();

    const registeredLoaders = Object.assign(
      {},
      ...registerModelLoaders.mock.calls.map(([loaders]) => loaders as Record<string, unknown>),
    );
    expect(registeredLoaders).toHaveProperty('AIEmployeeActionModel');
    expect(registeredLoaders.AIEmployeeActionModel).toMatchObject({
      extends: 'ActionModel',
    });
  });
});
