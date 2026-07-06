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
  createSourceBinding,
} from './reference-test-helpers';

describe('plugin-light-extension reference runtime state matrix', () => {
  it.each([
    {
      name: 'enabled repo with ready entry',
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      publications: [createPublicationRecord()],
      expectedStatus: 'active',
    },
    {
      name: 'disabled repo',
      repos: [createRepoRecord({ lifecycleStatus: 'disabled' })],
      entries: [createEntryRecord()],
      publications: [createPublicationRecord()],
      expectedStatus: 'repo_disabled',
    },
    {
      name: 'archived repo',
      repos: [createRepoRecord({ lifecycleStatus: 'archived' })],
      entries: [createEntryRecord()],
      publications: [createPublicationRecord()],
      expectedStatus: 'repo_archived',
    },
    {
      name: 'missing repo',
      repos: [],
      entries: [createEntryRecord()],
      publications: [createPublicationRecord()],
      expectedStatus: 'repo_missing',
    },
    {
      name: 'missing entry',
      repos: [createRepoRecord()],
      entries: [],
      publications: [createPublicationRecord()],
      expectedStatus: 'entry_missing',
    },
    {
      name: 'missing publication',
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      publications: [],
      expectedStatus: 'publication_missing',
    },
  ])('keeps pinned references and derives $name as $expectedStatus', async (testCase) => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          uid: 'flow_js_block',
        }),
      },
      publications: testCase.publications,
      repos: testCase.repos,
      entries: testCase.entries,
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_block',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      statusCounts: {
        [testCase.expectedStatus]: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      publicationId: 'lep_sales_kpi',
      resolvedStatus: testCase.expectedStatus,
    });
  });

  it('marks a stale source binding as outdated while keeping the publication-backed reference identity', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          uid: 'flow_js_block',
          sourceBinding: createSourceBinding({
            repoId: 'ler_stale',
            entryId: 'lee_stale',
          }),
        }),
      },
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree(
      {
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      },
      {
        requestId: 'req_binding_outdated',
      },
    );

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      publicationId: 'lep_sales_kpi',
      resolvedStatus: 'binding_outdated',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'referenceConflict',
        reasonCode: 'binding_outdated',
      }),
    );
  });

  it('does not overwrite owner-local conflict statuses during repo lifecycle refresh', async () => {
    const conflictCases = [
      {
        id: 'lef_binding_outdated',
        resolvedStatus: 'binding_outdated',
      },
      {
        id: 'lef_settings_invalid',
        resolvedStatus: 'settings_invalid',
      },
      {
        id: 'lef_owner_missing',
        resolvedStatus: 'owner_missing',
      },
    ];
    const { service, repositories } = createReferenceServiceFixture({
      publications: [createPublicationRecord()],
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: conflictCases.map((conflictCase) =>
        createReferenceRecord({
          id: conflictCase.id,
          modelUid: conflictCase.id,
          resolvedStatus: conflictCase.resolvedStatus,
        }),
      ),
    });

    await service.refreshReferencesForRepo('ler_sales', {
      requestId: 'req_refresh_preserve_conflicts',
    });

    expect(repositories.lightExtensionReferences.records.map((record) => record.toJSON())).toEqual(
      expect.arrayContaining(
        conflictCases.map((conflictCase) =>
          expect.objectContaining({
            id: conflictCase.id,
            resolvedStatus: conflictCase.resolvedStatus,
          }),
        ),
      ),
    );
  });
});
