/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter } from '@nocobase/server';

import { registerFlowModelRunJSSourceAdapters } from '../runjs-sources';

type Registrar = {
  adapters: RunJSSourceAdapter[];
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
};

describe('flow-engine RunJS source registration', () => {
  it('prefers the Light Extension host and unregisters every adapter on cleanup', () => {
    const lightExtension = createRegistrar();
    const legacyVsc = createRegistrar();
    const cleanup = registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: (name) => {
            if (name === '@nocobase/plugin-light-extension') {
              return lightExtension;
            }
            if (name === '@nocobase/plugin-vsc-file') {
              return legacyVsc;
            }
            return null;
          },
        },
      },
    });

    expect(lightExtension.adapters.map((adapter) => adapter.kind)).toEqual([
      'flowModel.step',
      'flowModel.flowRegistry.runjs',
      'chart.option',
      'chart.events',
    ]);
    expect(legacyVsc.adapters).toEqual([]);
    cleanup();
    expect(lightExtension.adapters).toEqual([]);
  });

  it('registers after Light Extension loads and removes the pending listener on cleanup', () => {
    const registrar = createRegistrar();
    const listeners = new Set<(plugin: unknown) => void>();
    let loaded = false;
    const cleanup = registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: (name) => (loaded && name === '@nocobase/plugin-light-extension' ? registrar : null),
        },
        on: (_eventName, listener) => listeners.add(listener),
        off: (_eventName, listener) => listeners.delete(listener),
      },
    });

    expect(listeners.size).toBe(1);
    loaded = true;
    for (const listener of listeners) {
      listener(registrar);
    }
    expect(registrar.adapters.length).toBeGreaterThan(0);
    expect(listeners.size).toBe(0);

    cleanup();
    expect(registrar.adapters).toEqual([]);
  });

  it('discovers a capability host when no known alias resolves', () => {
    const registrar = createRegistrar();
    const legacyVsc = createRegistrar();
    const cleanup = registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: (name) => (name === '@nocobase/plugin-vsc-file' ? legacyVsc : null),
          getPlugins: () => new Map([['custom-host', registrar]]),
        },
      },
    });

    expect(registrar.adapters.length).toBeGreaterThan(0);
    expect(legacyVsc.adapters).toEqual([]);
    cleanup();
    expect(registrar.adapters).toEqual([]);
  });

  it('keeps the legacy VSC alias as the final compatibility fallback', () => {
    const registrar = createRegistrar();
    const cleanup = registerFlowModelRunJSSourceAdapters({
      db: {} as Database,
      app: {
        pm: {
          get: (name) => (name === 'vsc-file' ? registrar : null),
        },
      },
    });

    expect(registrar.adapters.length).toBeGreaterThan(0);
    cleanup();
    expect(registrar.adapters).toEqual([]);
  });

  it('keeps repeated load and cleanup free of duplicate or residual adapters', () => {
    const registrar = createRegistrar();
    const plugin = {
      db: {} as Database,
      app: {
        pm: {
          get: (name: string) => (name === 'light-extension' ? registrar : null),
        },
      },
    };
    let cleanup: (() => void) | undefined;
    const load = () => {
      cleanup?.();
      cleanup = registerFlowModelRunJSSourceAdapters(plugin);
    };

    load();
    const adapterCount = registrar.adapters.length;
    load();
    expect(registrar.adapters).toHaveLength(adapterCount);

    cleanup?.();
    cleanup?.();
    expect(registrar.adapters).toEqual([]);
  });

  it('treats a recognized FlowModel RunJS step as uninitialized when its params are not persisted yet', async () => {
    const registrar = createRegistrar();
    const db = {
      getCollection: () => ({
        repository: {
          findModelById: async () => ({
            uid: 'js-step-model',
            use: 'JSBlockModel',
            stepParams: {
              jsSettings: {},
            },
          }),
        },
      }),
    } as unknown as Database;
    registerFlowModelRunJSSourceAdapters({
      db,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const stepAdapter = registrar.adapters.find((adapter) => adapter.kind === 'flowModel.step');
    expect(stepAdapter).toBeDefined();

    await expect(
      stepAdapter?.readLegacy({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'js-step-model',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ctx: {},
      }),
    ).resolves.toMatchObject({
      code: '',
      version: 'v2',
      surfaceStyle: 'render',
      uninitialized: true,
      metadata: {
        modelUse: 'JSBlockModel',
      },
    });
  });

  it('treats a JS Page RunJS step as an uninitialized render source', async () => {
    const registrar = createRegistrar();
    const db = {
      getCollection: () => ({
        repository: {
          findModelById: async () => ({
            uid: 'js-page-model',
            use: 'JSPageModel',
            stepParams: {},
          }),
        },
      }),
    } as unknown as Database;
    registerFlowModelRunJSSourceAdapters({
      db,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const stepAdapter = registrar.adapters.find((adapter) => adapter.kind === 'flowModel.step');

    await expect(
      stepAdapter?.readLegacy({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'js-page-model',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ctx: {},
      }),
    ).resolves.toMatchObject({
      code: '',
      version: 'v2',
      surfaceStyle: 'render',
      entryPath: 'src/main.tsx',
      entry: 'src/main.tsx',
      uninitialized: true,
      metadata: {
        modelUse: 'JSPageModel',
      },
    });
  });

  it('keeps persisted non-empty FlowModel code without a version on v1 semantics', async () => {
    const registrar = createRegistrar();
    const db = {
      getCollection: () => ({
        repository: {
          findModelById: async () => ({
            uid: 'legacy-js-step-model',
            use: 'JSBlockModel',
            stepParams: {
              jsSettings: {
                runJs: {
                  code: 'return {{ ctx.record.id }};',
                },
              },
            },
          }),
        },
      }),
    } as unknown as Database;
    registerFlowModelRunJSSourceAdapters({
      db,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const stepAdapter = registrar.adapters.find((adapter) => adapter.kind === 'flowModel.step');

    await expect(
      stepAdapter?.readLegacy({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'legacy-js-step-model',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ctx: {},
      }),
    ).resolves.toMatchObject({
      code: 'return {{ ctx.record.id }};',
      version: 'v1',
      uninitialized: undefined,
    });
  });

  it('rejects an unknown FlowModel step locator when the persisted step is missing', async () => {
    const registrar = createRegistrar();
    const db = {
      getCollection: () => ({
        repository: {
          findModelById: async () => ({
            uid: 'js-step-model',
            use: 'JSBlockModel',
            stepParams: {},
          }),
        },
      }),
    } as unknown as Database;
    registerFlowModelRunJSSourceAdapters({
      db,
      app: {
        pm: {
          get: () => registrar,
        },
      },
    });

    const stepAdapter = registrar.adapters.find((adapter) => adapter.kind === 'flowModel.step');

    await expect(
      stepAdapter?.readLegacy({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'js-step-model',
          flowKey: 'unknownSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        ctx: {},
      }),
    ).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      status: 404,
      details: {
        path: 'stepParams.unknownSettings.runJs',
      },
    });
  });
});

function createRegistrar(): Registrar {
  const registrar: Registrar = {
    adapters: [],
    registerRunJSSourceAdapter(adapter) {
      registrar.adapters.push(adapter);
      return () => {
        registrar.adapters = registrar.adapters.filter((item) => item !== adapter);
      };
    },
  };

  return registrar;
}
