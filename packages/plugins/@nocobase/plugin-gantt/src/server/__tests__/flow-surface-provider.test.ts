/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { ganttFlowSurfaceCapabilitiesProvider } from '../flow-surface-provider';
import { PluginGanttServer } from '../plugin';

describe('Gantt flow surface capability provider', () => {
  it('owns the Gantt manifest and create contract', async () => {
    const [manifest] = await ganttFlowSurfaceCapabilitiesProvider.getCapabilities({
      enabledPlugins: new Set(['@nocobase/plugin-gantt']),
    });
    const node = await ganttFlowSurfaceCapabilitiesProvider.resolveCreate?.(
      undefined as never,
      {
        initParams: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      },
      undefined as never,
    );

    expect(manifest).toMatchObject({
      publicType: 'gantt',
      implementation: { modelUse: 'GanttBlockModel' },
      availability: { create: { supported: true } },
    });
    expect(node).toMatchObject({
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
      subModels: {
        columns: [
          {
            use: 'TableActionsColumnModel',
            props: { title: '{{t("Actions")}}' },
          },
        ],
      },
    });
  });

  it('registers and unregisters the provider with flow-engine', async () => {
    const registerProvider = vi.fn();
    const unregisterProvider = vi.fn();
    const plugin = {
      app: {
        pm: {
          get: () => ({
            flowSurfaceCapabilityProviders: {
              registerProvider,
              unregisterProvider,
            },
          }),
        },
      },
      afterDisable: PluginGanttServer.prototype.afterDisable,
    } as unknown as PluginGanttServer;

    await PluginGanttServer.prototype.load.call(plugin);
    await PluginGanttServer.prototype.afterDisable.call(plugin);
    await PluginGanttServer.prototype.remove.call(plugin);

    expect(registerProvider).toHaveBeenCalledWith(ganttFlowSurfaceCapabilitiesProvider);
    expect(unregisterProvider).toHaveBeenCalledTimes(2);
    expect(unregisterProvider).toHaveBeenLastCalledWith('@nocobase/plugin-gantt');
  });
});
