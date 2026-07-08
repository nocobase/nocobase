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
