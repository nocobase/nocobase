/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { hashReferenceOwnerLocator, normalizeReferenceOwnerLocator } from '../services/ReferenceOwnerRegistry';
import {
  createEntryRecord,
  createJsBlockNode,
  createPublicationRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
} from './reference-test-helpers';

describe('plugin-light-extension multi-host reference foundation', () => {
  it('describes active and placeholder owner adapters without requiring future hosts to be installed', async () => {
    const { service } = createReferenceServiceFixture();

    const diagnostics = await service.getContractDiagnostics();

    expect(diagnostics.ownerAdapters.map((adapter) => adapter.kind)).toEqual([
      'js-block',
      'js-field',
      'js-action',
      'js-item',
      'runjs',
      'event',
    ]);
    expect(diagnostics.ownerAdapters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          status: 'active',
          supportsVersionPolicy: true,
          supportsImpact: true,
          supportsBulkUpgrade: true,
          supportsRebuild: true,
        }),
        expect.objectContaining({
          kind: 'js-field',
          ownerKind: 'flowModel.fieldSettings',
          status: 'active',
          implementationTask: '03-task-js-field-entry-end-to-end.md',
          supportsVersionPolicy: true,
          supportsImpact: true,
          supportsBulkUpgrade: true,
          supportsRebuild: true,
        }),
        expect.objectContaining({
          kind: 'js-action',
          ownerKind: 'flowModel.actionSettings',
          status: 'active',
          implementationTask: '04-task-js-action-entry-end-to-end.md',
          supportsVersionPolicy: true,
          supportsImpact: true,
          supportsBulkUpgrade: true,
          supportsRebuild: true,
        }),
        expect.objectContaining({
          kind: 'runjs',
          ownerKind: 'flowModel.runjsHost',
          status: 'placeholder',
        }),
      ]),
    );
  });

  it('runs rebuild-index dry-run for JS Block owners without mutating the reference table', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
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
    });

    const result = await service.rebuildIndex({
      rootUid: 'flow_js_block',
      dryRun: true,
    });

    expect(result).toMatchObject({
      dryRun: true,
      scanned: 1,
      upserted: 1,
      removed: 0,
      ownerMissing: 0,
      statusCounts: {
        active: 1,
      },
      items: [
        expect.objectContaining({
          action: 'upsert',
          kind: 'js-block',
          ownerKind: 'flowModel.step',
          ownerLocatorHash: expect.stringMatching(/^sha256:/),
          repoId: 'ler_sales',
          entryId: 'lee_sales_kpi',
          publicationId: 'lep_sales_kpi',
          resolvedStatus: 'active',
        }),
      ],
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceRebuild',
        result: 'success',
        details: expect.objectContaining({
          dryRun: true,
          upserted: 1,
        }),
      }),
    );
  });

  it('does not rebuild JS Block references for future placeholder owner locators', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          uid: 'flow_js_block',
        }),
      },
      flowModels: [
        {
          uid: 'flow_js_block',
          options: createJsBlockNode({
            uid: 'flow_js_block',
          }),
        },
      ],
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    const result = await service.rebuildIndex({
      ownerLocator: {
        kind: 'flowModel.itemSettings',
        modelUid: 'flow_js_block',
      },
      dryRun: true,
    });

    expect(result).toMatchObject({
      dryRun: true,
      scanned: 0,
      upserted: 0,
      removed: 0,
      ownerMissing: 0,
    });
    expect(result.items).toBeUndefined();
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
    expect(repositories.flowModels.find).not.toHaveBeenCalled();
  });

  it('uses stable non-step owner hashes without descriptor text', () => {
    const first = normalizeReferenceOwnerLocator({
      kind: 'flowModel.fieldSettings',
      modelUid: 'flow_field_phone',
      descriptor: 'Field model settings locator',
    });
    const second = normalizeReferenceOwnerLocator({
      kind: 'flowModel.fieldSettings',
      modelUid: 'flow_field_phone',
      descriptor: 'Renamed display text',
    });

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    if (!first || !second) {
      throw new Error('Expected field settings owner locators to normalize');
    }
    expect(hashReferenceOwnerLocator(first)).toBe(hashReferenceOwnerLocator(second));
    expect(
      normalizeReferenceOwnerLocator({
        kind: 'flowModel.fieldSettings',
        descriptor: 'missing owner uid',
      }),
    ).toBeNull();
  });

  it('generates a stable ownerLocatorHash per copied owner instead of reusing the source owner hash', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_source_block: createJsBlockNode({
          uid: 'flow_source_block',
        }),
        flow_copied_block: createJsBlockNode({
          uid: 'flow_copied_block',
        }),
      },
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_source_block',
      action: 'flowModels.save',
    });
    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_copied_block',
      action: 'flowModels.duplicate',
    });

    const records = repositories.lightExtensionReferences.records.map((record) => record.toJSON());
    expect(records).toHaveLength(2);
    expect(new Set(records.map((record) => record.ownerLocatorHash)).size).toBe(2);
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ownerLocator: expect.objectContaining({ modelUid: 'flow_source_block' }),
        }),
        expect.objectContaining({
          ownerLocator: expect.objectContaining({ modelUid: 'flow_copied_block' }),
        }),
      ]),
    );
  });

  it('marks stale references for non-adapter owners without assuming every FlowModel node is a JS Block', async () => {
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
        requestId: 'req_non_adapter_owner',
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
});
