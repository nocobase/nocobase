/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { createGanttFlowSurfaceCapabilityProvider, PluginGanttServer } from '../plugin';

describe('Gantt flow surface capability provider', () => {
  it('should expose a public-safe create-enabled Gantt canary manifest', () => {
    const provider = createGanttFlowSurfaceCapabilityProvider();
    const [capability] = provider.getCapabilities({
      enabledPlugins: new Set(['@nocobase/plugin-gantt']),
    });

    expect(provider.ownerPlugin).toBe('@nocobase/plugin-gantt');
    expect(capability).toMatchObject({
      id: 'blocks.gantt',
      kind: 'block',
      publicType: 'gantt',
      implementation: {
        modelUse: 'GanttBlockModel',
      },
      availability: {
        create: {
          supported: true,
        },
        configure: {
          supported: false,
          reasonCode: 'contract-not-verified',
        },
      },
      supportLevel: 'create-only',
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
        required: ['titleField', 'startField', 'endField'],
        properties: {
          titleField: {
            type: 'string',
          },
          startField: {
            type: 'string',
          },
          endField: {
            type: 'string',
          },
          timeScale: {
            enum: ['hour', 'quarterDay', 'halfDay', 'day', 'week', 'month', 'year', 'quarterYear'],
          },
        },
      },
    });

    const publicSchema = JSON.stringify({
      initParamsSchema: capability.initParamsSchema,
      settingsSchema: capability.settingsSchema,
      configureOptions: capability.configureOptions,
    });
    expect(publicSchema).not.toContain('GanttBlockModel');
    expect(publicSchema).not.toContain('stepParams');
    expect(publicSchema).not.toContain('props');
  });

  it('should validate and resolve a guarded create node', () => {
    const provider = createGanttFlowSurfaceCapabilityProvider();
    const [capability] = provider.getCapabilities({
      enabledPlugins: new Set(['@nocobase/plugin-gantt']),
    });

    expect(capability.availability?.create?.supported).toBe(true);
    expect(provider.validateSettings?.(capability, { initParams: {}, settings: {} })).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'initParams.collectionName',
        }),
        expect.objectContaining({
          path: 'settings.titleField',
        }),
      ]),
    });

    expect(
      provider.validateSettings?.(capability, {
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          titleField: 'title',
          startField: 'startAt',
          endField: 'endAt',
          pageSize: 201,
        },
      }),
    ).toMatchObject({
      ok: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          path: 'settings.pageSize',
        }),
      ]),
    });

    const validation = provider.validateSettings?.(capability, {
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
        progressField: 'progress',
        colorField: 'status',
        timeScale: 'week',
        pageSize: 50,
        showRowNumbers: true,
        treeTable: false,
      },
    });
    expect(validation).toEqual({
      ok: true,
    });

    const node = provider.resolveCreate?.(capability, {
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
        progressField: 'progress',
        colorField: 'status',
        timeScale: 'week',
        pageSize: 50,
        showRowNumbers: true,
        treeTable: false,
      },
    });

    expect(node).toMatchObject({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
          progress: 'progress',
          color: 'status',
          range: 'week',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
        ganttSettings: {
          fields: {
            title: 'title',
            start: 'startAt',
            end: 'endAt',
            progress: 'progress',
            color: 'status',
            range: 'week',
          },
        },
        tableSettings: {
          pageSize: {
            pageSize: 50,
          },
          showRowNumbers: {
            showIndex: true,
          },
          treeTable: {
            treeTable: false,
          },
        },
      },
    });
    expect(node).not.toHaveProperty('subModels');
    expect(JSON.stringify(node)).not.toContain('capabilityId');
    expect(JSON.stringify(node)).not.toContain('createModelOptions');
    expect(JSON.stringify(node)).not.toContain('TableActionsColumnModel');
  });

  it('should re-register the provider when the plugin is enabled again', async () => {
    const providers = new Map<string, ReturnType<typeof createGanttFlowSurfaceCapabilityProvider>>();
    const registry = {
      registerProvider: vi.fn((provider: ReturnType<typeof createGanttFlowSurfaceCapabilityProvider>) => {
        providers.set(provider.ownerPlugin, provider);
      }),
      unregisterProvider: vi.fn((ownerPlugin: string) => {
        providers.delete(ownerPlugin);
      }),
    };
    const plugin = Object.create(PluginGanttServer.prototype) as {
      app: {
        pm: {
          get: (name: string) => unknown;
        };
      };
      load: () => Promise<void>;
      afterDisable: () => Promise<void>;
      afterEnable: () => Promise<void>;
    };
    plugin.app = {
      pm: {
        get: (name: string) => (name === 'flow-engine' ? { flowSurfaceCapabilityProviders: registry } : undefined),
      },
    };

    await plugin.load();
    expect(registry.registerProvider).toHaveBeenCalledTimes(1);
    expect(providers.has('@nocobase/plugin-gantt')).toBe(true);

    await plugin.afterDisable();
    expect(registry.unregisterProvider).toHaveBeenCalledWith('@nocobase/plugin-gantt');
    expect(providers.has('@nocobase/plugin-gantt')).toBe(false);

    await plugin.afterEnable();
    expect(registry.registerProvider).toHaveBeenCalledTimes(2);
    expect(providers.has('@nocobase/plugin-gantt')).toBe(true);
  });
});
