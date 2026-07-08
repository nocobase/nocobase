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
  createJsFieldEntryRecord,
  createJsFieldNode,
  createJsFieldPublicationRecord,
  createJsFieldReferenceRecord,
  createJsFieldSourceBinding,
  createPublicationRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  stableJsonHash,
} from './reference-test-helpers';

describe('plugin-light-extension reference service', () => {
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
