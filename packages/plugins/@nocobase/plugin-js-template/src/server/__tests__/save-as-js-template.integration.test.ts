/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Model, Transaction } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplate,
  SaveAsJsTemplateInput,
  SaveAsJsTemplateOriginBinding,
  JsTemplateProject,
} from '../../shared/types';
import { createJsTemplatesResource } from '../resources/jsTemplates';
import type { JsTemplateCompilePreviewService } from '../services/JsTemplateCompilePreviewService';
import {
  SaveAsJsTemplateService,
  PersistentSaveAsJsTemplateSnapshotValidator,
} from '../services/SaveAsJsTemplateService';
import { buildRunJSSourceRepositoryIdentity, type RunJSSourceAdapterRegistry } from '@nocobase/runjs/workspace/server';

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_js_block',
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  paramPath: ['code'],
} as const;

const project: JsTemplateProject = {
  id: 'jtp_existing',
  name: 'shared-tools',
  normalizedName: 'shared-tools',
  title: 'Shared tools',
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_2',
};

const entry: JsTemplate = {
  id: 'jtt_entry',
  projectId: project.id,
  target: 'client',
  kind: 'js-block',
  templateName: 'sales-kpi',
  entryPath: 'src/client/js-blocks/sales-kpi/index.ts',
  descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
  title: 'Sales KPI',
  description: null,
  category: null,
  icon: null,
  tags: null,
  sort: null,
  settingsSchema: null,
  settingsSchemaHash: null,
  compiledCommitId: 'commit_2',
  compiledInputKey: 'compile_key',
  compilerBuildId: 'compiler_build',
  runtimeArtifact: {
    code: 'return 1;',
    runtimeVersion: 'v2',
    entryPath: 'src/client/js-blocks/sales-kpi/index.ts',
  },
  runtimeVersion: 'v2',
  surfaceStyle: 'render',
  runtimeCodeHash: 'runtime_hash',
  filesHash: 'files_hash',
  settingsDefaultsHash: null,
  compiledAt: '2026-07-11T00:00:00.000Z',
  healthStatus: 'ready',
  diagnostics: [],
};

