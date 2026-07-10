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
  createJsActionEntryRecord,
  createJsActionNode,
  createJsBlockNode,
  createJsFieldEntryRecord,
  createJsFieldNode,
  createJsItemEntryRecord,
  createJsItemNode,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  createRunJSEntryRecord,
  createRunJSHostNode,
  stableJsonHash,
} from './reference-test-helpers';

describe('plugin-light-extension references service', () => {
  it('upserts JS Block references against the entry current runtime and removes them after switching inline', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          settings: {
            threshold: 7,
            region: 'EMEA',
            stale: 'removed',
          },
        }),
      },
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_block',
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
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      kind: 'js-block',
      settingsHash: stableJsonHash({
        threshold: 7,
        region: 'EMEA',
      }),
      resolvedStatus: 'active',
    });
    expect(JSON.stringify(repositories.lightExtensionReferences.records[0].toJSON())).not.toContain('publication');

    repositories.flowModels.findModelById.mockResolvedValueOnce(
      createJsBlockNode({
        sourceMode: 'inline',
      }),
    );

    const inlineResult = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_block',
      action: 'flowModels.save',
    });

    expect(inlineResult).toMatchObject({
      scanned: 1,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('derives reference statuses from repo, entry, runtime, and settings health', async () => {
    const cases = [
      {
        name: 'repo disabled',
        repo: createRepoRecord({ lifecycleStatus: 'disabled' }),
        entry: createEntryRecord(),
        expected: 'repo_disabled',
      },
      {
        name: 'entry missing',
        repo: createRepoRecord(),
        entry: createEntryRecord({ healthStatus: 'missing' }),
        expected: 'entry_missing',
      },
      {
        name: 'runtime missing',
        repo: createRepoRecord(),
        entry: createEntryRecord({ compiledCommitId: null, runtimeArtifact: null, runtimeCodeHash: null }),
        expected: 'runtime_missing',
      },
      {
        name: 'settings invalid',
        repo: createRepoRecord(),
        entry: createEntryRecord(),
        settings: {
          threshold: 99,
          region: 'EMEA',
        },
        expected: 'settings_invalid',
      },
    ];

    for (const testCase of cases) {
      const { service, repositories } = createReferenceServiceFixture({
        flowModelTrees: {
          flow_js_block: createJsBlockNode({
            settings: testCase.settings || {},
          }),
        },
        repos: [testCase.repo],
        entries: [testCase.entry],
      });

      await service.syncFlowModelReferencesForNodeTree({
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      });

      expect(repositories.lightExtensionReferences.records[0].toJSON(), testCase.name).toMatchObject({
        resolvedStatus: testCase.expected,
      });
    }
  });

  it('indexes JS field, action, item, and RunJS host references without publication identity', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        root: {
          uid: 'root',
          subModels: {
            field: createJsFieldNode(),
            action: createJsActionNode(),
            item: createJsItemNode(),
            runjs: createRunJSHostNode(),
          },
        },
      },
      repos: [
        createRepoRecord({ id: 'ler_fields' }),
        createRepoRecord({ id: 'ler_actions' }),
        createRepoRecord({ id: 'ler_items' }),
        createRepoRecord({ id: 'ler_runjs' }),
      ],
      entries: [
        createJsFieldEntryRecord(),
        createJsActionEntryRecord(),
        createJsItemEntryRecord(),
        createRunJSEntryRecord(),
      ],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'root',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 4,
      upserted: 4,
      statusCounts: {
        active: 4,
      },
    });
    expect(repositories.lightExtensionReferences.records.map((record) => record.get('kind')).sort()).toEqual([
      'js-action',
      'js-field',
      'js-item',
      'runjs',
    ]);
    expect(
      JSON.stringify(repositories.lightExtensionReferences.records.map((record) => record.toJSON())),
    ).not.toContain('publication');
  });

  it('refreshes existing references after an entry loses its current runtime artifact', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      repos: [createRepoRecord()],
      entries: [
        createEntryRecord({
          compiledCommitId: null,
          runtimeArtifact: null,
          runtimeCodeHash: null,
        }),
      ],
      references: [createReferenceRecord()],
    });

    await service.refreshReferencesForRepo('ler_sales');

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'runtime_missing',
    });
  });
});
