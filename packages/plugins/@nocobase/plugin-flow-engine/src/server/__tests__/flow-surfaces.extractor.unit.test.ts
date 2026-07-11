/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { rmSync, symlinkSync } from 'fs';
import { link, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  buildAutoNamespacedPublicType,
  buildFlowSurfaceAutoSnapshot,
  collectFlowSurfaceExtractorAstEvents,
  createFlowSurfaceExtractionRecorder,
  deriveFlowSurfaceAutoCapabilityCandidates,
  extractFlowSurfacePluginCapabilities,
  formatFlowSurfaceExtractorCliSummary,
  getFlowSurfaceAutoSnapshotFileName,
  loadFlowSurfaceAutoSnapshotsFromDirectory,
  registerFlowSurfaceExtractorCommand,
  resolveFlowSurfacePluginEntry,
  runFlowSurfaceExtractorCommand,
  runFlowSurfaceExtractorCli,
  writeFlowSurfaceAutoSnapshot,
} from '../flow-surfaces/extractor';
import { collectAutoSnapshotPublicCapabilities } from '../flow-surfaces/capability-registry';
import type { FlowSurfaceExtractionEvent } from '../flow-surfaces/extractor/types';
import type { FlowSurfaceCapabilityDiagnosticWarning } from '../flow-surfaces/types';

const FLOW_SURFACE_EXTRACTOR_TEST_DATE = '2026-06-04T00:00:00.000Z';
const FLOW_SURFACE_EXTRACTOR_FIXTURES_ROOT = join(__dirname, 'flow-surfaces-extractor-fixtures');
const FLOW_SURFACE_GANTT_PACKAGE_ROOT = join(__dirname, '../../../..', 'plugin-gantt');

type FlowSurfaceExtractorFixtureSource = {
  packageRoot: string;
  sourceFile: string;
  source: string;
};

async function readFlowSurfaceExtractorFixtureSource(
  fixtureName: string,
  entry = 'src/client-v2/index.ts',
): Promise<FlowSurfaceExtractorFixtureSource> {
  const packageRoot = join(FLOW_SURFACE_EXTRACTOR_FIXTURES_ROOT, fixtureName);
  const sourceFile = join(packageRoot, entry);
  return {
    packageRoot,
    sourceFile,
    source: await readFile(sourceFile, 'utf8'),
  };
}