describe('PersistentSaveAsJsTemplateSnapshotValidator', () => {
  it('rejects a stale source head', async () => {
    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const validator = new PersistentSaveAsJsTemplateSnapshotValidator(
      createSnapshotDatabase({
        repository: {
          id: 'runjs_repo',
          ...identity,
          status: 'active',
          headCommitId: 'runjs_commit_current',
        },
      }),
    );

    await expect(
      validator.assertCurrent({
        locator,
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: 'runjs_commit_stale',
        expectedOwnerFingerprint: 'owner_before',
      }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_SOURCE_OUTDATED',
      details: {
        sourceRepoId: 'runjs_repo',
        expectedHeadCommitId: 'runjs_commit_stale',
        currentHeadCommitId: 'runjs_commit_current',
      },
    });
  });

  it('rejects a source repository owned by another host', async () => {
    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const validator = new PersistentSaveAsJsTemplateSnapshotValidator(
      createSnapshotDatabase({
        repository: {
          id: 'runjs_repo',
          ...identity,
          ownerId: 'runjs:flowModel.step:another-host:forged',
          status: 'active',
          headCommitId: 'runjs_commit',
        },
      }),
    );

    await expect(
      validator.assertCurrent({
        locator,
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: 'runjs_commit',
        expectedOwnerFingerprint: 'owner_before',
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PERMISSION_DENIED' });
  });
});

describe('SaveAsJsTemplateService', () => {
  it('requires a non-empty idempotency key before reading or writing source state', async () => {
    const fixture = createFailFastService();
    const input = createSaveAsJsTemplateInput();
    delete (input as Partial<SaveAsJsTemplateInput>).idempotencyKey;

    await expect(fixture.service.saveAsJsTemplate(input, { adapterContext: {} })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      message: 'Save as JS Template idempotency key must be a non-empty string',
    });
    expect(fixture.registryRequire).not.toHaveBeenCalled();
    expectFailFastWritesNotCalled(fixture);
  });

  it.each([
    ['JSBlockModel', 'js-block', 'src/client/js-blocks'],
    ['JSActionModel', 'js-action', 'src/client/js-actions'],
    ['JSFieldModel', 'js-field', 'src/client/js-fields'],
    ['JSColumnModel', 'js-field', 'src/client/js-fields'],
    ['JSItemModel', 'js-item', 'src/client/js-items'],
  ] as const)(
    'saves a %s source in an existing project and writes the host binding in the same transaction',
    async (modelUse, kind, entryRoot) => {
      const sourceLocator = {
        ...locator,
        flowKey: kind === 'js-action' ? 'clickSettings' : 'jsSettings',
      } as const;
      const originBinding = {
        type: 'js-template-entry' as const,
        projectId: 'jtp_origin',
        templateId: 'jtt_origin',
        kind,
      };
      const transaction = { id: 'tx_save_as', LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const lockFlowModel = vi.fn();
      const findFlowModelById = vi.fn(async () => ({
        stepParams: {
          [sourceLocator.flowKey]: {
            runJs: {
              sourceMode: 'js-template',
              sourceBinding: originBinding,
            },
          },
        },
      }));
      const assertApplicationOwnership = vi.fn();
      const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
      const savedTemplate: JsTemplate = {
        ...entry,
        kind,
        entryPath: `${entryRoot}/sales-kpi/index.ts`,
        descriptorPath: `${entryRoot}/sales-kpi/entry.json`,
      };
      const originSettingsSchema = {
        type: 'object',
        properties: {
          title: { type: 'string', default: 'Welcome' },
          showTimestamp: { type: 'boolean', default: true },
        },
      };
      const getTemplate = vi.fn(async () => ({
        ...entry,
        id: 'jtt_origin',
        projectId: 'jtp_origin',
        kind,
        settingsSchema: originSettingsSchema,
      }));
      const adapter = {
        kind: 'flowModel.step',
        assertCanRead: vi.fn(),
        assertCanWrite: vi.fn(),
        readLegacy: vi.fn(async () => ({
          code: 'return 1;',
          version: 'v2',
          label: 'JS block',
          surfaceStyle: 'render',
          language: 'typescript',
          ownerFingerprint: 'owner_before',
          metadata: { modelUse },
        })),
        writeRuntime: vi.fn(),
        writeExternalBinding,
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const preparedSave = { candidate: { projectId: project.id } };
      const prepareSaveSource = vi.fn(async () => preparedSave);
      const commitPreparedSave = vi.fn(async () => ({
        project,
        commit: {},
        tree: {},
        compile: {},
        diagnostics: [],
      }));
      const syncUsages = vi.fn(async () => undefined);
      const recordLifecycleEvent = vi.fn(async () => undefined);
      const listTemplates = vi
        .fn()
        .mockResolvedValueOnce([{ ...savedTemplate, id: 'jtt_existing_source_key', templateName: 'welcome-card' }])
        .mockResolvedValueOnce([savedTemplate]);
      const operationModel = createJsTemplateSourceOperationModel();
      const service = new SaveAsJsTemplateService(
        {
          sequelize: {
            transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
          },
          getRepository: (name: string) => {
            if (name !== 'jsTemplateSourceOperations') {
              throw new Error(`Unexpected repository: ${name}`);
            }
            return { model: operationModel.model };
          },
          getCollection: () => ({
            model: { findByPk: lockFlowModel },
            repository: { findModelById: findFlowModelById },
          }),
        } as unknown as Database,
        {
          lockInternalProjectForUpdate: vi.fn(async () => ({ ...project, vscRepoId: 'vsc_repo' })),
          assertApplicationOwnership,
        } as never,
        {
          pull: vi.fn(async () => ({
            project,
            commit: { id: 'commit_2' },
            tree: null,
            unchanged: false,
            files: [],
          })),
        } as never,
        { getTemplate, listTemplates } as never,
        { prepareSaveSource, commitPreparedSave } as never,
        { syncFlowModelUsagesForNodeTree: syncUsages } as never,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
        'main',
        { assertCurrent: vi.fn() },
        { recordLifecycleEvent } as never,
      );

      const result = await service.saveAsJsTemplate(
        {
          idempotencyKey: `save-as-${kind}-${modelUse}`,
          locator: sourceLocator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [
            { path: 'src/main.ts', content: 'return 1;' },
            {
              path: 'src/client/entry.json',
              content: JSON.stringify({
                schemaVersion: 1,
                key: 'welcome-card',
                description: 'Preserved source description',
                icon: 'CodeOutlined',
              }),
            },
          ],
          originBinding,
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-kpi',
          templateTitle: 'Sales KPI',
        },
        {
          actorUserId: '1',
          requestId: 'req_save_as_existing',
          adapterContext: {},
        },
      );

      expect(prepareSaveSource).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: project.id,
          expectedHeadCommitId: 'commit_2',
          files: expect.arrayContaining([expect.objectContaining({ path: `${entryRoot}/sales-kpi/index.ts` })]),
        }),
        expect.not.objectContaining({ transaction: expect.anything() }),
      );
      expect(commitPreparedSave).toHaveBeenCalledWith(preparedSave, expect.objectContaining({ transaction }));
      expect(lockFlowModel).toHaveBeenCalledWith(sourceLocator.modelUid, {
        transaction,
        lock: 'UPDATE',
      });
      expect(lockFlowModel.mock.invocationCallOrder[0]).toBeLessThan(commitPreparedSave.mock.invocationCallOrder[0]);
      const savedFiles = prepareSaveSource.mock.calls[0][0].files as Array<{ path: string; content: string }>;
      const descriptor = JSON.parse(
        savedFiles.find((file) => file.path === `${entryRoot}/sales-kpi/entry.json`)?.content || '{}',
      );
      if (kind === 'js-field') {
        expect(descriptor.category).toBe(modelUse === 'JSColumnModel' ? 'js-column' : 'js-field');
      } else {
        expect(descriptor).not.toHaveProperty('category');
      }
      expect(descriptor).toMatchObject({
        key: 'sales-kpi',
        description: 'Preserved source description',
        icon: 'CodeOutlined',
      });
      expect(descriptor.settings).toEqual(originSettingsSchema.properties);
      expect(descriptor).not.toHaveProperty('settingsSchema');
      expect(getTemplate).toHaveBeenCalledWith('jtt_origin', expect.anything());
      expect(assertApplicationOwnership).toHaveBeenCalledWith('jtp_origin', 'main', expect.anything());
      expect(findFlowModelById).toHaveBeenCalledTimes(2);
      expect(writeExternalBinding).toHaveBeenCalledWith({
        locator: sourceLocator,
        baseOwnerFingerprint: 'owner_before',
        binding: {
          sourceMode: 'js-template',
          sourceBinding: {
            type: 'js-template-entry',
            projectId: project.id,
            templateId: savedTemplate.id,
            kind,
          },
        },
        ctx: expect.objectContaining({ transaction }),
      });
      expect(syncUsages).toHaveBeenCalledWith(
        expect.objectContaining({ rootUid: sourceLocator.modelUid }),
        expect.objectContaining({ transaction }),
      );
      expect(result.binding).toEqual({
        type: 'js-template-entry',
        projectId: project.id,
        templateId: savedTemplate.id,
        kind,
      });
      expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
      expect(recordLifecycleEvent).toHaveBeenCalledWith({
        projectId: project.id,
        action: 'saveAsJsTemplate',
        result: 'success',
        requestId: 'req_save_as_existing',
        actorUserId: '1',
        message: 'RunJS source saved as a JS Template',
        details: { destinationType: 'existing', templateId: savedTemplate.id, kind },
        transaction,
      });
    },
  );

  it('creates a new project with a compiled JS Block template before binding it', async () => {
    const transaction = { id: 'tx_create' } as unknown as Transaction;
    const recordLifecycleEvent = vi.fn(async () => undefined);
    let reservedProjectId = '';
    const createdProject = { ...project, name: 'sales-tools', normalizedName: 'sales-tools' };
    const createdEntry = {
      ...entry,
      kind: 'js-block' as const,
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
    };
    const createProject = vi.fn(async (_input: unknown, _ctx: unknown, options: { projectId: string }) => ({
      ...createdProject,
      id: options.projectId,
    }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const syncUsages = vi.fn(async () => undefined);
    let compiled = false;
    const prepared = {};
    const prepareInitialWorkspace = vi.fn(async (input: { projectId: string }) => {
      reservedProjectId = input.projectId;
      return prepared;
    });
    const applyPreparedInitialWorkspace = vi.fn(async () => {
      compiled = true;
      return {
        project: { ...createdProject, id: reservedProjectId },
        status: 'success',
        templates: [{ ...createdEntry, projectId: reservedProjectId }],
        diagnostics: [],
      };
    });
    const operationModel = createJsTemplateSourceOperationModel();
    const service = new SaveAsJsTemplateService(
      {
        sequelize: {
          transaction: (run: (currentTransaction: Transaction) => Promise<unknown>) => run(transaction),
        },
        getRepository: (name: string) => {
          if (name !== 'jsTemplateSourceOperations') {
            throw new Error(`Unexpected repository: ${name}`);
          }
          return { model: operationModel.model };
        },
      } as unknown as Database,
      { createProjectForCompositeUseCase: createProject, assertApplicationOwnership: vi.fn() } as never,
      {} as never,
      {
        listTemplates: vi.fn(async () => {
          expect(compiled).toBe(true);
          return [{ ...createdEntry, projectId: reservedProjectId }];
        }),
      } as never,
      { prepareInitialWorkspace, applyPreparedInitialWorkspace } as never,
      { syncFlowModelUsagesForNodeTree: syncUsages } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JavaScript block',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
            writeExternalBinding,
            getFingerprint: vi.fn(async () => 'owner_after'),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { assertCurrent: vi.fn() },
      { recordLifecycleEvent } as never,
    );

    const result = await service.saveAsJsTemplate(
      {
        idempotencyKey: 'save-as-new-sales-kpi-block',
        locator,
        expectedOwnerFingerprint: 'owner_before',
        sourceRepoId: 'runjs_repo',
        sourceHeadCommitId: null,
        entryPath: 'src/main.tsx',
        runtimeVersion: 'v2',
        files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Saved</div>);' }],
        destination: { type: 'new', name: 'sales-tools', title: 'Sales tools' },
        templateName: 'sales-kpi',
      },
      { adapterContext: {}, requestId: 'req_save_as_new' },
    );

    const createInput = createProject.mock.calls[0][0];
    const initialPaths = createInput.initialFiles.map((file: { path: string }) => file.path);
    expect(initialPaths.sort()).toEqual(
      [
        'README.md',
        'src/client/js-blocks/sales-kpi/entry.json',
        'src/client/js-blocks/sales-kpi/index.tsx',
        'tsconfig.json',
      ].sort(),
    );
    expect(prepareInitialWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: reservedProjectId, files: expect.any(Array) }),
      expect.not.objectContaining({ transaction: expect.anything() }),
    );
    expect(applyPreparedInitialWorkspace).toHaveBeenCalledWith(
      prepared,
      createdProject.headCommitId,
      expect.objectContaining({ transaction: expect.anything() }),
    );
    expect(writeExternalBinding.mock.invocationCallOrder[0]).toBeGreaterThan(
      applyPreparedInitialWorkspace.mock.invocationCallOrder[0],
    );
    expect(syncUsages.mock.invocationCallOrder[0]).toBeGreaterThan(writeExternalBinding.mock.invocationCallOrder[0]);
    expect(result.binding).toMatchObject({
      projectId: reservedProjectId,
      templateId: createdEntry.id,
      kind: 'js-block',
    });
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith({
      projectId: reservedProjectId,
      action: 'saveAsJsTemplate',
      result: 'success',
      requestId: 'req_save_as_new',
      actorUserId: undefined,
      message: 'RunJS source saved as a JS Template',
      details: { destinationType: 'new', templateId: createdEntry.id, kind: 'js-block' },
      transaction,
    });
  });

  it('rejects an existing template instead of overwriting it', async () => {
    const saveSource = vi.fn();
    const operationModel = createJsTemplateSourceOperationModel();
    const service = new SaveAsJsTemplateService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) =>
            run({ id: 'tx_conflict' } as unknown as Transaction),
        },
        getRepository: (name: string) => {
          if (name !== 'jsTemplateSourceOperations') {
            throw new Error(`Unexpected repository: ${name}`);
          }
          return { model: operationModel.model };
        },
      } as unknown as Database,
      { lockInternalProjectForUpdate: vi.fn(async () => project), assertApplicationOwnership: vi.fn() } as never,
      {
        pull: vi.fn(async () => ({
          project,
          commit: null,
          tree: null,
          unchanged: false,
          files: [{ path: 'src/client/js-blocks/sales-kpi/index.ts' }],
        })),
      } as never,
      { listTemplates: vi.fn(async () => []) } as never,
      { saveSource } as never,
      { syncFlowModelUsagesForNodeTree: vi.fn() } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JS block',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
            writeExternalBinding: vi.fn(),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { assertCurrent: vi.fn() },
    );

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-existing-conflict',
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_CONFLICT' });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('rejects a stale owner fingerprint before changing the destination', async () => {
    const saveSource = vi.fn();
    const service = createFailureService({
      ownerFingerprint: 'owner_current',
      saveSource,
    });

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-stale-owner',
          locator,
          expectedOwnerFingerprint: 'owner_stale',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED' });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('rejects nested RunJS locators before any repository, VSC, host, or usage write', async () => {
    const fixture = createFailFastService();
    const nestedLocator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'flow_action',
      containerFlowKey: 'eventFlow',
      containerStepKey: 'runJs',
      valuePath: ['code'],
      scene: 'eventFlow',
    } as const;

    await expect(
      fixture.service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-nested-runjs',
          locator: nestedLocator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.ts', content: 'ctx.message.success("done");' }],
          destination: { type: 'new', name: 'forbidden-runjs' },
          templateName: 'action-script',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_INVALID_INPUT' });
    expect(fixture.registryRequire).not.toHaveBeenCalled();
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects unsupported FlowModel uses before any repository, VSC, host, or usage write', async () => {
    const fixture = createFailFastService('FormBlockModel');

    await expect(
      fixture.service.saveAsJsTemplate(createSaveAsJsTemplateInput(), { adapterContext: {} }),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
    });

    expect(fixture.readLegacy).toHaveBeenCalledTimes(2);
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects a forged step locator that targets a nested generic value', async () => {
    const fixture = createFailFastService('JSBlockModel');

    await expect(
      fixture.service.saveAsJsTemplate(
        createSaveAsJsTemplateInput({
          locator: {
            ...locator,
            flowKey: 'formSettings',
            stepKey: 'defaultValue',
            paramPath: ['value', 'code'],
          },
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_INVALID_INPUT' });

    expect(fixture.readLegacy).toHaveBeenCalledTimes(2);
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects a forged runjs origin binding before any repository, VSC, host, or usage write', async () => {
    const fixture = createFailFastService();

    await expect(
      fixture.service.saveAsJsTemplate(
        createSaveAsJsTemplateInput({
          originBinding: {
            type: 'js-template-entry',
            projectId: 'jtp_legacy_runjs',
            templateId: 'jtt_legacy_runjs',
            kind: 'runjs',
          },
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_INVALID_INPUT' });

    expect(fixture.registryRequire).not.toHaveBeenCalled();
    expectFailFastWritesNotCalled(fixture);
  });

  it('rejects an origin binding that does not match the current Host binding', async () => {
    const saveSource = vi.fn();
    const getTemplate = vi.fn();
    const service = createFailureService({
      saveSource,
      getTemplate,
      currentSourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_current',
        templateId: 'jtt_current',
        kind: 'js-block',
      },
    });

    await expect(
      service.saveAsJsTemplate(
        createSaveAsJsTemplateInput({
          originBinding: {
            type: 'js-template-entry',
            projectId: 'jtp_forged',
            templateId: 'jtt_forged',
            kind: 'js-block',
          },
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });

    expect(getTemplate).not.toHaveBeenCalled();
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('rejects a matching origin binding outside the current application before reading its schema', async () => {
    const originBinding = {
      type: 'js-template-entry' as const,
      projectId: 'jtp_other_application',
      templateId: 'jtt_other_application',
      kind: 'js-block',
    };
    const saveSource = vi.fn();
    const getTemplate = vi.fn();
    const assertApplicationOwnership = vi.fn(async (projectId: string) => {
      if (projectId === originBinding.projectId) {
        throw new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'Source Project belongs to another application');
      }
    });
    const service = createFailureService({
      saveSource,
      getTemplate,
      currentSourceBinding: originBinding,
      assertApplicationOwnership,
    });

    await expect(
      service.saveAsJsTemplate(createSaveAsJsTemplateInput({ originBinding }), { adapterContext: {} }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PERMISSION_DENIED', status: 403 });

    expect(assertApplicationOwnership).toHaveBeenCalledWith(originBinding.projectId, 'main', expect.anything());
    expect(getTemplate).not.toHaveBeenCalled();
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('requires host write permission before changing the destination', async () => {
    const saveSource = vi.fn();
    const service = createFailureService({
      saveSource,
      assertCanWrite: vi.fn(async () => {
        throw new Error('permission denied');
      }),
    });

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-permission-denied',
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: null,
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('permission denied');
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('marks a reserved operation as failed when authorization rejects the request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const saveSource = vi.fn();
    const service = createFailureService({
      saveSource,
      operationModel,
      assertCanWrite: vi.fn(async () => {
        throw new Error('permission denied');
      }),
    });

    await expect(
      service.saveAsJsTemplate(
        createSaveAsJsTemplateInput({
          idempotencyKey: 'save-as-existing-sales-kpi',
        }),
        { adapterContext: {} },
      ),
    ).rejects.toThrow('permission denied');

    expect(operationModel.model.findOne).toHaveBeenCalledOnce();
    expect(operationModel.model.findOrCreate).toHaveBeenCalledOnce();
    expect(operationModel.getValues()).toMatchObject({ status: 'failed', errorCode: 'Error' });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('marks a reserved operation as failed when source snapshot validation rejects the request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const saveSource = vi.fn();
    const sourceSnapshotValidator = {
      assertCurrent: vi.fn(async () => {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_OUTDATED', 'source changed');
      }),
    };
    const service = createFailureService({
      saveSource,
      operationModel,
      sourceSnapshotValidator,
    });

    await expect(
      service.saveAsJsTemplate(
        createSaveAsJsTemplateInput({
          idempotencyKey: 'save-as-stale-existing-sales-kpi',
        }),
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_SOURCE_OUTDATED' });

    expect(sourceSnapshotValidator.assertCurrent).toHaveBeenCalledOnce();
    expect(operationModel.model.findOrCreate).toHaveBeenCalledOnce();
    expect(operationModel.getValues()).toMatchObject({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_SOURCE_OUTDATED',
    });
    expect(saveSource).not.toHaveBeenCalled();
  });

  it('creates one new project and template when the completed operation is replayed', async () => {
    const transaction = { id: 'tx_new_create' } as unknown as Transaction;
    const operationModel = createJsTemplateSourceOperationModel();
    let reservedProjectId = '';
    const createdProject = {
      ...project,
      name: 'sales-tools',
      normalizedName: 'sales-tools',
      title: 'Sales tools',
    };
    const createProject = vi.fn(async (_input: unknown, _ctx: unknown, options: { projectId: string }) => ({
      ...createdProject,
      id: options.projectId,
    }));
    const prepared = {};
    const prepareInitialWorkspace = vi.fn(async (input: { projectId: string }) => {
      reservedProjectId = input.projectId;
      return prepared;
    });
    const applyPreparedInitialWorkspace = vi.fn(async () => ({
      project: { ...createdProject, id: reservedProjectId },
      status: 'success',
      templates: [{ ...entry, projectId: reservedProjectId }],
      diagnostics: [],
    }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const syncUsages = vi.fn(async () => undefined);
    const service = new SaveAsJsTemplateService(
      {
        sequelize: {
          transaction: (run: (transaction: Transaction) => Promise<unknown>) => run(transaction),
        },
        getRepository: (name: string) => {
          if (name !== 'jsTemplateSourceOperations') {
            throw new Error(`Unexpected repository: ${name}`);
          }
          return { model: operationModel.model };
        },
      } as unknown as Database,
      {
        createProjectForCompositeUseCase: createProject,
      } as never,
      {} as never,
      { listTemplates: vi.fn(async () => [{ ...entry, projectId: reservedProjectId }]) } as never,
      { prepareInitialWorkspace, applyPreparedInitialWorkspace } as never,
      { syncFlowModelUsagesForNodeTree: syncUsages } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JS block',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
            writeExternalBinding,
            getFingerprint: vi.fn(async () => 'owner_after'),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { assertCurrent: vi.fn() },
      { recordLifecycleEvent: vi.fn(async () => undefined) } as never,
    );

    const input = createSaveAsJsTemplateInput({
      destination: { type: 'new', name: 'sales-tools', title: 'Sales tools' },
      idempotencyKey: 'save-as-new-sales-kpi',
    });
    const first = await service.saveAsJsTemplate(input, { adapterContext: {} });
    const replay = await service.saveAsJsTemplate(input, { adapterContext: {} });

    expect(reservedProjectId).toMatch(/^jtp_/);
    expect(first).toMatchObject({
      project: { id: reservedProjectId },
      template: { projectId: reservedProjectId },
    });
    expect(replay).toEqual(first);

    expect(prepareInitialWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: reservedProjectId }),
      expect.not.objectContaining({ transaction: expect.anything() }),
    );
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'sales-tools', title: 'Sales tools' }),
      expect.objectContaining({ transaction }),
      { projectId: reservedProjectId },
    );
    expect(applyPreparedInitialWorkspace).toHaveBeenCalledWith(
      prepared,
      createdProject.headCommitId,
      expect.objectContaining({ transaction }),
    );
    expect(writeExternalBinding).toHaveBeenCalledWith(
      expect.objectContaining({ ctx: expect.objectContaining({ transaction }) }),
    );
    expect(syncUsages).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ transaction }));
    expect(createProject).toHaveBeenCalledOnce();
    expect(prepareInitialWorkspace).toHaveBeenCalledOnce();
    expect(writeExternalBinding).toHaveBeenCalledOnce();
    expect(syncUsages).toHaveBeenCalledOnce();
    expect(operationModel.getValues()).toMatchObject({ status: 'completed', result: first });
  });

  it('returns the persisted result when a completed JS Template source operation is replayed', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const saveSource = vi.fn(async () => ({ project, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const writeExternalBinding = vi.fn(async () => ({ ownerFingerprint: 'owner_after' }));
    const service = createFailureService({ saveSource, writeExternalBinding, operationModel });
    const input = createSaveAsJsTemplateInput({ idempotencyKey: '  save-sales-kpi-v1  ' });

    const first = await service.saveAsJsTemplate(input, { adapterContext: {} });
    const replay = await service.saveAsJsTemplate(
      { ...input, idempotencyKey: 'save-sales-kpi-v1' },
      { adapterContext: {} },
    );

    expect(replay).toEqual(first);
    expect(saveSource).toHaveBeenCalledTimes(1);
    expect(writeExternalBinding).toHaveBeenCalledTimes(1);
    expect(operationModel.getValues()).toMatchObject({
      idempotencyKey: 'save-sales-kpi-v1',
      status: 'completed',
      result: first,
    });
  });

  it('rejects reuse of a JS Template source operation key with a different request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const saveSource = vi.fn(async () => ({ project, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const service = createFailureService({ saveSource, operationModel });
    const input = createSaveAsJsTemplateInput({ idempotencyKey: 'save-as-sales-kpi-v1' });

    await service.saveAsJsTemplate(input, { adapterContext: {} });
    await expect(
      service.saveAsJsTemplate({ ...input, templateName: 'different-entry' }, { adapterContext: {} }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_IDEMPOTENCY_CONFLICT' });
    expect(saveSource).toHaveBeenCalledTimes(1);
  });

  it('reclaims a failed JS Template source operation for the same request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const saveSource = vi
      .fn()
      .mockRejectedValueOnce(new Error('compile failed'))
      .mockResolvedValueOnce({ project, commit: {}, tree: {}, compile: {}, diagnostics: [] });
    const listTemplates = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([entry]);
    const service = createFailureService({ saveSource, operationModel, listTemplates });
    const input = createSaveAsJsTemplateInput({ idempotencyKey: 'save-as-sales-kpi-retry' });

    await expect(service.saveAsJsTemplate(input, { adapterContext: {} })).rejects.toThrow('compile failed');
    await expect(service.saveAsJsTemplate(input, { adapterContext: {} })).resolves.toMatchObject({
      ownerFingerprint: 'owner_after',
    });

    expect(saveSource).toHaveBeenCalledTimes(2);
    expect(operationModel.getValues()).toMatchObject({ status: 'completed' });
  });

  it('rejects a disabled destination before writing JS Block state', async () => {
    const lifecycleStatus = 'disabled';
    const saveSource = vi.fn();
    const writeExternalBinding = vi.fn();
    const syncUsages = vi.fn();
    const service = createFailureService({
      destinationProject: { ...project, lifecycleStatus },
      modelUse: 'JSBlockModel',
      saveSource,
      writeExternalBinding,
      syncUsages,
    });

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: `save-as-${lifecycleStatus}-project`,
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.tsx',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Page</div>);' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-page',
        },
        { adapterContext: {} },
      ),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PROJECT_DISABLED' });
    expect(saveSource).not.toHaveBeenCalled();
    expect(writeExternalBinding).not.toHaveBeenCalled();
    expect(syncUsages).not.toHaveBeenCalled();
  });

  it('does not bind or sync usages when JS Block compilation fails', async () => {
    const saveSource = vi.fn(async () => {
      throw new Error('compile failed');
    });
    const writeExternalBinding = vi.fn();
    const syncUsages = vi.fn();
    const service = createFailureService({
      modelUse: 'JSBlockModel',
      saveSource,
      writeExternalBinding,
      syncUsages,
    });

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-compile-failure',
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.tsx',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.tsx', content: 'ctx.render(<div>Page</div>);' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-page',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('compile failed');
    expect(writeExternalBinding).not.toHaveBeenCalled();
    expect(syncUsages).not.toHaveBeenCalled();
  });

  it('keeps destination and host writes under one rejected transaction when binding fails', async () => {
    const transaction = { id: 'tx_rollback', LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
    let committed = false;
    const saveSource = vi.fn(async () => ({ project, commit: {}, tree: {}, compile: {}, diagnostics: [] }));
    const savedPageTemplate = {
      ...entry,
      kind: 'js-block' as const,
      entryPath: 'src/client/js-blocks/sales-kpi/index.ts',
      descriptorPath: 'src/client/js-blocks/sales-kpi/entry.json',
    };
    const service = createFailureService({
      transaction,
      modelUse: 'JSBlockModel',
      savedTemplate: savedPageTemplate,
      saveSource,
      writeExternalBinding: vi.fn(async () => {
        throw new Error('host binding failed');
      }),
      onTransactionSuccess: () => {
        committed = true;
      },
    });

    await expect(
      service.saveAsJsTemplate(
        {
          idempotencyKey: 'save-as-host-write-rollback',
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_repo',
          sourceHeadCommitId: 'runjs_commit',
          entryPath: 'src/main.ts',
          runtimeVersion: 'v2',
          files: [{ path: 'src/main.ts', content: 'return 1;' }],
          destination: { type: 'existing', projectId: project.id },
          templateName: 'sales-kpi',
        },
        { adapterContext: {} },
      ),
    ).rejects.toThrow('host binding failed');
    expect(saveSource).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ transaction }));
    expect(committed).toBe(false);
  });
});

function createFailureService(options: {
  ownerFingerprint?: string;
  surfaceStyle?: 'render' | 'action' | 'value';
  transaction?: Transaction;
  destinationProject?: JsTemplateProject;
  modelUse?: string;
  savedTemplate?: JsTemplate;
  saveSource: ReturnType<typeof vi.fn>;
  writeExternalBinding?: ReturnType<typeof vi.fn>;
  assertCanWrite?: ReturnType<typeof vi.fn>;
  syncUsages?: ReturnType<typeof vi.fn>;
  onTransactionSuccess?: () => void;
  operationModel?: ReturnType<typeof createJsTemplateSourceOperationModel>;
  listTemplates?: ReturnType<typeof vi.fn>;
  sourceSnapshotValidator?: { assertCurrent: ReturnType<typeof vi.fn> };
  currentSourceBinding?: SaveAsJsTemplateOriginBinding;
  assertApplicationOwnership?: ReturnType<typeof vi.fn>;
  getTemplate?: ReturnType<typeof vi.fn>;
}): SaveAsJsTemplateService {
  const transaction =
    options.transaction || ({ id: 'tx_failure', LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction);
  const operationModel = options.operationModel || createJsTemplateSourceOperationModel();
  return new SaveAsJsTemplateService(
    {
      sequelize: {
        transaction: async (run: (transaction: Transaction) => Promise<unknown>) => {
          const result = await run(transaction);
          options.onTransactionSuccess?.();
          return result;
        },
      },
      getRepository: (name: string) => {
        if (name !== 'jsTemplateSourceOperations') {
          throw new Error(`Unexpected repository: ${name}`);
        }
        return { model: operationModel.model };
      },
      getCollection: () => ({
        model: { findByPk: vi.fn() },
        repository: {
          findModelById: vi.fn(async () => ({
            stepParams: {
              jsSettings: {
                runJs: options.currentSourceBinding
                  ? {
                      sourceMode: 'js-template',
                      sourceBinding: options.currentSourceBinding,
                    }
                  : { sourceMode: 'inline' },
              },
            },
          })),
        },
      }),
    } as unknown as Database,
    {
      lockInternalProjectForUpdate: vi.fn(async () => options.destinationProject || project),
      assertApplicationOwnership: options.assertApplicationOwnership || vi.fn(),
    } as never,
    {
      pull: vi.fn(async () => ({
        project: options.destinationProject || project,
        commit: null,
        tree: null,
        unchanged: false,
        files: [],
      })),
    } as never,
    {
      getTemplate: options.getTemplate,
      listTemplates:
        options.listTemplates ||
        vi
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([options.savedTemplate || entry]),
    } as never,
    {
      prepareSaveSource: vi.fn(async () => ({ candidate: { projectId: project.id } })),
      commitPreparedSave: options.saveSource,
    } as never,
    { syncFlowModelUsagesForNodeTree: options.syncUsages || vi.fn() } as never,
    () =>
      ({
        require: () => ({
          kind: 'flowModel.step',
          assertCanWrite: options.assertCanWrite || vi.fn(),
          readLegacy: vi.fn(async () => ({
            code: 'return 1;',
            version: 'v2',
            label: 'JS block',
            surfaceStyle: options.surfaceStyle || 'render',
            language: 'typescript',
            ownerFingerprint: options.ownerFingerprint || 'owner_before',
            metadata: { modelUse: options.modelUse || 'JSBlockModel' },
          })),
          writeExternalBinding:
            options.writeExternalBinding || vi.fn(async () => ({ ownerFingerprint: 'owner_after' })),
          getFingerprint: vi.fn(async () => 'owner_after'),
        }),
      }) as unknown as RunJSSourceAdapterRegistry,
    'main',
    options.sourceSnapshotValidator || { assertCurrent: vi.fn() },
    { recordLifecycleEvent: vi.fn(async () => undefined) } as never,
  );
}

function createJsTemplateSourceOperationModel(
  hooks: { beforeUpdate?: (values: Record<string, unknown>) => void } = {},
) {
  const rows: Record<string, unknown>[] = [];
  const matchesWhere = (values: Record<string, unknown>, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => values[key] === value);
  const toRecord = (values: Record<string, unknown>) =>
    ({
      get: (key: string) => values[key],
    }) as Model;
  const model = {
    findOne: vi.fn(async (options: { where: Record<string, unknown> }) => {
      const values = rows.find((candidate) => matchesWhere(candidate, options.where));
      return values ? toRecord(values) : null;
    }),
    findOrCreate: vi.fn(async (options: { where: Record<string, unknown>; defaults: Record<string, unknown> }) => {
      const existing = rows.find((candidate) => matchesWhere(candidate, options.where));
      if (existing) {
        return [toRecord(existing), false] as const;
      }
      const values = { ...options.defaults, updatedAt: new Date() };
      rows.push(values);
      return [toRecord(values), true] as const;
    }),
    update: vi.fn(
      async (nextValues: Record<string, unknown>, query: { where: Record<string, unknown> }): Promise<[number]> => {
        hooks.beforeUpdate?.(nextValues);
        const values = rows.find((candidate) => matchesWhere(candidate, query.where));
        if (!values) {
          return [0];
        }
        Object.assign(values, nextValues, { updatedAt: new Date() });
        return [1];
      },
    ),
  };
  return {
    model,
    getValues: () => rows[0],
    getAllValues: () => rows,
  };
}

function createTestModel(values: Record<string, unknown>): Model {
  return { get: (key: string) => values[key] } as Model;
}

function createSnapshotDatabase(input: {
  repository?: Record<string, unknown>;
  commit?: Record<string, unknown>;
}): Database {
  const toModel = (values: Record<string, unknown> | undefined): Model | null =>
    values ? ({ get: (key: string) => values[key] } as Model) : null;
  return {
    getRepository: (name: string) => {
      if (name === 'vscFileRepositories') {
        return { findOne: vi.fn(async () => toModel(input.repository)) };
      }
      if (name === 'vscFileCommits') {
        return { findOne: vi.fn(async () => toModel(input.commit)) };
      }
      throw new Error(`Unexpected repository: ${name}`);
    },
  } as unknown as Database;
}

function createSaveAsJsTemplateInput(overrides: Partial<SaveAsJsTemplateInput> = {}): SaveAsJsTemplateInput {
  return {
    idempotencyKey: 'save-as-sales-kpi',
    locator,
    expectedOwnerFingerprint: 'owner_before',
    sourceRepoId: 'runjs_repo',
    sourceHeadCommitId: 'runjs_commit',
    entryPath: 'src/main.ts',
    runtimeVersion: 'v2',
    files: [{ path: 'src/main.ts', content: 'return 1;' }],
    destination: { type: 'existing', projectId: project.id },
    templateName: 'sales-kpi',
    ...overrides,
  };
}

function createFailFastService(modelUse = 'JSBlockModel') {
  const transaction = vi.fn();
  const createProject = vi.fn();
  const pull = vi.fn();
  const getTemplate = vi.fn();
  const listTemplates = vi.fn();
  const prepareSaveSource = vi.fn();
  const commitPreparedSave = vi.fn();
  const compileCurrentRuntime = vi.fn();
  const syncFlowModelUsagesForNodeTree = vi.fn();
  const assertCanWrite = vi.fn();
  const readLegacy = vi.fn(async () => ({
    code: 'return 1;',
    version: 'v2',
    label: 'RunJS',
    surfaceStyle: 'render' as const,
    language: 'typescript',
    ownerFingerprint: 'owner_before',
    metadata: { modelUse },
  }));
  const writeExternalBinding = vi.fn();
  const registryRequire = vi.fn(() => ({
    kind: 'flowModel.step',
    assertCanWrite,
    readLegacy,
    writeExternalBinding,
    getFingerprint: vi.fn(),
  }));
  const operationModel = createJsTemplateSourceOperationModel();
  const service = new SaveAsJsTemplateService(
    {
      sequelize: { transaction },
      getRepository: (name: string) => {
        if (name !== 'jsTemplateSourceOperations') {
          throw new Error(`Unexpected repository: ${name}`);
        }
        return { model: operationModel.model };
      },
    } as unknown as Database,
    { createProject, assertApplicationOwnership: vi.fn() } as never,
    { pull } as never,
    { getTemplate, listTemplates } as never,
    { prepareSaveSource, commitPreparedSave, compileCurrentRuntime } as never,
    { syncFlowModelUsagesForNodeTree } as never,
    () => ({ require: registryRequire }) as unknown as RunJSSourceAdapterRegistry,
    'main',
    { assertCurrent: vi.fn() },
  );

  return {
    service,
    transaction,
    createProject,
    pull,
    getTemplate,
    listTemplates,
    prepareSaveSource,
    commitPreparedSave,
    compileCurrentRuntime,
    syncFlowModelUsagesForNodeTree,
    assertCanWrite,
    readLegacy,
    writeExternalBinding,
    registryRequire,
  };
}

function expectFailFastWritesNotCalled(fixture: ReturnType<typeof createFailFastService>): void {
  expect(fixture.transaction).not.toHaveBeenCalled();
  expect(fixture.createProject).not.toHaveBeenCalled();
  expect(fixture.pull).not.toHaveBeenCalled();
  expect(fixture.getTemplate).not.toHaveBeenCalled();
  expect(fixture.listTemplates).not.toHaveBeenCalled();
  expect(fixture.prepareSaveSource).not.toHaveBeenCalled();
  expect(fixture.commitPreparedSave).not.toHaveBeenCalled();
  expect(fixture.compileCurrentRuntime).not.toHaveBeenCalled();
  expect(fixture.writeExternalBinding).not.toHaveBeenCalled();
  expect(fixture.syncFlowModelUsagesForNodeTree).not.toHaveBeenCalled();
}

describe('save-as JS Template resource integration', () => {
  const locator = {
    kind: 'flowModel.step',
    modelUid: 'fm_js_block',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  } as const;

  describe('save-as resource', () => {
    it.each([
      { destination: { type: 'existing', projectId: 'jtp_existing' } },
      {
        destination: {
          type: 'new',
          name: 'sales-tools',
          title: 'Sales tools',
          description: 'Shared sales extensions',
        },
      },
    ])('normalizes saveAsJsTemplate $destination.type destination and request context', async ({ destination }) => {
      const saveAsJsTemplate = vi.fn(async () => ({
        project: { id: 'jtp_selected' },
        ownerFingerprint: 'owner_after',
      }));
      const resource = createJsTemplatesResource(
        {} as never,
        {} as never,
        {} as JsTemplateCompilePreviewService,
        { saveAsJsTemplate } as unknown as SaveAsJsTemplateService,
      );
      const can = vi.fn().mockReturnValue({});
      const ctx = {
        action: {
          params: {
            values: {
              idempotencyKey: 'save-as-js-template-sales-page-v1',
              locator,
              expectedOwnerFingerprint: 'owner_before',
              sourceRepoId: 'runjs_sales_page',
              sourceHeadCommitId: 'commit_inline',
              entryPath: 'src/client/index.tsx',
              runtimeVersion: 'v2',
              files: [{ path: 'src/client/index.tsx', content: 'ctx.render(null);' }],
              destination,
              templateName: 'sales-page',
            },
          },
        },
        auth: { user: { id: 9 } },
        can,
        request: { headers: { 'x-request-id': 'req_save_as_js_template', 'x-request-source': 'resource-contract' } },
      } as unknown as Context;

      await resource.actions?.saveAsJsTemplate?.(ctx, async () => undefined);

      expect(saveAsJsTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'save-as-js-template-sales-page-v1',
          destination,
          templateName: 'sales-page',
          files: [expect.objectContaining({ path: 'src/client/index.tsx', content: 'ctx.render(null);' })],
        }),
        expect.objectContaining({
          actorUserId: '9',
          requestId: 'req_save_as_js_template',
          requestSource: 'resource-contract',
          can,
        }),
      );
      expect((ctx as { body?: unknown }).body).toEqual({
        project: { id: 'jtp_selected' },
        ownerFingerprint: 'owner_after',
      });
    });

    it.each([
      ['missing', undefined, 'destination.type is required'],
      ['null', null, 'destination.type is required'],
      ['default', { type: 'default' }, 'destination.type must be "existing" or "new"'],
    ] as const)(
      'rejects a $label destination before invoking saveAsJsTemplate',
      async (_label, destination, message) => {
        const saveAsJsTemplate = vi.fn();
        const resource = createJsTemplatesResource(
          {} as never,
          {} as never,
          {} as JsTemplateCompilePreviewService,
          { saveAsJsTemplate } as unknown as SaveAsJsTemplateService,
        );
        const values: Record<string, unknown> = {
          idempotencyKey: 'save-as-invalid-destination',
          locator,
          expectedOwnerFingerprint: 'owner_before',
          sourceRepoId: 'runjs_sales_page',
          sourceHeadCommitId: 'commit_inline',
          entryPath: 'src/client/index.tsx',
          runtimeVersion: 'v2',
          files: [{ path: 'src/client/index.tsx', content: 'ctx.render(null);' }],
          templateName: 'sales-page',
        };
        if (typeof destination !== 'undefined') {
          values.destination = destination;
        }
        const ctx = {
          action: { params: { values } },
          auth: { user: { id: 9 } },
          request: { headers: {} },
        } as unknown as Context;
        const next = vi.fn();

        await resource.actions?.saveAsJsTemplate?.(ctx, next);

        expect(saveAsJsTemplate).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
        expect((ctx as { status?: number }).status).toBe(400);
        expect(
          (ctx as { body?: { errors?: Array<{ code?: string; message?: string }> } }).body?.errors?.[0],
        ).toMatchObject({
          code: 'JS_TEMPLATE_INVALID_INPUT',
          message,
        });
      },
    );
  });
});
