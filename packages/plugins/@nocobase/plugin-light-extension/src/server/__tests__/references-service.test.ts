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
  createJsPageEntryRecord,
  createJsPageNode,
  createJsPageReferenceRecord,
  createJsPageSourceBinding,
  createReferenceRecord,
  createReferenceServiceFixture,
  createRepoRecord,
  createRunJSEntryRecord,
  createRunJSHostNode,
  stableJsonHash,
} from './reference-test-helpers';
import {
  buildReferenceOwnerLocator,
  getReferenceOwnerAdapterByUse,
  hashReferenceOwnerLocator,
} from '../services/ReferenceOwnerRegistry';
import type { LightExtensionRuntimeSourceBinding } from '../../shared/types';

describe('plugin-light-extension references service', () => {
  it('maintains an independent JS Page reference through external updates and return to inline', async () => {
    const { service, repositories, flowModelTrees } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_page: createJsPageNode({
          settings: {
            threshold: 7,
            region: 'EMEA',
          },
        }),
      },
      repos: [createRepoRecord({ id: 'ler_pages' }), createRepoRecord({ id: 'ler_support' })],
      entries: [createJsPageEntryRecord(), createJsPageEntryRecord({ id: 'lee_support_page', repoId: 'ler_support' })],
    });

    await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_page',
      action: 'flowModels.save',
    });

    const pageAdapter = getReferenceOwnerAdapterByUse('JSPageModel');
    const blockAdapter = getReferenceOwnerAdapterByUse('JSBlockModel');
    if (!pageAdapter || !blockAdapter) {
      throw new Error('Expected JS Page and JS Block reference owner adapters');
    }
    const pageLocator = buildReferenceOwnerLocator(pageAdapter, 'flow_js_page', 'JSPageModel');
    const blockLocator = buildReferenceOwnerLocator(blockAdapter, 'flow_js_page', 'JSBlockModel');
    expect(pageLocator).toMatchObject({
      kind: 'flowModel.pageSettings',
      use: 'JSPageModel',
      stepPath: ['stepParams', 'jsSettings', 'runJs'],
    });
    expect(hashReferenceOwnerLocator(pageLocator)).not.toBe(hashReferenceOwnerLocator(blockLocator));
    expect(hashReferenceOwnerLocator(pageLocator)).toBe(
      hashReferenceOwnerLocator(buildReferenceOwnerLocator(pageAdapter, 'flow_js_page', 'JSPageModel')),
    );
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_pages',
      entryId: 'lee_sales_page',
      kind: 'js-page',
      ownerKind: 'flowModel.pageSettings',
      ownerLocator: pageLocator,
      ownerLocatorHash: hashReferenceOwnerLocator(pageLocator),
      settingsHash: stableJsonHash({ threshold: 7, region: 'EMEA' }),
      resolvedStatus: 'active',
    });

    flowModelTrees.flow_js_page = createJsPageNode({
      settings: {
        threshold: 8,
        region: 'EMEA',
      },
    });
    await service.syncFlowModelReferencesForNodeTree({ rootUid: 'flow_js_page', action: 'flowModels.save' });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].get('settingsHash')).toBe(
      stableJsonHash({ threshold: 8, region: 'EMEA' }),
    );

    flowModelTrees.flow_js_page = createJsPageNode({
      sourceBinding: createJsPageSourceBinding({
        repoId: 'ler_support',
        entryId: 'lee_support_page',
      }),
    });
    await service.syncFlowModelReferencesForNodeTree({ rootUid: 'flow_js_page', action: 'flowModels.save' });
    expect(repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'ler_support',
      entryId: 'lee_support_page',
      resolvedStatus: 'active',
    });

    flowModelTrees.flow_js_page = createJsPageNode({ sourceMode: 'inline' });
    const inlineResult = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_js_page',
      action: 'flowModels.save',
    });
    expect(inlineResult).toMatchObject({ scanned: 1, removed: 1 });
    expect(repositories.lightExtensionReferences.records).toHaveLength(0);
  });

  it('derives JS Page status from repo, entry, runtime, and settings state', async () => {
    const cases: Array<{
      name: string;
      repo: Record<string, unknown>;
      entry: Record<string, unknown>;
      settings?: Record<string, unknown>;
      sourceBinding?: LightExtensionRuntimeSourceBinding;
      expected: string;
      reason?: string;
    }> = [
      {
        name: 'repo disabled',
        repo: createRepoRecord({ id: 'ler_pages', lifecycleStatus: 'disabled' }),
        entry: createJsPageEntryRecord(),
        expected: 'repo_disabled',
      },
      {
        name: 'repo archived',
        repo: createRepoRecord({ id: 'ler_pages', lifecycleStatus: 'archived' }),
        entry: createJsPageEntryRecord(),
        expected: 'repo_archived',
      },
      {
        name: 'entry missing',
        repo: createRepoRecord({ id: 'ler_pages' }),
        entry: createJsPageEntryRecord({ healthStatus: 'missing' }),
        expected: 'entry_missing',
      },
      {
        name: 'runtime missing',
        repo: createRepoRecord({ id: 'ler_pages' }),
        entry: createJsPageEntryRecord({ compiledCommitId: null, runtimeArtifact: null, runtimeCodeHash: null }),
        expected: 'runtime_missing',
      },
      {
        name: 'settings invalid',
        repo: createRepoRecord({ id: 'ler_pages' }),
        entry: createJsPageEntryRecord(),
        settings: { threshold: 99, region: 'EMEA' },
        expected: 'settings_invalid',
      },
      {
        name: 'binding kind mismatch',
        repo: createRepoRecord({ id: 'ler_pages' }),
        entry: createJsPageEntryRecord(),
        sourceBinding: createJsPageSourceBinding({ kind: 'js-block' }),
        expected: 'binding_outdated',
        reason: 'kind_mismatch',
      },
    ];

    for (const testCase of cases) {
      const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
        flowModelTrees: {
          flow_js_page: createJsPageNode({
            settings: testCase.settings,
            sourceBinding: testCase.sourceBinding,
          }),
        },
        repos: [testCase.repo],
        entries: [testCase.entry],
      });

      await service.syncFlowModelReferencesForNodeTree({ rootUid: 'flow_js_page', action: 'flowModels.save' });

      expect(repositories.lightExtensionReferences.records[0].get('resolvedStatus'), testCase.name).toBe(
        testCase.expected,
      );
      if (testCase.expected === 'settings_invalid') {
        expect(repositories.lightExtensionReferences.records[0].get('settingsHash')).toBe(
          stableJsonHash({ threshold: 99, region: 'EMEA' }),
        );
      }
      expect(recordReferenceEvent, testCase.name).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'referenceConflict',
          ownerKind: 'flowModel.pageSettings',
          reasonCode: testCase.reason || testCase.expected,
        }),
      );
    }
  });

  it('refreshes JS Page repo lifecycle status without saving the page and marks deleted pages missing', async () => {
    const { service, repositories, flowModelTrees } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_page: createJsPageNode(),
      },
      repos: [createRepoRecord({ id: 'ler_pages' })],
      entries: [createJsPageEntryRecord()],
      references: [createJsPageReferenceRecord()],
    });

    await repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'disabled' });
    await service.refreshReferencesForRepo('ler_pages');
    expect(repositories.lightExtensionReferences.records[0].get('resolvedStatus')).toBe('repo_disabled');

    await repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'archived' });
    await service.refreshReferencesForRepo('ler_pages');
    expect(repositories.lightExtensionReferences.records[0].get('resolvedStatus')).toBe('repo_archived');

    delete flowModelTrees.flow_js_page;
    await service.markFlowModelReferencesOwnerMissingForNodeTree({
      rootUid: 'flow_js_page',
      action: 'flowSurfaces.destroyPage',
    });
    expect(repositories.lightExtensionReferences.records[0].get('resolvedStatus')).toBe('owner_missing');
  });

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

  it('indexes FormJSFieldItemModel as a JS item reference owner', async () => {
    const formJsItem = createJsItemNode({ uid: 'flow_form_js_item' });
    formJsItem.use = 'FormJSFieldItemModel';
    const { service, repositories } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_form_js_item: formJsItem,
      },
      repos: [createRepoRecord({ id: 'ler_items' })],
      entries: [createJsItemEntryRecord()],
    });

    const result = await service.syncFlowModelReferencesForNodeTree({
      rootUid: 'flow_form_js_item',
      action: 'flowSurfaces.updateSettings',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      statusCounts: {
        active: 1,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      kind: 'js-item',
      ownerLocator: expect.objectContaining({
        use: 'FormJSFieldItemModel',
      }),
    });
  });

  it('records repo_missing and binding_outdated without blocking reference synchronization', async () => {
    const missingRepoFixture = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode(),
      },
      repos: [],
      entries: [],
    });
    await expect(
      missingRepoFixture.service.syncFlowModelReferencesForNodeTree({
        rootUid: 'flow_js_field',
        action: 'flowSurfaces.updateSettings',
      }),
    ).resolves.toMatchObject({
      statusCounts: {
        repo_missing: 1,
      },
    });
    expect(missingRepoFixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'repo_missing',
    });

    const outdatedFixture = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode({
          sourceBinding: {
            type: 'light-extension-entry',
            repoId: 'ler_fields',
            entryId: 'lee_fields',
            kind: 'js-action',
          },
        }),
      },
      repos: [createRepoRecord({ id: 'ler_fields' })],
      entries: [],
    });
    await expect(
      outdatedFixture.service.syncFlowModelReferencesForNodeTree({
        rootUid: 'flow_js_field',
        action: 'flowSurfaces.updateSettings',
      }),
    ).resolves.toMatchObject({
      statusCounts: {
        binding_outdated: 1,
      },
    });
    expect(outdatedFixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'binding_outdated',
    });
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

  it('skips reference loading entirely when the refresh plan has no reference fingerprint changes', async () => {
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      repos: [createRepoRecord()],
      entries: [createEntryRecord()],
      references: [createReferenceRecord()],
    });

    const result = await service.refreshReferences({
      repoId: 'ler_sales',
      plan: {
        mode: 'skip',
        reason: 'reference_fingerprint_unchanged',
      },
    });

    expect(result).toEqual({
      mode: 'skip',
      reason: 'reference_fingerprint_unchanged',
      targetEntryCount: 0,
      referenceCount: 0,
      changed: 0,
      statusCounts: {},
    });
    expect(repositories.lightExtensionReferences.find).not.toHaveBeenCalled();
    expect(repositories.lightExtensionRepos.findOne).not.toHaveBeenCalled();
    expect(repositories.lightExtensionEntries.find).not.toHaveBeenCalled();
    expect(repositories.flowModels.findModelById).not.toHaveBeenCalled();
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          mode: 'skip',
          reason: 'reference_fingerprint_unchanged',
          targetEntryCount: 0,
          referenceCount: 0,
          changed: 0,
        }),
      }),
    );
  });

  it('refreshes only target entry references with one repo load, one entry load, and one owner-root load', async () => {
    const secondEntry = createEntryRecord({
      id: 'lee_other',
      entryName: 'other',
      entryPath: 'src/client/js-blocks/other/index.tsx',
      descriptorPath: 'src/client/js-blocks/other/entry.json',
    });
    const { service, repositories, recordReferenceEvent } = createReferenceServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      repos: [createRepoRecord({ headCommitId: 'vsc_commit_2' })],
      entries: [createEntryRecord(), secondEntry],
      references: [
        createReferenceRecord({ id: 'lef_target_1' }),
        createReferenceRecord({ id: 'lef_target_2' }),
        createReferenceRecord({
          id: 'lef_other',
          modelUid: 'flow_other',
          entryId: 'lee_other',
        }),
      ],
    });

    const result = await service.refreshReferences({
      repoId: 'ler_sales',
      plan: {
        mode: 'entries',
        entryIds: ['lee_sales_kpi', 'lee_sales_kpi'],
        reason: 'entry_reference_fingerprint_changed',
      },
    });

    expect(result).toMatchObject({
      mode: 'entries',
      targetEntryCount: 1,
      referenceCount: 2,
      changed: 2,
      statusCounts: {
        runtime_missing: 2,
      },
    });
    expect(repositories.lightExtensionReferences.records[0].get('resolvedStatus')).toBe('runtime_missing');
    expect(repositories.lightExtensionReferences.records[1].get('resolvedStatus')).toBe('runtime_missing');
    expect(repositories.lightExtensionReferences.records[2].get('resolvedStatus')).toBe('active');
    expect(repositories.lightExtensionReferences.find).toHaveBeenCalledTimes(1);
    expect(repositories.lightExtensionRepos.findOne).toHaveBeenCalledTimes(1);
    expect(repositories.lightExtensionEntries.find).toHaveBeenCalledTimes(1);
    expect(repositories.flowModels.findModelById).toHaveBeenCalledTimes(1);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          mode: 'entries',
          reason: 'entry_reference_fingerprint_changed',
          targetEntryCount: 1,
          referenceCount: 2,
          changed: 2,
          statusCounts: {
            runtime_missing: 2,
          },
        }),
      }),
    );
  });
});
