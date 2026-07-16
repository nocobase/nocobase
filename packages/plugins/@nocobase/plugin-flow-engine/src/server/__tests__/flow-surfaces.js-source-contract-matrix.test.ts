/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import { compileFlowSurfaceApplyBlueprintRequest } from '../flow-surfaces/blueprint';
import { exportFlowSurfaceBlueprintDocument } from '../flow-surfaces/blueprint/export-document';
import { getNodeContract } from '../flow-surfaces/catalog';
import { FlowSurfaceContractGuard } from '../flow-surfaces/contract-guard';
import { clearInactiveRunJsSourceBinding, resolveRunJsSettingsGroupKey } from '../flow-surfaces/service';
import { buildRunJsSourceChanges } from '../flow-surfaces/service-utils';
import { validateRunJsSourceBinding, type RunJsSourceBindingKind } from '../flow-surfaces/source-binding-authoring';

type RunJsGroupKey = 'jsSettings' | 'clickSettings';

type SurfaceCase = {
  label: string;
  use: string;
  kind: Exclude<RunJsSourceBindingKind, 'runjs'>;
  group: RunJsGroupKey;
};

type RunJsState = {
  code?: string;
  version?: string;
  sourceMode?: 'inline' | 'light-extension';
  sourceBinding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

type RunJsStepParams = Partial<Record<RunJsGroupKey, { runJs: RunJsState }>>;

const SURFACES: SurfaceCase[] = [
  { label: 'JS Block', use: 'JSBlockModel', kind: 'js-block', group: 'jsSettings' },
  { label: 'JS Item', use: 'JSItemModel', kind: 'js-item', group: 'jsSettings' },
  { label: 'JS Item Action', use: 'JSItemActionModel', kind: 'js-item', group: 'jsSettings' },
  { label: 'JS Collection Action', use: 'JSCollectionActionModel', kind: 'js-action', group: 'clickSettings' },
  { label: 'JS Record Action', use: 'JSRecordActionModel', kind: 'js-action', group: 'clickSettings' },
  { label: 'JS Form Action', use: 'JSFormActionModel', kind: 'js-action', group: 'clickSettings' },
  { label: 'Generic JS Action', use: 'JSActionModel', kind: 'js-action', group: 'clickSettings' },
  { label: 'JS Field', use: 'JSFieldModel', kind: 'js-field', group: 'jsSettings' },
  { label: 'JS Editable Field', use: 'JSEditableFieldModel', kind: 'js-field', group: 'jsSettings' },
  { label: 'JS Column', use: 'JSColumnModel', kind: 'js-field', group: 'jsSettings' },
];

function sourceBinding(kind: RunJsSourceBindingKind, entryId = `entry_${kind}`) {
  return {
    type: 'light-extension-entry',
    repoId: `repo_${kind}`,
    entryId,
    kind,
  };
}

function stepParams(group: RunJsGroupKey, runJs: RunJsState): RunJsStepParams {
  return {
    [group]: { runJs },
  };
}

function readRunJs(value: unknown, group: RunJsGroupKey): RunJsState {
  const runJs = (value as RunJsStepParams)[group]?.runJs;
  if (!runJs) {
    throw new Error(`Missing ${group}.runJs`);
  }
  return runJs;
}

function mergeSource(caseItem: SurfaceCase, current: RunJsState, changes: Record<string, unknown>) {
  const contract = getNodeContract(caseItem.use).domains.stepParams;
  if (!contract) {
    throw new Error(`${caseItem.use} stepParams contract is required`);
  }
  const sourceChanges = buildRunJsSourceChanges(changes);
  if (!sourceChanges) {
    throw new Error(`${caseItem.use} source changes are required`);
  }
  return new FlowSurfaceContractGuard().mergeDomainValue(
    'stepParams',
    stepParams(caseItem.group, current),
    stepParams(caseItem.group, sourceChanges),
    contract,
    caseItem.use,
  );
}

function lightExtensionRunJs(kind: SurfaceCase['kind'], entryId: string, code: string): RunJsState {
  return {
    code,
    version: 'v2',
    sourceMode: 'light-extension',
    sourceBinding: sourceBinding(kind, entryId),
    settings: {
      locale: 'en-US',
    },
  };
}

function fieldInit(fieldPath: string) {
  return {
    dataSourceKey: 'main',
    collectionName: 'employees',
    fieldPath,
  };
}

function createLightExtensionPageTree() {
  const fieldSource = lightExtensionRunJs('js-field', 'entry_table_field', "ctx.render(String(ctx.value || '')); ");
  const editableSource = lightExtensionRunJs(
    'js-field',
    'entry_editable_field',
    "ctx.render(String(ctx.value || '')); ",
  );
  return {
    uid: 'page-js-source-matrix',
    use: 'RootPageModel',
    props: { title: 'JS source matrix' },
    subModels: {
      tabs: [
        {
          uid: 'tab-js-source-matrix',
          use: 'RootPageTabModel',
          props: { title: 'Main' },
          subModels: {
            grid: {
              uid: 'grid-js-source-matrix',
              use: 'BlockGridModel',
              props: {
                rows: {
                  main: [['block-js-source-matrix'], ['table-js-source-matrix'], ['form-js-source-matrix']],
                },
                rowOrder: ['main'],
                sizes: {
                  main: [8, 8, 8],
                },
              },
              subModels: {
                items: [
                  {
                    uid: 'block-js-source-matrix',
                    use: 'JSBlockModel',
                    stepParams: {
                      jsSettings: {
                        runJs: lightExtensionRunJs('js-block', 'entry_block', "ctx.render('block fallback');"),
                      },
                    },
                  },
                  {
                    uid: 'table-js-source-matrix',
                    use: 'TableBlockModel',
                    stepParams: {
                      resourceSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'employees' },
                      },
                    },
                    subModels: {
                      columns: [
                        {
                          uid: 'wrapper-js-field-matrix',
                          use: 'TableColumnModel',
                          stepParams: { fieldSettings: { init: fieldInit('nickname') } },
                          subModels: {
                            field: [
                              {
                                uid: 'field-js-source-matrix',
                                use: 'JSFieldModel',
                                stepParams: {
                                  fieldSettings: { init: fieldInit('nickname') },
                                  jsSettings: { runJs: fieldSource },
                                },
                              },
                            ],
                          },
                        },
                        {
                          uid: 'column-js-source-matrix',
                          use: 'JSColumnModel',
                          stepParams: {
                            jsSettings: {
                              runJs: lightExtensionRunJs(
                                'js-field',
                                'entry_column',
                                "ctx.render(String(ctx.record?.status || '')); ",
                              ),
                            },
                          },
                        },
                        {
                          uid: 'item-js-source-matrix',
                          use: 'JSItemModel',
                          stepParams: {
                            jsSettings: {
                              runJs: lightExtensionRunJs('js-item', 'entry_item', "ctx.render('item fallback');"),
                            },
                          },
                        },
                        {
                          uid: 'actions-column-js-source-matrix',
                          use: 'TableActionsColumnModel',
                          subModels: {
                            actions: [
                              {
                                uid: 'item-action-js-source-matrix',
                                use: 'JSItemActionModel',
                                stepParams: {
                                  jsSettings: {
                                    runJs: lightExtensionRunJs(
                                      'js-item',
                                      'entry_item_action',
                                      "ctx.render('item action fallback');",
                                    ),
                                  },
                                },
                              },
                            ],
                          },
                        },
                      ],
                      actions: [
                        {
                          uid: 'action-js-source-matrix',
                          use: 'JSCollectionActionModel',
                          stepParams: {
                            clickSettings: {
                              runJs: lightExtensionRunJs(
                                'js-action',
                                'entry_action',
                                "ctx.message.info('action fallback');",
                              ),
                            },
                          },
                        },
                      ],
                    },
                  },
                  {
                    uid: 'form-js-source-matrix',
                    use: 'CreateFormModel',
                    stepParams: {
                      resourceSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'employees' },
                      },
                    },
                    subModels: {
                      grid: {
                        uid: 'form-grid-js-source-matrix',
                        use: 'FormGridModel',
                        subModels: {
                          items: [
                            {
                              uid: 'wrapper-editable-js-source-matrix',
                              use: 'FormItemModel',
                              stepParams: { fieldSettings: { init: fieldInit('email') } },
                              subModels: {
                                field: [
                                  {
                                    uid: 'editable-js-source-matrix',
                                    use: 'JSEditableFieldModel',
                                    stepParams: {
                                      fieldSettings: { init: fieldInit('email') },
                                      jsSettings: { runJs: editableSource },
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
  };
}

describe('flowSurfaces JS source contract matrix', () => {
  it('keeps legacy inline, explicit inline, and light-extension source in canonical runJs for every owner use', () => {
    for (const caseItem of SURFACES) {
      expect(resolveRunJsSettingsGroupKey(caseItem.use), caseItem.label).toBe(caseItem.group);
      const sourceGroup = getNodeContract(caseItem.use).domains.stepParams?.groups?.[caseItem.group];
      expect(sourceGroup?.allowedPaths, caseItem.label).toEqual(
        expect.arrayContaining(['runJs.sourceMode', 'runJs.sourceBinding', 'runJs.settings.*']),
      );
      expect(sourceGroup?.pathSchemas?.['runJs.sourceBinding']?.properties?.kind?.enum, caseItem.label).toEqual([
        caseItem.kind,
      ]);

      const legacyInline = mergeSource(
        caseItem,
        { code: 'return "before";', version: 'v1' },
        { code: 'return "after";' },
      );
      expect(readRunJs(legacyInline, caseItem.group), caseItem.label).toEqual({
        code: 'return "after";',
        version: 'v1',
      });

      const binding = sourceBinding(caseItem.kind, `entry_${caseItem.use}`);
      const bindingOnly = mergeSource(caseItem, {}, { sourceBinding: binding });
      expect(readRunJs(bindingOnly, caseItem.group), caseItem.label).toEqual({
        sourceMode: 'light-extension',
        sourceBinding: binding,
      });
      expect(readRunJs(bindingOnly, caseItem.group), caseItem.label).not.toHaveProperty('code');

      const currentLightExtension = {
        code: 'return "fallback";',
        version: 'v2',
        sourceMode: 'light-extension' as const,
        sourceBinding: binding,
        settings: { currency: 'CNY', precision: 2 },
      };
      const changedEntry = mergeSource(caseItem, currentLightExtension, {
        sourceBinding: { entryId: `entry_${caseItem.use}_next` },
        settings: { currency: 'USD' },
      });
      expect(readRunJs(changedEntry, caseItem.group), caseItem.label).toEqual({
        ...currentLightExtension,
        sourceBinding: {
          ...binding,
          entryId: `entry_${caseItem.use}_next`,
        },
        settings: { currency: 'USD', precision: 2 },
      });

      const switchedInline = mergeSource(caseItem, currentLightExtension, { sourceMode: 'inline' });
      clearInactiveRunJsSourceBinding(
        caseItem.use,
        stepParams(caseItem.group, { sourceMode: 'inline' }),
        switchedInline,
      );
      expect(readRunJs(switchedInline, caseItem.group), caseItem.label).toEqual({
        code: 'return "fallback";',
        version: 'v2',
        sourceMode: 'inline',
        settings: { currency: 'CNY', precision: 2 },
      });
    }
  });

  it('treats binding-only value-return RunJS as runnable and enforces the runjs kind', () => {
    const accepted = validateRunJsSourceBinding({
      source: {
        sourceMode: 'light-extension',
        sourceBinding: sourceBinding('runjs', 'entry_value_return'),
      },
      path: '$.value.runJs',
      expectedKind: 'runjs',
      requireExplicitSourceModeForBinding: true,
      surfaceLabel: 'value-return RunJS',
    });
    expect(accepted).toMatchObject({
      errors: [],
      hasLightExtensionSourceInput: true,
      hasRunnableLightExtensionSource: true,
    });

    const wrongKind = validateRunJsSourceBinding({
      source: {
        sourceMode: 'light-extension',
        sourceBinding: sourceBinding('js-action', 'entry_wrong_kind'),
      },
      path: '$.value.runJs',
      expectedKind: 'runjs',
      requireExplicitSourceModeForBinding: true,
      surfaceLabel: 'value-return RunJS',
    });
    expect(wrongKind.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '$.value.runJs.sourceBinding.kind',
          ruleId: 'runjs-sourceBinding-kind-invalid',
          details: expect.objectContaining({ expectedKind: 'runjs' }),
        }),
      ]),
    );
    expect(wrongKind.hasRunnableLightExtensionSource).toBe(false);
  });

  it('round-trips light-extension bindings and preserved fallback code through export and apply compilation', async () => {
    const exported = exportFlowSurfaceBlueprintDocument({
      page: createLightExtensionPageTree(),
      target: { pageSchemaUid: 'page-schema-js-source-matrix' },
    });
    expect(exported.unsupported).toEqual([]);

    const blocks = exported.document.tabs[0].blocks;
    const jsBlock = blocks.find((block) => block.type === 'jsBlock');
    const table = blocks.find((block) => block.type === 'table');
    const form = blocks.find((block) => block.type === 'createForm');
    const settings = [
      { label: 'JS Block', runJs: jsBlock?.settings },
      { label: 'JS Field', runJs: table?.fields?.find((field) => field.renderer === 'js')?.settings },
      { label: 'JS Column', runJs: table?.fields?.find((field) => field.type === 'jsColumn')?.settings },
      { label: 'JS Item', runJs: table?.fields?.find((field) => field.type === 'jsItem')?.settings },
      { label: 'JS Collection Action', runJs: table?.actions?.find((action) => action.type === 'js')?.settings },
      {
        label: 'JS Item Action',
        runJs: table?.recordActions?.find((action) => action.type === 'jsItem')?.settings,
      },
      { label: 'JS Editable Field', runJs: form?.fields?.find((field) => field.renderer === 'js')?.settings },
    ];

    expect(settings).toHaveLength(7);
    for (const { label, runJs } of settings) {
      expect(runJs, label).toMatchObject({
        code: expect.any(String),
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: expect.objectContaining({
          type: 'light-extension-entry',
          repoId: expect.any(String),
          entryId: expect.any(String),
          kind: expect.stringMatching(/^js-(?:block|field|action|item)$/),
        }),
        settings: { locale: 'en-US' },
      });
    }
    expect(table?.fields?.find((field) => field.type === 'jsColumn')?.settings?.sourceBinding?.kind).toBe('js-field');

    const errors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', exported.document);
    expect(errors).toEqual([]);

    const program = compileFlowSurfaceApplyBlueprintRequest(exported.document, {
      replaceTarget: {
        locator: { pageSchemaUid: 'page-schema-js-source-matrix' },
        pageUid: 'page-js-source-matrix',
        tabs: [{ uid: 'tab-js-source-matrix' }],
      },
    });
    const compose = program.steps.find((step) => step.action === 'compose');
    expect(compose?.values).toMatchObject({
      mode: 'replace',
      blocks: expect.arrayContaining([
        expect.objectContaining({
          type: 'jsBlock',
          settings: expect.objectContaining({
            sourceMode: 'light-extension',
            sourceBinding: expect.objectContaining({ kind: 'js-block' }),
            code: "ctx.render('block fallback');",
          }),
        }),
        expect.objectContaining({
          type: 'table',
          fields: expect.arrayContaining([
            expect.objectContaining({
              type: 'jsColumn',
              settings: expect.objectContaining({
                sourceBinding: expect.objectContaining({ kind: 'js-field' }),
              }),
            }),
          ]),
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'js',
              settings: expect.objectContaining({
                sourceBinding: expect.objectContaining({ kind: 'js-action' }),
              }),
            }),
          ]),
          recordActions: expect.arrayContaining([
            expect.objectContaining({
              type: 'jsItem',
              settings: expect.objectContaining({
                sourceBinding: expect.objectContaining({ kind: 'js-item' }),
              }),
            }),
          ]),
        }),
      ]),
    });
  });
});
