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
import { createFlowModelRunJSSourceAdapters } from '../runjs-sources/flow-model-adapters';

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

  it('covers FlowModel step read/write and external-to-inline contracts without an app host', async () => {
    const model: Record<string, unknown> = {
      uid: 'step-contract-model',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("old");',
            version: 'v2',
            keep: 'preserved',
          },
        },
      },
    };
    const { adapters, ctx } = createAdapterHarness(model);
    const adapter = adapters.find((item) => item.kind === 'flowModel.step');
    if (!adapter) {
      throw new Error('FlowModel step source adapter is unavailable');
    }
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'step-contract-model',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };

    const legacy = await adapter.readLegacy({ locator, ctx });
    expect(legacy).toMatchObject({ code: 'ctx.render("old");', version: 'v2', surfaceStyle: 'render' });
    await adapter.writeRuntime({
      locator,
      artifact: runtimeArtifact('ctx.render("new");'),
      commitId: 'step-commit',
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx,
    });
    expect(getAtPath(model, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'ctx.render("new");',
      version: 'v2',
      keep: 'preserved',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'runjs-repo',
        commitId: 'step-commit',
        entry: 'src/main.tsx',
      },
    });

    const source = getAtPath(model, ['stepParams', 'jsSettings', 'runJs']);
    if (!isRecord(source)) {
      throw new Error('FlowModel step source is unavailable');
    }
    source.sourceMode = 'light-extension';
    source.sourceBinding = { type: 'light-extension-entry', repoId: 'extension-repo', entryId: 'entry-1' };
    await expect(adapter.assertCanRead({ locator, ctx })).rejects.toMatchObject({ code: 'RUNJS_SOURCE_READONLY' });

    const transitionCtx: RunJSSourceAdapterContext = { ...ctx, sourceTransition: 'external-to-inline' };
    await expect(adapter.assertCanWrite({ locator, ctx: transitionCtx })).resolves.toBeUndefined();
    const externalLegacy = await adapter.readLegacy({ locator, ctx: transitionCtx });
    await adapter.writeRuntime({
      locator,
      artifact: runtimeArtifact('ctx.render("inline again");'),
      commitId: 'inline-commit',
      baseOwnerFingerprint: externalLegacy.ownerFingerprint,
      ctx: transitionCtx,
    });
    expect(getAtPath(model, ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'ctx.render("inline again");',
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry', repoId: 'extension-repo', entryId: 'entry-1' },
    });
  });

  it.each([
    {
      name: 'defaultParams',
      step: { use: 'runjs', defaultParams: { code: 'ctx.default();', keep: 'default' } },
      expectedCode: 'ctx.default();',
      expectedPath: ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'defaultParams'],
    },
    {
      name: 'legacy params',
      step: { use: 'runjs', params: { code: 'ctx.legacy();', keep: 'legacy' } },
      expectedCode: 'ctx.legacy();',
      expectedPath: ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'params'],
    },
    {
      name: 'params preferred when both paths exist',
      step: {
        use: 'runjs',
        defaultParams: { code: 'ctx.default();', keepDefault: true },
        params: { code: 'ctx.legacy();', keep: 'legacy' },
      },
      expectedCode: 'ctx.legacy();',
      expectedPath: ['flowRegistry', 'submitFlow', 'steps', 'runStep', 'params'],
    },
  ])(
    'normalizes flowRegistry $name read/write paths without an app host',
    async ({ step, expectedCode, expectedPath }) => {
      const model: Record<string, unknown> = {
        uid: 'flow-registry-contract-model',
        use: 'ActionModel',
        flowRegistry: { submitFlow: { steps: { runStep: step } } },
      };
      const { adapters, ctx } = createAdapterHarness(model);
      const adapter = adapters.find((item) => item.kind === 'flowModel.flowRegistry.runjs');
      if (!adapter) {
        throw new Error('FlowRegistry RunJS source adapter is unavailable');
      }
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'flow-registry-contract-model',
        flowKey: 'submitFlow',
        stepKey: 'runStep',
        sourcePath: ['defaultParams', 'code'],
      };

      const legacy = await adapter.readLegacy({ locator, ctx });
      expect(legacy).toMatchObject({ code: expectedCode, surfaceStyle: 'action' });
      await adapter.writeRuntime({
        locator,
        artifact: runtimeArtifact('ctx.next();'),
        commitId: 'unused',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx,
      });
      expect(getAtPath(model, expectedPath)).toMatchObject({ code: 'ctx.next();', keep: expect.anything() });
    },
  );

  it.each([
    {
      name: 'unsupported source path',
      step: { use: 'runjs', defaultParams: { code: 'ctx.safe();' } },
      flowKey: 'submitFlow',
      stepKey: 'runStep',
      sourcePath: ['title'],
      path: 'flowRegistry.submitFlow.steps.runStep.title',
    },
    {
      name: 'non-RunJS step',
      step: { use: 'customVariable', defaultParams: { code: 'ctx.safe();' } },
      flowKey: 'submitFlow',
      stepKey: 'runStep',
      sourcePath: ['defaultParams', 'code'],
      path: 'flowRegistry.submitFlow.steps.runStep',
    },
    {
      name: 'missing step',
      step: undefined,
      flowKey: 'submitFlow',
      stepKey: 'missingStep',
      sourcePath: ['defaultParams', 'code'],
      path: 'flowRegistry.submitFlow.steps.missingStep',
    },
    {
      name: 'missing flow',
      step: undefined,
      flowKey: 'missingFlow',
      stepKey: 'missingStep',
      sourcePath: ['defaultParams', 'code'],
      path: 'flowRegistry.missingFlow.steps.missingStep',
    },
  ])(
    'rejects flowRegistry $name in the lightweight adapter matrix',
    async ({ step, flowKey, stepKey, sourcePath, path }) => {
      const steps = step ? { runStep: step } : {};
      const model: Record<string, unknown> = {
        uid: 'flow-registry-guard-model',
        use: 'ActionModel',
        flowRegistry: { submitFlow: { steps } },
      };
      const { adapters, ctx } = createAdapterHarness(model);
      const adapter = adapters.find((item) => item.kind === 'flowModel.flowRegistry.runjs');
      if (!adapter) {
        throw new Error('FlowRegistry RunJS source adapter is unavailable');
      }
      const locator: RunJSSourceLocator = {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'flow-registry-guard-model',
        flowKey,
        stepKey,
        sourcePath,
      };

      await expect(adapter.readLegacy({ locator, ctx })).rejects.toMatchObject({
        code: 'RUNJS_SOURCE_NOT_FOUND',
        details: { path },
      });
      await expect(
        adapter.writeRuntime({
          locator,
          artifact: runtimeArtifact('ctx.blocked();'),
          commitId: 'unused',
          baseOwnerFingerprint: 'missing',
          ctx,
        }),
      ).rejects.toMatchObject({ code: 'RUNJS_SOURCE_NOT_FOUND', details: { path } });
    },
  );

  it.each([
    {
      name: 'v2 option',
      kind: 'chart.option' as const,
      model: {
        uid: 'chart-contract-model',
        use: 'ChartBlockModel',
        stepParams: {
          chartSettings: { configure: { chart: { option: { raw: 'return { old: true };', keep: 'option' } } } },
        },
      },
      expectedCode: 'return { old: true };',
      expectedStyle: 'value',
      expectedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'option'],
    },
    {
      name: 'v2 events',
      kind: 'chart.events' as const,
      model: {
        uid: 'chart-contract-model',
        use: 'ChartBlockModel',
        stepParams: {
          chartSettings: { configure: { chart: { events: { raw: 'ctx.old();', keep: 'events' } } } },
        },
      },
      expectedCode: 'ctx.old();',
      expectedStyle: 'action',
      expectedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'events'],
    },
    {
      name: 'legacy option',
      kind: 'chart.option' as const,
      model: {
        uid: 'chart-contract-model',
        use: 'ChartBlockModel',
        settings: { visual: { raw: 'return { legacy: true };', keep: 'legacy-option' } },
      },
      expectedCode: 'return { legacy: true };',
      expectedStyle: 'value',
      expectedPath: ['settings', 'visual'],
    },
    {
      name: 'legacy events',
      kind: 'chart.events' as const,
      model: {
        uid: 'chart-contract-model',
        use: 'ChartBlockModel',
        settings: { events: { raw: 'ctx.legacy();', keep: 'legacy-events' } },
      },
      expectedCode: 'ctx.legacy();',
      expectedStyle: 'action',
      expectedPath: ['settings', 'events'],
    },
    {
      name: 'missing v2 option leaf',
      kind: 'chart.option' as const,
      model: {
        uid: 'chart-contract-model',
        use: 'ChartBlockModel',
        stepParams: { chartSettings: { configure: { chart: { option: { mode: 'custom' } } } } },
      },
      expectedCode: expect.stringContaining('series: []'),
      expectedStyle: 'value',
      expectedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'option'],
    },
  ])(
    'normalizes chart $name read/write paths without an app host',
    async ({ kind, model, expectedCode, expectedStyle, expectedPath }) => {
      const { adapters, ctx } = createAdapterHarness(model);
      const adapter = adapters.find((item) => item.kind === kind);
      if (!adapter) {
        throw new Error(`${kind} source adapter is unavailable`);
      }
      const locator: RunJSSourceLocator = { kind, modelUid: 'chart-contract-model' };

      const legacy = await adapter.readLegacy({ locator, ctx });
      expect(legacy).toMatchObject({ code: expectedCode, surfaceStyle: expectedStyle, entryPath: 'src/main.ts' });
      await adapter.writeRuntime({
        locator,
        artifact: runtimeArtifact('ctx.next();', 'src/main.ts'),
        commitId: 'unused',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx,
      });
      expect(getAtPath(model, expectedPath)).toMatchObject({ raw: 'ctx.next();' });
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

function createAdapterHarness(model: Record<string, unknown>) {
  const repository = {
    findModelById: async (uid: string) => (uid === model.uid ? model : null),
    patch: async (values: Record<string, unknown>) => Object.assign(model, values),
  };
  const db = {
    getCollection: (name: string) => {
      if (name !== 'flowModels') {
        throw new Error(`Unexpected collection: ${name}`);
      }
      return {
        repository,
        model: {
          findByPk: async (uid: string) => (uid === model.uid ? model : null),
        },
      };
    },
  } as unknown as Database;
  const ctx: RunJSSourceAdapterContext = {
    transaction: { LOCK: { UPDATE: 'UPDATE' } } as RunJSSourceAdapterContext['transaction'],
    can: () => ({}),
  };

  return { adapters: createFlowModelRunJSSourceAdapters(db), ctx };
}

function runtimeArtifact(code: string, entryPath = 'src/main.tsx') {
  return {
    code,
    version: 'v2',
    diagnostics: [],
    filesHash: 'files-hash',
    entryPath,
    metadata: { repoId: 'runjs-repo' },
  };
}

function getAtPath(root: unknown, path: Array<string | number>): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') {
      current = current[segment];
      continue;
    }
    if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
      continue;
    }
    return undefined;
  }
  return current;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
