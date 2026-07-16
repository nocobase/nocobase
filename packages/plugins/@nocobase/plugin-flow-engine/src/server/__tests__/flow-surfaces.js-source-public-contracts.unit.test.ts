/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Team.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { collectFlowSurfaceAuthoringErrors } from '../flow-surfaces/authoring-validation';
import { compileFlowSurfaceApplyBlueprintRequest } from '../flow-surfaces/blueprint';
import { exportFlowSurfaceBlueprintDocument } from '../flow-surfaces/blueprint/export-document';
import { getEditableDomainsForUse, getNodeContract, getSettingsSchemaForUse } from '../flow-surfaces/catalog';
import { expandFieldCatalogCandidate } from '../flow-surfaces/catalog-smart';
import { getConfigureOptionsForCatalogItem, getConfigureOptionsForUse } from '../flow-surfaces/configure-options';

const SOURCE_PATHS = ['runJs.sourceMode', 'runJs.sourceBinding', 'runJs.settings.*'];

function fieldInit(fieldPath: string) {
  return {
    dataSourceKey: 'main',
    collectionName: 'employees',
    fieldPath,
  };
}

function legacyInline(code: string) {
  return {
    code,
    version: 'v1',
  };
}

function createLegacyInlineJsPageTree() {
  const nicknameInit = fieldInit('nickname');
  const emailInit = fieldInit('email');
  return {
    uid: 'page-legacy-js',
    use: 'RootPageModel',
    props: { title: 'Legacy JS compatibility' },
    subModels: {
      tabs: [
        {
          uid: 'tab-legacy-js',
          use: 'RootPageTabModel',
          props: { title: 'Main' },
          subModels: {
            grid: {
              uid: 'grid-legacy-js',
              use: 'BlockGridModel',
              props: {
                rows: {
                  main: [['block-legacy-js'], ['table-legacy-js'], ['form-legacy-js']],
                },
                rowOrder: ['main'],
                sizes: {
                  main: [8, 8, 8],
                },
              },
              subModels: {
                items: [
                  {
                    uid: 'block-legacy-js',
                    use: 'JSBlockModel',
                    stepParams: {
                      jsSettings: {
                        runJs: {
                          ...legacyInline("ctx.render('legacy block');"),
                          sourceRef: { type: 'vsc-file', path: 'legacy/js-block.tsx' },
                        },
                      },
                    },
                  },
                  {
                    uid: 'table-legacy-js',
                    use: 'TableBlockModel',
                    stepParams: {
                      resourceSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'employees' },
                      },
                    },
                    subModels: {
                      columns: [
                        {
                          uid: 'table-field-wrapper',
                          use: 'TableColumnModel',
                          stepParams: { fieldSettings: { init: nicknameInit } },
                          subModels: {
                            field: [
                              {
                                uid: 'table-js-field',
                                use: 'JSFieldModel',
                                stepParams: {
                                  fieldSettings: { init: nicknameInit },
                                  jsSettings: { runJs: legacyInline("ctx.render(String(ctx.value || '')); ") },
                                },
                              },
                            ],
                          },
                        },
                        {
                          uid: 'table-js-column',
                          use: 'JSColumnModel',
                          stepParams: {
                            jsSettings: { runJs: legacyInline("ctx.render(String(ctx.record?.status || '')); ") },
                          },
                        },
                        {
                          uid: 'table-js-item',
                          use: 'JSItemModel',
                          stepParams: {
                            jsSettings: { runJs: legacyInline("ctx.render('legacy item');") },
                          },
                        },
                        {
                          uid: 'table-actions-column',
                          use: 'TableActionsColumnModel',
                          subModels: {
                            actions: [
                              {
                                uid: 'table-js-item-action',
                                use: 'JSItemActionModel',
                                stepParams: {
                                  jsSettings: { runJs: legacyInline("ctx.render('legacy item action');") },
                                },
                              },
                            ],
                          },
                        },
                      ],
                      actions: [
                        {
                          uid: 'table-js-action',
                          use: 'JSCollectionActionModel',
                          stepParams: {
                            clickSettings: { runJs: legacyInline("ctx.message.info('legacy action');") },
                          },
                        },
                      ],
                    },
                  },
                  {
                    uid: 'form-legacy-js',
                    use: 'CreateFormModel',
                    stepParams: {
                      resourceSettings: {
                        init: { dataSourceKey: 'main', collectionName: 'employees' },
                      },
                    },
                    subModels: {
                      grid: {
                        uid: 'form-grid-legacy-js',
                        use: 'FormGridModel',
                        subModels: {
                          items: [
                            {
                              uid: 'form-field-wrapper',
                              use: 'FormItemModel',
                              stepParams: { fieldSettings: { init: emailInit } },
                              subModels: {
                                field: [
                                  {
                                    uid: 'form-js-field',
                                    use: 'JSEditableFieldModel',
                                    stepParams: {
                                      fieldSettings: { init: emailInit },
                                      jsSettings: { runJs: legacyInline("ctx.render(String(ctx.value || '')); ") },
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

function expectSourceOptions(use: string, kind: string) {
  const options = getConfigureOptionsForUse(use);
  expect(options).toEqual(
    expect.objectContaining({
      code: expect.objectContaining({ type: 'string' }),
      version: expect.objectContaining({ type: 'string' }),
      sourceMode: expect.objectContaining({
        type: 'string',
        enum: ['inline', 'light-extension'],
      }),
      sourceBinding: expect.objectContaining({
        type: 'object',
        example: expect.objectContaining({
          type: 'light-extension-entry',
          kind,
        }),
      }),
      settings: expect.objectContaining({ type: 'object' }),
    }),
  );

  const itemOptions = getConfigureOptionsForCatalogItem({ kind: 'field', use });
  expect(itemOptions).toMatchObject({
    sourceMode: options.sourceMode,
    sourceBinding: options.sourceBinding,
    settings: options.settings,
  });
}

function expectSourceContract(use: string, groupKey: 'jsSettings' | 'clickSettings', kind: string) {
  const group = getNodeContract(use).domains.stepParams?.groups?.[groupKey];
  expect(group?.allowedPaths).toEqual(expect.arrayContaining(SOURCE_PATHS));
  expect(group?.allowedPaths).not.toEqual(expect.arrayContaining(['sourceMode', 'sourceBinding', 'settings.*']));
  expect(group?.pathSchemas?.['runJs.sourceBinding']).toMatchObject({
    type: 'object',
    required: ['type', 'repoId', 'entryId', 'kind'],
    properties: {
      type: {
        enum: ['light-extension-entry'],
      },
      kind: {
        enum: [kind],
      },
    },
    additionalProperties: false,
  });
}

describe('flowSurfaces public JS source contracts', () => {
  it('exports legacy inline JS owners to sourceMode-free public applyBlueprint mappings', async () => {
    const exported = exportFlowSurfaceBlueprintDocument({
      page: createLegacyInlineJsPageTree(),
      target: { pageSchemaUid: 'page-schema-legacy-js' },
    });
    const blocks = exported.document.tabs[0].blocks;
    const jsBlock = blocks.find((block) => block.type === 'jsBlock');
    const table = blocks.find((block) => block.type === 'table');
    const form = blocks.find((block) => block.type === 'createForm');
    const tableJsField = table?.fields?.find((field) => field.renderer === 'js');
    const jsColumn = table?.fields?.find((field) => field.type === 'jsColumn');
    const jsItem = table?.fields?.find((field) => field.type === 'jsItem');
    const formJsField = form?.fields?.find((field) => field.renderer === 'js');
    const jsAction = table?.actions?.find((action) => action.type === 'js');
    const jsItemAction = table?.recordActions?.find((action) => action.type === 'jsItem');

    expect(jsBlock?.settings).toEqual({
      ...legacyInline("ctx.render('legacy block');"),
      sourceRef: { type: 'vsc-file', path: 'legacy/js-block.tsx' },
    });
    const legacySettings = [
      [tableJsField?.settings, legacyInline("ctx.render(String(ctx.value || '')); ")],
      [jsColumn?.settings, legacyInline("ctx.render(String(ctx.record?.status || '')); ")],
      [jsItem?.settings, legacyInline("ctx.render('legacy item');")],
      [formJsField?.settings, legacyInline("ctx.render(String(ctx.value || '')); ")],
      [jsAction?.settings, legacyInline("ctx.message.info('legacy action');")],
      [jsItemAction?.settings, legacyInline("ctx.render('legacy item action');")],
    ] as const;
    for (const [settings, expected] of legacySettings) {
      expect(settings).toEqual(expected);
      expect(settings).not.toHaveProperty('sourceMode');
      expect(settings).not.toHaveProperty('sourceBinding');
      expect(settings).not.toHaveProperty('sourceRef');
    }
    expect(exported.unsupported).toEqual([]);

    const applyErrors = await collectFlowSurfaceAuthoringErrors('applyBlueprint', exported.document);
    expect(applyErrors).toEqual([]);

    const program = compileFlowSurfaceApplyBlueprintRequest(exported.document, {
      replaceTarget: {
        locator: { pageSchemaUid: 'page-schema-legacy-js' },
        pageUid: 'page-legacy-js',
        tabs: [{ uid: 'tab-legacy-js' }],
      },
    });
    const composeStep = program.steps.find((step) => step.action === 'compose');
    expect(composeStep?.values).toMatchObject({
      mode: 'replace',
      blocks: expect.arrayContaining([
        expect.objectContaining({
          type: 'jsBlock',
          settings: {
            ...legacyInline("ctx.render('legacy block');"),
            sourceRef: { type: 'vsc-file', path: 'legacy/js-block.tsx' },
          },
        }),
        expect.objectContaining({
          type: 'table',
          fields: expect.arrayContaining([
            expect.objectContaining({
              fieldPath: 'nickname',
              renderer: 'js',
              settings: legacyInline("ctx.render(String(ctx.value || '')); "),
            }),
            expect.objectContaining({
              type: 'jsColumn',
              settings: legacyInline("ctx.render(String(ctx.record?.status || '')); "),
            }),
            expect.objectContaining({
              type: 'jsItem',
              settings: legacyInline("ctx.render('legacy item');"),
            }),
          ]),
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'js',
              settings: legacyInline("ctx.message.info('legacy action');"),
            }),
          ]),
          recordActions: expect.arrayContaining([
            expect.objectContaining({
              type: 'jsItem',
              settings: legacyInline("ctx.render('legacy item action');"),
            }),
          ]),
        }),
        expect.objectContaining({
          type: 'createForm',
          fields: expect.arrayContaining([
            expect.objectContaining({
              fieldPath: 'email',
              renderer: 'js',
              settings: legacyInline("ctx.render(String(ctx.value || '')); "),
            }),
          ]),
        }),
      ]),
    });
  });

  it('exposes ordinary JS actions as js-action sources', () => {
    for (const use of [
      'JSCollectionActionModel',
      'JSRecordActionModel',
      'JSFormActionModel',
      'FilterFormJSActionModel',
      'JSActionModel',
    ]) {
      expectSourceOptions(use, 'js-action');
      expectSourceContract(use, 'clickSettings', 'js-action');
    }
  });

  it('exposes bound JS fields and their public wrappers as js-field sources', () => {
    for (const use of ['JSFieldModel', 'JSEditableFieldModel']) {
      expectSourceOptions(use, 'js-field');
      expectSourceContract(use, 'jsSettings', 'js-field');
    }

    for (const wrapperUse of ['TableColumnModel', 'DetailsItemModel', 'FormItemModel', 'PatternFormItemModel']) {
      expectSourceOptions(wrapperUse, 'js-field');
    }
    expectSourceContract('PatternFormFieldModel', 'jsSettings', 'js-field');
  });

  it('combines bound JS field catalog item contracts with their wrapper contracts', () => {
    for (const item of [
      { use: 'TableColumnModel', fieldUse: 'JSFieldModel', wrapperGroup: 'tableColumnSettings' },
      { use: 'DetailsItemModel', fieldUse: 'JSFieldModel', wrapperGroup: 'detailItemSettings' },
      { use: 'FormItemModel', fieldUse: 'JSEditableFieldModel', wrapperGroup: 'editItemSettings' },
    ]) {
      const projected = expandFieldCatalogCandidate(
        {
          key: `js:${item.use}`,
          label: `JS ${item.use}`,
          use: item.use,
          fieldUse: item.fieldUse,
          renderer: 'js',
        },
        {
          includeItemConfigureOptions: true,
          includeItemContracts: true,
          includeItemAllowedContainerUses: false,
          includeNodeContracts: false,
        },
        {
          getEditableDomains: getEditableDomainsForUse,
          getConfigureOptions: getConfigureOptionsForCatalogItem,
          getSettingsSchema: getSettingsSchemaForUse,
          getNodeContract,
        },
      );

      const groups = projected.settingsContract?.stepParams?.groups;
      expect(groups?.[item.wrapperGroup]).toBeTruthy();
      expect(groups?.jsSettings?.allowedPaths).toEqual(expect.arrayContaining(SOURCE_PATHS));
      expect(groups?.jsSettings?.pathSchemas?.['runJs.sourceBinding']?.properties?.kind?.enum).toEqual(['js-field']);
      expect(projected.settingsSchema?.stepParams?.['x-groups']).toEqual(
        expect.objectContaining({
          [item.wrapperGroup]: expect.any(Object),
          jsSettings: expect.objectContaining({
            allowedPaths: expect.arrayContaining(SOURCE_PATHS),
          }),
        }),
      );
      expect(projected.configureOptions).toEqual(
        expect.objectContaining({
          sourceMode: expect.objectContaining({ enum: ['inline', 'light-extension'] }),
          sourceBinding: expect.objectContaining({
            example: expect.objectContaining({ kind: 'js-field' }),
          }),
          settings: expect.objectContaining({ type: 'object' }),
        }),
      );
    }
  });

  it('limits JS columns to the shared js-field source kind', () => {
    expectSourceOptions('JSColumnModel', 'js-field');
    expectSourceContract('JSColumnModel', 'jsSettings', 'js-field');
  });

  it('keeps JS item surfaces on the js-item source kind', () => {
    for (const use of ['JSItemModel', 'FormJSFieldItemModel', 'JSItemActionModel']) {
      expectSourceOptions(use, 'js-item');
      expectSourceContract(use, 'jsSettings', 'js-item');
    }
  });
});
