/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createEntryRecord,
  createJsBlockNode,
  createJsActionEntryRecord,
  createJsActionNode,
  createJsActionPublicationRecord,
  createJsActionReferenceRecord,
  createJsActionSourceBinding,
  createJsItemEntryRecord,
  createJsItemNode,
  createJsItemPublicationRecord,
  createJsItemReferenceRecord,
  createJsItemSourceBinding,
  createJsFieldEntryRecord,
  createJsFieldNode,
  createJsFieldPublicationRecord,
  createJsFieldReferenceRecord,
  createJsFieldSourceBinding,
  createRunJSEntryRecord,
  createRunJSHostNode,
  createRunJSPublicationRecord,
  createPublicationRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  stableJsonHash,
} from './reference-test-helpers';

describe('plugin-light-extension reference service', () => {
  const jsActionHostUses = [
    ['JSActionModel', 'flow_js_action_top'],
    ['JSRecordActionModel', 'flow_js_action_record'],
    ['JSCollectionActionModel', 'flow_js_action_collection'],
    ['JSFormActionModel', 'flow_js_action_form'],
    ['FilterFormJSActionModel', 'flow_js_action_filter_form'],
  ] as const;
  const jsItemHostUses = [
    ['JSItemModel', 'flow_js_item_display'],
    ['JSItemActionModel', 'flow_js_item_action'],
  ] as const;

  it('upserts JS Block references with publication snapshot settings and removes them after switching inline', async () => {
    const flowModelTrees = {
      flow_js_block: createJsBlockNode({
        uid: 'flow_js_block',
        settings: {
          region: 'EMEA',
        },
      }),
    };
    const {
      service,
      repositories,
      recordReferenceEvent,
      flowModelTrees: fixtureFlowModelTrees,
    } = createReferenceServiceFixture({
      flowModelTrees,
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_sync_reference',
      },
    );

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      publicationId: 'lep_sales_kpi',
      kind: 'js-block',
      ownerKind: 'flowModel.step',
      ownerLocator: {
        kind: 'flowModel.step',
        modelUid: 'flow_js_block',
        use: 'JSBlockModel',
        stepPath: ['stepParams', 'jsSettings'],
      },
      versionPolicy: 'pinned',
      settingsHash: stableJsonHash({
        threshold: 5,
        region: 'EMEA',
      }),
      resolvedStatus: 'active',
    });

    fixtureFlowModelTrees.flow_js_block = createJsBlockNode({
      uid: 'flow_js_block',
      sourceMode: 'inline',
      settings: {
        region: 'secret-inline-value',
      },
    });
    const inlineResult = await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_js_block',
        action: 'flowSurfaces.updateSettings',
      },
      {
        requestId: 'req_inline_reference',
      },
    );

    expect(inlineResult).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceRemove',
        reasonCode: 'source_mode_inline',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
    expect(JSON.stringify(recordReferenceEvent.mock.calls)).not.toContain('secret-inline-value');
  });

  it.each([
    ['JSFieldModel', 'flow_js_field_display'],
    ['JSEditableFieldModel', 'flow_js_field_editable'],
    ['JSColumnModel', 'flow_js_column_phone'],
  ] as const)('upserts %s JS Field references with distinct field owner locators', async (use, uid) => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsFieldNode({
          uid,
          use,
          settings: {
            prefix: 'callto:',
          },
        }),
      },
      publications: [createJsFieldPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [createJsFieldEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_fields',
      entryId: 'lee_phone_link',
      publicationId: 'lep_phone_link',
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
      ownerLocator: {
        kind: 'flowModel.fieldSettings',
        modelUid: uid,
        use,
      },
      versionPolicy: 'pinned',
      settingsHash: stableJsonHash({
        prefix: 'callto:',
      }),
      resolvedStatus: 'active',
    });
  });

  it.each(jsActionHostUses)('upserts %s JS Action references with distinct action owner locators', async (use, uid) => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsActionNode({
          uid,
          use,
          settings: {
            successMessage: 'Marked approved',
          },
        }),
      },
      publications: [createJsActionPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_actions' })],
      entries: [createJsActionEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_actions',
      entryId: 'lee_mark_approved',
      publicationId: 'lep_mark_approved',
      kind: 'js-action',
      ownerKind: 'flowModel.actionSettings',
      ownerLocator: {
        kind: 'flowModel.actionSettings',
        modelUid: uid,
        use,
      },
      versionPolicy: 'pinned',
      settingsHash: stableJsonHash({
        successMessage: 'Marked approved',
      }),
      resolvedStatus: 'active',
    });
  });

  it.each(['flowSurfaces.applyBlueprint', 'flowSurfaces.compose'] as const)(
    'upserts reused JS Action entry references for all action hosts after %s',
    async (action) => {
      const { service, repositories } = createReferenceServiceFixture({
        flowModelTrees: {
          flow_action_page: {
            uid: 'flow_action_page',
            use: 'PageModel',
            subModels: {
              actions: jsActionHostUses.map(([use, uid]) =>
                createJsActionNode({
                  uid,
                  use,
                  settings: {
                    successMessage: `Marked approved by ${use}`,
                  },
                }),
              ),
            },
          },
        },
        publications: [createJsActionPublicationRecord()],
        repos: [createRepoRecord({ id: 'ler_actions' })],
        entries: [createJsActionEntryRecord()],
      });

      const result = await service.syncFlowModelReferencesForNodeTree({
        rootUid: 'flow_action_page',
        action,
      });

      const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
      expect(result).toMatchObject({
        scanned: 5,
        upserted: 5,
        removed: 0,
        statusCounts: {
          active: 5,
        },
      });
      expect(records).toHaveLength(5);
      expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(5);
      expect(new Set(records.map((record) => record.entryId))).toEqual(new Set(['lee_mark_approved']));
      expect(records).toEqual(
        expect.arrayContaining(
          jsActionHostUses.map(([use, uid]) =>
            expect.objectContaining({
              kind: 'js-action',
              ownerKind: 'flowModel.actionSettings',
              ownerLocator: expect.objectContaining({
                modelUid: uid,
                use,
              }),
              publicationId: 'lep_mark_approved',
              versionPolicy: 'pinned',
            }),
          ),
        ),
      );
    },
  );

  it('rebuilds JS Action references from persisted action flow model records', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModels: jsActionHostUses.map(([use, uid]) => ({
        uid,
        options: createJsActionNode({
          uid,
          use,
          settings: {
            successMessage: `Marked approved by ${use}`,
          },
        }),
      })),
      publications: [createJsActionPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_actions' })],
      entries: [createJsActionEntryRecord()],
    });

    const result = await service.rebuildIndex({
      repoId: 'ler_actions',
    });

    const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
    expect(result).toMatchObject({
      scanned: 5,
      upserted: 5,
      removed: 0,
      ownerMissing: 0,
      statusCounts: {
        active: 5,
      },
    });
    expect(records).toHaveLength(5);
    expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(5);
    expect(records).toEqual(
      expect.arrayContaining(
        jsActionHostUses.map(([use, uid]) =>
          expect.objectContaining({
            repoId: 'ler_actions',
            entryId: 'lee_mark_approved',
            kind: 'js-action',
            ownerLocator: expect.objectContaining({
              modelUid: uid,
              use,
            }),
          }),
        ),
      ),
    );
  });

  it('generates a stable ownerLocatorHash per copied JS Action owner', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_source_js_action: createJsActionNode({
          uid: 'flow_source_js_action',
          use: 'JSRecordActionModel',
        }),
        flow_copied_js_action: createJsActionNode({
          uid: 'flow_copied_js_action',
          use: 'JSRecordActionModel',
        }),
      },
      publications: [createJsActionPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_actions' })],
      entries: [createJsActionEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_source_js_action',
      action: 'flowModels.save',
    });
    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_copied_js_action',
      action: 'flowModels.duplicate',
    });

    const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
    expect(records).toHaveLength(2);
    expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(2);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'js-action',
          ownerLocator: expect.objectContaining({ modelUid: 'flow_source_js_action' }),
        }),
        expect.objectContaining({
          kind: 'js-action',
          ownerLocator: expect.objectContaining({ modelUid: 'flow_copied_js_action' }),
        }),
      ]),
    );
  });

  it('marks JS Action references owner_missing when an action button is deleted', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      references: [
        createJsActionReferenceRecord({
          id: 'lef_deleted_js_action',
          modelUid: 'flow_deleted_js_action',
          use: 'JSActionModel',
        }),
      ],
    });

    const result = await service.markFlowModelReferencesOwnerMissingForNodeTree(
      {
        rootUid: 'flow_deleted_js_action',
        action: 'flowSurfaces.removeNode',
      },
      {
        requestId: 'req_deleted_js_action_reference',
      },
    );

    expect(result).toMatchObject({
      ownerMissing: 1,
      statusCounts: {
        owner_missing: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      id: 'lef_deleted_js_action',
      resolvedStatus: 'owner_missing',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceOwnerMissing',
        ownerKind: 'flowModel.actionSettings',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
  });

  it.each(jsItemHostUses)('upserts %s JS Item references with distinct item owner locators', async (use, uid) => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsItemNode({
          uid,
          use,
          settings: {
            vipColor: '#f5222d',
          },
        }),
      },
      publications: [createJsItemPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_items' })],
      entries: [createJsItemEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_items',
      entryId: 'lee_level_label',
      publicationId: 'lep_level_label',
      kind: 'js-item',
      ownerKind: 'flowModel.itemSettings',
      ownerLocator: {
        kind: 'flowModel.itemSettings',
        modelUid: uid,
        use,
      },
      versionPolicy: 'pinned',
      settingsHash: stableJsonHash({
        vipColor: '#f5222d',
      }),
      resolvedStatus: 'active',
    });
  });

  it.each([
    ['default value', createRunJSHostNode({ uid: 'flow_default_runjs', settings: { currency: 'USD' } })],
    [
      'form assignment',
      createRunJSHostNode({
        uid: 'flow_assign_runjs',
        hostPath: 'assignRule',
        settings: { currency: 'CNY' },
      }),
    ],
    [
      'assign form item',
      createRunJSHostNode({
        uid: 'flow_assign_form_runjs',
        hostPath: 'assignForm',
        settings: { currency: 'EUR' },
      }),
    ],
  ] as const)('upserts RunJS references for %s hosts with per-host locators', async (_title, node) => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [node.uid]: node,
      },
      publications: [createRunJSPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_runjs' })],
      entries: [createRunJSEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: node.uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    const record = repositories.lightExtensionReferences.records[0].toJSON();
    expect(record).toMatchObject({
      repoId: 'ler_runjs',
      entryId: 'lee_normalize_amount',
      publicationId: 'lep_normalize_amount',
      kind: 'runjs',
      ownerKind: 'flowModel.runjsHost',
      ownerLocator: expect.objectContaining({
        kind: 'flowModel.runjsHost',
        modelUid: node.uid,
        hostPath: expect.arrayContaining(['stepParams']),
      }),
      versionPolicy: 'pinned',
      resolvedStatus: 'active',
    });
    expect(record.settingsHash).toMatch(/^sha256:/);
  });

  it('removes RunJS references when the nested host switches back to inline', async () => {
    const flowModelTrees = {
      flow_assign_runjs: createRunJSHostNode({
        uid: 'flow_assign_runjs',
        hostPath: 'assignRule',
        settings: { currency: 'USD' },
      }),
    };
    const {
      service,
      repositories,
      flowModelTrees: fixtureFlowModelTrees,
    } = createReferenceServiceFixture({
      flowModelTrees,
      publications: [createRunJSPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_runjs' })],
      entries: [createRunJSEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_assign_runjs',
      action: 'flowModels.save',
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);

    fixtureFlowModelTrees.flow_assign_runjs = createRunJSHostNode({
      uid: 'flow_assign_runjs',
      hostPath: 'assignRule',
      sourceMode: 'inline',
    });
    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_assign_runjs',
      action: 'flowSurfaces.updateSettings',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('rebuilds RunJS references from nested FlowModel children', async () => {
    const child = createRunJSHostNode({
      uid: 'flow_nested_assign_form_runjs',
      hostPath: 'assignForm',
      settings: { currency: 'JPY' },
    });
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_page_with_runjs_child: {
          uid: 'flow_page_with_runjs_child',
          use: 'PageModel',
          subModels: {
            items: [child],
          },
        },
      },
      publications: [createRunJSPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_runjs' })],
      entries: [createRunJSEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_page_with_runjs_child',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      kind: 'runjs',
      ownerLocator: expect.objectContaining({
        modelUid: 'flow_nested_assign_form_runjs',
      }),
    });
  });

  it('upserts JS Item references after the settings dialog saves a source binding step wrapper', async () => {
    const uid = 'flow_js_item_saved_wrapper';
    const sourceBinding = createJsItemSourceBinding();
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: {
          uid,
          use: 'JSItemActionModel',
          stepParams: {
            jsSettings: {
              sourceBinding: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  vipColor: '#faad14',
                },
              },
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  vipColor: '#faad14',
                },
              },
            },
          },
        },
      },
      publications: [createJsItemPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_items' })],
      entries: [createJsItemEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_items',
      entryId: 'lee_level_label',
      kind: 'js-item',
      ownerKind: 'flowModel.itemSettings',
      settingsHash: stableJsonHash({
        vipColor: '#faad14',
      }),
      resolvedStatus: 'active',
    });
  });

  it('removes JS Item references after switching the item back to inline source', async () => {
    const uid = 'flow_js_item_inline';
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsItemNode({
          uid,
          sourceMode: 'inline',
        }),
      },
      references: [
        createJsItemReferenceRecord({
          modelUid: uid,
        }),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowSurfaces.updateSettings',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('rebuilds JS Item references from persisted item flow model records', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModels: jsItemHostUses.map(([use, uid]) => ({
        uid,
        options: createJsItemNode({
          uid,
          use,
          settings: {
            vipColor: '#eb2f96',
          },
        }),
      })),
      publications: [createJsItemPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_items' })],
      entries: [createJsItemEntryRecord()],
    });

    const result = await service.rebuildIndex({
      repoId: 'ler_items',
    });

    const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
    expect(result).toMatchObject({
      scanned: 2,
      upserted: 2,
      removed: 0,
      ownerMissing: 0,
      statusCounts: {
        active: 2,
      },
    });
    expect(records).toHaveLength(2);
    expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(2);
    expect(records).toEqual(
      expect.arrayContaining(
        jsItemHostUses.map(([use, uid]) =>
          expect.objectContaining({
            repoId: 'ler_items',
            entryId: 'lee_level_label',
            kind: 'js-item',
            ownerLocator: expect.objectContaining({
              modelUid: uid,
              use,
            }),
          }),
        ),
      ),
    );
  });

  it('generates a stable ownerLocatorHash per copied JS Item owner', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_source_js_item: createJsItemNode({
          uid: 'flow_source_js_item',
          use: 'JSItemActionModel',
        }),
        flow_copied_js_item: createJsItemNode({
          uid: 'flow_copied_js_item',
          use: 'JSItemActionModel',
        }),
      },
      publications: [createJsItemPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_items' })],
      entries: [createJsItemEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_source_js_item',
      action: 'flowModels.save',
    });
    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_copied_js_item',
      action: 'flowModels.duplicate',
    });

    const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
    expect(records).toHaveLength(2);
    expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(2);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'js-item',
          ownerLocator: expect.objectContaining({ modelUid: 'flow_source_js_item' }),
        }),
        expect.objectContaining({
          kind: 'js-item',
          ownerLocator: expect.objectContaining({ modelUid: 'flow_copied_js_item' }),
        }),
      ]),
    );
  });

  it('upserts JS Action references after the settings dialog saves a source binding step wrapper', async () => {
    const uid = 'flow_js_action_saved_wrapper';
    const sourceBinding = createJsActionSourceBinding();
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: {
          uid,
          use: 'JSActionModel',
          stepParams: {
            clickSettings: {
              sourceBinding: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  successMessage: 'Marked approved',
                },
              },
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  successMessage: 'Marked approved',
                },
              },
            },
          },
        },
      },
      publications: [createJsActionPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_actions' })],
      entries: [createJsActionEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_actions',
      entryId: 'lee_mark_approved',
      kind: 'js-action',
      ownerKind: 'flowModel.actionSettings',
      settingsHash: stableJsonHash({
        successMessage: 'Marked approved',
      }),
      resolvedStatus: 'active',
    });
  });

  it('removes JS Action references after switching the button back to inline source', async () => {
    const uid = 'flow_js_action_inline';
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsActionNode({
          uid,
          sourceMode: 'inline',
        }),
      },
      references: [
        createJsActionReferenceRecord({
          modelUid: uid,
        }),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowSurfaces.updateSettings',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('upserts JS Field references after the settings dialog saves a source binding step wrapper', async () => {
    const uid = 'flow_js_field_saved_wrapper';
    const sourceBinding = createJsFieldSourceBinding();
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: {
          uid,
          use: 'JSFieldModel',
          stepParams: {
            jsSettings: {
              sourceBinding: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  prefix: 'callto:',
                },
              },
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  prefix: 'callto:',
                },
              },
            },
          },
        },
      },
      publications: [createJsFieldPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [createJsFieldEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      removed: 0,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_fields',
      entryId: 'lee_phone_link',
      publicationId: 'lep_phone_link',
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
      ownerLocator: {
        kind: 'flowModel.fieldSettings',
        modelUid: uid,
        use: 'JSFieldModel',
      },
      settingsHash: stableJsonHash({
        prefix: 'callto:',
      }),
      resolvedStatus: 'active',
    });
  });

  it('uses updated RunJS settings when a runtime settings step changed after source selection', async () => {
    const uid = 'flow_js_field_updated_settings';
    const sourceBinding = createJsFieldSourceBinding();
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: {
          uid,
          use: 'JSFieldModel',
          stepParams: {
            jsSettings: {
              sourceBinding,
              settings: {
                prefix: 'tel:',
              },
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  prefix: 'callto:',
                },
              },
            },
          },
        },
      },
      publications: [createJsFieldPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [createJsFieldEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'lightExtensionReferences.rebuildIndex',
    });

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      settingsHash: stableJsonHash({
        prefix: 'callto:',
      }),
      resolvedStatus: 'active',
    });
  });

  it('prunes stale settings when rebuilding follow-active JS Field references against a new active schema', async () => {
    const uid = 'flow_js_field_follow_active_prune';
    const sourceBinding = createJsFieldSourceBinding({
      publicationId: 'lep_phone_link_legacy',
      versionPolicy: 'follow-active',
    });
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: {
          uid,
          use: 'JSFieldModel',
          stepParams: {
            jsSettings: {
              sourceBinding,
              settings: {
                legacyPlan: 'legacy-value',
              },
              runJs: {
                sourceMode: 'light-extension',
                sourceBinding,
                settings: {
                  legacyPlan: 'legacy-value',
                },
              },
            },
          },
        },
      },
      publications: [
        createJsFieldPublicationRecord({
          id: 'lep_phone_link_active',
          settingsSchemaHash: 'schema_active',
          settingsSchemaSnapshot: {
            type: 'object',
            properties: {
              activePlan: {
                type: 'string',
              },
            },
          },
          settingsDefaultsSnapshot: {
            activePlan: 'active-default',
          },
        }),
      ],
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [
        createJsFieldEntryRecord({
          activePublicationId: 'lep_phone_link_active',
        }),
      ],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'lightExtensionReferences.rebuildIndex',
    });

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      publicationId: 'lep_phone_link_active',
      versionPolicy: 'follow-active',
      settingsHash: stableJsonHash({
        activePlan: 'active-default',
      }),
      resolvedStatus: 'active',
    });
  });

  it('removes JS Field references after switching the host back to inline source', async () => {
    const uid = 'flow_js_field_inline';
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        [uid]: createJsFieldNode({
          uid,
          sourceMode: 'inline',
        }),
      },
      references: [
        createJsFieldReferenceRecord({
          modelUid: uid,
        }),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: uid,
      action: 'flowSurfaces.updateSettings',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 0,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('updates an existing reference without changing its primary key', async () => {
    const existing = createReferenceRecord({
      id: 'lef_existing',
      modelUid: 'flow_js_block',
      settingsHash: stableJsonHash({ threshold: 5, region: 'APAC' }),
    });
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          uid: 'flow_js_block',
          settings: {
            region: 'EMEA',
          },
        }),
      },
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [existing],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_block',
      action: 'flowModels.save',
    });

    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      id: 'lef_existing',
      settingsHash: stableJsonHash({
        threshold: 5,
        region: 'EMEA',
      }),
    });
  });

  it('removes stale references when an owner is no longer a JS Block', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_form_block: {
          uid: 'flow_form_block',
          use: 'FormBlockModel',
        },
      },
      references: [
        createReferenceRecord({
          id: 'lef_form_block_stale',
          modelUid: 'flow_form_block',
        }),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_form_block',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_non_js_block_owner',
      },
    );

    expect(result).toMatchObject({
      scanned: 1,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceRemove',
        reasonCode: 'owner_not_reference_adapter',
      }),
    );
  });

  it('marks stale references owner_missing when the owner record no longer exists', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_page: {
          uid: 'flow_page',
          use: 'PageModel',
        },
      },
      references: [
        createReferenceRecord({
          id: 'lef_deleted_owner',
          modelUid: 'flow_deleted_js_block',
        }),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_page',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_deleted_owner_reference',
      },
    );

    expect(result).toMatchObject({
      ownerMissing: 1,
      statusCounts: {
        owner_missing: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      id: 'lef_deleted_owner',
      resolvedStatus: 'owner_missing',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceOwnerMissing',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
  });

  it('does not mark the current owner hash owner_missing when a repo rebuild finds a stale hash for the same model', async () => {
    const uid = 'flow_js_field_reused_uid';
    const { service, repositories } = createReferenceServiceFixture({
      flowModels: [
        {
          uid,
          options: createJsFieldNode({
            uid,
            use: 'JSFieldModel',
            settings: {
              prefix: 'callto:',
            },
          }),
        },
      ],
      publications: [createJsFieldPublicationRecord()],
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [createJsFieldEntryRecord()],
      references: [
        createJsFieldReferenceRecord({
          id: 'lef_current_js_field_hash',
          modelUid: uid,
          use: 'JSFieldModel',
          resolvedStatus: 'active',
        }),
        createJsFieldReferenceRecord({
          id: 'lef_stale_js_field_hash',
          modelUid: uid,
          use: 'JSColumnModel',
          resolvedStatus: 'active',
        }),
      ],
    });

    const result = await service.rebuildIndex(
      {
        repoId: 'ler_fields',
      },
      {
        requestId: 'req_rebuild_same_model_stale_hash',
      },
    );

    expect(result).toMatchObject({
      upserted: 1,
      ownerMissing: 1,
      statusCounts: {
        active: 1,
        owner_missing: 1,
      },
    });
    expect(
      Object.fromEntries(
        repositories.lightExtensionReferences.records.map((record) => [record.get('id'), record.toJSON()]),
      ),
    ).toMatchObject({
      lef_current_js_field_hash: {
        resolvedStatus: 'active',
        ownerLocator: {
          modelUid: uid,
          use: 'JSFieldModel',
        },
      },
      lef_stale_js_field_hash: {
        resolvedStatus: 'owner_missing',
        ownerLocator: {
          modelUid: uid,
          use: 'JSColumnModel',
        },
      },
    });
  });

  it('does not duplicate owner_missing count or audit when a repository remove hook fires twice', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      references: [
        createReferenceRecord({
          id: 'lef_deleted_owner_once',
          modelUid: 'flow_deleted_once',
        }),
      ],
    });

    const first = await service.markFlowModelReferencesOwnerMissingForNodeTree(
      {
        rootUid: 'flow_deleted_once',
        action: 'flowModels.destroy',
      },
      {
        requestId: 'req_deleted_owner_once',
      },
    );
    const second = await service.markFlowModelReferencesOwnerMissingForNodeTree(
      {
        rootUid: 'flow_deleted_once',
        action: 'flowModels.repository.remove',
      },
      {
        requestId: 'req_deleted_owner_twice',
      },
    );

    expect(first).toMatchObject({
      ownerMissing: 1,
      statusCounts: {
        owner_missing: 1,
      },
    });
    expect(second).toMatchObject({
      ownerMissing: 0,
      statusCounts: {},
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      id: 'lef_deleted_owner_once',
      resolvedStatus: 'owner_missing',
    });
    expect(recordReferenceEvent.mock.calls.filter(([event]) => event.action === 'referenceOwnerMissing')).toHaveLength(
      1,
    );
  });
});
