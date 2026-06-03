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
  it('should expose a public-safe read-only Gantt canary manifest', () => {
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
          supported: false,
          reasonCode: 'missing-create-contract',
        },
        configure: {
          supported: false,
          reasonCode: 'contract-not-verified',
        },
      },
      supportLevel: 'readback-only',
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
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
