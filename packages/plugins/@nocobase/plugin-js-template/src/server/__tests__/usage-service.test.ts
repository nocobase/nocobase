/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createTemplateRecord,
  createJsActionTemplateRecord,
  createJsActionNode,
  createJsBlockNode,
  createJsFieldTemplateRecord,
  createJsFieldNode,
  createJsFieldSourceBinding,
  createJsItemTemplateRecord,
  createJsItemNode,
  createJsPageTemplateRecord,
  createJsPageNode,
  createJsPageUsageRecord,
  createJsPageSourceBinding,
  createSourceBinding,
  createUsageRecord,
  createJsTemplateUsageServiceFixture,
  createProjectRecord,
  stableJsonHash,
} from './usage-test-helpers';
import {
  buildUsageOwnerLocator,
  getUsageOwnerAdapterByUse,
  hashUsageOwnerLocator,
} from '../services/JsTemplateUsageOwnerRegistry';
import type { JsTemplateRuntimeSourceBinding } from '../../shared/types';

describe('plugin-js-template usage service', () => {
  it('maintains an independent JS Page usage through external updates and return to inline', async () => {
    const { service, repositories, flowModelTrees, projectService } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_page: createJsPageNode({
          settings: {
            threshold: 7,
            region: 'EMEA',
          },
        }),
      },
      projects: [createProjectRecord({ id: 'jtp_pages' }), createProjectRecord({ id: 'jtp_support' })],
      templates: [
        createJsPageTemplateRecord(),
        createJsPageTemplateRecord({ id: 'jtt_support_page', projectId: 'jtp_support' }),
      ],
    });
    const lockProject = vi.spyOn(projectService, 'lockInternalProjectForUpdate');

    await service.syncFlowModelUsagesForNodeTree({
      rootUid: 'flow_js_page',
      action: 'flowModels.save',
    });

    const pageAdapter = getUsageOwnerAdapterByUse('JSPageModel');
    const blockAdapter = getUsageOwnerAdapterByUse('JSBlockModel');
    if (!pageAdapter || !blockAdapter) {
      throw new Error('Expected JS Page and JS Block usage owner adapters');
    }
    const pageLocator = buildUsageOwnerLocator(pageAdapter, 'flow_js_page', 'JSPageModel');
    const blockLocator = buildUsageOwnerLocator(blockAdapter, 'flow_js_page', 'JSBlockModel');
    expect(pageLocator).toMatchObject({
      kind: 'flowModel.pageSettings',
      use: 'JSPageModel',
      stepPath: ['stepParams', 'jsSettings', 'runJs'],
    });
    expect(hashUsageOwnerLocator(pageLocator)).not.toBe(hashUsageOwnerLocator(blockLocator));
    expect(hashUsageOwnerLocator(pageLocator)).toBe(
      hashUsageOwnerLocator(buildUsageOwnerLocator(pageAdapter, 'flow_js_page', 'JSPageModel')),
    );
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      projectId: 'jtp_pages',
      templateId: 'jtt_sales_page',
      kind: 'js-page',
      ownerKind: 'flowModel.pageSettings',
      ownerLocator: pageLocator,
      ownerLocatorHash: hashUsageOwnerLocator(pageLocator),
      settingsHash: stableJsonHash({ threshold: 7, region: 'EMEA' }),
      resolvedStatus: 'active',
    });
    expect(lockProject).toHaveBeenCalledWith('jtp_pages', expect.objectContaining({ transaction: expect.anything() }));

    flowModelTrees.flow_js_page = createJsPageNode({
      settings: {
        threshold: 8,
        region: 'EMEA',
      },
    });
    await service.syncFlowModelUsagesForNodeTree({ rootUid: 'flow_js_page', action: 'flowModels.save' });
    expect(repositories.jsTemplateUsages.records).toHaveLength(1);
    expect(repositories.jsTemplateUsages.records[0].get('settingsHash')).toBe(
      stableJsonHash({ threshold: 8, region: 'EMEA' }),
    );

    flowModelTrees.flow_js_page = createJsPageNode({
      sourceBinding: createJsPageSourceBinding({
        projectId: 'jtp_support',
        templateId: 'jtt_support_page',
      }),
    });
    await service.syncFlowModelUsagesForNodeTree({ rootUid: 'flow_js_page', action: 'flowModels.save' });
    expect(repositories.jsTemplateUsages.records).toHaveLength(1);
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      projectId: 'jtp_support',
      templateId: 'jtt_support_page',
      resolvedStatus: 'active',
    });

    flowModelTrees.flow_js_page = createJsPageNode({ sourceMode: 'inline' });
    const inlineResult = await service.syncFlowModelUsagesForNodeTree({
      rootUid: 'flow_js_page',
      action: 'jsTemplates.detachToInline',
    });
    expect(inlineResult).toMatchObject({ scanned: 1, removed: 1 });
    expect(repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('derives JS Page rebuild status from project, template, runtime, and settings state', async () => {
    const cases: Array<{
      name: string;
      project: Record<string, unknown>;
      template: Record<string, unknown>;
      settings?: Record<string, unknown>;
      sourceBinding?: JsTemplateRuntimeSourceBinding;
      expected: string;
      reason?: string;
    }> = [
      {
        name: 'project disabled',
        project: createProjectRecord({ id: 'jtp_pages', lifecycleStatus: 'disabled' }),
        template: createJsPageTemplateRecord(),
        expected: 'project_disabled',
      },
      {
        name: 'template missing',
        project: createProjectRecord({ id: 'jtp_pages' }),
        template: createJsPageTemplateRecord({ healthStatus: 'missing' }),
        expected: 'template_missing',
      },
      {
        name: 'runtime missing',
        project: createProjectRecord({ id: 'jtp_pages' }),
        template: createJsPageTemplateRecord({ compiledCommitId: null, runtimeArtifact: null, runtimeCodeHash: null }),
        expected: 'runtime_missing',
      },
      {
        name: 'settings invalid',
        project: createProjectRecord({ id: 'jtp_pages' }),
        template: createJsPageTemplateRecord(),
        settings: { threshold: 99, region: 'EMEA' },
        expected: 'settings_invalid',
      },
    ];

    for (const testCase of cases) {
      const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
        flowModelTrees: {
          flow_js_page: createJsPageNode({
            settings: testCase.settings,
            sourceBinding: testCase.sourceBinding,
          }),
        },
        projects: [testCase.project],
        templates: [testCase.template],
      });

      await service.syncFlowModelUsagesForNodeTree({ rootUid: 'flow_js_page', action: 'usageRebuild' });

      expect(repositories.jsTemplateUsages.records[0].get('resolvedStatus'), testCase.name).toBe(testCase.expected);
      if (testCase.expected === 'settings_invalid') {
        expect(repositories.jsTemplateUsages.records[0].get('settingsHash')).toBe(
          stableJsonHash({ threshold: 99, region: 'EMEA' }),
        );
      }
      expect(recordUsageEvent, testCase.name).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'usageConflict',
          ownerKind: 'flowModel.pageSettings',
          reasonCode: testCase.reason || testCase.expected,
        }),
      );
    }
  });

  it('refreshes JS Page project lifecycle status without saving the page and marks deleted pages missing', async () => {
    const { service, repositories, flowModelTrees } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_page: createJsPageNode(),
      },
      projects: [createProjectRecord({ id: 'jtp_pages' })],
      templates: [createJsPageTemplateRecord()],
      usages: [createJsPageUsageRecord()],
    });

    await repositories.jsTemplateProjects.records[0].update({ lifecycleStatus: 'disabled' });
    await service.refreshUsagesForProject('jtp_pages');
    expect(repositories.jsTemplateUsages.records[0].get('resolvedStatus')).toBe('project_disabled');

    delete flowModelTrees.flow_js_page;
    await service.markFlowModelUsagesOwnerMissingForNodeTree({
      rootUid: 'flow_js_page',
      action: 'flowSurfaces.destroyPage',
    });
    expect(repositories.jsTemplateUsages.records[0].get('resolvedStatus')).toBe('owner_missing');
  });

  it('upserts JS Block usages against the current template runtime and removes them after switching inline', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          settings: {
            threshold: 7,
            region: 'EMEA',
            stale: 'removed',
          },
        }),
      },
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
    });

    const result = await service.syncFlowModelUsagesForNodeTree({
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
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      projectId: 'jtp_sales',
      templateId: 'jtt_sales_kpi',
      kind: 'js-block',
      settingsHash: stableJsonHash({
        threshold: 7,
        region: 'EMEA',
      }),
      resolvedStatus: 'active',
    });

    repositories.flowModels.findModelById.mockResolvedValue(
      createJsBlockNode({
        sourceMode: 'inline',
      }),
    );

    await expect(
      service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_CONFLICT', status: 409 });
    expect(repositories.jsTemplateUsages.records).toHaveLength(1);

    const inlineResult = await service.syncFlowModelUsagesForNodeTree({
      rootUid: 'flow_js_block',
      action: 'jsTemplates.detachToInline',
    });

    expect(inlineResult).toMatchObject({
      scanned: 1,
      removed: 1,
    });
    expect(repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('derives usage statuses from project, template, runtime, and settings health', async () => {
    const cases = [
      {
        name: 'project disabled',
        project: createProjectRecord({ lifecycleStatus: 'disabled' }),
        template: createTemplateRecord(),
        expected: 'project_disabled',
      },
      {
        name: 'template missing',
        project: createProjectRecord(),
        template: createTemplateRecord({ healthStatus: 'missing' }),
        expected: 'template_missing',
      },
      {
        name: 'runtime missing',
        project: createProjectRecord(),
        template: createTemplateRecord({ compiledCommitId: null, runtimeArtifact: null, runtimeCodeHash: null }),
        expected: 'runtime_missing',
      },
      {
        name: 'runtime compiled from a non-head commit',
        project: createProjectRecord({ headCommitId: 'vsc_commit_2' }),
        template: createTemplateRecord(),
        expected: 'runtime_missing',
      },
      {
        name: 'settings invalid',
        project: createProjectRecord(),
        template: createTemplateRecord(),
        settings: {
          threshold: 99,
          region: 'EMEA',
        },
        expected: 'settings_invalid',
      },
      {
        name: 'failed template does not expose its previous runtime',
        project: createProjectRecord(),
        template: createTemplateRecord({ healthStatus: 'failed' }),
        expected: 'runtime_missing',
      },
    ];

    for (const testCase of cases) {
      const { service, repositories } = createJsTemplateUsageServiceFixture({
        flowModelTrees: {
          flow_js_block: createJsBlockNode({
            settings: testCase.settings || {},
          }),
        },
        projects: [testCase.project],
        templates: [testCase.template],
      });

      await service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      });

      expect(repositories.jsTemplateUsages.records[0].toJSON(), testCase.name).toMatchObject({
        resolvedStatus: testCase.expected,
      });
    }
  });

  it('indexes usages for all five retained JS Template kinds', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        root: {
          uid: 'root',
          subModels: {
            block: createJsBlockNode(),
            page: createJsPageNode(),
            field: createJsFieldNode(),
            action: createJsActionNode(),
            item: createJsItemNode(),
          },
        },
      },
      projects: [
        createProjectRecord(),
        createProjectRecord({ id: 'jtp_pages' }),
        createProjectRecord({ id: 'jtp_fields' }),
        createProjectRecord({ id: 'jtp_actions' }),
        createProjectRecord({ id: 'jtp_items' }),
      ],
      templates: [
        createTemplateRecord(),
        createJsPageTemplateRecord(),
        createJsFieldTemplateRecord(),
        createJsActionTemplateRecord(),
        createJsItemTemplateRecord(),
      ],
    });

    const result = await service.syncFlowModelUsagesForNodeTree({
      rootUid: 'root',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 5,
      upserted: 5,
      statusCounts: {
        active: 5,
      },
    });
    expect(repositories.jsTemplateUsages.records.map((record) => record.get('kind')).sort()).toEqual([
      'js-action',
      'js-block',
      'js-field',
      'js-item',
      'js-page',
    ]);
  });

  it('does not index the form JS field menu provider as a source owner', async () => {
    expect(getUsageOwnerAdapterByUse('FormJSFieldItemModel')).toBeUndefined();
  });

  it('reports project_missing and binding_outdated without writing during an explicit dry-run rebuild', async () => {
    const missingRepoFixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode(),
      },
      projects: [],
      templates: [],
    });
    await expect(
      missingRepoFixture.service.rebuildUsages({ rootUid: 'flow_js_field', dryRun: true }),
    ).resolves.toMatchObject({
      statusCounts: {
        project_missing: 1,
      },
      items: [expect.objectContaining({ action: 'upsert', resolvedStatus: 'project_missing' })],
    });
    expect(missingRepoFixture.repositories.jsTemplateUsages.records).toHaveLength(0);

    const outdatedFixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode({
          sourceBinding: {
            type: 'js-template-entry',
            projectId: 'jtp_fields',
            templateId: 'jtt_fields',
            kind: 'js-action',
          },
        }),
      },
      projects: [createProjectRecord({ id: 'jtp_fields' })],
      templates: [],
    });
    await expect(
      outdatedFixture.service.rebuildUsages({ rootUid: 'flow_js_field', dryRun: true }),
    ).resolves.toMatchObject({
      statusCounts: {
        binding_outdated: 1,
      },
      items: [expect.objectContaining({ action: 'upsert', resolvedStatus: 'binding_outdated' })],
    });
    expect(outdatedFixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('uses a locked ownership read for rootless writes and an unlocked ownership read for dry runs', async () => {
    const flowModel = {
      uid: 'flow_js_block',
      options: createJsBlockNode(),
    };
    const writeFixture = createJsTemplateUsageServiceFixture({
      flowModels: [flowModel],
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
    });
    const writeLock = vi.spyOn(writeFixture.projectService, 'lockInternalProjectForUpdate');
    const writeRead = vi.spyOn(writeFixture.projectService, 'getInternalProject');

    await writeFixture.service.rebuildUsages();

    expect(writeLock).toHaveBeenCalledWith('jtp_sales', expect.objectContaining({ transaction: expect.anything() }));
    expect(writeRead).not.toHaveBeenCalled();

    const dryRunFixture = createJsTemplateUsageServiceFixture({
      flowModels: [flowModel],
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
    });
    const dryRunLock = vi.spyOn(dryRunFixture.projectService, 'lockInternalProjectForUpdate');
    const dryRunRead = vi.spyOn(dryRunFixture.projectService, 'getInternalProject');

    await dryRunFixture.service.rebuildUsages({ dryRun: true });

    expect(dryRunLock).not.toHaveBeenCalled();
    expect(dryRunRead).toHaveBeenCalledWith('jtp_sales', expect.objectContaining({ dryRun: true }));
    expect(dryRunFixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('rejects a mismatched Project and Template while the Project update lock is held', async () => {
    const fixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode({
          sourceBinding: createJsFieldSourceBinding({
            projectId: 'jtp_fields',
            templateId: 'jtt_other_field',
          }),
        }),
      },
      projects: [createProjectRecord({ id: 'jtp_fields' }), createProjectRecord({ id: 'jtp_other' })],
      templates: [createJsFieldTemplateRecord({ id: 'jtt_other_field', projectId: 'jtp_other' })],
    });
    const lockProject = vi.spyOn(fixture.projectService, 'lockInternalProjectForUpdate');

    await expect(
      fixture.service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_field',
        action: 'flowSurfaces.updateSettings',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
    expect(lockProject).toHaveBeenCalledWith('jtp_fields', expect.objectContaining({ transaction: expect.anything() }));
    expect(fixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('does not create a Usage for a foreign-application binding', async () => {
    const fixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          sourceBinding: createSourceBinding({ projectId: 'jtp_foreign', templateId: 'jtt_foreign' }),
        }),
      },
      projects: [createProjectRecord({ id: 'jtp_foreign', applicationName: 'support' })],
      templates: [createTemplateRecord({ id: 'jtt_foreign', projectId: 'jtp_foreign' })],
    });

    await expect(
      fixture.service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_block',
        action: 'flowModels.save',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
    expect(fixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('does not reveal a foreign Template Project through dry-run binding diagnostics', async () => {
    const fixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          sourceBinding: createSourceBinding({ projectId: 'jtp_sales', templateId: 'jtt_foreign' }),
        }),
      },
      projects: [createProjectRecord(), createProjectRecord({ id: 'jtp_foreign_secret', applicationName: 'support' })],
      templates: [createTemplateRecord({ id: 'jtt_foreign', projectId: 'jtp_foreign_secret' })],
    });

    const result = await fixture.service.rebuildUsages({ rootUid: 'flow_js_block', dryRun: true });

    expect(result).toMatchObject({
      statusCounts: { template_missing: 1 },
      items: [
        expect.objectContaining({
          action: 'upsert',
          projectId: 'jtp_sales',
          templateId: 'jtt_foreign',
          resolvedStatus: 'template_missing',
        }),
      ],
    });
    expect(JSON.stringify(result)).not.toContain('jtp_foreign_secret');
    expect(fixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('limits owner-hash cleanup to the current application', async () => {
    const mainUsage = createUsageRecord({ id: 'jtu_main_owner' });
    const foreignUsage = createUsageRecord({
      id: 'jtu_foreign_owner',
      projectId: 'jtp_foreign',
      templateId: 'jtt_foreign',
    });
    const fixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({ sourceMode: 'inline' }),
      },
      projects: [createProjectRecord(), createProjectRecord({ id: 'jtp_foreign', applicationName: 'support' })],
      templates: [createTemplateRecord(), createTemplateRecord({ id: 'jtt_foreign', projectId: 'jtp_foreign' })],
      usages: [mainUsage, foreignUsage],
    });

    await expect(
      fixture.service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_block',
        action: 'jsTemplates.detachToInline',
      }),
    ).resolves.toMatchObject({ removed: 1 });
    expect(fixture.repositories.jsTemplateUsages.records.map((usage) => usage.get('id'))).toEqual([
      'jtu_foreign_owner',
    ]);
  });

  it('keeps foreign usages unchanged during an unscoped rebuild', async () => {
    const fixture = createJsTemplateUsageServiceFixture({
      projects: [createProjectRecord(), createProjectRecord({ id: 'jtp_foreign', applicationName: 'support' })],
      templates: [createTemplateRecord(), createTemplateRecord({ id: 'jtt_foreign', projectId: 'jtp_foreign' })],
      usages: [
        createUsageRecord({ id: 'jtu_main_missing_owner', modelUid: 'flow_main_missing' }),
        createUsageRecord({
          id: 'jtu_foreign_missing_owner',
          modelUid: 'flow_foreign_missing',
          projectId: 'jtp_foreign',
          templateId: 'jtt_foreign',
        }),
      ],
    });

    await fixture.service.rebuildUsages();

    expect(fixture.repositories.jsTemplateUsages.records.map((usage) => usage.toJSON())).toEqual([
      expect.objectContaining({ id: 'jtu_main_missing_owner', resolvedStatus: 'owner_missing' }),
      expect.objectContaining({ id: 'jtu_foreign_missing_owner', resolvedStatus: 'active' }),
    ]);
  });

  it.each(['jtp_foreign', 'jtp_missing'])(
    'does not distinguish a foreign or missing rebuild Project (%s)',
    async (projectId) => {
      const fixture = createJsTemplateUsageServiceFixture({
        projects: [createProjectRecord({ id: 'jtp_foreign', applicationName: 'support' })],
      });

      await expect(fixture.service.rebuildUsages({ projectId })).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PROJECT_NOT_FOUND',
        status: 404,
      });
      await expect(
        fixture.service.refreshUsages({
          projectId,
          plan: { mode: 'project', reason: 'application_boundary_test' },
        }),
      ).rejects.toMatchObject({
        code: 'JS_TEMPLATE_PROJECT_NOT_FOUND',
        status: 404,
      });
    },
  );

  it('rejects an authoring save when its Project or Template target disappeared', async () => {
    const missingProjectFixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode(),
      },
      projects: [],
      templates: [],
    });
    await expect(
      missingProjectFixture.service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_field',
        action: 'flowSurfaces.updateSettings',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
    expect(missingProjectFixture.repositories.jsTemplateUsages.records).toHaveLength(0);

    const missingTemplateFixture = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_field: createJsFieldNode(),
      },
      projects: [createProjectRecord({ id: 'jtp_fields' })],
      templates: [],
    });
    await expect(
      missingTemplateFixture.service.syncFlowModelUsagesForNodeTree({
        rootUid: 'flow_js_field',
        action: 'flowModels.save',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
    expect(missingTemplateFixture.repositories.jsTemplateUsages.records).toHaveLength(0);
  });

  it('locks all authoring Source Projects once in canonical order before synchronizing owners', async () => {
    const { service, projectService } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_root: {
          uid: 'flow_root',
          subModels: {
            fields: [
              createJsFieldNode({
                uid: 'flow_project_z',
                sourceBinding: createJsFieldSourceBinding({ projectId: 'jtp_z', templateId: 'jtt_z' }),
              }),
              createJsFieldNode({
                uid: 'flow_project_a',
                sourceBinding: createJsFieldSourceBinding({ projectId: 'jtp_a', templateId: 'jtt_a' }),
              }),
              createJsFieldNode({
                uid: 'flow_project_z_duplicate',
                sourceBinding: createJsFieldSourceBinding({ projectId: 'jtp_z', templateId: 'jtt_z' }),
              }),
            ],
          },
        },
      },
      projects: [createProjectRecord({ id: 'jtp_z' }), createProjectRecord({ id: 'jtp_a' })],
      templates: [
        createJsFieldTemplateRecord({ id: 'jtt_z', projectId: 'jtp_z' }),
        createJsFieldTemplateRecord({ id: 'jtt_a', projectId: 'jtp_a' }),
      ],
    });
    const lockProject = vi.spyOn(projectService, 'lockInternalProjectForUpdate');

    await service.syncFlowModelUsagesForNodeTree({ rootUid: 'flow_root', action: 'flowModels.save' });

    expect(lockProject.mock.calls.map(([projectId]) => projectId)).toEqual(['jtp_a', 'jtp_z']);
  });

  it('indexes JSColumnModel as a js-field usage owner', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_column: createJsFieldNode({ uid: 'flow_js_column', use: 'JSColumnModel' }),
      },
      projects: [createProjectRecord({ id: 'jtp_fields' })],
      templates: [createJsFieldTemplateRecord()],
    });

    const result = await service.syncFlowModelUsagesForNodeTree({
      rootUid: 'flow_js_column',
      action: 'flowModels.save',
    });

    expect(result).toMatchObject({
      scanned: 1,
      upserted: 1,
      statusCounts: { active: 1 },
    });
    expect(repositories.jsTemplateUsages.records).toHaveLength(1);
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
      ownerLocator: expect.objectContaining({
        use: 'JSColumnModel',
      }),
    });
  });

  it('refreshes existing usages after their runtime no longer matches the project head', async () => {
    const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      projects: [createProjectRecord({ headCommitId: 'vsc_commit_2' })],
      templates: [createTemplateRecord()],
      usages: [createUsageRecord()],
    });

    const result = await service.refreshUsagesForProject('jtp_sales', {}, 'source_committed');

    expect(result.reason).toBe('source_committed');
    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'runtime_missing',
    });
    expect(recordUsageEvent).not.toHaveBeenCalled();
  });

  it('refreshes usages with the owner current settings instead of schema defaults', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode({
          settings: {
            threshold: 99,
            region: 'EMEA',
          },
        }),
      },
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
      usages: [createUsageRecord()],
    });

    await service.refreshUsagesForProject('jtp_sales');

    expect(repositories.jsTemplateUsages.records[0].toJSON()).toMatchObject({
      resolvedStatus: 'settings_invalid',
      settingsHash: stableJsonHash({
        threshold: 99,
        region: 'EMEA',
      }),
    });
  });

  it('skips usage loading entirely when the refresh plan has no usage fingerprint changes', async () => {
    const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      projects: [createProjectRecord()],
      templates: [createTemplateRecord()],
      usages: [createUsageRecord()],
    });

    const result = await service.refreshUsages({
      projectId: 'jtp_sales',
      plan: {
        mode: 'skip',
        reason: 'usage_fingerprint_unchanged',
      },
    });

    expect(result).toEqual({
      mode: 'skip',
      reason: 'usage_fingerprint_unchanged',
      targetTemplateCount: 0,
      usageCount: 0,
      changed: 0,
      statusCounts: {},
    });
    expect(repositories.jsTemplateUsages.find).not.toHaveBeenCalled();
    expect(repositories.jsTemplateProjects.findOne).toHaveBeenCalledTimes(1);
    expect(repositories.jsTemplates.find).not.toHaveBeenCalled();
    expect(repositories.flowModels.findModelById).not.toHaveBeenCalled();
    expect(recordUsageEvent).not.toHaveBeenCalled();
  });

  it('refreshes only target template usages with scoped project loads, one template load, and one owner-root load', async () => {
    const secondTemplate = createTemplateRecord({
      id: 'jtt_other',
      templateName: 'other',
      entryPath: 'src/client/js-blocks/other/index.tsx',
      descriptorPath: 'src/client/js-blocks/other/entry.json',
    });
    const { service, repositories, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModelTrees: {
        flow_js_block: createJsBlockNode(),
      },
      projects: [createProjectRecord({ headCommitId: 'vsc_commit_2' })],
      templates: [createTemplateRecord(), secondTemplate],
      usages: [
        createUsageRecord({ id: 'jtu_target_1' }),
        createUsageRecord({ id: 'jtu_target_2' }),
        createUsageRecord({
          id: 'jtu_other',
          modelUid: 'flow_other',
          templateId: 'jtt_other',
        }),
      ],
    });

    const result = await service.refreshUsages({
      projectId: 'jtp_sales',
      plan: {
        mode: 'templates',
        templateIds: ['jtt_sales_kpi', 'jtt_sales_kpi'],
        reason: 'template_usage_fingerprint_changed',
      },
    });

    expect(result).toMatchObject({
      mode: 'templates',
      targetTemplateCount: 1,
      usageCount: 2,
      changed: 2,
      statusCounts: {
        runtime_missing: 2,
      },
    });
    expect(repositories.jsTemplateUsages.records[0].get('resolvedStatus')).toBe('runtime_missing');
    expect(repositories.jsTemplateUsages.records[1].get('resolvedStatus')).toBe('runtime_missing');
    expect(repositories.jsTemplateUsages.records[2].get('resolvedStatus')).toBe('active');
    expect(repositories.jsTemplateUsages.find).toHaveBeenCalledTimes(1);
    expect(repositories.jsTemplateProjects.findOne).toHaveBeenCalledTimes(2);
    expect(repositories.jsTemplates.find).toHaveBeenCalledTimes(1);
    expect(repositories.flowModels.findModelById).toHaveBeenCalledTimes(1);
    expect(recordUsageEvent).not.toHaveBeenCalled();
  });
});
