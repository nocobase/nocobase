/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginWorkflowClient from '../index';

type RegisteredWorkflowEntryAction = {
  prototype: {
    onClick: (event?: unknown) => Promise<void>;
  };
};

type WorkflowEntryActionInstance = {
  context: {
    isMobileLayout: boolean;
    router: { navigate: ReturnType<typeof vi.fn> };
  };
  onClick: (event?: unknown) => Promise<void>;
};

describe('PluginWorkflowClient action panel models', () => {
  it('registers the workflow task entry models in the v1 runtime', async () => {
    const registerModels = vi.fn();
    const router = { add: vi.fn() };
    const pm = {
      get: vi.fn(() => ({
        mobileRouter: { add: vi.fn() },
      })),
    };
    const app = {
      addComponents: vi.fn(),
      addProvider: vi.fn(),
      pluginSettingsManager: { add: vi.fn() },
      schemaInitializerManager: { addItem: vi.fn() },
      schemaSettingsManager: { addItem: vi.fn() },
    };
    const plugin = {
      app,
      flowEngine: { registerModels },
      pm,
      router,
      registerCollectionsToDataSource: vi.fn(),
      registerInstruction: vi.fn(),
      registerInstructionGroup: vi.fn(),
      registerSystemVariable: vi.fn(),
      registerTrigger: vi.fn(),
    };

    await PluginWorkflowClient.prototype.load.call(plugin as unknown as PluginWorkflowClient);

    expect(registerModels).toHaveBeenCalledWith(
      expect.objectContaining({
        WorkflowTasksEntryActionModel: expect.any(Function),
      }),
    );

    const registeredModels = registerModels.mock.calls[0][0] as Record<string, RegisteredWorkflowEntryAction>;
    expect(registeredModels).not.toHaveProperty('WorkflowTasksEmbeddedPageModel');

    const EntryActionModel = registeredModels.WorkflowTasksEntryActionModel;
    const model = Object.create(EntryActionModel.prototype) as WorkflowEntryActionInstance;
    const navigate = vi.fn();
    Object.defineProperty(model, 'context', {
      configurable: true,
      value: {
        isMobileLayout: true,
        router: { navigate },
      },
    });

    await model.onClick({ type: 'click' });

    expect(navigate).toHaveBeenCalledWith('/admin/workflow/tasks');
  });
});
