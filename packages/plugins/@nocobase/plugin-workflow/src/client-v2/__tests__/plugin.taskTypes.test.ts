/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { Outlet } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PluginWorkflowClientV2 from '../plugin';
import {
  WORKFLOW_CANVAS_ROUTE_NAME,
  WORKFLOW_CANVAS_ROUTE_PATH,
  WORKFLOW_CANVAS_SETTINGS_ROUTE_NAME,
  WORKFLOW_CANVAS_SETTINGS_ROUTE_PATH,
  WORKFLOW_EXECUTION_ROUTE_NAME,
  WORKFLOW_EXECUTION_ROUTE_PATH,
  WORKFLOW_EXECUTION_SETTINGS_ROUTE_NAME,
  WORKFLOW_EXECUTION_SETTINGS_ROUTE_PATH,
  WORKFLOW_TASKS_MOBILE_ROUTE_NAME,
  WORKFLOW_TASKS_MOBILE_ROUTE_PATH,
  WORKFLOW_TASKS_ROUTE_NAME,
  WORKFLOW_TASKS_ROUTE_PATH,
} from '../constants';

function createPlugin() {
  const app = {
    flowEngine: { registerModelLoaders: vi.fn() },
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

  it('registers desktop and mobile task center routes plus the topbar action model', async () => {
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
      }),
    );

    const modelLoaders = app.flowEngine.registerModelLoaders.mock.calls[0][0];
    await expect(modelLoaders.WorkflowTasksTopbarActionModel.loader()).resolves.toHaveProperty(
      'default',
      expect.any(Function),
    );
  });

  it('registers standalone and settings-compatible workflow detail routes', async () => {
    const { app, plugin } = createPlugin();

    await plugin.load();

    [
      [WORKFLOW_CANVAS_ROUTE_NAME, WORKFLOW_CANVAS_ROUTE_PATH],
      [WORKFLOW_CANVAS_SETTINGS_ROUTE_NAME, WORKFLOW_CANVAS_SETTINGS_ROUTE_PATH],
      [WORKFLOW_EXECUTION_ROUTE_NAME, WORKFLOW_EXECUTION_ROUTE_PATH],
      [WORKFLOW_EXECUTION_SETTINGS_ROUTE_NAME, WORKFLOW_EXECUTION_SETTINGS_ROUTE_PATH],
    ].forEach(([name, path]) => {
      expect(app.router.add).toHaveBeenCalledWith(
        name,
        expect.objectContaining({ path, componentLoader: expect.any(Function) }),
      );
    });
  });

  it('matches a settings-compatible workflow URL inside the v2 basename to the canvas route', () => {
    const app = createMockClient({ publicPath: '/v/' });
    app.router.add('admin', { path: '/admin', Component: Outlet });
    app.router.add('admin.settings', { path: '/admin/settings', Component: Outlet });
    app.pluginSettingsManager.addMenuItem({ key: 'workflow', title: 'Workflow' });
    app.pluginSettingsManager.addPageTabItem({ menuKey: 'workflow', key: 'index', title: 'Workflow' });
    app.router.add(WORKFLOW_CANVAS_SETTINGS_ROUTE_NAME, {
      path: WORKFLOW_CANVAS_SETTINGS_ROUTE_PATH,
      Component: () => null,
    });

    const matches = app.router.matchRoutes('/v/admin/settings/workflow/workflows/342944512737281') || [];

    expect(matches.at(-1)?.route.id).toBe(WORKFLOW_CANVAS_SETTINGS_ROUTE_NAME);
  });
});
