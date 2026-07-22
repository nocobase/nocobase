/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type {
  RunJSRuntimeArtifact,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceLocator,
} from '@nocobase/server';

import { registerFlowModelRunJSSourceAdapters } from '../runjs-sources';
import { createFlowModelRunJSSourceAdapters } from '../runjs-sources/flow-model-adapters';

type Registrar = {
  adapters: RunJSSourceAdapter[];
  registerRunJSSourceAdapter: (adapter: RunJSSourceAdapter) => () => void;
};

type JsonRecord = Record<string, unknown>;

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

describe('flow-engine RunJS source adapter contracts', () => {
  it.each([
    ['JSBlockModel', 'jsSettings', 'render'],
    ['JSPageModel', 'jsSettings', 'render'],
    ['JSFieldModel', 'jsSettings', 'render'],
    ['JSEditableFieldModel', 'jsSettings', 'render'],
    ['JSItemModel', 'jsSettings', 'render'],
    ['JSColumnModel', 'jsSettings', 'render'],
    ['JSItemActionModel', 'jsSettings', 'render'],
    ['JSActionModel', 'clickSettings', 'action'],
    ['JSRecordActionModel', 'clickSettings', 'action'],
    ['JSCollectionActionModel', 'clickSettings', 'action'],
    ['JSFormActionModel', 'clickSettings', 'action'],
    ['FilterFormJSActionModel', 'clickSettings', 'action'],
  ] as const)('initializes and writes every %s whitelist path', async (modelUse, flowKey, surfaceStyle) => {
    const modelUid = `initializable-${modelUse}`;
    const harness = createFlowModelHarness({
      uid: modelUid,
      use: modelUse,
      stepParams: { untouched: { keep: true } },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid,
      flowKey,
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const adapter = getAdapter(harness.db, locator.kind);
    const legacy = await adapter.readLegacy({ locator, ctx: {} });

    expect(legacy).toMatchObject({
      code: '',
      version: 'v2',
      surfaceStyle,
      uninitialized: true,
      metadata: { modelUse },
    });

    await adapter.writeRuntime({
      locator,
      artifact: createArtifact(`${surfaceStyle}-${modelUse}`),
      commitId: 'commit-initialized',
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx: harness.ctx,
    });

    expect(getAtPath(harness.model(modelUid), ['stepParams', flowKey, 'runJs'])).toMatchObject({
      code: `${surfaceStyle}-${modelUse}`,
      version: 'v2',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'contract-repo',
        commitId: 'commit-initialized',
        entry: 'src/main.tsx',
      },
    });
    expect(getAtPath(harness.model(modelUid), ['stepParams', 'untouched', 'keep'])).toBe(true);
  });

  it('reads and writes step, nested, keyed, and flowRegistry paths without an App or HTTP host', async () => {
    const harness = createFlowModelHarness(
      {
        uid: 'matrix-step',
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: { runJs: { code: 'old step', version: 'v2', keep: 'step sibling' } },
        },
      },
      {
        uid: 'matrix-nested',
        use: 'FormModel',
        stepParams: {
          rules: {
            configure: {
              values: [{ value: { code: 'old value', version: 'v2', keep: 'value sibling' } }],
              linkage: { params: { value: { script: 'old script', keep: 'script sibling' } } },
              eventFlow: { params: { code: 'old event', keep: 'event sibling' } },
              assignForm: {
                fieldSettings: {
                  assignValue: { value: { code: 'old assign', version: 'v2', keep: 'assign sibling' } },
                },
              },
              filterForm: {
                formFilterBlockModelSettings: {
                  defaultValues: {
                    value: [{ value: { code: 'old filter', version: 'v2', keep: 'filter sibling' } }],
                  },
                },
              },
            },
          },
          eventSettings: {
            linkageRules: {
              value: [
                {
                  key: 'rule_1',
                  actions: [
                    {
                      key: 'runjs_action',
                      params: { value: { script: 'old keyed script', keep: 'keyed sibling' } },
                    },
                    {
                      key: 'assign_action',
                      params: {
                        value: [
                          {
                            key: 'assign_rule',
                            value: { code: 'old keyed assign', version: 'v2', keep: 'keyed assign sibling' },
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
            customVariable: {
              variables: [
                {
                  key: 'var_total',
                  runjs: { code: 'old variable', version: 'v2', keep: 'variable sibling' },
                },
              ],
            },
          },
        },
      },
      {
        uid: 'matrix-registry',
        use: 'ActionModel',
        flowRegistry: {
          submitFlow: {
            steps: {
              defaultRun: { use: 'runjs', defaultParams: { code: 'old default', keep: 'default sibling' } },
              legacyRun: { use: 'runjs', params: { code: 'old legacy', keep: 'legacy sibling' } },
              bothRun: {
                use: 'runjs',
                defaultParams: { code: 'old ignored default', keep: 'default sibling' },
                params: { code: 'old preferred legacy', keep: 'preferred sibling' },
              },
              customVariableRun: {
                use: 'customVariable',
                defaultParams: {
                  variables: [
                    {
                      key: 'registry_var',
                      runjs: { code: 'old registry variable', version: 'v2', keep: 'registry sibling' },
                    },
                  ],
                },
              },
              customVariableLegacy: {
                use: 'customVariable',
                params: {
                  variables: [
                    {
                      key: 'registry_legacy',
                      runjs: { code: 'old registry legacy', version: 'v2', keep: 'legacy registry sibling' },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    );

    const cases: Array<{
      locator: RunJSSourceLocator;
      oldCode: string;
      nextCode: string;
      storedPath: Array<string | number>;
      siblingPath: Array<string | number>;
      sibling: string;
    }> = [
      {
        locator: {
          kind: 'flowModel.step',
          modelUid: 'matrix-step',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        oldCode: 'old step',
        nextCode: 'next step',
        storedPath: ['stepParams', 'jsSettings', 'runJs', 'code'],
        siblingPath: ['stepParams', 'jsSettings', 'runJs', 'keep'],
        sibling: 'step sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'rules',
          containerStepKey: 'configure',
          valuePath: ['values', 0, 'value'],
          scene: 'defaultValue',
        },
        oldCode: 'old value',
        nextCode: 'next value',
        storedPath: ['stepParams', 'rules', 'configure', 'values', 0, 'value', 'code'],
        siblingPath: ['stepParams', 'rules', 'configure', 'values', 0, 'value', 'keep'],
        sibling: 'value sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'rules',
          containerStepKey: 'configure',
          valuePath: ['linkage', 'params', 'value', 'script'],
          scene: 'linkageRunjs',
        },
        oldCode: 'old script',
        nextCode: 'next script',
        storedPath: ['stepParams', 'rules', 'configure', 'linkage', 'params', 'value', 'script'],
        siblingPath: ['stepParams', 'rules', 'configure', 'linkage', 'params', 'value', 'keep'],
        sibling: 'script sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'rules',
          containerStepKey: 'configure',
          valuePath: ['eventFlow', 'params', 'code'],
          scene: 'eventFlow',
        },
        oldCode: 'old event',
        nextCode: 'next event',
        storedPath: ['stepParams', 'rules', 'configure', 'eventFlow', 'params', 'code'],
        siblingPath: ['stepParams', 'rules', 'configure', 'eventFlow', 'params', 'keep'],
        sibling: 'event sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'rules',
          containerStepKey: 'configure',
          valuePath: ['assignForm', 'fieldSettings', 'assignValue', 'value'],
          scene: 'assignForm',
        },
        oldCode: 'old assign',
        nextCode: 'next assign',
        storedPath: ['stepParams', 'rules', 'configure', 'assignForm', 'fieldSettings', 'assignValue', 'value', 'code'],
        siblingPath: [
          'stepParams',
          'rules',
          'configure',
          'assignForm',
          'fieldSettings',
          'assignValue',
          'value',
          'keep',
        ],
        sibling: 'assign sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'rules',
          containerStepKey: 'configure',
          valuePath: ['filterForm', 'formFilterBlockModelSettings', 'defaultValues', 'value', 0, 'value'],
          scene: 'filterFormDefaultValues',
        },
        oldCode: 'old filter',
        nextCode: 'next filter',
        storedPath: [
          'stepParams',
          'rules',
          'configure',
          'filterForm',
          'formFilterBlockModelSettings',
          'defaultValues',
          'value',
          0,
          'value',
          'code',
        ],
        siblingPath: [
          'stepParams',
          'rules',
          'configure',
          'filterForm',
          'formFilterBlockModelSettings',
          'defaultValues',
          'value',
          0,
          'value',
          'keep',
        ],
        sibling: 'filter sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'eventSettings',
          containerStepKey: 'linkageRules',
          valuePath: ['value', 'rule_1', 'actions', 'runjs_action', 'params', 'value', 'script'],
          scene: 'linkage',
        },
        oldCode: 'old keyed script',
        nextCode: 'next keyed script',
        storedPath: [
          'stepParams',
          'eventSettings',
          'linkageRules',
          'value',
          0,
          'actions',
          0,
          'params',
          'value',
          'script',
        ],
        siblingPath: [
          'stepParams',
          'eventSettings',
          'linkageRules',
          'value',
          0,
          'actions',
          0,
          'params',
          'value',
          'keep',
        ],
        sibling: 'keyed sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'eventSettings',
          containerStepKey: 'linkageRules',
          valuePath: ['value', 'rule_1', 'actions', 'assign_action', 'params', 'value', 'assign_rule', 'value'],
          scene: 'formValue',
        },
        oldCode: 'old keyed assign',
        nextCode: 'next keyed assign',
        storedPath: [
          'stepParams',
          'eventSettings',
          'linkageRules',
          'value',
          0,
          'actions',
          1,
          'params',
          'value',
          0,
          'value',
          'code',
        ],
        siblingPath: [
          'stepParams',
          'eventSettings',
          'linkageRules',
          'value',
          0,
          'actions',
          1,
          'params',
          'value',
          0,
          'value',
          'keep',
        ],
        sibling: 'keyed assign sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-nested',
          containerFlowKey: 'eventSettings',
          containerStepKey: 'customVariable',
          valuePath: ['variables', 'var_total', 'runjs'],
          scene: 'eventFlow',
        },
        oldCode: 'old variable',
        nextCode: 'next variable',
        storedPath: ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs', 'code'],
        siblingPath: ['stepParams', 'eventSettings', 'customVariable', 'variables', 0, 'runjs', 'keep'],
        sibling: 'variable sibling',
      },
      {
        locator: {
          kind: 'flowModel.flowRegistry.runjs',
          modelUid: 'matrix-registry',
          flowKey: 'submitFlow',
          stepKey: 'defaultRun',
          sourcePath: ['defaultParams', 'code'],
        },
        oldCode: 'old default',
        nextCode: 'next default',
        storedPath: ['flowRegistry', 'submitFlow', 'steps', 'defaultRun', 'defaultParams', 'code'],
        siblingPath: ['flowRegistry', 'submitFlow', 'steps', 'defaultRun', 'defaultParams', 'keep'],
        sibling: 'default sibling',
      },
      {
        locator: {
          kind: 'flowModel.flowRegistry.runjs',
          modelUid: 'matrix-registry',
          flowKey: 'submitFlow',
          stepKey: 'legacyRun',
          sourcePath: ['defaultParams', 'code'],
        },
        oldCode: 'old legacy',
        nextCode: 'next legacy',
        storedPath: ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'params', 'code'],
        siblingPath: ['flowRegistry', 'submitFlow', 'steps', 'legacyRun', 'params', 'keep'],
        sibling: 'legacy sibling',
      },
      {
        locator: {
          kind: 'flowModel.flowRegistry.runjs',
          modelUid: 'matrix-registry',
          flowKey: 'submitFlow',
          stepKey: 'bothRun',
          sourcePath: ['defaultParams', 'code'],
        },
        oldCode: 'old preferred legacy',
        nextCode: 'next preferred legacy',
        storedPath: ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'params', 'code'],
        siblingPath: ['flowRegistry', 'submitFlow', 'steps', 'bothRun', 'params', 'keep'],
        sibling: 'preferred sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-registry',
          containerFlowKey: 'submitFlow',
          containerStepKey: 'customVariableRun',
          valuePath: ['variables', 'registry_var', 'runjs'],
          scene: 'eventFlow',
        },
        oldCode: 'old registry variable',
        nextCode: 'next registry variable',
        storedPath: [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableRun',
          'defaultParams',
          'variables',
          0,
          'runjs',
          'code',
        ],
        siblingPath: [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableRun',
          'defaultParams',
          'variables',
          0,
          'runjs',
          'keep',
        ],
        sibling: 'registry sibling',
      },
      {
        locator: {
          kind: 'flowModel.nestedRunJS',
          modelUid: 'matrix-registry',
          containerFlowKey: 'submitFlow',
          containerStepKey: 'customVariableLegacy',
          valuePath: ['variables', 'registry_legacy', 'runjs'],
          scene: 'eventFlow',
        },
        oldCode: 'old registry legacy',
        nextCode: 'next registry legacy',
        storedPath: [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableLegacy',
          'params',
          'variables',
          0,
          'runjs',
          'code',
        ],
        siblingPath: [
          'flowRegistry',
          'submitFlow',
          'steps',
          'customVariableLegacy',
          'params',
          'variables',
          0,
          'runjs',
          'keep',
        ],
        sibling: 'legacy registry sibling',
      },
    ];

    for (const item of cases) {
      const adapter = getAdapter(harness.db, item.locator.kind);
      const legacy = await adapter.readLegacy({ locator: item.locator, ctx: {} });
      expect(legacy.code).toBe(item.oldCode);
      await adapter.writeRuntime({
        locator: item.locator,
        artifact: createArtifact(item.nextCode),
        commitId: 'contract-commit',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx: harness.ctx,
      });
      expect(getAtPath(harness.model(item.locator.modelUid), item.storedPath)).toBe(item.nextCode);
      expect(getAtPath(harness.model(item.locator.modelUid), item.siblingPath)).toBe(item.sibling);
    }
  });

  it('normalizes chart option and event storage across v2, legacy, and missing raw paths', async () => {
    const harness = createFlowModelHarness(
      {
        uid: 'chart-v2',
        use: 'ChartBlockModel',
        stepParams: {
          chartSettings: {
            configure: {
              chart: {
                option: { mode: 'raw', raw: 'old option', keep: 'option sibling' },
                events: { raw: 'old events', keep: 'events sibling' },
              },
            },
          },
        },
      },
      {
        uid: 'chart-legacy',
        use: 'ChartBlockModel',
        settings: {
          visual: { raw: 'old legacy option', keep: 'legacy option sibling' },
          events: { raw: 'old legacy events', keep: 'legacy events sibling' },
        },
      },
      {
        uid: 'chart-new',
        use: 'ChartBlockModel',
        stepParams: {
          chartSettings: { configure: { chart: { option: { mode: 'custom' }, events: {} } } },
        },
      },
    );
    const cases: Array<{
      locator: RunJSSourceLocator;
      oldCode?: string;
      nextCode: string;
      storedPath: Array<string | number>;
      siblingPath?: Array<string | number>;
      sibling?: string;
    }> = [
      {
        locator: { kind: 'chart.option', modelUid: 'chart-v2' },
        oldCode: 'old option',
        nextCode: 'next option',
        storedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'],
        siblingPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'keep'],
        sibling: 'option sibling',
      },
      {
        locator: { kind: 'chart.events', modelUid: 'chart-v2' },
        oldCode: 'old events',
        nextCode: 'next events',
        storedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'],
        siblingPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'keep'],
        sibling: 'events sibling',
      },
      {
        locator: { kind: 'chart.option', modelUid: 'chart-legacy' },
        oldCode: 'old legacy option',
        nextCode: 'next legacy option',
        storedPath: ['settings', 'visual', 'raw'],
        siblingPath: ['settings', 'visual', 'keep'],
        sibling: 'legacy option sibling',
      },
      {
        locator: { kind: 'chart.events', modelUid: 'chart-legacy' },
        oldCode: 'old legacy events',
        nextCode: 'next legacy events',
        storedPath: ['settings', 'events', 'raw'],
        siblingPath: ['settings', 'events', 'keep'],
        sibling: 'legacy events sibling',
      },
      {
        locator: { kind: 'chart.option', modelUid: 'chart-new' },
        nextCode: 'next new option',
        storedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'option', 'raw'],
      },
      {
        locator: { kind: 'chart.events', modelUid: 'chart-new' },
        nextCode: 'next new events',
        storedPath: ['stepParams', 'chartSettings', 'configure', 'chart', 'events', 'raw'],
      },
    ];

    for (const item of cases) {
      const adapter = getAdapter(harness.db, item.locator.kind);
      const legacy = await adapter.readLegacy({ locator: item.locator, ctx: {} });
      if (item.oldCode) {
        expect(legacy.code).toBe(item.oldCode);
      } else {
        expect(legacy.code).not.toBe('');
      }
      expect(legacy.surfaceStyle).toBe(item.locator.kind === 'chart.option' ? 'value' : 'action');
      await adapter.writeRuntime({
        locator: item.locator,
        artifact: createArtifact(item.nextCode, 'v2', 'src/main.ts'),
        commitId: 'chart-commit',
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx: harness.ctx,
      });
      expect(getAtPath(harness.model(item.locator.modelUid), item.storedPath)).toBe(item.nextCode);
      if (item.siblingPath) {
        expect(getAtPath(harness.model(item.locator.modelUid), item.siblingPath)).toBe(item.sibling);
      }
    }
  });

  it('allows only explicit external-to-inline step writes and preserves binding metadata', async () => {
    const harness = createFlowModelHarness({
      uid: 'external-step',
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'inline fallback',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: { type: 'light-extension-entry', repoId: 'repo-1', entryId: 'entry-1' },
            settings: { keep: true },
          },
        },
      },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.step',
      modelUid: 'external-step',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    };
    const adapter = getAdapter(harness.db, locator.kind);

    await expect(adapter.assertCanRead({ locator, ctx: harness.ctx })).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_READONLY',
    });
    const ctx = { ...harness.ctx, sourceTransition: 'external-to-inline' as const };
    const legacy = await adapter.readLegacy({ locator, ctx });
    await adapter.writeRuntime({
      locator,
      artifact: createArtifact('moved inline'),
      commitId: 'inline-commit',
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx,
    });

    expect(getAtPath(harness.model('external-step'), ['stepParams', 'jsSettings', 'runJs'])).toMatchObject({
      code: 'moved inline',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: { type: 'light-extension-entry', repoId: 'repo-1', entryId: 'entry-1' },
      settings: { keep: true },
    });
  });

  it('creates a missing value-surface leaf only below an existing nested owner', async () => {
    const harness = createFlowModelHarness({
      uid: 'missing-value-leaf',
      stepParams: { editItemSettings: { initialValue: { keep: 'owner sibling' } } },
    });
    const locator: RunJSSourceLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'missing-value-leaf',
      containerFlowKey: 'editItemSettings',
      containerStepKey: 'initialValue',
      valuePath: ['defaultValue'],
      scene: 'formValue',
    };
    const adapter = getAdapter(harness.db, locator.kind);
    const legacy = await adapter.readLegacy({ locator, ctx: {} });

    await adapter.writeRuntime({
      locator,
      artifact: createArtifact('return "created";'),
      commitId: 'missing-leaf-commit',
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx: harness.ctx,
    });

    expect(getAtPath(harness.model(locator.modelUid), ['stepParams', 'editItemSettings', 'initialValue'])).toEqual({
      keep: 'owner sibling',
      defaultValue: { code: 'return "created";', version: 'v2' },
    });
  });

  it.each([
    {
      label: 'missing nested owner',
      model: { uid: 'missing-owner', stepParams: {} },
      locator: {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-owner',
        containerFlowKey: 'editItemSettings',
        containerStepKey: 'initialValue',
        valuePath: ['defaultValue'],
        scene: 'formValue',
      },
      details: { path: 'stepParams.editItemSettings.initialValue' },
    },
    {
      label: 'missing nested intermediate',
      model: {
        uid: 'missing-intermediate',
        stepParams: { editItemSettings: { initialValue: {} } },
      },
      locator: {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-intermediate',
        containerFlowKey: 'editItemSettings',
        containerStepKey: 'initialValue',
        valuePath: ['missingParent', 'value'],
        scene: 'formValue',
      },
      details: { path: 'missingParent' },
    },
    {
      label: 'missing keyed row',
      model: {
        uid: 'missing-keyed-row',
        stepParams: { eventSettings: { linkageRules: { value: [] } } },
      },
      locator: {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-keyed-row',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'linkageRules',
        valuePath: ['value', 'rule_new', 'actions', 'action_new', 'params', 'value', 'script'],
        scene: 'linkage',
      },
      details: { key: 'rule_new' },
    },
    {
      label: 'missing keyed target',
      model: {
        uid: 'missing-keyed-target',
        stepParams: {
          eventSettings: {
            linkageRules: {
              value: [{ key: 'rule_1', actions: [{ key: 'action_1' }] }],
            },
          },
        },
      },
      locator: {
        kind: 'flowModel.nestedRunJS',
        modelUid: 'missing-keyed-target',
        containerFlowKey: 'eventSettings',
        containerStepKey: 'linkageRules',
        valuePath: ['value', 'rule_1', 'actions', 'action_1', 'params', 'value', 'script'],
        scene: 'linkage',
      },
      details: { path: 'value.rule_1.actions.action_1.params.value.script' },
    },
    {
      label: 'unsupported flowRegistry path',
      model: {
        uid: 'unsupported-registry-path',
        flowRegistry: {
          submitFlow: { steps: { runStep: { use: 'runjs', title: 'keep', defaultParams: { code: 'old' } } } },
        },
      },
      locator: {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'unsupported-registry-path',
        flowKey: 'submitFlow',
        stepKey: 'runStep',
        sourcePath: ['title'],
      },
      details: { path: 'flowRegistry.submitFlow.steps.runStep.title' },
    },
    {
      label: 'non-RunJS flowRegistry step',
      model: {
        uid: 'non-runjs-registry-step',
        flowRegistry: {
          submitFlow: { steps: { runStep: { use: 'customVariable', defaultParams: { code: 'old' } } } },
        },
      },
      locator: {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'non-runjs-registry-step',
        flowKey: 'submitFlow',
        stepKey: 'runStep',
        sourcePath: ['defaultParams', 'code'],
      },
      details: { path: 'flowRegistry.submitFlow.steps.runStep' },
    },
    {
      label: 'missing flowRegistry step',
      model: {
        uid: 'missing-registry-step',
        flowRegistry: { submitFlow: { steps: {} } },
      },
      locator: {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'missing-registry-step',
        flowKey: 'submitFlow',
        stepKey: 'missingRun',
        sourcePath: ['defaultParams', 'code'],
      },
      details: { path: 'flowRegistry.submitFlow.steps.missingRun' },
    },
    {
      label: 'missing flowRegistry flow',
      model: { uid: 'missing-registry-flow', flowRegistry: {} },
      locator: {
        kind: 'flowModel.flowRegistry.runjs',
        modelUid: 'missing-registry-flow',
        flowKey: 'missingFlow',
        stepKey: 'missingRun',
        sourcePath: ['defaultParams', 'code'],
      },
      details: { path: 'flowRegistry.missingFlow.steps.missingRun' },
    },
  ] as const)('rejects $label without mutating the model', async ({ model, locator, details }) => {
    const harness = createFlowModelHarness(model);
    const adapter = getAdapter(harness.db, locator.kind);
    const before = harness.model(locator.modelUid);

    await expect(adapter.readLegacy({ locator, ctx: {} })).rejects.toMatchObject({
      code: 'RUNJS_SOURCE_NOT_FOUND',
      details,
    });
    expect(harness.model(locator.modelUid)).toEqual(before);
  });
});

