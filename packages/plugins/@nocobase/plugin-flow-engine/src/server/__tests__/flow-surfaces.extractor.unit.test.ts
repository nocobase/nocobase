/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rmSync, symlinkSync } from 'fs';
import { link, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildAutoNamespacedPublicType,
  buildFlowSurfaceAutoSnapshot,
  collectFlowSurfaceExtractorAstEvents,
  createFlowSurfaceExtractionRecorder,
  createFlowSurfaceExtractorRuntimeWarning,
  createFlowSurfaceMockFieldBindingModelClass,
  createFlowSurfaceMockClientPluginContext,
  createFlowSurfaceMockModelClass,
  deriveFlowSurfaceAutoCapabilityCandidates,
  getFlowSurfaceAutoSnapshotFileName,
  loadFlowSurfaceAutoSnapshotsFromDirectory,
  resolveFlowSurfacePluginEntry,
  runWithFlowSurfaceExtractorGuards,
  writeFlowSurfaceAutoSnapshot,
} from '../flow-surfaces/extractor';
import { FlowSurfaceExtractorGuardError } from '../flow-surfaces/extractor/guards';

describe('flowSurfaces extractor scaffold', () => {
  it('should record runtime model facts without executing model loaders', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-gantt',
      recorder,
    });
    const loader = () => {
      throw new Error('loader should not execute');
    };

    context.flowEngine.registerModelLoaders({
      GanttBlockModel: {
        loader,
      },
    });

    expect(recorder.getEvents()).toMatchObject([
      {
        type: 'model.loaderRegistered',
        modelUse: 'GanttBlockModel',
        loaderName: 'loader',
        confidence: 'high',
      },
    ]);
  });

  it('should not execute accessors while recording runtime models and model loaders', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-gantt',
      recorder,
    });
    let getterExecuted = false;
    const models = Object.defineProperties(
      {},
      {
        GanttBlockModel: {
          get() {
            getterExecuted = true;
            return class GanttBlockModel {};
          },
        },
      },
    );
    const nestedLoader = Object.defineProperties(
      {},
      {
        loader: {
          get() {
            getterExecuted = true;
            return () => undefined;
          },
        },
      },
    );
    const loaders = {
      GanttBlockModel: nestedLoader,
    };

    context.flowEngine.registerModels(models);
    context.flowEngine.registerModelLoaders(loaders);

    const events = recorder.getEvents();
    expect(getterExecuted).toBe(false);
    expect(events).toEqual([
      expect.objectContaining({
        type: 'model.registered',
        modelUse: 'GanttBlockModel',
      }),
      expect.objectContaining({
        type: 'model.loaderRegistered',
        modelUse: 'GanttBlockModel',
      }),
    ]);
    expect(events[0]).not.toHaveProperty('className');
    expect(events[1]).not.toHaveProperty('loaderName');
  });

  it('should mirror flow engine on the mock app and record field binding roles', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-field-sequence',
      recorder,
    });
    const EditableItemModel = createFlowSurfaceMockFieldBindingModelClass({
      role: 'editable',
      recorder,
    });
    const DisplayItemModel = createFlowSurfaceMockFieldBindingModelClass({
      role: 'display',
      recorder,
    });
    const FilterableItemModel = createFlowSurfaceMockFieldBindingModelClass({
      role: 'filterable',
      recorder,
    });

    context.app.flowEngine.registerModelLoaders({
      SequenceFieldModel: {
        loader: () => undefined,
      },
    });
    EditableItemModel.bindModelToInterface('SequenceFieldModel', ['sequence']);
    DisplayItemModel.bindModelToInterface('DisplayTextFieldModel', ['sequence']);
    FilterableItemModel.bindModelToInterface('InputFieldModel', ['sequence']);

    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.loaderRegistered',
          modelUse: 'SequenceFieldModel',
        }),
        expect.objectContaining({
          type: 'field.bindingRegistered',
          modelUse: 'SequenceFieldModel',
          fieldInterface: 'sequence',
          role: 'editable',
        }),
        expect.objectContaining({
          type: 'field.bindingRegistered',
          modelUse: 'DisplayTextFieldModel',
          fieldInterface: 'sequence',
          role: 'display',
        }),
        expect.objectContaining({
          type: 'field.bindingRegistered',
          modelUse: 'InputFieldModel',
          fieldInterface: 'sequence',
          role: 'filterable',
        }),
      ]),
    );
  });

  it('should mark function-based flow and create options as dynamic facts', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const GanttBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'GanttBlockModel',
      recorder,
    });

    GanttBlockModel.registerFlow({
      key: 'ganttSettings',
      steps: {
        fields: {
          uiSchema() {
            return {};
          },
        },
      },
    });
    GanttBlockModel.define({
      label: 'Gantt',
      createModelOptions: {
        use: 'GanttBlockModel',
        defaultParams() {
          return {};
        },
      },
    });

    expect(recorder.getEvents()).toMatchObject([
      {
        type: 'model.flowRegistered',
        modelUse: 'GanttBlockModel',
        flowKey: 'ganttSettings',
        staticStatus: 'dynamic',
      },
      {
        type: 'menu.itemRegistered',
        modelUse: 'GanttBlockModel',
        slot: 'blocks',
        createModelOptionsStatus: 'dynamic',
      },
    ]);
  });

  it('should record runtime registerFlow string overloads', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-demo',
      recorder,
    });
    const DemoBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'DemoBlockModel',
      recorder,
    });

    context.flowEngine.registerFlow('globalRefresh', {
      title: 'Global refresh',
      steps: {},
    });
    DemoBlockModel.registerFlow('alpha', {
      title: 'Alpha',
      steps: {},
    });
    DemoBlockModel.registerFlow('beta', {
      title: 'Beta',
      sort: 20,
      steps: {},
    });

    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.flowRegistered',
          flowKey: 'globalRefresh',
          title: 'Global refresh',
          staticStatus: 'static',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'alpha',
          title: 'Alpha',
          staticStatus: 'static',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'beta',
          title: 'Beta',
          sort: 20,
          staticStatus: 'static',
        }),
      ]),
    );
  });

  it('should not execute accessor properties while inspecting runtime registration objects', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const GanttBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'GanttBlockModel',
      recorder,
    });
    let getterExecuted = false;
    const flow = Object.defineProperties(
      {
        key: 'ganttSettings',
      },
      {
        steps: {
          get() {
            getterExecuted = true;
            return {};
          },
        },
      },
    );
    const definition = Object.defineProperties(
      {
        label: 'Gantt',
      },
      {
        createModelOptions: {
          get() {
            getterExecuted = true;
            return {
              use: 'GanttBlockModel',
            };
          },
        },
      },
    );

    GanttBlockModel.registerFlow(flow);
    GanttBlockModel.define(definition);

    expect(getterExecuted).toBe(false);
    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'GanttBlockModel',
          flowKey: 'ganttSettings',
          staticStatus: 'dynamic',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'GanttBlockModel',
          createModelOptionsStatus: 'unresolved',
        }),
      ]),
    );
  });

  it('should record runtime facts through explicit guarded VM bridges', async () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-demo',
      recorder,
    });
    const DemoBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'DemoBlockModel',
      recorder,
    });
    const EditableItemModel = createFlowSurfaceMockFieldBindingModelClass({
      role: 'editable',
      recorder,
    });

    await runWithFlowSurfaceExtractorGuards(
      `
        flowEngine.registerModels({ DemoBlockModel });
        flowEngine.registerModelLoaders({
          DemoActionModel: {
            loader() {
              throw new Error('loader should not execute');
            },
          },
        });
        flowEngine.registerFlow('globalRefresh', {
          title: 'Global refresh',
          steps: {},
        });
        DemoBlockModel.registerFlow('demoSettings', {
          title: 'Demo settings',
          steps: {},
        });
        DemoBlockModel.define({
          label: 'Demo',
          createModelOptions: {
            use: 'DemoBlockModel',
          },
        });
        EditableItemModel.bindModelToInterface('DemoFieldModel', ['demo']);
      `,
      {
        bridges: {
          flowEngine: {
            registerModels: context.flowEngine.registerModels,
            registerModelLoaders: context.flowEngine.registerModelLoaders,
            registerFlow: context.flowEngine.registerFlow,
          },
          DemoBlockModel: {
            define: DemoBlockModel.define,
            registerFlow: DemoBlockModel.registerFlow,
          },
          EditableItemModel: {
            bindModelToInterface: EditableItemModel.bindModelToInterface,
          },
        },
      },
    );

    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'DemoBlockModel',
        }),
        expect.objectContaining({
          type: 'model.loaderRegistered',
          modelUse: 'DemoActionModel',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          flowKey: 'globalRefresh',
          title: 'Global refresh',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'demoSettings',
          title: 'Demo settings',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'DemoBlockModel',
          label: 'Demo',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'field.bindingRegistered',
          modelUse: 'DemoFieldModel',
          fieldInterface: 'demo',
          role: 'editable',
        }),
      ]),
    );
  });

  it('should tolerate common runtime prelude APIs before guarded model registrations', async () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-action-bulk-edit',
      recorder,
    });

    await runWithFlowSurfaceExtractorGuards(
      `
        app.flowEngine.registerActions({
          bulkEditTitleField() {
            throw new Error('action should not execute');
          },
        });
        app.pm.get('workflow')?.registerTrigger?.('event', function Trigger() {});
        const workflow = app.pm.get('workflow');
        workflow.registerInstruction('event', function Instruction() {});
        const auth = app.pm.get(function PluginAuthClientV2() {});
        auth.registerType('sms', {
          signInFormLoader() {
            throw new Error('loader should not execute');
          },
        });
        app.eventBus.addEventListener('plugin:block-workbench:loaded', () => undefined);
        app.flowEngine.registerModels({
          BulkEditActionModel: class BulkEditActionModel {},
        });
      `,
      {
        bridges: {
          app: {
            eventBus: {
              addEventListener: context.app.eventBus.addEventListener,
            },
            flowEngine: {
              registerActions: context.app.flowEngine.registerActions,
              registerModels: context.app.flowEngine.registerModels,
            },
            pm: {
              get: context.app.pm.get,
            },
          },
        },
      },
    );

    expect(recorder.getEvents()).toEqual([
      expect.objectContaining({
        type: 'model.registered',
        modelUse: 'BulkEditActionModel',
      }),
    ]);
  });

  it('should keep ordinary bridge object returns out of the VM', async () => {
    let bridgeObjectObserved = false;

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          const result = source.getObject();
          if (result !== undefined) {
            trap.bump();
          }
          return 'done';
        `,
        {
          bridges: {
            source: {
              getObject() {
                return {
                  value: 'blocked',
                };
              },
            },
            trap: {
              bump() {
                bridgeObjectObserved = true;
              },
            },
          },
        },
      ),
    ).resolves.toBe('done');

    expect(bridgeObjectObserved).toBe(false);
  });

  it('should not execute proxy traps while recording top-level VM registration objects', async () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-demo',
      recorder,
    });
    let trapCount = 0;

    await runWithFlowSurfaceExtractorGuards(
      `
        const proxiedModels = new Proxy(
          {
            DemoBlockModel: class DemoBlockModel {},
          },
          {
            ownKeys() {
              trap.bump();
              return ['DemoBlockModel'];
            },
            getOwnPropertyDescriptor() {
              trap.bump();
              return {
                configurable: true,
                enumerable: true,
                value: class DemoBlockModel {},
              };
            },
          },
        );
        flowEngine.registerModels(proxiedModels);
      `,
      {
        bridges: {
          flowEngine: {
            registerModels: context.flowEngine.registerModels,
          },
          trap: {
            bump() {
              trapCount += 1;
            },
          },
        },
      },
    );

    expect(trapCount).toBe(0);
    expect(recorder.getEvents()).toEqual([]);
  });

  it('should conservatively record nested VM proxy registration objects without executing traps', async () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-demo',
      recorder,
    });
    const DemoBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'DemoBlockModel',
      recorder,
    });
    let trapCount = 0;

    await runWithFlowSurfaceExtractorGuards(
      `
        const trapHandler = {
          getOwnPropertyDescriptor() {
            trap.bump();
            return {
              configurable: true,
              enumerable: true,
              value: 'dynamic',
            };
          },
          ownKeys() {
            trap.bump();
            return ['loader'];
          },
        };
        flowEngine.registerModelLoaders({
          DemoActionModel: new Proxy(
            {
              loader() {
                throw new Error('loader should not execute');
              },
            },
            trapHandler,
          ),
        });
        DemoBlockModel.registerFlow('proxyFlow', new Proxy(
          {
            title: 'Proxy flow',
            steps: {},
          },
          trapHandler,
        ));
        DemoBlockModel.define(new Proxy(
          {
            label: 'Proxy menu',
            createModelOptions: {
              use: 'DemoBlockModel',
            },
          },
          trapHandler,
        ));
        DemoBlockModel.define({
          label: 'Nested proxy menu',
          createModelOptions: new Proxy(
            {
              use: 'DemoBlockModel',
            },
            trapHandler,
          ),
        });
      `,
      {
        bridges: {
          flowEngine: {
            registerModelLoaders: context.flowEngine.registerModelLoaders,
          },
          DemoBlockModel: {
            define: DemoBlockModel.define,
            registerFlow: DemoBlockModel.registerFlow,
          },
          trap: {
            bump() {
              trapCount += 1;
            },
          },
        },
      },
    );

    expect(trapCount).toBe(0);
    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.loaderRegistered',
          modelUse: 'DemoActionModel',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'proxyFlow',
          staticStatus: 'dynamic',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'DemoBlockModel',
          createModelOptionsStatus: 'unresolved',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'DemoBlockModel',
          label: 'Nested proxy menu',
          createModelOptionsStatus: 'dynamic',
        }),
      ]),
    );
    expect(recorder.getEvents()[0]).not.toHaveProperty('loaderName');
    expect(recorder.getEvents()[1]).not.toHaveProperty('title');
  });

  it('should not execute proxy traps while reading nested VM function names', async () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const context = createFlowSurfaceMockClientPluginContext({
      packageName: '@nocobase/plugin-demo',
      recorder,
    });
    let trapCount = 0;

    await runWithFlowSurfaceExtractorGuards(
      `
        const trapHandler = {
          get(_target, property) {
            if (property === 'name') {
              trap.bump();
            }
            return Reflect.get(...arguments);
          },
        };
        const ProxiedModel = new Proxy(class DemoBlockModel {}, trapHandler);
        const proxiedLoader = new Proxy(function DemoActionLoader() {}, trapHandler);
        flowEngine.registerModels({
          DemoBlockModel: ProxiedModel,
        });
        flowEngine.registerModelLoaders({
          DemoActionModel: proxiedLoader,
        });
      `,
      {
        bridges: {
          flowEngine: {
            registerModels: context.flowEngine.registerModels,
            registerModelLoaders: context.flowEngine.registerModelLoaders,
          },
          trap: {
            bump() {
              trapCount += 1;
            },
          },
        },
      },
    );

    expect(trapCount).toBe(0);
    expect(recorder.getEvents()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'DemoBlockModel',
        }),
        expect.objectContaining({
          type: 'model.loaderRegistered',
          modelUse: 'DemoActionModel',
        }),
      ]),
    );
    expect(recorder.getEvents()[1]).not.toHaveProperty('loaderName');
  });

  it('should block unsafe globals while guarded runtime code is evaluated', async () => {
    let warningMessage = '';

    const runFetch = () => runWithFlowSurfaceExtractorGuards(`fetch('https://example.test');`);

    await expect(runFetch()).rejects.toThrow(FlowSurfaceExtractorGuardError);

    try {
      await runFetch();
    } catch (error) {
      warningMessage = createFlowSurfaceExtractorRuntimeWarning(error).message;
    }

    expect(warningMessage).toContain('fetch');
  });

  it('should block sessionStorage when browser storage globals exist', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem() {
          return 'stored';
        },
      },
    });

    try {
      await expect(
        runWithFlowSurfaceExtractorGuards(`Reflect.get(globalThis.sessionStorage, 'getItem');`),
      ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'sessionStorage', originalDescriptor);
      } else {
        delete (globalThis as typeof globalThis & { sessionStorage?: unknown }).sessionStorage;
      }
    }
  });

  it('should block direct reassignment of existing guarded globals', async () => {
    await expect(runWithFlowSurfaceExtractorGuards(`globalThis.fetch = () => 'bypassed';`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(runWithFlowSurfaceExtractorGuards(`globalThis.setTimeout = () => 'bypassed';`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );
  });

  it('should restore existing guarded globals after blocked reassignment', async () => {
    const originalFetch = globalThis.fetch;

    await expect(runWithFlowSurfaceExtractorGuards(`globalThis.fetch = () => 'bypassed';`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );
    expect(globalThis.fetch).toBe(originalFetch);
  });

  it('should preserve absent browser global semantics while guards are installed', async () => {
    expect(
      await runWithFlowSurfaceExtractorGuards(`
        if (typeof globalThis.window !== 'undefined') {
          Reflect.get(globalThis.window, 'location');
        }
        return typeof globalThis.window;
      `),
    ).toBe('undefined');
  });

  it('should block absent guarded globals from being created during runtime inspection', async () => {
    await expect(
      runWithFlowSurfaceExtractorGuards(`
        globalThis.window = {
          location: 'https://example.test',
        };
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { window?: unknown }).window).toBe('undefined');

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        Object.assign(globalThis, {
          document: {
            location: 'https://example.test',
          },
        });
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as typeof globalThis & { document?: unknown }).document).toBe('undefined');
  });

  it('should block non-configurable definitions of absent guarded globals', async () => {
    await expect(
      runWithFlowSurfaceExtractorGuards(`
        Object.defineProperty(globalThis, 'window', {
          configurable: false,
          value: {
            location: 'https://example.test',
          },
        });
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { window?: unknown }).window).toBe('undefined');

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        Reflect.defineProperty(globalThis, 'document', {
          configurable: false,
          value: {},
        });
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { document?: unknown }).document).toBe('undefined');

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        Object.defineProperties(globalThis, {
          localStorage: {
            configurable: false,
            value: {},
          },
        });
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { localStorage?: unknown }).localStorage).toBe('undefined');
  });

  it('should fail closed when runtime code schedules Promise microtasks', async () => {
    await expect(
      runWithFlowSurfaceExtractorGuards(`
        Promise.resolve().then(() => fetch('https://example.test'));
      `),
    ).rejects.toMatchObject({
      blockedGlobal: 'Promise.resolve',
    });
  });

  it('should not run bridges from async work after the synchronous runtime turn', async () => {
    let bridgeCallCount = 0;

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          (async () => {
            await 0;
            trap.bump();
          })();
          return 'done';
        `,
        {
          bridges: {
            trap: {
              bump() {
                bridgeCallCount += 1;
              },
            },
          },
        },
      ),
    ).resolves.toBe('done');
    expect(bridgeCallCount).toBe(0);
  });

  it('should fail closed on scheduler escape attempts', async () => {
    await expect(runWithFlowSurfaceExtractorGuards(`queueMicrotask(() => undefined);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(runWithFlowSurfaceExtractorGuards(`process.nextTick(() => undefined);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(runWithFlowSurfaceExtractorGuards(`setImmediate(() => undefined);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );
  });

  it('should fail closed when guarded descriptors are deleted and recreated', async () => {
    const originalFetch = globalThis.fetch;

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        delete globalThis.fetch;
        globalThis.fetch = () => 'bypassed';
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(globalThis.fetch).toBe(originalFetch);

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        delete globalThis.window;
        globalThis.window = {
          location: 'https://example.test',
        };
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
    expect(typeof (globalThis as typeof globalThis & { window?: unknown }).window).toBe('undefined');
  });

  it('should block saved host global references during delete and reassignment attempts', async () => {
    const originalFetch = globalThis.fetch;
    const savedFetch = globalThis.fetch;

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          delete globalThis.fetch;
          try {
            globalThis.fetch = savedFetch;
          } catch (_error) {
            // Continue to prove the captured reference itself is not callable.
          }
          savedFetch('https://example.test');
        `,
        {
          globals: {
            savedFetch,
          },
        },
      ),
    ).rejects.toMatchObject({
      blockedGlobal: 'globals.savedFetch',
    });
    expect(globalThis.fetch).toBe(originalFetch);
  });

  it('should not execute host global proxy traps or accessors while installing user globals', async () => {
    let trapCount = 0;
    let getterExecuted = false;
    const proxiedGlobal = new Proxy(
      {
        value: 'blocked',
      },
      {
        getOwnPropertyDescriptor() {
          trapCount += 1;
          return {
            configurable: true,
            enumerable: true,
            value: 'blocked',
          };
        },
        ownKeys() {
          trapCount += 1;
          return ['value'];
        },
      },
    );
    const arrayGlobal = Object.defineProperty([], '0', {
      configurable: true,
      enumerable: true,
      get() {
        getterExecuted = true;
        return 'blocked';
      },
    });

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          Reflect.get(proxiedGlobal, 'value');
        `,
        {
          globals: {
            arrayGlobal,
            proxiedGlobal,
          },
        },
      ),
    ).rejects.toMatchObject({
      blockedGlobal: 'globals.proxiedGlobal.value',
    });

    expect(trapCount).toBe(0);
    expect(getterExecuted).toBe(false);
  });

  it('should block object hardening on protected runtime objects', async () => {
    await expect(runWithFlowSurfaceExtractorGuards(`Object.freeze(globalThis);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(runWithFlowSurfaceExtractorGuards(`Object.seal(process);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(runWithFlowSurfaceExtractorGuards(`Object.preventExtensions(globalThis);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    expect(Object.isExtensible(globalThis)).toBe(true);
    expect(Object.isExtensible(process)).toBe(true);
  });

  it('should reject async runtime work instead of awaiting it', async () => {
    await expect(
      runWithFlowSurfaceExtractorGuards(`
        return (async () => undefined)();
      `),
    ).rejects.toMatchObject({
      blockedGlobal: 'result',
    });

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          return (async () => {
            await { then() {} };
          })();
        `,
        {
          timeoutMs: 50,
        },
      ),
    ).rejects.toMatchObject({
      blockedGlobal: 'result',
    });

    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          let current = {
            then() {
              return new Promise(() => undefined);
            },
          };
          for (let index = 0; index < 40; index += 1) {
            current = Object.create(current);
          }
          return current;
        `,
        {
          timeoutMs: 50,
        },
      ),
    ).rejects.toMatchObject({
      blockedGlobal: 'result',
    });

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        return {
          ok: true,
        };
      `),
    ).rejects.toMatchObject({
      blockedGlobal: 'result',
    });
  });

  it('should time out endless async microtask chains', async () => {
    await expect(
      runWithFlowSurfaceExtractorGuards(
        `
          (async () => {
            while (true) {
              await 0;
            }
          })();
        `,
        {
          timeoutMs: 50,
        },
      ),
    ).rejects.toThrow('Script execution timed out');
  });

  it('should fail closed when runtime code registers timers', async () => {
    await expect(runWithFlowSurfaceExtractorGuards(`setTimeout(() => undefined, 0);`)).rejects.toThrow(
      FlowSurfaceExtractorGuardError,
    );

    await expect(
      runWithFlowSurfaceExtractorGuards(`
        new Promise((resolve) => setTimeout(resolve, 0));
      `),
    ).rejects.toThrow(FlowSurfaceExtractorGuardError);
  });

  it('should extract static registration facts from TSX source', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        class PluginDemoClient {
          async load() {
            this.flowEngine.registerModels({ DemoBlockModel });
            this.flowEngine.registerModelLoaders({
              DemoActionModel: { loader: () => import('./DemoActionModel') },
            });
          }
        }

        DemoBlockModel.registerFlow({
          key: 'demoSettings',
          title: 'Demo settings',
          steps: {
            fields: {
              uiSchema() {
                return {};
              },
            },
          },
        });

        EditableItemModel.bindModelToInterface('DemoFieldModel', ['demo']);

        DemoBlockModel.define({
          label: 'Demo',
          createModelOptions: {
            use: 'DemoBlockModel',
          },
        });

        export function DemoMenu() {
          return <AddSubModelButton key="demo" title="Demo" modelUse="DemoBlockModel" subModelKey="blocks" />;
        }
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'DemoBlockModel',
        }),
        expect.objectContaining({
          type: 'model.loaderRegistered',
          modelUse: 'DemoActionModel',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'demoSettings',
          staticStatus: 'dynamic',
        }),
        expect.objectContaining({
          type: 'field.bindingRegistered',
          fieldInterface: 'demo',
          modelUse: 'DemoFieldModel',
          role: 'editable',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'DemoBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'demo',
          modelUse: 'DemoBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'unresolved',
        }),
      ]),
    );
  });

  it('should extract same-file const object registrations from TSX source', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        const models = {
          DemoBlockModel,
          DemoActionModel: RenamedDemoActionModel,
        };

        class PluginDemoClient {
          async load() {
            this.flowEngine.registerModels(models);
          }
        }
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'DemoBlockModel',
          className: 'DemoBlockModel',
        }),
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'DemoActionModel',
          className: 'RenamedDemoActionModel',
        }),
      ]),
    );
  });

  it('should extract namespace imported barrel model registrations from TSX source', async () => {
    const tempRoot = await mkdtemp(join(await realpath(tmpdir()), 'flow-surfaces-extractor-ast-'));
    try {
      const modelsDir = join(tempRoot, 'models');
      const entryPath = join(tempRoot, 'plugin.tsx');
      await mkdir(modelsDir);
      await writeFile(
        join(modelsDir, 'index.ts'),
        [
          "export * from './DemoBlockModel';",
          "export * from './DemoActionModel';",
          'export const NotAFlowHelper = 1;',
          '',
        ].join('\n'),
        'utf8',
      );
      await writeFile(join(modelsDir, 'DemoBlockModel.tsx'), 'export class DemoBlockModel {}\n', 'utf8');
      await writeFile(join(modelsDir, 'DemoActionModel.ts'), 'export class DemoActionModel {}\n', 'utf8');
      const source = `
        import * as models from './models';

        class PluginDemoClient {
          async load() {
            this.app.flowEngine.registerModels(models);
          }
        }
      `;
      await writeFile(entryPath, source, 'utf8');

      const events = collectFlowSurfaceExtractorAstEvents({
        sourceFile: entryPath,
        source,
      });

      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'model.registered',
            modelUse: 'DemoBlockModel',
          }),
          expect.objectContaining({
            type: 'model.registered',
            modelUse: 'DemoActionModel',
          }),
        ]),
      );
      expect(events).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            modelUse: 'NotAFlowHelper',
          }),
        ]),
      );
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('should not expand namespace imports inside dynamic registration expressions', async () => {
    const tempRoot = await mkdtemp(join(await realpath(tmpdir()), 'flow-surfaces-extractor-ast-'));
    try {
      const modelsDir = join(tempRoot, 'models');
      const entryPath = join(tempRoot, 'plugin.tsx');
      await mkdir(modelsDir);
      await writeFile(join(modelsDir, 'index.ts'), 'export class FilteredOutBlockModel {}\n', 'utf8');
      const source = `
        import * as models from './models';

        class PluginDemoClient {
          async load() {
            const filteredModels = Object.fromEntries(Object.entries(models).filter(Boolean));
            this.flowEngine.registerModels(filteredModels);
          }
        }
      `;
      await writeFile(entryPath, source, 'utf8');

      const events = collectFlowSurfaceExtractorAstEvents({
        sourceFile: entryPath,
        source,
      });

      expect(events).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({
            type: 'model.registered',
            modelUse: 'FilteredOutBlockModel',
          }),
        ]),
      );
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('should extract AST registerFlow string overloads as distinct flows', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/models/DemoBlockModel.tsx',
      source: `
        DemoBlockModel.registerFlow('alpha', {
          title: 'Alpha',
          steps: {},
        });

        DemoBlockModel.registerFlow('beta', {
          title: 'Beta',
          sort: 20,
          steps: {},
        });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events,
    });

    expect(snapshot.flows).toEqual([
      expect.objectContaining({
        modelUse: 'DemoBlockModel',
        flowKey: 'alpha',
        title: 'Alpha',
        staticStatus: 'static',
      }),
      expect.objectContaining({
        modelUse: 'DemoBlockModel',
        flowKey: 'beta',
        title: 'Beta',
        sort: 20,
        staticStatus: 'static',
      }),
    ]);
  });

  it('should extract identifier-backed AST registerFlow object literals', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/models/DemoBlockModel.tsx',
      source: `
        const demoSettingsFlow = {
          key: 'demoSettings',
          title: tExpr('Demo settings'),
          sort: 30,
          steps: {},
        };

        DemoBlockModel.registerFlow(demoSettingsFlow);
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'DemoBlockModel',
          flowKey: 'demoSettings',
          title: 'Demo settings',
          sort: 30,
          staticStatus: 'dynamic',
        }),
      ]),
    );
  });

  it('should extract imported defineFlow registerFlow facts', async () => {
    const tempRoot = await mkdtemp(join(await realpath(tmpdir()), 'flow-surfaces-extractor-flow-'));
    try {
      const flowsDir = join(tempRoot, 'flows');
      const modelsDir = join(tempRoot, 'models');
      const modelPath = join(modelsDir, 'PopupActionModel.tsx');
      await mkdir(flowsDir);
      await mkdir(modelsDir);
      await writeFile(
        join(flowsDir, 'openViewFlow.ts'),
        `
          export const openViewFlow = defineFlow({
            key: 'popupSettings',
            title: tExpr('Popup settings'),
            sort: 300,
            steps: {},
          });
        `,
        'utf8',
      );
      const source = `
        import { openViewFlow } from '../flows/openViewFlow';

        PopupActionModel.registerFlow(openViewFlow);
      `;
      await writeFile(modelPath, source, 'utf8');

      const events = collectFlowSurfaceExtractorAstEvents({
        sourceFile: modelPath,
        source,
      });

      expect(events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'model.flowRegistered',
            modelUse: 'PopupActionModel',
            flowKey: 'popupSettings',
            title: 'Popup settings',
            sort: 300,
            staticStatus: 'dynamic',
          }),
        ]),
      );
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it('should keep AST flowEngine registerFlow overloads unbound to modelUse', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        class PluginDemoClient {
          async load() {
            this.flowEngine.registerFlow('globalRefresh', {
              title: 'Global refresh',
              steps: {},
            });

            this.app.flowEngine.registerFlow('appGlobalRefresh', {
              title: 'App global refresh',
              steps: {},
            });
          }
        }
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events,
    });

    expect(snapshot.flows).toEqual([
      expect.objectContaining({
        flowKey: 'appGlobalRefresh',
        title: 'App global refresh',
        staticStatus: 'static',
      }),
      expect.objectContaining({
        flowKey: 'globalRefresh',
        title: 'Global refresh',
        staticStatus: 'static',
      }),
    ]);
    expect(snapshot.flows).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          modelUse: 'flowEngine',
        }),
      ]),
    );
  });

  it('should extract model names through casted AST receivers', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-field-code/src/client-v2/models/CodeFieldModel.tsx',
      source: `
        (CodeFieldModel as unknown).define({
          label: tExpr('Code'),
        });

        (CodeFieldModel as unknown).registerFlow({
          key: 'codeFieldSettings',
          sort: 200,
          title: tExpr('Content settings'),
          steps: {
            height: {
              defaultParams(ctx) {
                return { height: ctx.model?.props?.height || 'auto' };
              },
            },
          },
        });
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'CodeFieldModel',
        }),
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'CodeFieldModel',
          flowKey: 'codeFieldSettings',
          staticStatus: 'dynamic',
        }),
      ]),
    );
  });

  it('should infer known field binding subclass roles from AST receivers', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile:
        'packages/core/client-v2/src/flow/models/fields/DisplayAssociationField/DisplaySubTableFieldModel.tsx',
      source: `
        DetailsItemModel.bindModelToInterface('DisplaySubTableFieldModel', ['m2m', 'o2m', 'mbm']);
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'field.bindingRegistered',
          fieldInterface: 'm2m',
          modelUse: 'DisplaySubTableFieldModel',
          role: 'display',
        }),
      ]),
    );
  });

  it('should not infer static create options from JSX menu references alone', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      source: `
        export function DemoMenu() {
          return <AddSubModelButton key="demo" title="Demo" modelUse="DemoBlockModel" subModelKey="blocks" />;
        }
      `,
    });

    expect(events).toMatchObject([
      {
        type: 'menu.itemRegistered',
        modelUse: 'DemoBlockModel',
        createModelOptionsStatus: 'unresolved',
      },
    ]);
  });

  it('should mark non-literal AST flow and create option expressions as dynamic', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
      source: `
        const tableSettingsFlow = TableBlockModel.globalFlowRegistry.getFlow('tableSettings');

        GanttBlockModel.registerFlow({
          key: 'tableSettings',
          sort: tableSettingsFlow?.sort ?? 500,
          title: tableSettingsFlow?.title ?? tExpr('Table settings'),
          steps: getGanttTableSettingsSteps(),
        });

        GanttBlockModel.define({
          label: tExpr('Gantt'),
          createModelOptions: {
            use: 'GanttBlockModel',
            props: {
              title: tExpr('Actions'),
            },
          },
        });
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'model.flowRegistered',
          modelUse: 'GanttBlockModel',
          flowKey: 'tableSettings',
          staticStatus: 'dynamic',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          modelUse: 'GanttBlockModel',
          createModelOptionsStatus: 'dynamic',
        }),
      ]),
    );
  });

  it('should recover action placement evidence from subModelBaseClass and dynamic items menus', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      source: `
        export function GanttMenu() {
          return (
            <AddSubModelButton
              key="gantt-add-actions"
              model={this}
              subModelBaseClass={this.getModelClassName('CollectionActionGroupModel')}
              subModelKey="actions"
            />
          );
        }

        export function ListMenu() {
          return (
            <AddSubModelButton
              key={'table-column-add-actions'}
              model={this}
              items={(ctx) => this.getCollectionActionItems(ctx)}
              subModelKey="actions"
            />
          );
        }
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'gantt-add-actions',
          slot: 'actions',
          createModelOptionsStatus: 'unresolved',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'table-column-add-actions',
          slot: 'actions',
          createModelOptionsStatus: 'dynamic',
        }),
      ]),
    );
  });

  it('should recover field placement evidence from subModelBaseClasses arrays', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/core/client-v2/src/flow/models/blocks/form/FormGridModel.tsx',
      source: `
        export function FormGrid() {
          return (
            <AddSubModelButton
              subModelKey="items"
              subModelBaseClasses={[
                this.context.getModelClassName('FormItemModel'),
                this.context.getModelClassName('FormAssociationFieldGroupModel'),
                this.context.getModelClassName('FormCustomItemModel'),
                this.context.getModelClassName('FormJSFieldItemModel'),
              ].filter(Boolean)}
              model={this}
            />
          );
        }
      `,
    });

    expect(events).toMatchObject([
      {
        type: 'menu.itemRegistered',
        slot: 'fields',
        createModelOptionsStatus: 'unresolved',
      },
    ]);
  });

  it('should extract static AddSubModelButton items as per-item menu facts', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/core/client-v2/src/flow/models/base/PageModel/PageModel.tsx',
      source: `
        export function PageTabs() {
          return (
            <AddSubModelButton
              model={this}
              subModelKey={'tabs'}
              items={[
                {
                  key: 'blank',
                  label: this.context.t('Blank tab'),
                  createModelOptions: this.createPageTabModelOptions,
                },
              ]}
            />
          );
        }
      `,
    });

    expect(events).toMatchObject([
      {
        type: 'menu.itemRegistered',
        menuKey: 'blank',
        labelKey: 'Blank tab',
        labelFallback: 'Blank tab',
        slot: 'tabs',
        createModelOptionsStatus: 'dynamic',
      },
    ]);
  });

  it('should extract variable-backed static AddSubModelButton items', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-workflow-approval/src/client/models/ProcessFormModel.tsx',
      source: `
        export class ProcessFormModel {
          renderConfigureActions() {
            const items: SubModelItem[] = [
              {
                key: 'approve',
                label: this.translate('Approve', { ns: NAMESPACE }),
                createModelOptions: {
                  use: 'ProcessFormApproveModel',
                },
                toggleable: true,
              },
              {
                key: 'reject',
                label: this.translate('Reject', { ns: NAMESPACE }),
                createModelOptions: {
                  use: 'ProcessFormRejectModel',
                },
                toggleable: true,
              },
            ];

            return <AddSubModelButton model={this} subModelKey="actions" items={items} />;
          }
        }
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'approve',
          modelUse: 'ProcessFormApproveModel',
          slot: 'actions',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'reject',
          modelUse: 'ProcessFormRejectModel',
          slot: 'actions',
          createModelOptionsStatus: 'static',
        }),
      ]),
    );
  });

  it('should extract grouped static AddSubModelButton child items', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-workflow-approval/src/client/models/TriggerBlockGridModel.tsx',
      source: `
        export class TriggerBlockGridModel {
          renderAddSubModelButton() {
            const items: SubModelItem[] = [
              {
                key: 'dataBlock',
                type: 'group',
                label: tExpr('Form'),
                children: [
                  {
                    key: 'applyForm',
                    label: tExpr('Apply form'),
                    useModel: 'ApplyFormModel',
                    createModelOptions: {
                      use: 'ApplyFormModel',
                    },
                  },
                ],
              },
              {
                key: 'otherBlocks',
                type: 'group',
                label: tExpr('Other blocks'),
                children: [
                  {
                    key: 'markdown',
                    label: tExpr('Markdown'),
                    useModel: 'MarkdownBlockModel',
                    createModelOptions: {
                      use: 'MarkdownBlockModel',
                    },
                  },
                  {
                    key: 'jsBlock',
                    label: tExpr('JS block'),
                    useModel: 'JSBlockModel',
                    createModelOptions: {
                      use: 'JSBlockModel',
                    },
                  },
                ],
              },
            ];

            return <AddSubModelButton model={this} subModelKey="items" items={items} />;
          }
        }
      `,
    });

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'applyForm',
          modelUse: 'ApplyFormModel',
          slot: 'items',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'markdown',
          modelUse: 'MarkdownBlockModel',
          slot: 'items',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'jsBlock',
          modelUse: 'JSBlockModel',
          slot: 'items',
          createModelOptionsStatus: 'static',
        }),
      ]),
    );
  });

  it('should preserve structured runtime and AST menu label evidence in snapshots', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    const GanttBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'GanttBlockModel',
      recorder,
    });
    const RuntimeDistBlockModel = createFlowSurfaceMockModelClass({
      modelUse: 'RuntimeDistBlockModel',
      recorder,
    });

    GanttBlockModel.define({
      label: {
        key: 'Gantt',
        fallback: 'Gantt chart',
      },
      createModelOptions: {
        use: 'GanttBlockModel',
      },
    });
    RuntimeDistBlockModel.define({
      label: '{{t("Runtime label", {"defaultValue":"Runtime fallback"})}}',
      createModelOptions: {
        use: 'RuntimeDistBlockModel',
      },
    });
    recorder.recordMenuItem({
      menuKey: 'runtime-single-quote',
      label: "{{t('Runtime single label', { defaultValue: 'Runtime single fallback' })}}",
      modelUse: 'RuntimeSingleBlockModel',
      slot: 'blocks',
    });
    recorder.recordMenuItem({
      menuKey: 'merge-label',
      label: '{{t("Merge label")}}',
      modelUse: 'MergeBlockModel',
      slot: 'blocks',
    });
    recorder.recordMenuItem({
      menuKey: 'merge-label',
      label: '{{t("Merge label", {"fallback":"Merged fallback"})}}',
      modelUse: 'MergeBlockModel',
      slot: 'blocks',
    });

    const astEvents = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/models/PageModel.tsx',
      source: `
        DemoBlockModel.define({
          label: tExpr('Demo block', { defaultValue: 'Demo block fallback' }),
          createModelOptions: {
            use: 'DemoBlockModel',
          },
        });

        DistBlockModel.define({
          label: '{{t("Dist block", {"defaultValue":"Dist fallback"})}}',
          createModelOptions: {
            use: 'DistBlockModel',
          },
        });

        SingleQuoteDistBlockModel.define({
          label: "{{t('Single quote block', { fallback: 'Single quote fallback', ns: 'client' })}}",
          createModelOptions: {
            use: 'SingleQuoteDistBlockModel',
          },
        });

        export function PageTabs() {
          return (
            <AddSubModelButton
              model={this}
              subModelKey={'tabs'}
              items={[
                {
                  key: 'blank',
                  label: this.context.t('Blank tab'),
                  createModelOptions: {
                    use: 'PageTabModel',
                  },
                },
              ]}
            />
          );
        }
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [...recorder.getEvents(), ...astEvents],
    });

    expect(snapshot.menuItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUse: 'GanttBlockModel',
          label: 'Gantt chart',
          labelKey: 'Gantt',
          labelFallback: 'Gantt chart',
        }),
        expect.objectContaining({
          modelUse: 'RuntimeDistBlockModel',
          label: 'Runtime fallback',
          labelKey: 'Runtime label',
          labelFallback: 'Runtime fallback',
        }),
        expect.objectContaining({
          menuKey: 'runtime-single-quote',
          label: 'Runtime single fallback',
          labelKey: 'Runtime single label',
          labelFallback: 'Runtime single fallback',
        }),
        expect.objectContaining({
          menuKey: 'merge-label',
          label: 'Merged fallback',
          labelKey: 'Merge label',
          labelFallback: 'Merged fallback',
        }),
        expect.objectContaining({
          modelUse: 'DemoBlockModel',
          label: 'Demo block fallback',
          labelKey: 'Demo block',
          labelFallback: 'Demo block fallback',
        }),
        expect.objectContaining({
          modelUse: 'DistBlockModel',
          label: 'Dist fallback',
          labelKey: 'Dist block',
          labelFallback: 'Dist fallback',
        }),
        expect.objectContaining({
          modelUse: 'SingleQuoteDistBlockModel',
          label: 'Single quote fallback',
          labelKey: 'Single quote block',
          labelFallback: 'Single quote fallback',
        }),
        expect.objectContaining({
          menuKey: 'blank',
          label: 'Blank tab',
          labelKey: 'Blank tab',
          labelFallback: 'Blank tab',
        }),
      ]),
    );
  });

  it('should normalize snapshots and derive read-only auto candidates', () => {
    const runtimeRecorder = createFlowSurfaceExtractionRecorder();
    runtimeRecorder.recordModel({
      modelUse: 'GanttBlockModel',
      className: 'GanttBlockModel',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
      confidence: 'high',
    });
    runtimeRecorder.recordMenuItem({
      menuKey: 'gantt',
      label: 'Gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });

    const astEvents = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
      source: `
        GanttBlockModel.registerFlow({
          key: 'ganttSettings',
          title: 'Gantt',
          steps: {},
        });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      pluginVersion: '2.1.0-test',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [...runtimeRecorder.getEvents(), ...astEvents],
    });
    const candidates = deriveFlowSurfaceAutoCapabilityCandidates(snapshot);

    expect(snapshot.models).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        confidence: 'high',
      },
    ]);
    expect(snapshot.flows).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        flowKey: 'ganttSettings',
        staticStatus: 'static',
      },
    ]);
    expect(candidates).toMatchObject([
      {
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'autoSnapshot',
        confidence: 'high',
        warnings: [
          {
            code: 'auto-discovered-readonly',
          },
        ],
      },
    ]);
  });

  it('should classify action-group models as actions and suppress unknown model diagnostics', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModelLoader({
      modelUse: 'GanttCollectionActionGroupModel',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'AmbiguousModel',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toMatchObject([
      {
        kind: 'action',
        publicType: 'pluginGantt.ganttCollectionActionGroup',
        modelUse: 'GanttCollectionActionGroupModel',
      },
    ]);
  });

  it('should classify item and column models as field components', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/models/field-items.tsx',
      source: `
        class BulkEditFormItemModel extends FormItemModel {}

        DividerItemModel.define({
          label: tExpr('Divider'),
          createModelOptions: {
            use: 'DividerItemModel',
          },
        });

        MarkdownItemModel.define({
          label: tExpr('Markdown'),
          createModelOptions: {
            use: 'MarkdownItemModel',
          },
        });

        BulkEditFormItemModel.define({
          label: tExpr('Bulk edit'),
          createModelOptions: {
            use: 'BulkEditFormItemModel',
          },
        });

        TableColumnModel.define({
          label: tExpr('Display fields'),
          createModelOptions: {
            use: 'TableColumnModel',
          },
        });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events,
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'fieldComponent',
          modelUse: 'DividerItemModel',
        }),
        expect.objectContaining({
          kind: 'fieldComponent',
          modelUse: 'MarkdownItemModel',
        }),
        expect.objectContaining({
          kind: 'fieldComponent',
          modelUse: 'BulkEditFormItemModel',
        }),
        expect.objectContaining({
          kind: 'fieldComponent',
          modelUse: 'TableColumnModel',
        }),
      ]),
    );
  });

  it('should keep runtime and AST source refs distinct for the same source path', () => {
    const sourceFile = 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx';
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'GanttBlockModel',
      source: sourceFile,
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      source: sourceFile,
      confidence: 'medium',
    });
    const astEvents = collectFlowSurfaceExtractorAstEvents({
      sourceFile,
      source: `
        this.flowEngine.registerModels({ GanttBlockModel });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [...recorder.getEvents(), ...astEvents],
    });

    expect(snapshot.models[0].sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: sourceFile, evidenceSource: 'runtime' }),
        expect.objectContaining({ source: sourceFile, evidenceSource: 'ast' }),
      ]),
    );
    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        confidence: 'high',
      },
    ]);
  });

  it('should merge later static flow metadata without executing runtime flow accessors', () => {
    const sourceFile = 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx';
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordFlow({
      modelUse: 'GanttBlockModel',
      flowKey: 'ganttSettings',
      staticStatus: 'dynamic',
      source: sourceFile,
      confidence: 'medium',
    });
    const astEvents = collectFlowSurfaceExtractorAstEvents({
      sourceFile,
      source: `
        GanttBlockModel.registerFlow('ganttSettings', {
          title: 'Gantt settings',
          sort: 20,
          steps: {},
        });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [...recorder.getEvents(), ...astEvents],
    });

    expect(snapshot.flows).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        flowKey: 'ganttSettings',
        title: 'Gantt settings',
        sort: 20,
        staticStatus: 'dynamic',
      },
    ]);
  });

  it('should derive read-only candidates from flow evidence', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordFlow({
      modelUse: 'GanttBlockModel',
      flowKey: 'ganttSettings',
      title: 'Gantt settings',
      staticStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toEqual([
      expect.objectContaining({
        kind: 'block',
        modelUse: 'GanttBlockModel',
        label: 'Gantt settings',
        evidence: expect.arrayContaining([
          {
            type: 'flow',
            ref: 'ganttSettings',
          },
        ]),
      }),
    ]);
  });

  it('should retain combined model, menu, and flow evidence on auto candidates', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'GanttBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordFlow({
      modelUse: 'GanttBlockModel',
      flowKey: 'ganttSettings',
      staticStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        evidence: [
          {
            type: 'menuItem',
            ref: 'gantt',
          },
          {
            type: 'flow',
            ref: 'ganttSettings',
          },
          {
            type: 'model',
            ref: 'GanttBlockModel',
          },
        ],
      },
    ]);
  });

  it('should disambiguate colliding auto public types by capability kind', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'BulkEditBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'BulkEditActionModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'BulkEditFieldModel',
      source: 'runtime',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-action-bulk-edit',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'pluginActionBulkEdit.bulkEditBlock',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
        expect.objectContaining({
          publicType: 'pluginActionBulkEdit.bulkEditAction',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
        expect.objectContaining({
          publicType: 'pluginActionBulkEdit.bulkEditFieldComponent',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
      ]),
    );
  });

  it('should disambiguate same-kind auto public type collisions by model use', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'JSFieldModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'JSItemModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'JSColumnModel',
      source: 'runtime',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });
    const candidates = deriveFlowSurfaceAutoCapabilityCandidates(snapshot);
    const publicTypes = candidates.map((candidate) => candidate.publicType);

    expect(new Set(publicTypes).size).toBe(publicTypes.length);
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUse: 'JSFieldModel',
          publicType: 'pluginDemo.jsFieldComponentJsField',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
        expect.objectContaining({
          modelUse: 'JSItemModel',
          publicType: 'pluginDemo.jsFieldComponentJsItem',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
        expect.objectContaining({
          modelUse: 'JSColumnModel',
          publicType: 'pluginDemo.jsFieldComponentJsColumn',
          warnings: expect.arrayContaining([expect.objectContaining({ code: 'public-type-conflict' })]),
        }),
      ]),
    );
  });

  it('should write snapshots only under the selected output directory', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-'));
    const outsideDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-outside-'));
    const symlinkedOutDirParent = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-link-parent-'));
    const symlinkedParentTarget = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-parent-target-'));
    const symlinkedParentRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-parent-link-root-'));
    const swappableOutDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-swap-'));
    try {
      const snapshot = buildFlowSurfaceAutoSnapshot({
        plugin: '@nocobase/plugin-demo',
        generatedAt: '2026-06-04T00:00:00.000Z',
        sourceHash: 'source-hash',
        extractorVersion: 'test',
        events: [],
      });
      const snapshotPath = await writeFlowSurfaceAutoSnapshot({
        snapshot,
        outDir,
      });
      const content = JSON.parse(await readFile(snapshotPath, 'utf8'));

      expect(snapshotPath).toBe(
        join(await realpath(outDir), getFlowSurfaceAutoSnapshotFileName('@nocobase/plugin-demo')),
      );
      expect(content).toMatchObject({
        version: 1,
        plugin: '@nocobase/plugin-demo',
        models: [],
      });
      await expect(
        writeFlowSurfaceAutoSnapshot({
          snapshot,
          outDir,
          fileName: '../escape.json',
        }),
      ).rejects.toThrow('file name must not include path separators');
      const outsideFile = join(outsideDir, 'outside.json');
      await writeFile(outsideFile, '{}\n', 'utf8');
      await symlink(outsideFile, join(outDir, 'linked.json'));
      await expect(
        writeFlowSurfaceAutoSnapshot({
          snapshot,
          outDir,
          fileName: 'linked.json',
        }),
      ).rejects.toThrow('must not be a symlink');

      const hardlinkedOutsideFile = join(outsideDir, 'hardlinked-outside.json');
      const hardlinkedSnapshotPath = join(outDir, 'hardlinked.json');
      await writeFile(hardlinkedOutsideFile, '{"outside":true}\n', 'utf8');
      await link(hardlinkedOutsideFile, hardlinkedSnapshotPath);
      await writeFlowSurfaceAutoSnapshot({
        snapshot,
        outDir,
        fileName: 'hardlinked.json',
      });
      expect(await readFile(hardlinkedOutsideFile, 'utf8')).toBe('{"outside":true}\n');
      expect(JSON.parse(await readFile(hardlinkedSnapshotPath, 'utf8'))).toMatchObject({
        plugin: '@nocobase/plugin-demo',
      });

      const symlinkedOutDir = join(symlinkedOutDirParent, 'out-link');
      await symlink(outDir, symlinkedOutDir);
      await expect(
        writeFlowSurfaceAutoSnapshot({
          snapshot,
          outDir: symlinkedOutDir,
        }),
      ).rejects.toThrow('output directory path must not include symlinks');

      const symlinkedParent = join(symlinkedParentRoot, 'linked-parent');
      await symlink(symlinkedParentTarget, symlinkedParent);
      await expect(
        writeFlowSurfaceAutoSnapshot({
          snapshot,
          outDir: join(symlinkedParent, 'nested'),
        }),
      ).rejects.toThrow('output directory path must not include symlinks');

      const swappingSnapshot = Object.create(snapshot) as typeof snapshot;
      Object.defineProperty(swappingSnapshot, 'toJSON', {
        value() {
          rmSync(swappableOutDir, { recursive: true, force: true });
          symlinkSync(outsideDir, swappableOutDir);
          return snapshot;
        },
      });
      await expect(
        writeFlowSurfaceAutoSnapshot({
          snapshot: swappingSnapshot,
          outDir: swappableOutDir,
          fileName: 'swapped.json',
        }),
      ).rejects.toThrow('output directory path must not include symlinks');
      await expect(readFile(join(outsideDir, 'swapped.json'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await rm(outDir, { recursive: true, force: true });
      await rm(outsideDir, { recursive: true, force: true });
      await rm(symlinkedOutDirParent, { recursive: true, force: true });
      await rm(symlinkedParentTarget, { recursive: true, force: true });
      await rm(symlinkedParentRoot, { recursive: true, force: true });
      await rm(swappableOutDir, { recursive: true, force: true });
    }
  });

  it('should load valid snapshots from an explicit directory', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-load-'));
    try {
      const snapshot = buildFlowSurfaceAutoSnapshot({
        plugin: '@nocobase/plugin-gantt',
        generatedAt: '2026-06-04T00:00:00.000Z',
        sourceHash: 'source-hash',
        extractorVersion: 'test',
        events: [
          {
            type: 'model.loaderRegistered',
            modelUse: 'GanttBlockModel',
            loaderName: 'loader',
            source: 'src/client-v2/index.ts',
            evidenceSource: 'runtime',
            confidence: 'high',
          },
          {
            type: 'menu.itemRegistered',
            menuKey: 'gantt',
            labelText: 'Gantt',
            modelUse: 'GanttBlockModel',
            slot: 'blocks',
            createModelOptionsStatus: 'static',
            source: 'src/client-v2/index.ts',
            evidenceSource: 'runtime',
            confidence: 'high',
          },
        ],
      });
      await writeFlowSurfaceAutoSnapshot({ snapshot, outDir });

      const loaded = await loadFlowSurfaceAutoSnapshotsFromDirectory({ dir: outDir });
      expect(loaded).toHaveLength(1);
      const [loadedSnapshot] = loaded;
      if (!loadedSnapshot) {
        throw new Error('snapshot should be loaded');
      }
      expect(loadedSnapshot).toMatchObject({
        plugin: '@nocobase/plugin-gantt',
        models: [expect.objectContaining({ modelUse: 'GanttBlockModel' })],
      });
      expect(deriveFlowSurfaceAutoCapabilityCandidates(loadedSnapshot)).toEqual([
        expect.objectContaining({
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          modelUse: 'GanttBlockModel',
        }),
      ]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should treat a missing snapshot directory as empty', async () => {
    const tempRoot = await realpath(tmpdir());
    const missingDir = join(tempRoot, `flow-surfaces-extractor-missing-${Date.now()}`);

    await expect(loadFlowSurfaceAutoSnapshotsFromDirectory({ dir: missingDir })).resolves.toEqual([]);
  });

  it('should skip invalid snapshot files without failing directory loading', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-invalid-load-'));
    try {
      const snapshot = buildFlowSurfaceAutoSnapshot({
        plugin: '@nocobase/plugin-valid',
        generatedAt: '2026-06-04T00:00:00.000Z',
        sourceHash: 'source-hash',
        extractorVersion: 'test',
        events: [
          {
            type: 'model.loaderRegistered',
            modelUse: 'ValidBlockModel',
            source: 'src/client-v2/index.ts',
            evidenceSource: 'runtime',
            confidence: 'high',
          },
        ],
      });
      const validPath = await writeFlowSurfaceAutoSnapshot({ snapshot, outDir });
      await writeFile(join(outDir, 'invalid-json.json'), '{', 'utf8');
      await writeFile(join(outDir, 'notes.txt'), JSON.stringify(snapshot), 'utf8');
      await mkdir(join(outDir, 'directory.json'));
      await symlink(validPath, join(outDir, 'linked.json'));
      await writeFile(
        join(outDir, 'wrong-version.json'),
        `${JSON.stringify({ ...snapshot, version: 999 }, null, 2)}\n`,
        'utf8',
      );
      await writeFile(
        join(outDir, 'malformed.json'),
        `${JSON.stringify(
          {
            ...snapshot,
            models: [{ modelUse: 'BrokenBlockModel', sourceRefs: [], confidence: 'certain' }],
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const loaded = await loadFlowSurfaceAutoSnapshotsFromDirectory({ dir: outDir });

      expect(loaded.map((item) => item.plugin)).toEqual(['@nocobase/plugin-valid']);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should resolve source client-v2 entries before dist entries by default', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-source-'));
    const sourceEntry = join(packageRoot, 'src/client-v2/index.tsx');
    const distEntry = join(packageRoot, 'dist/client-v2/index.js');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await mkdir(join(packageRoot, 'dist/client-v2'), { recursive: true });
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@nocobase/plugin-gantt"}\n', 'utf8');
      await writeFile(sourceEntry, 'export default class GanttPlugin {}\n', 'utf8');
      await writeFile(distEntry, 'module.exports = {};\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution).toMatchObject({
        plugin: '@nocobase/plugin-gantt',
        packageRoot,
        packageJsonPath: join(packageRoot, 'package.json'),
        sourceEntry,
        distEntry,
        selectedEntry: sourceEntry,
        mode: 'source',
        warnings: [],
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should keep source entry preference by default in production mode', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-production-'));
    const sourceEntry = join(packageRoot, 'src/client-v2/index.ts');
    const distEntry = join(packageRoot, 'dist/client-v2/index.js');
    try {
      vi.stubEnv('NODE_ENV', 'production');
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await mkdir(join(packageRoot, 'dist/client-v2'), { recursive: true });
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@nocobase/plugin-gantt"}\n', 'utf8');
      await writeFile(sourceEntry, 'export default class GanttPlugin {}\n', 'utf8');
      await writeFile(distEntry, 'module.exports = {};\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution).toMatchObject({
        sourceEntry,
        distEntry,
        selectedEntry: sourceEntry,
        mode: 'source',
        warnings: [],
      });
    } finally {
      vi.unstubAllEnvs();
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should prefer dist client-v2 entries when requested', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-dist-'));
    const sourceEntry = join(packageRoot, 'src/client-v2/plugin.ts');
    const distEntry = join(packageRoot, 'dist/client-v2/index.js');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await mkdir(join(packageRoot, 'dist/client-v2'), { recursive: true });
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@nocobase/plugin-gantt"}\n', 'utf8');
      await writeFile(sourceEntry, 'export default class GanttPlugin {}\n', 'utf8');
      await writeFile(distEntry, 'module.exports = {};\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
        preferMode: 'dist',
      });

      expect(resolution).toMatchObject({
        sourceEntry,
        distEntry,
        selectedEntry: distEntry,
        mode: 'dist',
        warnings: [],
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should honor source package.json client-v2 entry conventions before common paths', async () => {
    const tempRoot = await realpath(tmpdir());
    const cases: Array<{
      name: string;
      packageJson: Record<string, unknown>;
      entryPath: string;
    }> = [
      {
        name: 'top-level-client-v2',
        packageJson: {
          'client-v2': 'custom/top-level-client-v2.ts',
        },
        entryPath: 'custom/top-level-client-v2.ts',
      },
      {
        name: 'top-level-client-v2-camel',
        packageJson: {
          clientV2: 'custom/top-level-client-v2-camel.ts',
        },
        entryPath: 'custom/top-level-client-v2-camel.ts',
      },
      {
        name: 'top-level-client-v2-entry',
        packageJson: {
          'client-v2-entry': 'custom/top-level-client-v2-entry.ts',
        },
        entryPath: 'custom/top-level-client-v2-entry.ts',
      },
      {
        name: 'top-level-client-v2-entry-camel',
        packageJson: {
          clientV2Entry: 'custom/top-level-client-v2-entry-camel.ts',
        },
        entryPath: 'custom/top-level-client-v2-entry-camel.ts',
      },
      {
        name: 'nested-nocobase-client-v2',
        packageJson: {
          nocobase: {
            'client-v2': 'custom/nested-client-v2.ts',
          },
        },
        entryPath: 'custom/nested-client-v2.ts',
      },
      {
        name: 'nested-nocobase-client-v2-camel',
        packageJson: {
          nocobase: {
            clientV2: 'custom/nested-client-v2-camel.ts',
          },
        },
        entryPath: 'custom/nested-client-v2-camel.ts',
      },
      {
        name: 'nested-nocobase-client-v2-entry',
        packageJson: {
          nocobase: {
            'client-v2-entry': 'custom/nested-client-v2-entry.ts',
          },
        },
        entryPath: 'custom/nested-client-v2-entry.ts',
      },
      {
        name: 'nested-nocobase-client-v2-entry-camel',
        packageJson: {
          nocobase: {
            clientV2Entry: 'custom/nested-client-v2-entry-camel.ts',
          },
        },
        entryPath: 'custom/nested-client-v2-entry-camel.ts',
      },
    ];

    for (const item of cases) {
      const packageRoot = await mkdtemp(join(tempRoot, `flow-surfaces-entry-${item.name}-`));
      const declaredEntry = join(packageRoot, item.entryPath);
      const commonEntry = join(packageRoot, 'src/client-v2/index.ts');
      try {
        await mkdir(join(packageRoot, 'custom'), { recursive: true });
        await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
        await writeFile(
          join(packageRoot, 'package.json'),
          JSON.stringify(
            {
              name: `@example/plugin-${item.name}`,
              ...item.packageJson,
            },
            null,
            2,
          ),
          'utf8',
        );
        await writeFile(declaredEntry, 'export default class DeclaredPlugin {}\n', 'utf8');
        await writeFile(commonEntry, 'export default class CommonPlugin {}\n', 'utf8');

        const resolution = await resolveFlowSurfacePluginEntry({
          packageRoot,
        });

        expect(resolution).toMatchObject({
          plugin: `@example/plugin-${item.name}`,
          sourceEntry: declaredEntry,
          selectedEntry: declaredEntry,
          mode: 'source',
          warnings: [],
        });
      } finally {
        await rm(packageRoot, { recursive: true, force: true });
      }
    }
  });

  it('should resolve package.json exports client-v2 dist entries', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-exports-'));
    const distEntry = join(packageRoot, 'dist/client-v2/index.js');
    try {
      await mkdir(join(packageRoot, 'dist/client-v2'), { recursive: true });
      await writeFile(
        join(packageRoot, 'package.json'),
        JSON.stringify(
          {
            name: '@example/plugin-exports',
            exports: {
              './client-v2': {
                require: './dist/client-v2/index.js',
              },
              './client-v2.js': './dist/client-v2/index.js',
            },
          },
          null,
          2,
        ),
        'utf8',
      );
      await writeFile(distEntry, 'module.exports = {};\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution).toMatchObject({
        plugin: '@example/plugin-exports',
        distEntry,
        selectedEntry: distEntry,
        mode: 'dist',
        warnings: [],
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should classify package-declared root client-v2 markers as dist entries', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-root-marker-'));
    const sourceEntry = join(packageRoot, 'src/client-v2/index.tsx');
    const distEntry = join(packageRoot, 'client-v2.js');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await writeFile(
        join(packageRoot, 'package.json'),
        JSON.stringify(
          {
            name: '@example/plugin-root-marker',
            clientV2: './client-v2.js',
          },
          null,
          2,
        ),
        'utf8',
      );
      await writeFile(sourceEntry, 'export default class SourcePlugin {}\n', 'utf8');
      await writeFile(distEntry, 'module.exports = {};\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
        preferMode: 'dist',
      });

      expect(resolution).toMatchObject({
        plugin: '@example/plugin-root-marker',
        sourceEntry,
        distEntry,
        selectedEntry: distEntry,
        mode: 'dist',
        warnings: [],
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should return a nonfatal warning when a client-v2 entry cannot be resolved', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-missing-'));
    try {
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@example/plugin-server-only"}\n', 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution).toMatchObject({
        plugin: '@example/plugin-server-only',
        packageRoot,
        packageJsonPath: join(packageRoot, 'package.json'),
        warnings: [
          {
            code: 'extractor-runtime-error',
            message:
              'Plugin client-v2 entry could not be resolved; extractor should fall back to package-wide AST scan.',
          },
        ],
      });
      expect(resolution).not.toHaveProperty('selectedEntry');
      expect(resolution).not.toHaveProperty('mode');
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should ignore package.json client-v2 entries outside the package root', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-unsafe-'));
    try {
      await writeFile(join(tempRoot, 'outside-entry.ts'), 'export default class OutsidePlugin {}\n', 'utf8');
      await writeFile(
        join(packageRoot, 'package.json'),
        JSON.stringify(
          {
            name: '@example/plugin-unsafe-entry',
            clientV2: '../outside-entry.ts',
          },
          null,
          2,
        ),
        'utf8',
      );

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution.warnings).toEqual(
        expect.arrayContaining([
          {
            code: 'extractor-runtime-error',
            message: 'Plugin client-v2 package.json entry was outside package root and was ignored.',
          },
          {
            code: 'extractor-runtime-error',
            message:
              'Plugin client-v2 entry could not be resolved; extractor should fall back to package-wide AST scan.',
          },
        ]),
      );
      expect(resolution).not.toHaveProperty('selectedEntry');
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
      await rm(join(tempRoot, 'outside-entry.ts'), { force: true });
    }
  });

  it('should ignore package.json client-v2 entries that escape through symlinks', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-symlink-'));
    const outsideRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-outside-'));
    try {
      await mkdir(join(packageRoot, 'links'), { recursive: true });
      await writeFile(join(outsideRoot, 'entry.ts'), 'export default class OutsidePlugin {}\n', 'utf8');
      await symlink(outsideRoot, join(packageRoot, 'links/outside'), 'dir');
      await writeFile(
        join(packageRoot, 'package.json'),
        JSON.stringify(
          {
            name: '@example/plugin-symlink-entry',
            clientV2: 'links/outside/entry.ts',
          },
          null,
          2,
        ),
        'utf8',
      );

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution.warnings).toEqual(
        expect.arrayContaining([
          {
            code: 'extractor-runtime-error',
            message: 'Plugin client-v2 package.json entry was outside package root and was ignored.',
          },
          {
            code: 'extractor-runtime-error',
            message:
              'Plugin client-v2 entry could not be resolved; extractor should fall back to package-wide AST scan.',
          },
        ]),
      );
      expect(resolution).not.toHaveProperty('selectedEntry');
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
      await rm(outsideRoot, { recursive: true, force: true });
    }
  });

  it('should build auto namespaced public types from plugin and model names', () => {
    expect(buildAutoNamespacedPublicType('@nocobase/plugin-gantt', 'GanttBlockModel')).toBe('pluginGantt.gantt');
    expect(buildAutoNamespacedPublicType('@nocobase/plugin-gantt', 'GanttCollectionActionGroupModel')).toBe(
      'pluginGantt.ganttCollectionActionGroup',
    );
    expect(buildAutoNamespacedPublicType('@example/plugin-map', 'PointFieldModel')).toBe('examplePluginMap.point');
  });
});
