/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginWorkflowClientV2 from '../plugin';
import {
  WORKFLOW_TASKS_MOBILE_ROUTE_NAME,
  WORKFLOW_TASKS_MOBILE_ROUTE_PATH,
  WORKFLOW_TASKS_ROUTE_NAME,
  WORKFLOW_TASKS_ROUTE_PATH,
} from '../constants';

function createPlugin() {
  const app = {
    flowEngine: { registerModelLoaders: vi.fn() },
    entryActionManager: { register: vi.fn() },
    router: { add: vi.fn() },
    i18n: { t: (key: string) => key },
    pluginSettingsManager: { addMenuItem: vi.fn(), addPageTabItem: vi.fn() },
  };
  type PluginConstructorArgs = ConstructorParameters<typeof PluginWorkflowClientV2>;
  return {
    app,
    plugin: new PluginWorkflowClientV2(
      { packageName: 'workflow' } as PluginConstructorArgs[0],
      app as PluginConstructorArgs[1],
    ),
  };
}

describe('PluginWorkflowClientV2 task type registry', () => {
  it('keeps the v1 registerTaskType shape and injects the key', () => {
    const { plugin } = createPlugin();
    const option = {
      title: 'Demo',
      collection: 'demoTasks',
      Item: () => null,
      Detail: () => null,
      useActionParams: () => ({}),
    };

    plugin.registerTaskType('demo', option);

    expect(plugin.taskTypes.get('demo')).toEqual({ ...option, key: 'demo' });
  });

  it('registers desktop and mobile task center routes plus workflow task entry models', async () => {
    const { app, plugin } = createPlugin();

    await plugin.load();

    expect(app.router.add).toHaveBeenCalledWith(
      WORKFLOW_TASKS_ROUTE_NAME,
      expect.objectContaining({
        path: WORKFLOW_TASKS_ROUTE_PATH,
        componentLoader: expect.any(Function),
      }),
    );
    expect(app.router.add).toHaveBeenCalledWith(
      WORKFLOW_TASKS_MOBILE_ROUTE_NAME,
      expect.objectContaining({
        path: WORKFLOW_TASKS_MOBILE_ROUTE_PATH,
        componentLoader: expect.any(Function),
      }),
    );
    expect(WORKFLOW_TASKS_MOBILE_ROUTE_PATH.startsWith('/')).toBe(false);
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith(
      expect.objectContaining({
        WorkflowTasksTopbarActionModel: expect.objectContaining({
          extends: 'TopbarActionModel',
          loader: expect.any(Function),
        }),
        WorkflowTasksEntryActionModel: expect.objectContaining({
          extends: 'ActionModel',
          loader: expect.any(Function),
        }),
        WorkflowTasksEmbeddedPageModel: expect.objectContaining({
          extends: 'ChildPageModel',
          loader: expect.any(Function),
        }),
        WorkflowTasksPageMenuModel: expect.objectContaining({
          extends: 'BasePageMenuModel',
          loader: expect.any(Function),
        }),
      }),
    );
    expect(app.entryActionManager.register).toHaveBeenCalledWith(
      'workflow:tasks:action-panel',
      expect.objectContaining({
        scope: 'action-panel',
        provider: expect.any(Function),
      }),
    );
    const provider = app.entryActionManager.register.mock.calls.find(
      ([name]) => name === 'workflow:tasks:action-panel',
    )?.[1].provider;
    const items = await provider({});
    expect(items[0].createModelOptions.stepParams.popupSettings.openView).toEqual({
      mode: 'embed',
      pageModelClass: 'WorkflowTasksEmbeddedPageModel',
      showFlowSettings: false,
    });

    const modelLoaders = app.flowEngine.registerModelLoaders.mock.calls[0][0];
    await expect(modelLoaders.WorkflowTasksTopbarActionModel.loader()).resolves.toHaveProperty(
      'default',
      expect.any(Function),
    );
    await expect(modelLoaders.WorkflowTasksEntryActionModel.loader()).resolves.toHaveProperty(
      'default',
      expect.any(Function),
    );
    await expect(modelLoaders.WorkflowTasksEmbeddedPageModel.loader()).resolves.toHaveProperty(
      'default',
      expect.any(Function),
    );
    await expect(modelLoaders.WorkflowTasksPageMenuModel.loader()).resolves.toHaveProperty(
      'default',
      expect.any(Function),
    );
  });
});