function createFlowModelHarness(...initialModels: JsonRecord[]) {
  const models = new Map(
    initialModels.map((model) => {
      const uid = model.uid;
      if (typeof uid !== 'string') {
        throw new Error('FlowModel contract fixtures require a string uid');
      }
      return [uid, clone(model)] as const;
    }),
  );
  const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
  const repository = {
    findModelById: async (uid: string) => clone(models.get(uid)),
    patch: async (values: JsonRecord) => {
      const uid = values.uid;
      if (typeof uid !== 'string') {
        throw new Error('FlowModel patch requires a string uid');
      }
      const current = models.get(uid);
      if (!current) {
        return;
      }
      models.set(uid, { ...current, ...clone(values) });
    },
  };
  const db = {
    getCollection: (name: string) => {
      if (name !== 'flowModels') {
        throw new Error(`Unexpected collection ${name}`);
      }
      return {
        repository,
        model: {
          findByPk: async (uid: string) => models.get(uid),
        },
      };
    },
  } as unknown as Database;

  return {
    db,
    ctx: {
      can: () => ({}),
      transaction,
    } satisfies RunJSSourceAdapterContext,
    model(uid: string) {
      return clone(models.get(uid));
    },
  };
}

function getAdapter(db: Database, kind: RunJSSourceLocator['kind']): RunJSSourceAdapter {
  const adapter = createFlowModelRunJSSourceAdapters(db).find((candidate) => candidate.kind === kind);
  if (!adapter) {
    throw new Error(`Missing ${kind} adapter`);
  }
  return adapter;
}

function createArtifact(code: string, version = 'v2', entryPath = 'src/main.tsx'): RunJSRuntimeArtifact {
  return {
    code,
    version,
    diagnostics: [],
    filesHash: 'contract-files-hash',
    entryPath,
    metadata: { repoId: 'contract-repo' },
  };
}

function getAtPath(root: unknown, path: Array<string | number>): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current.find((item, index) => index === segment || (isRecord(item) && item.key === segment));
    } else if (isRecord(current) && typeof segment === 'string') {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

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
