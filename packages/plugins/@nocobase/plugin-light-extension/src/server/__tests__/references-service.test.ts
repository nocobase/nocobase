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
        name: 'runtime compiled from a non-head commit',
        repo: createRepoRecord({ headCommitId: 'vsc_commit_2' }),
        entry: createEntryRecord(),
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
      {
        name: 'legacy failed entry does not expose its previous runtime',
        repo: createRepoRecord(),
        entry: createEntryRecord({ healthStatus: 'failed' }),
        expected: 'runtime_missing',
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

  it('indexes JS field, action, item, and RunJS host references', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        root: {
          uid: 'root',
          subModels: {
            field: createJsFieldNode(),
            action: createJsActionNode(),
            item: createJsItemNode(),
            runjs: createRunJSHostNode({ storage: 'flowRegistry' }),
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
  });

  it('removes a RunJS host reference after the value switches back to inline source', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_form_runjs: createRunJSHostNode(),
      },
      repos: [createRepoRecord({ id: 'ler_runjs' })],
      entries: [createRunJSEntryRecord()],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_form_runjs',
      action: 'flowModels.save',
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);

    repositories.flowModels.findModelById.mockResolvedValueOnce(
      createRunJSHostNode({
        sourceMode: 'inline',
      }),
    );

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_form_runjs',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      removed: 1,
    });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('refreshes existing references after their runtime no longer matches the repo head', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      repos: [createRepoRecord({ headCommitId: 'vsc_commit_2' })],
      entries: [createEntryRecord()],
      references: [createReferenceRecord()],
    });

    await service.refreshReferencesForRepo('ler_sales');

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'runtime_missing',
    });
  });

  it('refreshes references with the owner current settings instead of schema defaults', async () => {
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          settings: {
            threshold: 99,
            region: 'EMEA',
          },
        }),
      },
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [createReferenceRecord()],
    });

    await service.refreshReferencesForRepo('ler_sales');

    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'settings_invalid',
      settingsHash: stableJsonHash({
        threshold: 99,
        region: 'EMEA',
      }),
    });
  });
});