describe('flowSurfaces extractor scaffold', () => {
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

  it('should make discovered blocks create-only and preserve static create options', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        class CustomBlockModel extends CollectionBlockModel {}

        flowEngine.registerModels({ CustomBlockModel });
        CustomBlockModel.define({
          label: tExpr('Custom block'),
          createModelOptions: {
            use: 'CustomBlockModel',
            props: {
              title: t('Custom title', { ns: 'demo' }),
              count: -2,
              enabled: true,
            },
            subModels: {
              item: {
                use: 'CustomItemModel',
              },
            },
          },
        });

        const menu = <AddSubModelButton key="custom" modelUse="CustomBlockModel" subModelKey="blocks" />;
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events,
    });
    const capabilities = collectAutoSnapshotPublicCapabilities({
      autoSnapshots: [snapshot],
      enabledPackages: new Set(['@nocobase/plugin-demo']),
    });
    const capability = capabilities.find((item) => item.publicType === 'pluginDemo.custom');

    expect(snapshot.models).toEqual([
      expect.objectContaining({
        modelUse: 'CustomBlockModel',
        modelBaseClass: 'CollectionBlockModel',
      }),
    ]);
    expect(snapshot.menuItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUse: 'CustomBlockModel',
          createModelOptions: {
            use: 'CustomBlockModel',
            props: {
              title: '{{t("Custom title", {"ns":"demo"})}}',
              count: -2,
              enabled: true,
            },
            subModels: {
              item: {
                use: 'CustomItemModel',
              },
            },
          },
        }),
      ]),
    );
    expect(snapshot.inferredAuthoring?.capabilities).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'pluginDemo.custom',
        acceptedAliases: ['custom'],
        modelUse: 'CustomBlockModel',
        placement: expect.objectContaining({
          collectionRequired: true,
        }),
        initParamsSchema: expect.objectContaining({
          required: ['collectionName'],
        }),
        settingsSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {},
        },
        createRecipe: expect.objectContaining({
          nodeTemplate: expect.objectContaining({
            use: 'CustomBlockModel',
            props: expect.objectContaining({
              title: '{{t("Custom title", {"ns":"demo"})}}',
            }),
          }),
        }),
      }),
    ]);
    expect(capability).toMatchObject({
      availability: {
        create: {
          supported: true,
          acceptsInitParams: true,
          acceptsSettings: false,
        },
      },
      supportLevel: 'create-only',
    });
    expect(capabilities.filter((item) => item.publicType === 'pluginDemo.custom')).toHaveLength(1);
  });

  it('should infer a minimal create recipe for a discovered block without static options', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'SimpleBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
    });

    expect(snapshot.inferredAuthoring?.capabilities).toEqual([
      expect.objectContaining({
        publicType: 'pluginDemo.simple',
        modelUse: 'SimpleBlockModel',
        createRecipe: expect.objectContaining({
          nodeTemplate: {
            use: 'SimpleBlockModel',
          },
        }),
      }),
    ]);
  });

  it('should not inspect referenced AST model loader function bodies', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        const loadDemoActionModel = () => {
          flowEngine.registerModels({
            HiddenLoaderBodyModel,
          });
          return import('./DemoActionModel');
        };
        function loadDemoBlockModel() {
          flowEngine.registerModels({
            HiddenFunctionLoaderBodyModel,
          });
          return import('./DemoBlockModel');
        }
        const loaders = {
          DemoActionModel: {
            loader: loadDemoActionModel,
          },
          DemoBlockModel: {
            loader: loadDemoBlockModel,
          },
        };

        class PluginDemoClient {
          async load() {
            this.flowEngine.registerModelLoaders(loaders);
          }
        }
      `,
    });

    expect(events).toEqual([
      expect.objectContaining({
        type: 'model.loaderRegistered',
        modelUse: 'DemoActionModel',
        loaderName: 'loadDemoActionModel',
      }),
      expect.objectContaining({
        type: 'model.loaderRegistered',
        modelUse: 'DemoBlockModel',
        loaderName: 'loadDemoBlockModel',
      }),
    ]);
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
          staticStatus: 'static',
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
            staticStatus: 'static',
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

  it('should mark non-literal AST flow expressions dynamic while accepting translation-only create options', () => {
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
          createModelOptionsStatus: 'static',
          createModelOptionsUse: 'GanttBlockModel',
        }),
      ]),
    );
  });

  it('should recover action placement evidence from subModelBaseClass and dynamic items menus', () => {
    const events = collectFlowSurfaceExtractorAstEvents({
      source: `
        const ALLOWED_GANTT_COLLECTION_ACTIONS = [
          'GanttTodayActionModel',
          'FilterActionModel',
        ];

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
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'allowed-action-00-gantt-today',
          modelUse: 'GanttTodayActionModel',
          slot: 'actions',
          createModelOptionsStatus: 'static',
        }),
        expect.objectContaining({
          type: 'menu.itemRegistered',
          menuKey: 'allowed-action-01-filter',
          modelUse: 'FilterActionModel',
          slot: 'actions',
          createModelOptionsStatus: 'static',
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

  it('should preserve structured AST and merged menu label evidence in snapshots', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
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

  it('should normalize extraction event logs into snapshot facts', () => {
    const recorder = createFlowSurfaceExtractionRecorder();

    recorder.recordModel({
      modelUse: 'DemoBlockModel',
      className: 'RuntimeDemoBlockModel',
      source: 'src/client-v2/plugin.tsx',
      confidence: 'medium',
    });
    recorder.recordModelLoader({
      modelUse: 'DemoBlockModel',
      loaderName: 'loadDemoBlock',
      source: 'src/client-v2/models/index.ts',
      evidenceSource: 'ast',
      confidence: 'high',
    });
    recorder.recordMenuItem({
      menuKey: 'demo',
      label: 'Demo',
      modelUse: 'DemoBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'src/client-v2/plugin.tsx',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'demo',
      label: '{{t("Demo block", {"defaultValue":"Demo block fallback"})}}',
      modelUse: 'DemoBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'dynamic',
      source: 'src/client-v2/models/DemoBlockModel.tsx',
      evidenceSource: 'ast',
      confidence: 'high',
    });
    recorder.recordFlow({
      modelUse: 'DemoBlockModel',
      flowKey: 'demoSettings',
      staticStatus: 'unresolved',
      source: 'src/client-v2/plugin.tsx',
      confidence: 'low',
    });
    recorder.recordFlow({
      modelUse: 'DemoBlockModel',
      flowKey: 'demoSettings',
      title: 'Demo settings',
      sort: 10,
      staticStatus: 'static',
      source: 'src/client-v2/models/DemoBlockModel.tsx',
      evidenceSource: 'ast',
      confidence: 'high',
    });
    recorder.recordFieldBinding({
      fieldInterface: 'demo',
      modelUse: 'DemoFieldModel',
      role: 'editable',
      source: 'src/client-v2/fields/demo.tsx',
      confidence: 'medium',
    });
    recorder.recordWarning({
      code: 'extractor-runtime-error',
      message: 'Runtime extraction failed; AST fallback used.',
    });
    recorder.recordWarning({
      code: 'extractor-runtime-error',
      message: 'Runtime extraction failed; AST fallback used.',
    });

    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: recorder.getEvents(),
      warnings: [
        {
          code: 'extractor-runtime-error',
          message: 'Runtime extraction failed; AST fallback used.',
        },
      ],
    });

    expect(recorder.getEvents().map((event) => event.type)).toEqual([
      'model.registered',
      'model.loaderRegistered',
      'menu.itemRegistered',
      'menu.itemRegistered',
      'model.flowRegistered',
      'model.flowRegistered',
      'field.bindingRegistered',
      'warning',
      'warning',
    ]);
    expect(snapshot.models).toEqual([
      expect.objectContaining({
        modelUse: 'DemoBlockModel',
        className: 'RuntimeDemoBlockModel',
        loaderName: 'loadDemoBlock',
        confidence: 'high',
        sourceRefs: expect.arrayContaining([
          expect.objectContaining({
            source: 'src/client-v2/plugin.tsx',
            evidenceSource: 'runtime',
          }),
          expect.objectContaining({
            source: 'src/client-v2/models/index.ts',
            evidenceSource: 'ast',
          }),
        ]),
      }),
    ]);
    expect(snapshot.menuItems).toEqual([
      expect.objectContaining({
        menuKey: 'demo',
        modelUse: 'DemoBlockModel',
        label: 'Demo',
        labelText: 'Demo',
        labelKey: 'Demo block',
        labelFallback: 'Demo block fallback',
        createModelOptionsStatus: 'dynamic',
        confidence: 'high',
        sourceRefs: expect.arrayContaining([
          expect.objectContaining({
            source: 'src/client-v2/plugin.tsx',
            evidenceSource: 'runtime',
          }),
          expect.objectContaining({
            source: 'src/client-v2/models/DemoBlockModel.tsx',
            evidenceSource: 'ast',
          }),
        ]),
      }),
    ]);
    expect(snapshot.flows).toEqual([
      expect.objectContaining({
        modelUse: 'DemoBlockModel',
        flowKey: 'demoSettings',
        title: 'Demo settings',
        sort: 10,
        staticStatus: 'static',
        confidence: 'high',
        sourceRefs: expect.arrayContaining([
          expect.objectContaining({
            source: 'src/client-v2/plugin.tsx',
            evidenceSource: 'runtime',
          }),
          expect.objectContaining({
            source: 'src/client-v2/models/DemoBlockModel.tsx',
            evidenceSource: 'ast',
          }),
        ]),
      }),
    ]);
    expect(snapshot.fieldBindings).toEqual([
      expect.objectContaining({
        fieldInterface: 'demo',
        modelUse: 'DemoFieldModel',
        role: 'editable',
      }),
    ]);
    expect(snapshot.warnings).toEqual([
      {
        code: 'extractor-runtime-error',
        message: 'Runtime extraction failed; AST fallback used.',
      },
    ]);
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
      createModelOptionsUse: 'GanttBlockModel',
      createModelOptionsSubModels: {
        actions: [],
        columns: ['TableActionsColumnModel'],
      },
      source: 'runtime',
      confidence: 'medium',
    });
    runtimeRecorder.recordModel({
      modelUse: 'GanttCollectionActionGroupModel',
      className: 'GanttCollectionActionGroupModel',
      source: 'runtime',
      confidence: 'medium',
    });
    const ganttAllowedActionModelUses = [
      'GanttExpandCollapseActionModel',
      'GanttTodayActionModel',
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
      'PopupCollectionActionModel',
      'LinkActionModel',
      'BulkEditActionModel',
      'BulkUpdateActionModel',
      'ExportActionModel',
      'ImportActionModel',
      'CollectionTriggerWorkflowActionModel',
      'CustomRequestActionModel',
      'AIEmployeeActionModel',
      'JSItemActionModel',
      'JSCollectionActionModel',
    ];
    ganttAllowedActionModelUses.forEach((actionModelUse, index) => {
      runtimeRecorder.recordMenuItem({
        menuKey: `allowed-action-${String(index).padStart(2, '0')}`,
        modelUse: actionModelUse,
        slot: 'actions',
        createModelOptionsStatus: 'static',
        createModelOptionsUse: actionModelUse,
        source: 'runtime',
        confidence: 'medium',
      });
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

    expect(snapshot.models).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUse: 'GanttBlockModel',
          confidence: 'high',
        }),
        expect.objectContaining({
          modelUse: 'GanttCollectionActionGroupModel',
          confidence: 'medium',
        }),
      ]),
    );
    expect(snapshot.flows).toMatchObject([
      {
        modelUse: 'GanttBlockModel',
        flowKey: 'ganttSettings',
        staticStatus: 'static',
      },
    ]);
    expect(snapshot.inferredAuthoring?.capabilities).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'gantt',
        acceptedAliases: expect.arrayContaining(['pluginGantt.gantt', 'ganttBlock']),
        ownerPlugin: '@nocobase/plugin-gantt',
        modelUse: 'GanttBlockModel',
        confidence: {
          discovery: 'high',
          placement: 'high',
          tree: 'high',
          settings: 'high',
          write: 'high',
        },
        createRecipe: expect.objectContaining({
          nodeTemplate: expect.objectContaining({
            use: 'GanttBlockModel',
            subModels: expect.objectContaining({
              actions: expect.arrayContaining([
                expect.objectContaining({
                  use: 'FilterActionModel',
                }),
                expect.objectContaining({
                  use: 'GanttTodayActionModel',
                }),
                expect.objectContaining({
                  use: 'RefreshActionModel',
                }),
                expect.objectContaining({
                  use: 'AddNewActionModel',
                }),
              ]),
              columns: expect.arrayContaining([
                expect.objectContaining({
                  use: 'TableColumnModel',
                }),
                expect.objectContaining({
                  use: 'TableActionsColumnModel',
                  subModels: {
                    actions: expect.arrayContaining([
                      expect.objectContaining({
                        use: 'ViewActionModel',
                        props: expect.objectContaining({
                          type: 'link',
                          icon: null,
                        }),
                        stepParams: expect.objectContaining({
                          buttonSettings: expect.objectContaining({
                            general: expect.objectContaining({
                              type: 'link',
                              icon: null,
                            }),
                          }),
                        }),
                      }),
                      expect.objectContaining({
                        use: 'EditActionModel',
                        props: expect.objectContaining({
                          type: 'link',
                          icon: null,
                        }),
                        stepParams: expect.objectContaining({
                          buttonSettings: expect.objectContaining({
                            general: expect.objectContaining({
                              type: 'link',
                              icon: null,
                            }),
                          }),
                        }),
                      }),
                      expect.objectContaining({
                        use: 'DeleteActionModel',
                        props: expect.objectContaining({
                          type: 'link',
                          icon: null,
                        }),
                        stepParams: expect.objectContaining({
                          buttonSettings: expect.objectContaining({
                            general: expect.objectContaining({
                              type: 'link',
                              icon: null,
                            }),
                          }),
                        }),
                      }),
                    ]),
                  },
                }),
              ]),
            }),
          }),
        }),
        popupHosts: expect.arrayContaining([
          expect.objectContaining({
            modelUse: 'AddNewActionModel',
            defaultType: 'addNew',
          }),
          expect.objectContaining({
            modelUse: 'ViewActionModel',
            defaultType: 'view',
          }),
          expect.objectContaining({
            modelUse: 'EditActionModel',
            defaultType: 'edit',
          }),
        ]),
        childSurfaces: expect.arrayContaining([
          expect.objectContaining({
            subModelKey: 'actions',
            kind: 'action',
          }),
          expect.objectContaining({
            subModelKey: 'columns',
            kind: 'fieldComponent',
            allowedChildren: ['TableColumnModel'],
          }),
        ]),
        allowedChildren: expect.arrayContaining([
          expect.objectContaining({
            modelUse: 'GanttTodayActionModel',
          }),
          expect.objectContaining({
            modelUse: 'GanttExpandCollapseActionModel',
          }),
          expect.objectContaining({
            modelUse: 'FilterActionModel',
          }),
          expect.objectContaining({
            modelUse: 'AddNewActionModel',
          }),
          expect.objectContaining({
            modelUse: 'PopupCollectionActionModel',
          }),
          expect.objectContaining({
            modelUse: 'RefreshActionModel',
          }),
        ]),
      }),
    ]);
    expect(snapshot.inferredAuthoring?.capabilities[0].childSurfaces?.[0].allowedChildren).toEqual(
      ganttAllowedActionModelUses,
    );
    expect(
      snapshot.inferredAuthoring?.capabilities[0].createRecipe?.nodeTemplate?.subModels?.actions?.map(
        (action: any) => action?.use,
      ),
    ).toEqual([
      'FilterActionModel',
      'GanttTodayActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
    ]);
    expect(
      snapshot.inferredAuthoring?.capabilities[0].allowedChildren
        ?.filter((item) => item.kind === 'action')
        .map((item) => item.modelUse),
    ).toEqual([...ganttAllowedActionModelUses, 'ViewActionModel', 'EditActionModel', 'DeleteActionModel']);
    expect(snapshot.inferredAuthoring?.capabilities[0].allowedChildren).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'fieldComponent',
          modelUse: 'TableColumnModel',
          builderContainerUse: 'TableBlockModel',
        }),
      ]),
    );
    expect(candidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          confidence: 'high',
          warnings: expect.arrayContaining([
            expect.objectContaining({
              code: 'auto-discovered-readonly',
            }),
          ]),
        }),
        expect.objectContaining({
          kind: 'action',
          publicType: 'pluginGantt.filter',
          modelUse: 'FilterActionModel',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          confidence: 'medium',
          warnings: expect.arrayContaining([
            expect.objectContaining({
              code: 'auto-discovered-readonly',
            }),
          ]),
        }),
      ]),
    );
  });

  it('should keep generic Gantt create support until the specialized contract is available', () => {
    const baseEvents: FlowSurfaceExtractionEvent[] = [
      {
        type: 'model.registered',
        modelUse: 'GanttBlockModel',
        className: 'GanttBlockModel',
        source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
        evidenceSource: 'runtime',
        confidence: 'high',
      },
      {
        type: 'model.flowRegistered',
        modelUse: 'GanttBlockModel',
        flowKey: 'ganttSettings',
        title: 'Gantt settings',
        staticStatus: 'static',
        source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
        evidenceSource: 'ast',
        confidence: 'medium',
      },
    ];
    const ganttAllowedActionModelUses = [
      'GanttExpandCollapseActionModel',
      'GanttTodayActionModel',
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
      'PopupCollectionActionModel',
    ];
    const fullEvidenceEvents: FlowSurfaceExtractionEvent[] = [
      {
        type: 'model.registered',
        modelUse: 'GanttCollectionActionGroupModel',
        className: 'GanttCollectionActionGroupModel',
        source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/actions/GanttActionModels.tsx',
        evidenceSource: 'ast',
        confidence: 'medium',
      },
      ...ganttAllowedActionModelUses.map((actionModelUse, index) => ({
        type: 'menu.itemRegistered' as const,
        menuKey: `allowed-action-${String(index).padStart(2, '0')}`,
        modelUse: actionModelUse,
        slot: 'actions',
        createModelOptionsStatus: 'static' as const,
        createModelOptionsUse: actionModelUse,
        source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/actions/GanttActionModels.tsx',
        evidenceSource: 'ast' as const,
        confidence: 'medium' as const,
      })),
    ];
    const buildSnapshot = (menuEvent: FlowSurfaceExtractionEvent, extraEvents: FlowSurfaceExtractionEvent[] = []) =>
      buildFlowSurfaceAutoSnapshot({
        plugin: '@nocobase/plugin-gantt',
        generatedAt: '2026-06-04T00:00:00.000Z',
        sourceHash: 'source-hash',
        extractorVersion: 'test',
        events: [...baseEvents, menuEvent, ...extraEvents],
      });

    const expectGenericFallback = (menuEvent: FlowSurfaceExtractionEvent) =>
      expect(buildSnapshot(menuEvent).inferredAuthoring?.capabilities[0]).toMatchObject({
        publicType: 'pluginGantt.gantt',
        confidence: {
          tree: 'high',
          write: 'high',
        },
        createRecipe: {
          nodeTemplate: {
            use: 'GanttBlockModel',
          },
        },
      });

    expectGenericFallback({
      type: 'menu.itemRegistered',
      menuKey: 'gantt',
      label: 'Gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'dynamic',
      createModelOptionsUse: 'GanttBlockModel',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
      evidenceSource: 'ast',
      confidence: 'medium',
    });
    expectGenericFallback({
      type: 'menu.itemRegistered',
      menuKey: 'gantt',
      label: 'Gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
      evidenceSource: 'ast',
      confidence: 'medium',
    });
    expectGenericFallback({
      type: 'menu.itemRegistered',
      menuKey: 'gantt',
      label: 'Gantt',
      modelUse: 'GanttBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      createModelOptionsUse: 'TableBlockModel',
      source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
      evidenceSource: 'ast',
      confidence: 'medium',
    });
    expect(
      buildSnapshot({
        type: 'menu.itemRegistered',
        menuKey: 'gantt',
        label: 'Gantt',
        modelUse: 'GanttBlockModel',
        slot: 'blocks',
        createModelOptionsStatus: 'static',
        createModelOptionsUse: 'GanttBlockModel',
        source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
        evidenceSource: 'ast',
        confidence: 'medium',
      }).inferredAuthoring?.capabilities[0],
    ).toMatchObject({
      publicType: 'gantt',
      confidence: {
        tree: 'medium',
        write: 'medium',
      },
      warnings: [
        expect.objectContaining({
          code: 'contract-not-verified',
        }),
      ],
    });
    expect(
      buildSnapshot(
        {
          type: 'menu.itemRegistered',
          menuKey: 'gantt',
          label: 'Gantt',
          modelUse: 'GanttBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          createModelOptionsUse: 'GanttBlockModel',
          createModelOptionsSubModels: {
            actions: [],
            columns: ['TableActionsColumnModel'],
          },
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
        fullEvidenceEvents,
      ).inferredAuthoring?.capabilities[0],
    ).toMatchObject({
      publicType: 'gantt',
      confidence: {
        tree: 'high',
        write: 'high',
      },
    });
    expect(
      buildSnapshot(
        {
          type: 'menu.itemRegistered',
          menuKey: 'gantt',
          label: 'Gantt',
          modelUse: 'GanttBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          createModelOptionsUse: 'GanttBlockModel',
          createModelOptionsSubModels: {
            actions: [],
            columns: ['TableActionsColumnModel'],
          },
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
        fullEvidenceEvents.filter(
          (event) => event.type !== 'menu.itemRegistered' || event.modelUse !== 'RefreshActionModel',
        ),
      ).inferredAuthoring?.capabilities[0],
    ).toMatchObject({
      publicType: 'gantt',
      confidence: {
        tree: 'medium',
        write: 'medium',
      },
      warnings: [
        expect.objectContaining({
          code: 'contract-not-verified',
        }),
      ],
    });
  });

  it('should derive auto candidates from block, action, field binding, and diagnostic evidence', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordMenuItem({
      menuKey: 'simple',
      label: 'Simple block',
      modelUse: 'SimpleBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'download',
      label: 'Download',
      modelUse: 'DownloadButtonModel',
      slot: 'recordActions',
      createModelOptionsStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordFlow({
      modelUse: 'ToolbarActionGroupModel',
      flowKey: 'toolbarActions',
      title: 'Toolbar actions',
      staticStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordFieldBinding({
      fieldInterface: 'email',
      modelUse: 'EmailFieldModel',
      role: 'editable',
      source: 'runtime',
      confidence: 'high',
    });
    recorder.recordModel({
      modelUse: 'LonelyBlockModel',
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

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          modelUse: 'SimpleBlockModel',
          publicType: 'pluginDemo.simple',
          evidence: [
            {
              type: 'menuItem',
              ref: 'simple',
            },
          ],
        }),
        expect.objectContaining({
          kind: 'action',
          modelUse: 'DownloadButtonModel',
          publicType: 'pluginDemo.downloadButton',
          evidence: [
            {
              type: 'menuItem',
              ref: 'download',
            },
          ],
        }),
        expect.objectContaining({
          kind: 'action',
          modelUse: 'ToolbarActionGroupModel',
          publicType: 'pluginDemo.toolbarActionGroup',
          evidence: [
            {
              type: 'flow',
              ref: 'toolbarActions',
            },
          ],
        }),
        expect.objectContaining({
          kind: 'fieldBinding',
          modelUse: 'EmailFieldModel',
          publicType: 'pluginDemo.email',
          confidence: 'high',
          evidence: [
            {
              type: 'fieldBinding',
              ref: 'email',
            },
          ],
        }),
        expect.objectContaining({
          kind: 'block',
          modelUse: 'LonelyBlockModel',
          confidence: 'low',
          evidence: [
            {
              type: 'model',
              ref: 'LonelyBlockModel',
            },
          ],
        }),
      ]),
    );
  });

  it('should require static placement evidence before raising auto candidate confidence', () => {
    const recorder = createFlowSurfaceExtractionRecorder();
    recorder.recordModel({
      modelUse: 'HighBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'high',
      modelUse: 'HighBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'MediumBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'medium',
      modelUse: 'MediumBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'static',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'DynamicBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordMenuItem({
      menuKey: 'dynamic',
      modelUse: 'DynamicBlockModel',
      slot: 'blocks',
      createModelOptionsStatus: 'dynamic',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordFlow({
      modelUse: 'DynamicBlockModel',
      flowKey: 'dynamicSettings',
      staticStatus: 'dynamic',
      source: 'runtime',
      confidence: 'medium',
    });
    recorder.recordModel({
      modelUse: 'LowBlockModel',
      source: 'runtime',
      confidence: 'medium',
    });
    const astEvents = collectFlowSurfaceExtractorAstEvents({
      sourceFile: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
      source: `
        this.flowEngine.registerModels({ HighBlockModel, DynamicBlockModel });
      `,
    });
    const snapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [...recorder.getEvents(), ...astEvents],
    });

    expect(deriveFlowSurfaceAutoCapabilityCandidates(snapshot)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUse: 'HighBlockModel',
          confidence: 'high',
        }),
        expect.objectContaining({
          modelUse: 'MediumBlockModel',
          confidence: 'medium',
        }),
        expect.objectContaining({
          modelUse: 'DynamicBlockModel',
          confidence: 'low',
          evidence: expect.arrayContaining([
            {
              type: 'menuItem',
              ref: 'dynamic',
            },
            {
              type: 'flow',
              ref: 'dynamicSettings',
            },
          ]),
        }),
        expect.objectContaining({
          modelUse: 'LowBlockModel',
          confidence: 'low',
        }),
      ]),
    );
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
        confidence: 'low',
        evidence: [
          {
            type: 'model',
            ref: 'GanttCollectionActionGroupModel',
          },
        ],
        warnings: [
          {
            code: 'auto-discovered-readonly',
            message:
              'Auto snapshot discovery is read-only until a manifest or provider declares an authoring contract.',
          },
        ],
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
      createModelOptionsStatus: 'static',
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

  it('should write snapshots and include result metadata for CLI extraction', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-cli-write-'));
    try {
      const summary = await runFlowSurfaceExtractorCli(
        [
          {
            plugin: '@example/plugin-cli',
          },
        ],
        {
          outDir,
          extractPlugin: async (target) => {
            const snapshot = buildFlowSurfaceAutoSnapshot({
              plugin: target.plugin,
              generatedAt: '2026-06-04T00:00:00.000Z',
              sourceHash: 'source-hash',
              extractorVersion: 'test',
              events: [
                {
                  type: 'model.registered',
                  modelUse: 'CliBlockModel',
                  source: 'src/client-v2/index.ts',
                  evidenceSource: 'ast',
                  confidence: 'medium',
                },
                {
                  type: 'menu.itemRegistered',
                  labelText: 'CLI block',
                  modelUse: 'CliBlockModel',
                  slot: 'blocks',
                  createModelOptionsStatus: 'static',
                  source: 'src/client-v2/index.ts',
                  evidenceSource: 'ast',
                  confidence: 'medium',
                },
              ],
            });
            return {
              snapshot,
              eventCount: 2,
              candidateCount: deriveFlowSurfaceAutoCapabilityCandidates(snapshot).length,
              warningCount: snapshot.warnings.length,
            };
          },
        },
      );

      expect(summary).toMatchObject({
        ok: true,
        dryRun: false,
        exitCode: 0,
        results: [
          {
            ok: true,
            plugin: '@example/plugin-cli',
            eventCount: 2,
            candidateCount: 1,
            warningCount: 0,
          },
        ],
      });
      expect(summary.results[0].snapshotPath).toBe(
        join(await realpath(outDir), getFlowSurfaceAutoSnapshotFileName('@example/plugin-cli')),
      );
      expect(JSON.parse(await readFile(summary.results[0].snapshotPath || '', 'utf8'))).toMatchObject({
        plugin: '@example/plugin-cli',
        models: [expect.objectContaining({ modelUse: 'CliBlockModel' })],
      });
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should skip snapshot writes in dry-run CLI mode', async () => {
    const tempRoot = await realpath(tmpdir());
    const outDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-cli-dry-'));
    try {
      const summary = await runFlowSurfaceExtractorCli(
        [
          {
            plugin: '@example/plugin-dry-run',
          },
        ],
        {
          dryRun: true,
          outDir,
          extractPlugin: async (target) => ({
            snapshot: buildFlowSurfaceAutoSnapshot({
              plugin: target.plugin,
              generatedAt: '2026-06-04T00:00:00.000Z',
              sourceHash: 'source-hash',
              extractorVersion: 'test',
              events: [],
            }),
            eventCount: 0,
            candidateCount: 0,
            warningCount: 0,
          }),
        },
      );

      expect(summary.results[0]).not.toHaveProperty('snapshotPath');
      expect(summary).toMatchObject({
        ok: true,
        dryRun: true,
        exitCode: 0,
      });
      expect(await readdir(outDir)).toEqual([]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it('should preserve extraction metadata and explain snapshot write failures in CLI output', async () => {
    const tempRoot = await realpath(tmpdir());
    const tempDir = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-cli-write-fail-'));
    const blockedOutDir = join(tempDir, 'not-a-directory');
    try {
      await writeFile(blockedOutDir, 'not a directory\n', 'utf8');

      const summary = await runFlowSurfaceExtractorCli(
        [
          {
            plugin: '@example/plugin-write-fail',
          },
        ],
        {
          outDir: blockedOutDir,
          extractPlugin: async (target) => {
            const snapshot = buildFlowSurfaceAutoSnapshot({
              plugin: target.plugin,
              generatedAt: '2026-06-04T00:00:00.000Z',
              sourceHash: 'source-hash',
              extractorVersion: 'test',
              events: [
                {
                  type: 'model.registered',
                  modelUse: 'WriteFailureBlockModel',
                  source: 'src/client-v2/index.ts',
                  evidenceSource: 'ast',
                  confidence: 'medium',
                },
                {
                  type: 'menu.itemRegistered',
                  labelText: 'Write failure block',
                  modelUse: 'WriteFailureBlockModel',
                  slot: 'blocks',
                  createModelOptionsStatus: 'static',
                  source: 'src/client-v2/index.ts',
                  evidenceSource: 'ast',
                  confidence: 'medium',
                },
              ],
            });
            return {
              snapshot,
              eventCount: 2,
              candidateCount: deriveFlowSurfaceAutoCapabilityCandidates(snapshot).length,
              warningCount: snapshot.warnings.length,
            };
          },
        },
      );
      const textOutput = formatFlowSurfaceExtractorCliSummary(summary);
      const [writeError] = summary.results[0].errors || [];

      expect(summary).toMatchObject({
        ok: false,
        exitCode: 1,
        results: [
          {
            ok: false,
            plugin: '@example/plugin-write-fail',
            eventCount: 2,
            candidateCount: 1,
            warningCount: 0,
          },
        ],
      });
      expect(summary.results[0]).not.toHaveProperty('snapshotPath');
      expect(writeError?.message).toBeTruthy();
      expect(textOutput).toContain(`${writeError?.code}: ${writeError?.message.replace(/\s+/g, ' ').trim()}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('should fail CLI summaries on warnings when requested', async () => {
    const summary = await runFlowSurfaceExtractorCli(
      [
        {
          plugin: '@example/plugin-warning',
        },
      ],
      {
        dryRun: true,
        failOnWarning: true,
        extractPlugin: async (target) => {
          const snapshot = buildFlowSurfaceAutoSnapshot({
            plugin: target.plugin,
            generatedAt: '2026-06-04T00:00:00.000Z',
            sourceHash: 'source-hash',
            extractorVersion: 'test',
            events: [],
            warnings: [
              {
                code: 'extractor-runtime-error',
                message: 'Runtime extraction failed; AST fallback used.',
              },
            ],
          });
          return {
            snapshot,
            eventCount: 0,
            candidateCount: 0,
            warningCount: snapshot.warnings.length,
          };
        },
      },
    );
    const parsedJson = JSON.parse(formatFlowSurfaceExtractorCliSummary(summary, { json: true }));

    expect(summary).toMatchObject({
      ok: false,
      exitCode: 1,
      results: [
        {
          ok: false,
          plugin: '@example/plugin-warning',
          warningCount: 1,
          errors: [
            {
              code: 'extractor-warning',
              message: 'Extractor produced 1 warning(s).',
            },
          ],
        },
      ],
    });
    expect(parsedJson.results[0].plugin).toBe('@example/plugin-warning');
  });

  it('should continue CLI batches after one plugin fails', async () => {
    const visited: string[] = [];
    const summary = await runFlowSurfaceExtractorCli(
      [{ plugin: '@example/plugin-ok-a' }, { plugin: '@example/plugin-broken' }, { plugin: '@example/plugin-ok-b' }],
      {
        dryRun: true,
        extractPlugin: async (target) => {
          visited.push(target.plugin);
          if (target.plugin === '@example/plugin-broken') {
            throw Object.assign(new Error('Fixture extractor failed.'), {
              code: 'fixture-extractor-error',
            });
          }
          return {
            snapshot: buildFlowSurfaceAutoSnapshot({
              plugin: target.plugin,
              generatedAt: '2026-06-04T00:00:00.000Z',
              sourceHash: 'source-hash',
              extractorVersion: 'test',
              events: [],
            }),
            eventCount: 0,
            candidateCount: 0,
            warningCount: 0,
          };
        },
      },
    );

    expect(visited).toEqual(['@example/plugin-ok-a', '@example/plugin-broken', '@example/plugin-ok-b']);
    expect(summary).toMatchObject({
      ok: false,
      exitCode: 1,
      results: [
        { ok: true, plugin: '@example/plugin-ok-a' },
        {
          ok: false,
          plugin: '@example/plugin-broken',
          errors: [
            {
              code: 'fixture-extractor-error',
              message: 'Fixture extractor failed.',
            },
          ],
        },
        { ok: true, plugin: '@example/plugin-ok-b' },
      ],
    });
  });

  it('should resolve all enabled plugin CLI targets and continue after failures', async () => {
    const findEnabledPlugins = vi.fn(async () => [
      { packageName: '@example/plugin-ok-a' },
      {
        get: (field: string) => (field === 'packageName' ? '@example/plugin-broken' : undefined),
      },
      { packageName: '@example/plugin-ok-a' },
      { packageName: '  ' },
    ]);
    const app = {
      loaded: false,
      load: vi.fn(async () => undefined),
      pm: {
        repository: {
          find: findEnabledPlugins,
        },
      },
    } as unknown as Parameters<typeof runFlowSurfaceExtractorCommand>[0];
    const visited: string[] = [];

    const summary = await runFlowSurfaceExtractorCommand(
      app,
      {
        allEnabled: true,
        dryRun: true,
      },
      {
        extractPlugin: async (target) => {
          visited.push(target.plugin);
          if (target.plugin === '@example/plugin-broken') {
            throw Object.assign(new Error('Enabled plugin extraction failed.'), {
              code: 'enabled-plugin-extractor-error',
            });
          }
          const snapshot = buildFlowSurfaceAutoSnapshot({
            plugin: target.plugin,
            generatedAt: '2026-06-04T00:00:00.000Z',
            sourceHash: 'source-hash',
            extractorVersion: 'test',
            events: [],
          });
          return {
            snapshot,
            eventCount: 0,
            candidateCount: 0,
            warningCount: 0,
          };
        },
      },
    );

    expect(app.load).toHaveBeenCalledTimes(1);
    expect(findEnabledPlugins).toHaveBeenCalledWith({
      fields: ['packageName'],
      filter: {
        enabled: true,
      },
    });
    expect(visited).toEqual(['@example/plugin-ok-a', '@example/plugin-broken']);
    expect(summary).toMatchObject({
      ok: false,
      dryRun: true,
      exitCode: 1,
      results: [
        { ok: true, plugin: '@example/plugin-ok-a' },
        {
          ok: false,
          plugin: '@example/plugin-broken',
          errors: [
            {
              code: 'enabled-plugin-extractor-error',
              message: 'Enabled plugin extraction failed.',
            },
          ],
        },
      ],
    });
  });

  it('should keep single-plugin CLI extraction independent from app preload', async () => {
    const app = {
      loaded: false,
      load: vi.fn(async () => {
        throw new Error('single plugin extraction should not load the app');
      }),
    } as unknown as Parameters<typeof runFlowSurfaceExtractorCommand>[0];

    const summary = await runFlowSurfaceExtractorCommand(
      app,
      {
        plugin: '@nocobase/plugin-gantt',
        dryRun: true,
        json: true,
      },
      {
        extractPlugin: async (target) => {
          const snapshot = buildFlowSurfaceAutoSnapshot({
            plugin: target.plugin,
            generatedAt: '2026-06-04T00:00:00.000Z',
            sourceHash: 'source-hash',
            extractorVersion: 'test',
            events: [],
          });
          return {
            snapshot,
            eventCount: 0,
            candidateCount: 0,
            warningCount: 0,
          };
        },
      },
    );
    const parsedJson = JSON.parse(formatFlowSurfaceExtractorCliSummary(summary, { json: true }));

    expect(app.load).not.toHaveBeenCalled();
    expect(parsedJson).toMatchObject({
      ok: true,
      dryRun: true,
      exitCode: 0,
      results: [
        {
          ok: true,
          plugin: '@nocobase/plugin-gantt',
        },
      ],
    });
  });

  it('should keep all-enabled JSON output parseable when loading the app emits stdout', async () => {
    const originalWrite = process.stdout.write;
    let stdout = '';
    process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
      const [chunk] = args;
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        stdout += chunk.toString();
      }
      const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
      maybeCallback?.();
      return true;
    }) as typeof process.stdout.write;

    try {
      const app = {
        loaded: false,
        load: vi.fn(async () => {
          process.stdout.write('bootstrap noise before json\n');
        }),
        pm: {
          repository: {
            find: vi.fn(async () => [{ packageName: '@example/plugin-json-a' }]),
          },
        },
      } as unknown as Parameters<typeof runFlowSurfaceExtractorCommand>[0];

      const summary = await runFlowSurfaceExtractorCommand(
        app,
        {
          allEnabled: true,
          dryRun: true,
          json: true,
        },
        {
          extractPlugin: async (target) => {
            const snapshot = buildFlowSurfaceAutoSnapshot({
              plugin: target.plugin,
              generatedAt: '2026-06-04T00:00:00.000Z',
              sourceHash: 'source-hash',
              extractorVersion: 'test',
              events: [],
            });
            return {
              snapshot,
              eventCount: 0,
              candidateCount: 0,
              warningCount: 0,
            };
          },
        },
      );
      process.stdout.write(formatFlowSurfaceExtractorCliSummary(summary, { json: true }));

      expect(app.load).toHaveBeenCalledTimes(1);
      expect(stdout).not.toContain('bootstrap noise before json');
      expect(JSON.parse(stdout)).toMatchObject({
        ok: true,
        dryRun: true,
        exitCode: 0,
        results: [
          {
            ok: true,
            plugin: '@example/plugin-json-a',
          },
        ],
      });
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  it('should restore stdout suppression when all-enabled preload fails', async () => {
    const originalWrite = process.stdout.write;
    let stdout = '';
    process.stdout.write = ((...args: Parameters<typeof process.stdout.write>) => {
      const [chunk] = args;
      if (typeof chunk === 'string' || Buffer.isBuffer(chunk)) {
        stdout += chunk.toString();
      }
      const maybeCallback = args.find((arg): arg is (error?: Error | null) => void => typeof arg === 'function');
      maybeCallback?.();
      return true;
    }) as typeof process.stdout.write;

    try {
      const app = {
        loaded: false,
        load: vi.fn(async () => {
          process.stdout.write('bootstrap noise before failure\n');
          throw new Error('preload failed');
        }),
        pm: {
          repository: {
            find: vi.fn(async () => [{ packageName: '@example/plugin-json-a' }]),
          },
        },
      } as unknown as Parameters<typeof runFlowSurfaceExtractorCommand>[0];

      const summary = await runFlowSurfaceExtractorCommand(app, {
        allEnabled: true,
        dryRun: true,
        json: true,
      });
      process.stdout.write(formatFlowSurfaceExtractorCliSummary(summary, { json: true }));

      expect(app.load).toHaveBeenCalledTimes(1);
      expect(stdout).not.toContain('bootstrap noise before failure');
      expect(JSON.parse(stdout)).toMatchObject({
        ok: false,
        dryRun: true,
        exitCode: 1,
        results: [
          {
            ok: false,
            plugin: '--all-enabled',
            errors: [
              {
                message: 'preload failed',
              },
            ],
          },
        ],
      });
    } finally {
      process.stdout.write = originalWrite;
    }
  });

  it('should register the extractor CLI command without unconditional preload', () => {
    const extractCommand = {
      action: vi.fn(() => extractCommand),
      option: vi.fn(() => extractCommand),
      preload: vi.fn(() => extractCommand),
    };
    const flowSurfacesCommand = {
      command: vi.fn(() => extractCommand),
    };
    const app = {
      command: vi.fn(() => flowSurfacesCommand),
      findCommand: vi.fn(() => flowSurfacesCommand),
    } as unknown as Parameters<typeof registerFlowSurfaceExtractorCommand>[0];

    registerFlowSurfaceExtractorCommand(app);

    expect(app.findCommand).toHaveBeenCalledWith('flow-surfaces');
    expect(app.command).not.toHaveBeenCalled();
    expect(flowSurfacesCommand.command).toHaveBeenCalledWith('extract-capabilities');
    expect(extractCommand.preload).not.toHaveBeenCalled();
    expect(extractCommand.option).toHaveBeenCalledWith('--all-enabled', 'extract every enabled plugin package');
    expect(extractCommand.action).toHaveBeenCalled();
  });

  it('should extract client-v2 AST facts for CLI plugin targets', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-cli-target-'));
    const entry = join(packageRoot, 'src/client-v2/index.ts');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await writeFile(
        join(packageRoot, 'package.json'),
        JSON.stringify(
          {
            name: '@example/plugin-cli-target',
            version: '1.2.3',
          },
          null,
          2,
        ),
        'utf8',
      );
      await writeFile(
        entry,
        `
          class CliBlockModel {}
          flowEngine.registerModels({ CliBlockModel });
          CliBlockModel.define({
            label: 'CLI block',
            createModelOptions: {
              use: 'CliBlockModel',
            },
          });
        `,
        'utf8',
      );

      const extraction = await extractFlowSurfacePluginCapabilities(
        {
          plugin: '@example/plugin-cli-target',
          packageRoot,
        },
        {
          generatedAt: '2026-06-04T00:00:00.000Z',
          extractorVersion: 'test',
        },
      );

      expect(extraction).toMatchObject({
        eventCount: 2,
        candidateCount: 1,
        warningCount: 0,
        snapshot: {
          plugin: '@example/plugin-cli-target',
          pluginVersion: '1.2.3',
          resolvedEntry: 'src/client-v2/index.ts',
          models: [expect.objectContaining({ modelUse: 'CliBlockModel' })],
          menuItems: [expect.objectContaining({ modelUse: 'CliBlockModel', labelText: 'CLI block' })],
        },
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should extract import-dependent CLI targets through AST without runtime warnings', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-extractor-cli-imports-'));
    const entry = join(packageRoot, 'src/client-v2/index.ts');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@example/plugin-cli-imports"}\n', 'utf8');
      await writeFile(
        entry,
        `
          import { tExpr } from '@nocobase/flow-engine';

          class ImportedBlockModel {}
          flowEngine.registerModels({ ImportedBlockModel });
          ImportedBlockModel.define({
            label: tExpr('Imported block'),
            createModelOptions: {
              use: 'ImportedBlockModel',
            },
          });
        `,
        'utf8',
      );

      const extraction = await extractFlowSurfacePluginCapabilities(
        {
          plugin: '@example/plugin-cli-imports',
          packageRoot,
        },
        {
          generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
          extractorVersion: 'test',
        },
      );

      expect(extraction).toMatchObject({
        eventCount: 2,
        candidateCount: 1,
        warningCount: 0,
        snapshot: {
          models: [expect.objectContaining({ modelUse: 'ImportedBlockModel' })],
          menuItems: [expect.objectContaining({ modelUse: 'ImportedBlockModel', label: 'Imported block' })],
        },
      });
    } finally {
      await rm(packageRoot, { recursive: true, force: true });
    }
  });

  it('should extract the real Gantt client-v2 snapshot as JSON inferred authoring discovery', async () => {
    const globalObject = globalThis as typeof globalThis & Record<TemporaryFlowSurfaceBrowserGlobalKey, unknown>;
    const originalDescriptors = new Map<TemporaryFlowSurfaceBrowserGlobalKey, PropertyDescriptor | undefined>();
    const accessedGlobals: string[] = [];
    const keys: TemporaryFlowSurfaceBrowserGlobalKey[] = ['fetch', 'localStorage', 'window'];
    keys.forEach((key) => {
      originalDescriptors.set(key, Object.getOwnPropertyDescriptor(globalObject, key));
    });
    Object.defineProperty(globalObject, 'fetch', {
      configurable: true,
      value: () => {
        accessedGlobals.push('fetch');
        throw new Error('fetch should not execute during AST extraction');
      },
    });
    Object.defineProperty(globalObject, 'localStorage', {
      configurable: true,
      value: {
        getItem() {
          accessedGlobals.push('localStorage.getItem');
          throw new Error('localStorage should not execute during AST extraction');
        },
      },
    });
    Object.defineProperty(globalObject, 'window', {
      configurable: true,
      get() {
        accessedGlobals.push('window');
        throw new Error('window should not execute during AST extraction');
      },
    });

    try {
      const extraction = await extractFlowSurfacePluginCapabilities(
        {
          plugin: '@nocobase/plugin-gantt',
          packageRoot: FLOW_SURFACE_GANTT_PACKAGE_ROOT,
        },
        {
          generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
          extractorVersion: 'test',
        },
      );
      const { snapshot } = extraction;
      const modelUses = snapshot.models.map((model) => model.modelUse);
      const ganttAllowedActionModelUses = [
        'GanttExpandCollapseActionModel',
        'GanttTodayActionModel',
        'FilterActionModel',
        'AddNewActionModel',
        'PopupCollectionActionModel',
        'BulkDeleteActionModel',
        'LinkActionModel',
        'RefreshActionModel',
        'BulkEditActionModel',
        'BulkUpdateActionModel',
        'ExportActionModel',
        'ImportActionModel',
        'CollectionTriggerWorkflowActionModel',
        'CustomRequestActionModel',
        'AIEmployeeActionModel',
        'JSItemActionModel',
        'JSCollectionActionModel',
      ];
      const publicCapabilities = collectAutoSnapshotPublicCapabilities({
        autoSnapshots: [snapshot],
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      });
      const ganttCapability = publicCapabilities.find((item) => item.publicType === 'gantt');

      expect(accessedGlobals).toEqual([]);
      expect(extraction.warningCount).toBe(0);
      expect(snapshot).toMatchObject({
        plugin: '@nocobase/plugin-gantt',
        resolvedEntry: 'src/client-v2/plugin.tsx',
      });
      expect(modelUses).toEqual(
        expect.arrayContaining([
          'GanttBlockModel',
          'GanttCollectionActionGroupModel',
          'GanttTodayActionModel',
          'GanttExpandCollapseActionModel',
          'GanttEventViewActionModel',
        ]),
      );
      expect(snapshot.flows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            modelUse: 'GanttBlockModel',
            flowKey: 'ganttSettings',
            staticStatus: 'dynamic',
          }),
          expect.objectContaining({
            modelUse: 'GanttBlockModel',
            flowKey: 'tableSettings',
            staticStatus: 'dynamic',
          }),
        ]),
      );
      expect(snapshot.inferredAuthoring?.capabilities).toEqual([
        expect.objectContaining({
          publicType: 'gantt',
          modelUse: 'GanttBlockModel',
          confidence: expect.objectContaining({
            tree: 'high',
            write: 'high',
          }),
          createRecipe: expect.objectContaining({
            nodeTemplate: expect.objectContaining({
              use: 'GanttBlockModel',
            }),
          }),
        }),
      ]);
      expect(
        snapshot.menuItems
          .filter((item) => item.slot === 'actions' && item.createModelOptionsStatus === 'static')
          .map((item) => item.modelUse),
      ).toEqual(ganttAllowedActionModelUses);
      expect(snapshot.inferredAuthoring?.capabilities[0].childSurfaces).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'action',
            subModelKey: 'actions',
            allowedChildren: ganttAllowedActionModelUses,
          }),
          expect.objectContaining({
            kind: 'fieldComponent',
            subModelKey: 'columns',
            allowedChildren: ['TableColumnModel'],
          }),
          expect.objectContaining({
            kind: 'action',
            subModelKey: 'eventViewAction',
            allowedChildren: ['GanttEventViewActionModel'],
          }),
        ]),
      );
      expect(snapshot.inferredAuthoring?.capabilities[0].allowedChildren).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: 'action',
            modelUse: 'GanttEventViewActionModel',
            publicType: 'view',
          }),
        ]),
      );
      expect(ganttCapability).toMatchObject({
        kind: 'block',
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-with-settings',
        readiness: 'createEnabled',
        availability: {
          create: {
            supported: true,
            acceptsInitParams: true,
            acceptsSettings: true,
          },
          configure: {
            supported: false,
            reasonCode: 'contract-not-verified',
          },
        },
      });
      expect(JSON.stringify(ganttCapability)).not.toContain('GanttBlockModel');
      expect(JSON.stringify(ganttCapability)).not.toContain('TableActionsColumnModel');
    } finally {
      keys.forEach((key) => {
        const originalDescriptor = originalDescriptors.get(key);
        if (originalDescriptor) {
          Object.defineProperty(globalObject, key, originalDescriptor);
        } else {
          Reflect.deleteProperty(globalObject, key);
        }
      });
    }
  });

  it('should derive a block candidate from the simple block fixture', async () => {
    const fixture = await readFlowSurfaceExtractorFixtureSource('simple-block-plugin');
    const extraction = await extractFlowSurfacePluginCapabilities(
      {
        plugin: '@example/simple-block-plugin',
        packageRoot: fixture.packageRoot,
      },
      {
        generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
        extractorVersion: 'test',
      },
    );
    const candidates = deriveFlowSurfaceAutoCapabilityCandidates(extraction.snapshot);

    expect(extraction).toMatchObject({
      eventCount: 2,
      candidateCount: 1,
      warningCount: 0,
    });
    expect(extraction.snapshot.models).toEqual([
      expect.objectContaining({
        modelUse: 'SimpleBlockModel',
        confidence: 'medium',
        sourceRefs: [
          expect.objectContaining({
            source: 'src/client-v2/index.ts',
            evidenceSource: 'ast',
          }),
        ],
      }),
    ]);
    expect(extraction.snapshot.menuItems).toEqual([
      expect.objectContaining({
        modelUse: 'SimpleBlockModel',
        labelText: 'Simple block',
        slot: 'blocks',
        createModelOptionsStatus: 'static',
      }),
    ]);
    expect(candidates).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'exampleSimpleBlockPlugin.simple',
        modelUse: 'SimpleBlockModel',
        ownerPlugin: '@example/simple-block-plugin',
        confidence: 'medium',
        evidence: expect.arrayContaining([
          {
            type: 'menuItem',
            ref: 'SimpleBlockModel',
          },
          {
            type: 'model',
            ref: 'SimpleBlockModel',
          },
        ]),
      }),
    ]);
  });

  it('should mark dynamic menu fixture items as dynamic without executing them', async () => {
    const fixture = await readFlowSurfaceExtractorFixtureSource('dynamic-menu-plugin', 'src/client-v2/index.tsx');
    const extraction = await extractFlowSurfacePluginCapabilities(
      {
        plugin: '@example/dynamic-menu-plugin',
        packageRoot: fixture.packageRoot,
      },
      {
        generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
        extractorVersion: 'test',
      },
    );

    expect(() =>
      collectFlowSurfaceExtractorAstEvents({
        source: fixture.source,
        sourceFile: fixture.sourceFile,
      }),
    ).not.toThrow();

    const events = collectFlowSurfaceExtractorAstEvents({
      source: fixture.source,
      sourceFile: fixture.sourceFile,
    });

    expect(events).toEqual([
      expect.objectContaining({
        type: 'menu.itemRegistered',
        modelUse: 'DynamicBlockModel',
        slot: 'blocks',
        createModelOptionsStatus: 'dynamic',
        evidenceSource: 'ast',
      }),
    ]);
    expect(extraction).toMatchObject({
      eventCount: 1,
      warningCount: 0,
      snapshot: {
        menuItems: [
          expect.objectContaining({
            modelUse: 'DynamicBlockModel',
            createModelOptionsStatus: 'dynamic',
          }),
        ],
      },
    });
  });

  it('should discover field binding fixtures without exposing create support', async () => {
    const fixture = await readFlowSurfaceExtractorFixtureSource('field-binding-plugin');
    const extraction = await extractFlowSurfacePluginCapabilities(
      {
        plugin: '@example/field-binding-plugin',
        packageRoot: fixture.packageRoot,
      },
      {
        generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
        extractorVersion: 'test',
      },
    );
    const candidates = deriveFlowSurfaceAutoCapabilityCandidates(extraction.snapshot);

    expect(extraction).toMatchObject({
      eventCount: 1,
      candidateCount: 1,
      warningCount: 0,
    });

    expect(extraction.snapshot.fieldBindings).toEqual([
      expect.objectContaining({
        fieldInterface: 'sequence',
        modelUse: 'SequenceFieldModel',
        role: 'editable',
        confidence: 'medium',
      }),
    ]);
    expect(candidates).toEqual([
      expect.objectContaining({
        kind: 'fieldBinding',
        publicType: 'exampleFieldBindingPlugin.sequence',
        modelUse: 'SequenceFieldModel',
        warnings: [
          expect.objectContaining({
            code: 'auto-discovered-readonly',
          }),
        ],
      }),
    ]);
    expect(
      collectAutoSnapshotPublicCapabilities({
        autoSnapshots: [extraction.snapshot],
        enabledPackages: new Set(['@example/field-binding-plugin']),
      }),
    ).toEqual([]);
  });

  it('should record loader fixture keys without executing loader code', async () => {
    const fixture = await readFlowSurfaceExtractorFixtureSource('loader-plugin');
    const extraction = await extractFlowSurfacePluginCapabilities(
      {
        plugin: '@example/loader-plugin',
        packageRoot: fixture.packageRoot,
      },
      {
        generatedAt: FLOW_SURFACE_EXTRACTOR_TEST_DATE,
        extractorVersion: 'test',
      },
    );
    const astEvents = collectFlowSurfaceExtractorAstEvents({
      source: fixture.source,
      sourceFile: fixture.sourceFile,
    });

    expect(extraction).toMatchObject({
      eventCount: 1,
      candidateCount: 1,
      warningCount: 0,
      snapshot: {
        plugin: '@example/loader-plugin',
        models: [
          expect.objectContaining({
            modelUse: 'LoaderBlockModel',
          }),
        ],
      },
    });
    expect(extraction.snapshot.models.map((model) => model.modelUse)).toEqual(['LoaderBlockModel']);
    expect(astEvents).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          type: 'model.registered',
          modelUse: 'LoaderResolvedBlockModel',
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

      const diagnosticWarnings: FlowSurfaceCapabilityDiagnosticWarning[] = [];
      const loaded = await loadFlowSurfaceAutoSnapshotsFromDirectory({ dir: outDir, diagnosticWarnings });

      expect(loaded.map((item) => item.plugin)).toEqual(['@nocobase/plugin-valid']);
      expect(diagnosticWarnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            source: 'snapshot',
            code: 'snapshot-file-skipped',
            fileName: 'invalid-json.json',
          }),
          expect.objectContaining({
            source: 'snapshot',
            code: 'snapshot-file-skipped',
            fileName: 'directory.json',
          }),
          expect.objectContaining({
            source: 'snapshot',
            code: 'snapshot-file-skipped',
            fileName: 'linked.json',
          }),
          expect.objectContaining({
            source: 'snapshot',
            code: 'snapshot-file-skipped',
            fileName: 'wrong-version.json',
          }),
          expect.objectContaining({
            source: 'snapshot',
            code: 'snapshot-file-skipped',
            fileName: 'malformed.json',
          }),
        ]),
      );
      expect(diagnosticWarnings).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fileName: 'notes.txt',
          }),
        ]),
      );
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

  it('should prefer plugin source entries before client-v2 index barrels', async () => {
    const tempRoot = await realpath(tmpdir());
    const packageRoot = await mkdtemp(join(tempRoot, 'flow-surfaces-entry-plugin-first-'));
    const pluginEntry = join(packageRoot, 'src/client-v2/plugin.tsx');
    const indexEntry = join(packageRoot, 'src/client-v2/index.tsx');
    try {
      await mkdir(join(packageRoot, 'src/client-v2'), { recursive: true });
      await writeFile(join(packageRoot, 'package.json'), '{"name":"@nocobase/plugin-auth"}\n', 'utf8');
      await writeFile(pluginEntry, 'export default class PluginAuthClient {}\n', 'utf8');
      await writeFile(indexEntry, "export { default } from './plugin'; export * from './pages/AuthLayout';\n", 'utf8');

      const resolution = await resolveFlowSurfacePluginEntry({
        packageRoot,
      });

      expect(resolution).toMatchObject({
        plugin: '@nocobase/plugin-auth',
        sourceEntry: pluginEntry,
        selectedEntry: pluginEntry,
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
