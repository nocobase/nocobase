/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter, RunJSSourceAdapterContext, RunJSSourceLocator } from '@nocobase/server';

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

  it.each([
    { modelUse: 'JSBlockModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSPageModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSFieldModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSEditableFieldModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSItemModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSColumnModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSItemActionModel', flowKey: 'jsSettings', surfaceStyle: 'render' },
    { modelUse: 'JSActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSRecordActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSCollectionActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'JSFormActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
    { modelUse: 'FilterFormJSActionModel', flowKey: 'clickSettings', surfaceStyle: 'action' },
  ])(
    'reads and initializes an unpersisted $modelUse $flowKey RunJS step as a $surfaceStyle source',
    async ({ modelUse, flowKey, surfaceStyle }) => {
      const registrar = createRegistrar();
      const model: Record<string, unknown> = {
        uid: 'uninitialized-js-model',
        use: modelUse,
        stepParams: {},
      };
      const db = {
        getCollection: () => ({
          repository: {
            findModelById: async () => model,
            patch: async (values: Record<string, unknown>) => Object.assign(model, values),
          },
          model: {
            findByPk: async () => model,
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
      if (!stepAdapter) {
        throw new Error('FlowModel step source adapter is unavailable');
      }
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.step',
        modelUid: 'uninitialized-js-model',
        flowKey,
        stepKey: 'runJs',
        paramPath: ['code'],
      };
      const ctx: RunJSSourceAdapterContext = {
        transaction: { LOCK: { UPDATE: 'UPDATE' } },
        can: () => ({}),
      };

      const legacy = await stepAdapter.readLegacy({ locator, ctx });
      expect(legacy).toMatchObject({
        code: '',
        version: 'v2',
        surfaceStyle,
        entryPath: 'src/main.tsx',
        entry: 'src/main.tsx',
        uninitialized: true,
        metadata: {
          modelUse,
        },
      });

      await stepAdapter.writeRuntime({
        locator,
        artifact: {
          code: 'ctx.saved();',
          version: 'v2',
          diagnostics: [],
          filesHash: 'files_hash',
          entryPath: 'src/main.tsx',
          metadata: { repoId: 'runjs_repo' },
        },
        commitId: 'runjs_commit',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx,
      });
      expect(model.stepParams).toMatchObject({
        [flowKey]: {
          runJs: {
            code: 'ctx.saved();',
            version: 'v2',
            sourceRef: {
              type: 'vsc-file',
              repoId: 'runjs_repo',
              commitId: 'runjs_commit',
              entry: 'src/main.tsx',
            },
          },
        },
      });
    },
  );

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
