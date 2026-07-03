/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { PluginAsyncTaskManagerClientV2 } from '../plugin';

vi.mock('@nocobase/client-v2', () => ({
  Icon: () => null,
  Plugin: class Plugin {},
  TopbarActionModel: class TopbarActionModel {},
  useApp: vi.fn(),
  useMobileLayout: vi.fn(),
}));

vi.mock('@nocobase/flow-engine', () => ({
  observer: (Component: unknown) => Component,
  tExpr: (key: string) => key,
  useFlowEngine: vi.fn(),
}));

describe('PluginAsyncTaskManagerClientV2', () => {
  it('registers the async task topbar model loader and emits the loaded event', async () => {
    const registerModelLoaders = vi.fn();
    const dispatchEvent = vi.fn();
    const plugin = new PluginAsyncTaskManagerClientV2() as PluginAsyncTaskManagerClientV2 & {
      app: {
        eventBus: {
          dispatchEvent: typeof dispatchEvent;
        };
      };
      flowEngine: {
        registerModelLoaders: typeof registerModelLoaders;
      };
    };
    plugin.app = {
      eventBus: {
        dispatchEvent,
      },
    };
    Object.defineProperty(plugin, 'flowEngine', {
      value: {
        registerModelLoaders,
      },
    });

    await plugin.load();

    expect(registerModelLoaders).toHaveBeenCalledWith({
      AsyncTasksTopbarActionModel: {
        extends: 'TopbarActionModel',
        loader: expect.any(Function),
      },
    });
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'plugin:async-task-manager:loaded',
        detail: plugin,
      }),
    );

    const loaders = registerModelLoaders.mock.calls[0][0];
    await expect(loaders.AsyncTasksTopbarActionModel.loader()).resolves.toHaveProperty('AsyncTasksTopbarActionModel');
  });
});
