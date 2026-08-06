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
import { createHash } from 'crypto';
import { describe, expect, it, vi } from 'vitest';

import { JsTemplateError } from '../../shared/errors';
import type {
  JsTemplate,
  JsTemplateRuntimeSourceBinding,
  SaveAsJsTemplateInput,
  SaveAsJsTemplateOriginBinding,
  JsTemplateProject,
} from '../../shared/types';
import swaggerDocument from '../../swagger';
import { createJsTemplatesResource } from '../resources/jsTemplates';
import type { JsTemplateCompilePreviewService } from '../services/JsTemplateCompilePreviewService';
import {
  SaveAsJsTemplateService,
  PersistentSaveAsJsTemplateSnapshotValidator,
} from '../services/SaveAsJsTemplateService';
import { JsTemplateSourceOperationStore } from '../services/JsTemplateSourceOperationStore';
import {
  isDetachJsTemplateToInlineHostSupported,
  DetachJsTemplateToInlineService,
} from '../services/DetachJsTemplateToInlineService';
import {
  JsTemplateWorkspaceCompilerBridge,
  type JsTemplateWorkspaceCompileInput,
} from '../services/JsTemplateWorkspaceCompilerBridge';
import {
  buildRunJSFilesHash,
  type RunJSSourceAdapterRegistry,
  VscError,
  type VscFileChange,
  type VscFileService,
  type VscRepositoryRecord,
} from '../vsc-file';
import { buildRunJSSourceRepositoryIdentity, canonicalizeRunJSCompileFiles } from '../vsc-file/public-api';

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
    ['JSPageModel', 'js-page', 'src/client/js-pages'],
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
      const publishPreparedSave = vi.fn(async () => ({
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
        { prepareSaveSource, publishPreparedSave } as never,
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
      expect(publishPreparedSave).toHaveBeenCalledWith(preparedSave, expect.objectContaining({ transaction }));
      expect(lockFlowModel).toHaveBeenCalledWith(sourceLocator.modelUid, {
        transaction,
        lock: 'UPDATE',
      });
      expect(lockFlowModel.mock.invocationCallOrder[0]).toBeLessThan(publishPreparedSave.mock.invocationCallOrder[0]);
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

  it('creates a new project with a compiled JS Page template before binding it', async () => {
    const transaction = { id: 'tx_create' } as unknown as Transaction;
    const recordLifecycleEvent = vi.fn(async () => undefined);
    let reservedProjectId = '';
    const createdProject = { ...project, name: 'sales-tools', normalizedName: 'sales-tools' };
    const createdEntry = {
      ...entry,
      kind: 'js-page' as const,
      entryPath: 'src/client/js-pages/sales-kpi/index.tsx',
      descriptorPath: 'src/client/js-pages/sales-kpi/entry.json',
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
    const publishPreparedInitialWorkspace = vi.fn(async () => {
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
      { prepareInitialWorkspace, publishPreparedInitialWorkspace } as never,
      { syncFlowModelUsagesForNodeTree: syncUsages } as never,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(),
            readLegacy: vi.fn(async () => ({
              code: 'return 1;',
              version: 'v2',
              label: 'JavaScript page',
              surfaceStyle: 'render',
              language: 'typescript',
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSPageModel' },
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
        idempotencyKey: 'save-as-new-sales-kpi-page',
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
        'src/client/js-pages/sales-kpi/entry.json',
        'src/client/js-pages/sales-kpi/index.tsx',
        'tsconfig.json',
      ].sort(),
    );
    expect(prepareInitialWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: reservedProjectId, files: expect.any(Array) }),
      expect.not.objectContaining({ transaction: expect.anything() }),
    );
    expect(publishPreparedInitialWorkspace).toHaveBeenCalledWith(
      prepared,
      createdProject.headCommitId,
      expect.objectContaining({ transaction: expect.anything() }),
    );
    expect(writeExternalBinding.mock.invocationCallOrder[0]).toBeGreaterThan(
      publishPreparedInitialWorkspace.mock.invocationCallOrder[0],
    );
    expect(syncUsages.mock.invocationCallOrder[0]).toBeGreaterThan(writeExternalBinding.mock.invocationCallOrder[0]);
    expect(result.binding).toMatchObject({
      projectId: reservedProjectId,
      templateId: createdEntry.id,
      kind: 'js-page',
    });
    expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
    expect(recordLifecycleEvent).toHaveBeenCalledWith({
      projectId: reservedProjectId,
      action: 'saveAsJsTemplate',
      result: 'success',
      requestId: 'req_save_as_new',
      actorUserId: undefined,
      message: 'RunJS source saved as a JS Template',
      details: { destinationType: 'new', templateId: createdEntry.id, kind: 'js-page' },
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
    const publishPreparedInitialWorkspace = vi.fn(async () => ({
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
      { prepareInitialWorkspace, publishPreparedInitialWorkspace } as never,
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
    expect(publishPreparedInitialWorkspace).toHaveBeenCalledWith(
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

  it('keeps save-as-js-template and detach-to-inline reservations independent when they use the same key', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const store = new JsTemplateSourceOperationStore(createJsTemplateSourceOperationDatabase(operationModel), 'main');
    const descriptor = {
      idempotencyKey: 'shared-save-detach-key',
      request: { locator, version: 'v2' },
      parseResult: (value: unknown) => value,
    };

    await expect(store.claim({ ...descriptor, action: 'save-as-js-template' })).resolves.toHaveProperty('reservation');
    await expect(store.claim({ ...descriptor, action: 'detach-to-inline' })).resolves.toHaveProperty('reservation');

    expect(operationModel.getAllValues()).toHaveLength(2);
    expect(operationModel.getAllValues()[0].identityHash).not.toBe(operationModel.getAllValues()[1].identityHash);
  });

  it('allows only one concurrent detach-to-inline reservation for the same request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const db = createJsTemplateSourceOperationDatabase(operationModel);
    const descriptor = {
      action: 'detach-to-inline',
      idempotencyKey: 'concurrent-detach-to-inline',
      request: { locator, version: 'v2' },
      parseResult: (value: unknown) => value,
    };

    const resolutions = await Promise.allSettled([
      new JsTemplateSourceOperationStore(db, 'main').claim(descriptor),
      new JsTemplateSourceOperationStore(db, 'main').claim(descriptor),
    ]);

    expect(resolutions.filter((resolution) => resolution.status === 'fulfilled')).toHaveLength(1);
    expect(resolutions.filter((resolution) => resolution.status === 'rejected')).toHaveLength(1);
    expect(resolutions.find((resolution) => resolution.status === 'rejected')).toMatchObject({
      reason: { code: 'JS_TEMPLATE_IDEMPOTENCY_IN_PROGRESS' },
    });
    expect(operationModel.getAllValues()).toHaveLength(1);
  });

  it('reclaims a failed detach-to-inline reservation for the same request', async () => {
    const operationModel = createJsTemplateSourceOperationModel();
    const store = new JsTemplateSourceOperationStore(createJsTemplateSourceOperationDatabase(operationModel), 'main');
    const descriptor = {
      action: 'detach-to-inline',
      idempotencyKey: 'retry-detach-to-inline',
      request: { locator, version: 'v2' },
      parseResult: (value: unknown) => value,
    };

    const first = await store.claim(descriptor);
    await store.fail(first.reservation, new Error('first attempt failed'));
    const retry = await store.claim(descriptor);

    expect(retry.reservation?.attemptId).not.toBe(first.reservation?.attemptId);
    expect(operationModel.getValues()).toMatchObject({ status: 'pending', errorCode: null, result: null });
  });

  it.each([
    ['disabled', 'JS_TEMPLATE_PROJECT_DISABLED'],
    ['archived', 'JS_TEMPLATE_PROJECT_ARCHIVED'],
  ] as const)('rejects a %s destination before writing JS Page state', async (lifecycleStatus, code) => {
    const saveSource = vi.fn();
    const writeExternalBinding = vi.fn();
    const syncUsages = vi.fn();
    const service = createFailureService({
      destinationProject: { ...project, lifecycleStatus },
      modelUse: 'JSPageModel',
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
    ).rejects.toMatchObject({ code });
    expect(saveSource).not.toHaveBeenCalled();
    expect(writeExternalBinding).not.toHaveBeenCalled();
    expect(syncUsages).not.toHaveBeenCalled();
  });

  it('does not bind or sync usages when JS Page compilation fails', async () => {
    const saveSource = vi.fn(async () => {
      throw new Error('compile failed');
    });
    const writeExternalBinding = vi.fn();
    const syncUsages = vi.fn();
    const service = createFailureService({
      modelUse: 'JSPageModel',
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
      kind: 'js-page' as const,
      entryPath: 'src/client/js-pages/sales-kpi/index.ts',
      descriptorPath: 'src/client/js-pages/sales-kpi/entry.json',
    };
    const service = createFailureService({
      transaction,
      modelUse: 'JSPageModel',
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
      publishPreparedSave: options.saveSource,
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

function createJsTemplateSourceOperationDatabase(
  operationModel: ReturnType<typeof createJsTemplateSourceOperationModel>,
): Database {
  return {
    getRepository: (name: string) => {
      if (name !== 'jsTemplateSourceOperations') {
        throw new Error(`Unexpected repository: ${name}`);
      }
      return { model: operationModel.model };
    },
  } as unknown as Database;
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
  const publishPreparedSave = vi.fn();
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
    { prepareSaveSource, publishPreparedSave, compileCurrentRuntime } as never,
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
    publishPreparedSave,
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
  expect(fixture.publishPreparedSave).not.toHaveBeenCalled();
  expect(fixture.compileCurrentRuntime).not.toHaveBeenCalled();
  expect(fixture.writeExternalBinding).not.toHaveBeenCalled();
  expect(fixture.syncFlowModelUsagesForNodeTree).not.toHaveBeenCalled();
}

describe('detach to inline integration', () => {
  // Old case -> new owner:
  // detach-to-inline / js-block + JSBlockModel -> host-kind support matrix below.
  // detach-to-inline / js-field + JSFieldModel -> host-kind support matrix below.
  // detach-to-inline / js-field + JSEditableFieldModel -> host-kind support matrix below.
  // detach-to-inline / js-field + JSColumnModel -> host-kind support matrix below.
  // detach-to-inline / js-action + JSActionModel -> host-kind support matrix below.
  // detach-to-inline / js-item + JSItemModel -> host-kind support matrix below.
  // detach-to-inline / js-page + JSPageModel -> host-kind support matrix below.
  // detach-to-inline / js-page + JSBlockModel -> host-kind support matrix below.
  // detach-to-inline / js-block + JSColumnModel -> host-kind support matrix below.
  // detach-to-inline / runjs + JSColumnModel -> host-kind support matrix below.
  // detach-to-inline / reserves the RunJS manifest file slot before opening a database transaction -> file-limit matrix below.
  // detach-to-inline / allows a 200-file workspace when the relocated dependency closure fits with the manifest -> file-limit matrix below.
  // detach-to-inline / detaches a JS Page with its snapshot and settings while removing the active usage -> this suite.
  // detach-to-inline / rejects a host that no longer points to the selected JS Template entry -> this suite.
  // New owner: detach late failure rolls back the external binding, RunJS repository Head, and usage index.

  const locator = {
    kind: 'flowModel.step',
    modelUid: 'fm_js_block',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  } as const;

  const binding = {
    type: 'js-template-entry',
    projectId: 'jtp_sales',
    templateId: 'jtt_sales',
    kind: 'js-block',
  } as const;

  const entry: JsTemplate = {
    id: binding.templateId,
    projectId: binding.projectId,
    target: 'client',
    kind: 'js-block',
    templateName: 'sales',
    entryPath: 'src/client/js-blocks/sales/index.tsx',
    descriptorPath: 'src/client/js-blocks/sales/entry.json',
    title: 'Sales',
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: null,
    settingsSchemaHash: null,
    compiledCommitId: 'commit_light',
    compiledInputKey: 'compile_key',
    compilerBuildId: 'compiler_build',
    runtimeArtifact: null,
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
    healthStatus: 'ready',
    diagnostics: [],
  };
  const detachProject = {
    ...project,
    id: binding.projectId,
    headCommitId: 'commit_light',
  };

  function createDetachCommitSourceReader(
    files: Array<{ path: string; content: string; language?: string; mode?: string }> = [
      { path: entry.entryPath, content: 'ctx.render(<div />);' },
    ],
  ) {
    const pullCommit = vi.fn(async (input: { projectId: string; commitId: string; includeContent: string }) => ({
      project: { ...detachProject, id: input.projectId, headCommitId: input.commitId },
      commit: { id: input.commitId, projectId: input.projectId },
      tree: { hash: 'source_tree', entryCount: files.length, byteSize: 100 },
      unchanged: false,
      files: files.map((file) => ({
        pathHash: `path-${file.path}`,
        pathLowerHash: `path-lower-${file.path}`,
        blobHash: `blob-${file.path}`,
        size: file.content.length,
        language: file.language || 'typescript',
        mode: file.mode || '100644',
        ...file,
      })),
    }));
    return { pullCommit };
  }

  function createDetachJsTemplateToInlinePreflightFixture(
    options: {
      entry?: JsTemplate;
      entryError?: Error;
      compileAccepted?: boolean;
      targetRepository?: VscRepositoryRecord;
      ensureError?: Error;
      projectHeadCommitId?: string;
      lockedProjectHeadCommitId?: string;
      sourceFiles?: Array<{ path: string; content: string; language?: string; mode?: string }>;
      hostBindingAfterPreparation?: JsTemplateRuntimeSourceBinding;
      templateAfterPreparation?: JsTemplate;
    } = {},
  ) {
    const operationModel = createJsTemplateSourceOperationModel();
    const transaction = vi.fn(async (run: (current: Transaction) => Promise<unknown>) =>
      run({ LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction),
    );
    const flowModel = {
      uid: locator.modelUid,
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("external");',
            version: 'v2',
            sourceMode: 'js-template',
            sourceBinding: binding,
          },
        },
      },
    };
    const lockedFlowModel = options.hostBindingAfterPreparation
      ? {
          ...flowModel,
          stepParams: {
            jsSettings: {
              runJs: {
                ...flowModel.stepParams.jsSettings.runJs,
                sourceBinding: options.hostBindingAfterPreparation,
              },
            },
          },
        }
      : flowModel;
    const db = {
      sequelize: { transaction },
      getCollection: () => ({
        model: { findByPk: vi.fn(async () => flowModel) },
        repository: {
          findModelById: vi.fn(async (_uid: string, readOptions?: { transaction?: Transaction }) =>
            readOptions?.transaction ? lockedFlowModel : flowModel,
          ),
          patch: vi.fn(),
        },
      }),
      getRepository: (name: string) => {
        if (name === 'jsTemplateSourceOperations') {
          return { model: operationModel.model };
        }
        return { update: vi.fn() };
      },
    } as unknown as Database;
    const getTemplate = vi.fn(async (_templateId: string, templateContext?: { transaction?: Transaction }) => {
      if (options.entryError) {
        throw options.entryError;
      }
      if (templateContext?.transaction && options.templateAfterPreparation) {
        return options.templateAfterPreparation;
      }
      return options.entry || entry;
    });
    const compilerBridge = new JsTemplateWorkspaceCompilerBridge();
    const prepareEntry = vi.fn((compileInput: JsTemplateWorkspaceCompileInput) => {
      const preparation = compilerBridge.prepareEntry(compileInput);
      if (options.compileAccepted === false) {
        return {
          ...preparation,
          accepted: false,
          diagnostics: [{ code: 'JS_TEMPLATE_COMPILE_FAILED', severity: 'error' as const, message: 'compile failed' }],
          failureCode: 'JS_TEMPLATE_COMPILE_FAILED',
        };
      }
      return preparation;
    });
    const findRepositoryByIdentity = vi.fn(async () => options.targetRepository || null);
    const pull = vi.fn(async () => ({ files: [] }));
    const sourceReader = createDetachCommitSourceReader(options.sourceFiles);
    const ensureAndPush = vi.fn(async () => {
      if (options.ensureError) {
        throw options.ensureError;
      }
      throw new Error('unexpected repository publish');
    });
    const service = new DetachJsTemplateToInlineService(
      db,
      {
        assertApplicationOwnership: vi.fn(async () => undefined),
        getProject: vi.fn(async () => ({
          ...detachProject,
          headCommitId: options.projectHeadCommitId || detachProject.headCommitId,
        })),
        lockInternalProjectForUpdate: vi.fn(async () => ({
          ...detachProject,
          headCommitId: options.lockedProjectHeadCommitId || options.projectHeadCommitId || detachProject.headCommitId,
        })),
      } as never,
      { getTemplate } as never,
      sourceReader as never,
      { prepareEntry } as never,
      { syncFlowModelUsagesForNodeTree: vi.fn() } as never,
      () =>
        ({
          findRepositoryByIdentity,
          pull,
          ensureAndPush,
        }) as unknown as VscFileService,
      () =>
        ({
          require: () => ({
            kind: 'flowModel.step',
            assertCanWrite: vi.fn(async () => undefined),
            readLegacy: vi.fn(async () => ({
              code: 'ctx.render("external");',
              version: 'v2',
              label: 'JS block',
              surfaceStyle: 'render' as const,
              language: 'typescript' as const,
              ownerFingerprint: 'owner_before',
              metadata: { modelUse: 'JSBlockModel' },
            })),
          }),
        }) as unknown as RunJSSourceAdapterRegistry,
    );

    return {
      service,
      transaction,
      findRepositoryByIdentity,
      pull,
      ensureAndPush,
      prepareEntry,
      pullSourceCommit: sourceReader.pullCommit,
    };
  }

  function createDetachJsTemplateToInlineTransactionFailureFixture(
    failureStage: 'host-write' | 'usage-sync' | 'audit' | 'operation-complete',
  ) {
    const operationModel = createJsTemplateSourceOperationModel({
      beforeUpdate: (values) => {
        if (failureStage === 'operation-complete' && values.status === 'completed') {
          throw new Error('forced operation complete rollback');
        }
      },
    });
    const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
    const initialFlowModel = {
      uid: locator.modelUid,
      use: 'JSBlockModel',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("external");',
            version: 'v1',
            sourceMode: 'js-template',
            sourceBinding: { ...binding },
            sourceRef: {
              type: 'vsc-file',
              repoId: 'old_inline_repo',
              commitId: 'old_inline_commit',
              entry: 'src/client/index.ts',
            },
          },
        },
      },
    };
    let flowModel = clone(initialFlowModel);
    let repositoryId: string | null = null;
    let commitCount = 0;
    let usageActive = true;
    let auditCount = 0;
    const db = {
      sequelize: {
        transaction: async (run: (current: Transaction) => Promise<unknown>) => {
          try {
            return await run(transaction);
          } catch (error) {
            flowModel = clone(initialFlowModel);
            repositoryId = null;
            commitCount = 0;
            usageActive = true;
            auditCount = 0;
            throw error;
          }
        },
      },
      getCollection: () => ({
        model: { findByPk: vi.fn(async () => clone(flowModel)) },
        repository: {
          findModelById: vi.fn(async () => clone(flowModel)),
          patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
            flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
          }),
        },
      }),
      getRepository: (name: string) =>
        name === 'jsTemplateSourceOperations' ? { model: operationModel.model } : { update: vi.fn() },
    } as unknown as Database;
    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const ensureAndPush = vi.fn(async () => {
      repositoryId = 'runjs_repo_created_in_transaction';
      commitCount = 1;
      return {
        repository: {
          id: repositoryId,
          ...identity,
          status: 'active' as const,
          defaultRef: 'head' as const,
          headCommitId: 'runjs_commit_created_in_transaction',
          headSeq: 1,
        },
        commit: {
          id: 'runjs_commit_created_in_transaction',
          repoId: repositoryId,
          seq: 1,
          parentCommitId: null,
          treeHash: 'tree_created_in_transaction',
          hash: 'commit_hash',
          message: 'Detach to inline',
          authorId: '1',
          metadata: {},
        },
        tree: { hash: 'tree_created_in_transaction', entryCount: 2, byteSize: 100 },
      };
    });
    const adapter = {
      kind: 'flowModel.step',
      assertCanWrite: vi.fn(async () => undefined),
      readLegacy: vi.fn(async () => ({
        code: 'ctx.render("external");',
        version: 'v1',
        label: 'JS block',
        surfaceStyle: 'render' as const,
        language: 'typescript' as const,
        ownerFingerprint: 'owner_before',
        metadata: { modelUse: 'JSBlockModel' },
      })),
      writeRuntime: vi.fn(
        async (input: {
          artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
          commitId: string;
        }) => {
          const runJS = flowModel.stepParams.jsSettings.runJs;
          runJS.code = input.artifact.code;
          runJS.version = input.artifact.version;
          runJS.sourceRef = {
            type: 'vsc-file',
            repoId: String(input.artifact.metadata?.repoId || ''),
            commitId: input.commitId,
            entry: String(input.artifact.entryPath || ''),
          };
          if (failureStage === 'host-write') {
            throw new Error('forced host write rollback');
          }
        },
      ),
      getFingerprint: vi.fn(async () => 'owner_after'),
    };
    const syncFlowModelUsagesForNodeTree = vi.fn(async () => {
      usageActive = false;
      if (failureStage === 'usage-sync') {
        throw new Error('forced usage sync rollback');
      }
    });
    const recordLifecycleEvent = vi.fn(async () => {
      auditCount += 1;
      if (failureStage === 'audit') {
        throw new Error('forced audit rollback');
      }
    });
    const service = new DetachJsTemplateToInlineService(
      db,
      {
        assertApplicationOwnership: vi.fn(async () => undefined),
        getProject: vi.fn(async () => detachProject),
        lockInternalProjectForUpdate: vi.fn(async () => detachProject),
      } as never,
      { getTemplate: vi.fn(async () => entry) } as never,
      createDetachCommitSourceReader() as never,
      {
        prepareEntry: vi.fn((compileInput: JsTemplateWorkspaceCompileInput) =>
          new JsTemplateWorkspaceCompilerBridge().prepareEntry(compileInput),
        ),
      } as never,
      { syncFlowModelUsagesForNodeTree } as never,
      () =>
        ({
          findRepositoryByIdentity: vi.fn(async () => null),
          ensureAndPush,
        }) as unknown as VscFileService,
      () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
      'main',
      { recordLifecycleEvent } as never,
    );

    return {
      service,
      operationModel,
      ensureAndPush,
      getState: () => ({ flowModel, repositoryId, commitCount, usageActive, auditCount }),
      initialFlowModel,
    };
  }

  describe('DetachJsTemplateToInlineService', () => {
    it.each([
      ['js-block', 'JSBlockModel', true],
      ['js-field', 'JSFieldModel', true],
      ['js-field', 'JSEditableFieldModel', true],
      ['js-field', 'JSColumnModel', true],
      ['js-action', 'JSActionModel', true],
      ['js-item', 'JSItemModel', true],
      ['js-page', 'JSPageModel', true],
      ['js-page', 'JSBlockModel', false],
      ['js-block', 'JSColumnModel', false],
      ['runjs', 'JSColumnModel', false],
    ])('checks whether %s can detach from %s back to inline code', (kind, modelUse, expected) => {
      expect(isDetachJsTemplateToInlineHostSupported(kind, modelUse)).toBe(expected);
    });

    it.each([
      {
        label: 'reserves the RunJS manifest file slot for a full 200-file dependency closure',
        files: [
          {
            path: entry.entryPath,
            content: Array.from({ length: 199 }, (_, index) => `import '../../../shared/file-${index + 1}';`).join(
              '\n',
            ),
          },
          ...Array.from({ length: 199 }, (_, index) => ({
            path: `src/shared/file-${index + 1}.ts`,
            content: 'export const value = true;\n',
          })),
        ],
        expected: {
          code: 'JS_TEMPLATE_SOURCE_ERROR',
          details: expect.objectContaining({ sourceCode: 'REPO_LIMIT_EXCEEDED' }),
        },
        lockedProjectHeadCommitId: undefined,
        transactionCalls: 0,
      },
      {
        label: 'allows a 200-file workspace when the relocated dependency closure fits with the manifest',
        files: [
          { path: entry.entryPath, content: 'ctx.render(<div />);' },
          ...Array.from({ length: 199 }, (_, index) => ({
            path: `src/shared/unused-${index + 1}.ts`,
            content: 'export const unused = true;\n',
          })),
        ],
        expected: { code: 'JS_TEMPLATE_SOURCE_OUTDATED' },
        lockedProjectHeadCommitId: 'commit_changed_after_source_read',
        transactionCalls: 1,
      },
    ])('$label', async ({ files, expected, lockedProjectHeadCommitId, transactionCalls }) => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({ sourceFiles: files, lockedProjectHeadCommitId });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-to-inline-file-limit',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { adapterContext: {} },
        ),
      ).rejects.toMatchObject(expected);
      expect(fixture.transaction).toHaveBeenCalledTimes(transactionCalls);
    });

    it.each([
      {
        label: 'a missing Entry',
        options: {
          entryError: new JsTemplateError('JS_TEMPLATE_NOT_FOUND', 'Entry was not found'),
        },
        files: [{ path: entry.entryPath, content: 'ctx.render(<div />);' }],
        expectedCode: 'JS_TEMPLATE_NOT_FOUND',
      },
      {
        label: 'an Entry that no longer matches the request',
        options: { entry: { ...entry, projectId: 'jtp_other' } },
        files: [{ path: entry.entryPath, content: 'ctx.render(<div />);' }],
        expectedCode: 'JS_TEMPLATE_BINDING_OUTDATED',
      },
      {
        label: 'a rejected JS Template compile',
        options: { compileAccepted: false },
        files: [{ path: entry.entryPath, content: 'ctx.render(<div />);' }],
        expectedCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      },
      {
        label: 'a rejected canonical Inline compile',
        options: {},
        files: [{ path: entry.entryPath, content: 'ctx.render(<div>);' }],
        expectedCode: 'JS_TEMPLATE_VALIDATION_FAILED',
      },
    ])('does not create a RunJS repository for $label', async ({ options, files, expectedCode }) => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({ ...options, sourceFiles: files });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: `detach-to-inline-preflight-${expectedCode}-${files[0].content.length}`,
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: expectedCode });

      expect(fixture.transaction).not.toHaveBeenCalled();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
    });

    it('rejects an existing target repository whose Head changes after preparation', async () => {
      const identity = buildRunJSSourceRepositoryIdentity(locator);
      const targetRepository: VscRepositoryRecord = {
        id: 'runjs_repo_existing',
        ...identity,
        status: 'active',
        defaultRef: 'head',
        headCommitId: 'runjs_head_before',
        headSeq: 1,
      };
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        targetRepository,
        ensureError: new VscError('BASE_COMMIT_OUTDATED', 'Target repository Head changed'),
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-to-inline-target-head-changed',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({
        code: 'JS_TEMPLATE_SOURCE_ERROR',
        details: { sourceCode: 'BASE_COMMIT_OUTDATED' },
      });

      expect(fixture.pull).toHaveBeenCalledWith(
        { repoId: targetRepository.id, includeContent: 'none' },
        expect.not.objectContaining({ transaction: expect.anything() }),
      );
      expect(fixture.ensureAndPush).toHaveBeenCalledWith(
        expect.objectContaining({ expectedRepository: targetRepository }),
        expect.objectContaining({ transaction: expect.anything() }),
      );
      expect(fixture.prepareEntry).toHaveBeenCalledOnce();
    });

    it('rejects a stale Source Project Head before copying or mutating any Host state', async () => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({ projectHeadCommitId: 'commit_newer' });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-stale-project-head',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({
        code: 'JS_TEMPLATE_SOURCE_OUTDATED',
        status: 409,
        details: {
          projectId: binding.projectId,
          templateId: binding.templateId,
          expectedProjectHeadCommitId: detachProject.headCommitId,
          currentProjectHeadCommitId: 'commit_newer',
        },
      });
      expect(fixture.transaction).not.toHaveBeenCalled();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
      expect(fixture.prepareEntry).not.toHaveBeenCalled();
    });

    it('rechecks the Source Project Head under lock before publishing Inline source', async () => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        lockedProjectHeadCommitId: 'commit_changed_during_detach',
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-project-head-race',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({
        code: 'JS_TEMPLATE_SOURCE_OUTDATED',
        status: 409,
        details: { currentProjectHeadCommitId: 'commit_changed_during_detach' },
      });
      expect(fixture.transaction).toHaveBeenCalledOnce();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
      expect(fixture.prepareEntry).toHaveBeenCalledOnce();
    });

    it('rejects a Host binding that changes after exact-commit source preparation', async () => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        hostBindingAfterPreparation: { ...binding, templateId: 'jtt_rebound' },
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-host-binding-race',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
      expect(fixture.pullSourceCommit).toHaveBeenCalledOnce();
      expect(fixture.prepareEntry).toHaveBeenCalledOnce();
      expect(fixture.transaction).toHaveBeenCalledOnce();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
    });

    it('rejects Template metadata that changes after exact-commit source preparation', async () => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        templateAfterPreparation: { ...entry, entryPath: 'src/client/js-blocks/sales/renamed.tsx' },
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-template-metadata-race',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
      expect(fixture.pullSourceCommit).toHaveBeenCalledOnce();
      expect(fixture.prepareEntry).toHaveBeenCalledOnce();
      expect(fixture.transaction).toHaveBeenCalledOnce();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
    });

    it('detaches a JS Page to Inline with its snapshot and settings while removing the active usage', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const operationModel = createJsTemplateSourceOperationModel();
      const pageLocator = { ...locator, modelUid: 'fm_js_page' };
      const pageBinding = { ...binding, projectId: 'jtp_pages', templateId: 'jtt_page', kind: 'js-page' as const };
      const pageEntry = {
        ...entry,
        id: pageBinding.templateId,
        projectId: pageBinding.projectId,
        kind: 'js-page' as const,
        templateName: 'page',
        entryPath: 'src/client/js-pages/page/index.tsx',
        descriptorPath: 'src/client/js-pages/page/entry.json',
        title: 'Page',
      };
      const currentSettings = {
        enabled: false,
        nested: { visibleValue: 'kept' },
        items: [{ key: 'first', active: false }],
      };
      const canonicalDescriptorContent = `${JSON.stringify(
        {
          schemaVersion: 1,
          key: 'sales',
          title: 'Sales',
          settings: { enabled: { type: 'boolean', default: true } },
        },
        null,
        2,
      )}\n`;
      const descriptorContent = `\ufeff${canonicalDescriptorContent.replace(/\n/gu, '\r\n')}`;
      const flowModel = {
        uid: pageLocator.modelUid,
        use: 'JSPageModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code: 'ctx.render("old");',
              version: 'v2',
              sourceMode: 'js-template',
              sourceBinding: { ...pageBinding },
              settings: currentSettings,
              sourceRef: {
                type: 'vsc-file',
                repoId: 'old_inline_repo',
                commitId: 'old_inline_commit',
                entry: 'src/client/index.tsx',
              },
            },
          },
        },
      };
      const patch = vi.fn(async (values: Record<string, unknown>) => {
        flowModel.stepParams = values.stepParams as typeof flowModel.stepParams;
      });
      const lockFlowModelRecord = vi.fn(async () => flowModel);
      const updateCommit = vi.fn(async () => undefined);
      const db = {
        sequelize: {
          transaction: (run: (current: Transaction) => Promise<unknown>) => run(transaction),
        },
        getCollection: () => ({
          model: { findByPk: lockFlowModelRecord },
          repository: { findModelById: vi.fn(async () => JSON.parse(JSON.stringify(flowModel))), patch },
        }),
        getRepository: (name: string) =>
          name === 'jsTemplateSourceOperations' ? { model: operationModel.model } : { update: updateCommit },
      } as unknown as Database;
      const compilerBridge = new JsTemplateWorkspaceCompilerBridge();
      const prepareEntry = vi.spyOn(compilerBridge, 'prepareEntry');
      const compileEntry = vi.spyOn(compilerBridge, 'compileEntry');
      const syncUsages = vi.fn(async () => undefined);
      const writeRuntime = vi.fn(
        async (input: {
          artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
          commitId: string;
        }) => {
          flowModel.stepParams.jsSettings.runJs.code = input.artifact.code;
          flowModel.stepParams.jsSettings.runJs.version = input.artifact.version;
          flowModel.stepParams.jsSettings.runJs.sourceRef = {
            type: 'vsc-file',
            repoId: String(input.artifact.metadata?.repoId || ''),
            commitId: input.commitId,
            entry: String(input.artifact.entryPath || 'src/client/index.tsx'),
          };
          return { ownerFingerprint: 'owner_runtime' };
        },
      );
      const assertCanWrite = vi.fn(async () => undefined);
      const readLegacy = vi.fn(async () => ({
        code: 'ctx.render("old");',
        version: 'v2',
        label: 'JS page',
        surfaceStyle: 'render' as const,
        language: 'typescript' as const,
        ownerFingerprint: 'owner_before',
        metadata: { modelUse: 'JSPageModel' },
      }));
      const adapter = {
        kind: 'flowModel.step',
        assertCanWrite,
        readLegacy,
        writeRuntime,
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const runJSRepo = {
        id: 'runjs_repo',
        ownerType: 'runjs-source',
        ownerId: 'runjs:flowModel.step:fm_js_block:expected',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headCommitId: 'runjs_old_commit',
        headSeq: 1,
      };
      const findRepositoryByIdentity = vi.fn(async (input: { ownerId: string }) => ({
        ...runJSRepo,
        ownerId: input.ownerId,
      }));
      const targetBaseWorkspaceFiles = [
        { path: 'src/client/entry.json', content: '{"schemaVersion":0}\n', language: 'json', mode: '100644' },
        {
          path: 'src/client/index.tsx',
          content: 'ctx.render("old");\n',
          language: 'tsx',
          mode: '100755',
        },
        { path: 'src/client/old.ts', content: 'export const stale = true;\n', language: 'typescript', mode: '100644' },
        { path: 'src/shared/used.ts', content: 'export const used = true;\n', language: 'typescript', mode: '100644' },
      ];
      const committedWorkspaceFiles = new Map<
        string,
        { path: string; content: string; language?: string; mode?: string }
      >(targetBaseWorkspaceFiles.map((file) => [file.path, { ...file }]));
      let committedHead = runJSRepo.headCommitId;
      const ensureAndPush = vi.fn(async (pushInput: { files: VscFileChange[]; metadata: Record<string, unknown> }) => {
        for (const file of pushInput.files) {
          if (file.operation === 'delete') {
            committedWorkspaceFiles.delete(file.path);
          } else if (typeof file.content === 'string') {
            committedWorkspaceFiles.set(file.path, {
              path: file.path,
              content: file.content,
              ...(file.language ? { language: file.language } : {}),
              ...(file.mode ? { mode: file.mode } : {}),
            });
          }
        }
        committedHead = 'runjs_new_commit';
        return {
          repository: { ...runJSRepo, headCommitId: committedHead, headSeq: 2 },
          commit: {
            id: committedHead,
            repoId: runJSRepo.id,
            seq: 2,
            parentCommitId: runJSRepo.headCommitId,
            treeHash: 'tree_hash',
            hash: 'commit_hash',
            message: 'Detach to inline',
            authorId: '1',
            metadata: pushInput.metadata,
          },
          tree: { hash: 'tree_hash', entryCount: committedWorkspaceFiles.size, byteSize: 100 },
        };
      });
      const pullCommit = vi.fn(async (pullInput: { repoId: string; commitId: string }) => {
        if (pullInput.repoId !== runJSRepo.id || pullInput.commitId !== committedHead) {
          throw new Error('Unexpected committed workspace read');
        }
        return {
          repository: { ...runJSRepo, headCommitId: committedHead, headSeq: 2 },
          commit: { id: committedHead, repoId: runJSRepo.id },
          tree: { hash: 'tree_hash', entryCount: committedWorkspaceFiles.size, byteSize: 100 },
          unchanged: false,
          files: Array.from(committedWorkspaceFiles.values()).sort((left, right) =>
            left.path.localeCompare(right.path),
          ),
        };
      });
      const vscFileService = {
        findRepositoryByIdentity,
        getRepository: vi.fn(async () => runJSRepo),
        pull: vi.fn(async () => ({
          repository: runJSRepo,
          commit: null,
          tree: null,
          unchanged: false,
          files: targetBaseWorkspaceFiles.map(({ path, language, mode }) => ({ path, language, mode })),
        })),
        pullCommit,
        ensureAndPush,
      } as unknown as VscFileService;
      const getVscFileService = vi.fn(() => vscFileService);
      const assertApplicationOwnership = vi.fn(async () => undefined);
      const getTemplate = vi.fn(async () => pageEntry);
      const recordLifecycleEvent = vi.fn(async () => undefined);
      const lockProject = vi.fn(async () => ({ ...detachProject, id: pageBinding.projectId }));
      const sourceFiles = [
        {
          path: pageEntry.entryPath,
          content: "import { used } from '../../../shared/used';\nctx.render(String(used));\n",
          language: 'tsx',
          mode: '100755',
        },
        { path: pageEntry.descriptorPath, content: descriptorContent, language: 'json', mode: '100644' },
        { path: 'src/shared/used.ts', content: 'export const used = true;\n' },
        { path: 'src/shared/unused.ts', content: 'export const unused = true;\n' },
        {
          path: 'src/client/js-pages/sibling/index.tsx',
          content: 'ctx.render("sibling");\n',
        },
      ];
      const sourceReader = createDetachCommitSourceReader(sourceFiles);
      const service = new DetachJsTemplateToInlineService(
        db,
        {
          assertApplicationOwnership,
          getProject: vi.fn(async () => ({ ...detachProject, id: pageBinding.projectId })),
          lockInternalProjectForUpdate: lockProject,
        } as never,
        { getTemplate } as never,
        sourceReader as never,
        compilerBridge,
        { syncFlowModelUsagesForNodeTree: syncUsages } as never,
        getVscFileService,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
        'main',
        { recordLifecycleEvent } as never,
      );

      const input = {
        idempotencyKey: 'detach-to-inline-page',
        expectedProjectHeadCommitId: pageEntry.compiledCommitId,
        locator: pageLocator,
        projectId: pageBinding.projectId,
        templateId: pageBinding.templateId,
      };
      const serviceContext = {
        actorUserId: '1',
        requestId: 'req_detach_inline',
        adapterContext: {},
      };
      const result = await service.detachToInline(input, serviceContext);
      getTemplate.mockResolvedValue({ ...entry, entryPath: 'src/client/js-blocks/changed/index.tsx' });
      const modifiedEntryReplay = await service.detachToInline(input, serviceContext);
      getTemplate.mockRejectedValue(new Error('source entry was deleted after the completed detach'));
      const deletedEntryReplay = await service.detachToInline(input, serviceContext);

      await expect(service.detachToInline(input, serviceContext)).resolves.toEqual(result);
      assertCanWrite.mockRejectedValueOnce(new Error('replay host permission denied'));
      await expect(service.detachToInline(input, serviceContext)).rejects.toThrow('replay host permission denied');

      expect(prepareEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          entryPath: 'src/client/index.tsx',
          files: expect.arrayContaining([
            expect.objectContaining({ path: 'src/client/entry.json', content: descriptorContent }),
            expect.objectContaining({ path: 'src/client/index.tsx' }),
            expect.objectContaining({ path: 'src/shared/used.ts' }),
          ]),
        }),
      );
      expect(JSON.stringify(prepareEntry.mock.calls)).not.toContain('src/shared/unused.ts');
      expect(JSON.stringify(prepareEntry.mock.calls)).not.toContain('src/client/js-pages/sibling/index.tsx');
      expect(prepareEntry).toHaveBeenCalledOnce();
      expect(compileEntry).not.toHaveBeenCalled();
      expect(ensureAndPush).toHaveBeenCalledWith(
        expect.objectContaining({
          allowEmptyCommit: true,
          files: expect.arrayContaining([
            expect.objectContaining({ path: '.nocobase/runjs-source.json', operation: 'upsert' }),
            expect.objectContaining({
              path: 'src/client/entry.json',
              content: canonicalDescriptorContent,
              language: 'json',
              mode: '100644',
              operation: 'upsert',
            }),
            expect.objectContaining({
              path: 'src/client/index.tsx',
              language: 'tsx',
              mode: '100755',
              operation: 'upsert',
            }),
            expect.objectContaining({ path: 'src/client/old.ts', operation: 'delete' }),
          ]),
        }),
        expect.any(Object),
      );
      const pushedFiles = ensureAndPush.mock.calls[0][0].files as VscFileChange[];
      const canonicalFiles = pushedFiles.filter((file) => file.operation === 'upsert');
      const committed = await pullCommit({ repoId: result.runJSRepoId, commitId: result.commitId });
      const materializedCommittedFiles = canonicalizeRunJSCompileFiles(
        (committed.files || []).map((file) => {
          if (typeof file.content !== 'string') {
            throw new Error(`Committed file "${file.path}" has no content`);
          }
          return { ...file, content: file.content };
        }),
      );
      expect(materializedCommittedFiles).toEqual(canonicalFiles);
      expect(materializedCommittedFiles.some((file) => file.path === 'src/client/old.ts')).toBe(false);
      expect(materializedCommittedFiles).toContainEqual(
        expect.objectContaining({
          path: 'src/shared/used.ts',
          content: 'export const used = true;\n',
          mode: '100644',
        }),
      );
      expect(materializedCommittedFiles).toContainEqual(
        expect.objectContaining({
          path: 'src/client/entry.json',
          content: canonicalDescriptorContent,
          language: 'json',
          mode: '100644',
        }),
      );
      expect(
        JSON.parse(
          materializedCommittedFiles.find((file) => file.path === '.nocobase/runjs-source.json')?.content || '{}',
        ),
      ).toEqual({
        schemaVersion: 1,
        entry: 'src/client/index.tsx',
        runtimeVersion: 'v2',
        surfaceStyle: 'render',
        compiler: { module: 'virtual-esm', jsx: true },
      });
      expect(result.filesHash).toBe(buildRunJSFilesHash(canonicalFiles));
      expect(buildRunJSFilesHash(materializedCommittedFiles)).toBe(result.filesHash);
      const sourceId = createHash('sha256').update(result.filesHash).digest('hex').slice(0, 16);
      expect(result.code).toContain(`nocobase-runjs://bundle/${sourceId}.js`);
      const pushMetadata = ensureAndPush.mock.calls[0][0].metadata as Record<string, unknown>;
      expect(pushMetadata.filesHash).toBe(result.filesHash);
      expect(pushMetadata.runtimeCodeHash).toBe(createHash('sha256').update(result.code).digest('hex'));
      expect(findRepositoryByIdentity).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          request: expect.objectContaining({
            resourceName: 'runJSSources',
            actionName: 'save',
          }),
        }),
      );
      expect(findRepositoryByIdentity.mock.invocationCallOrder[0]).toBeLessThan(
        lockFlowModelRecord.mock.invocationCallOrder[0],
      );
      expect(lockFlowModelRecord.mock.invocationCallOrder[0]).toBeLessThan(lockProject.mock.invocationCallOrder[0]);
      expect(modifiedEntryReplay).toEqual(result);
      expect(deletedEntryReplay).toEqual(result);
      expect(getVscFileService).toHaveBeenCalledTimes(5);
      expect(ensureAndPush).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ transaction }));
      expect(ensureAndPush).toHaveBeenCalledOnce();
      expect(writeRuntime).toHaveBeenCalledOnce();
      expect(patch).toHaveBeenCalledOnce();
      expect(syncUsages).toHaveBeenCalledOnce();
      expect(prepareEntry.mock.invocationCallOrder[0]).toBeLessThan(lockFlowModelRecord.mock.invocationCallOrder[0]);
      expect(assertCanWrite).toHaveBeenCalledTimes(6);
      expect(assertCanWrite.mock.calls[0][0].ctx.transaction).toBeUndefined();
      expect(readLegacy).toHaveBeenCalledTimes(2);
      expect(readLegacy.mock.calls[0][0].ctx.transaction).toBeUndefined();
      expect(assertCanWrite).toHaveBeenCalledWith({
        locator: pageLocator,
        ctx: expect.objectContaining({
          transaction,
          sourceTransition: 'external-to-inline',
        }),
      });
      expect(readLegacy).toHaveBeenCalledWith({
        locator: pageLocator,
        ctx: expect.objectContaining({
          transaction,
          sourceTransition: 'external-to-inline',
        }),
      });
      expect(writeRuntime).toHaveBeenCalledWith(
        expect.objectContaining({
          baseOwnerFingerprint: 'owner_before',
          commitId: 'runjs_new_commit',
          ctx: expect.objectContaining({
            transaction,
            sourceTransition: 'external-to-inline',
          }),
          artifact: expect.objectContaining({
            filesHash: result.filesHash,
            code: expect.stringContaining(`nocobase-runjs://bundle/${sourceId}.js`),
            metadata: {
              entry: 'src/client/index.tsx',
              runtimeVersion: 'v2',
              surfaceStyle: 'render',
              target: 'client',
              projectId: pageBinding.projectId,
              templateId: pageBinding.templateId,
              kind: 'js-page',
              templateName: 'page',
              modelUse: 'JSPageModel',
              surface: 'js-model.render',
              compilerSurfaceStyle: 'render',
              runtimeCodeHash: createHash('sha256').update(result.code).digest('hex'),
              repoId: 'runjs_repo',
            },
          }),
        }),
      );
      expect(flowModel.stepParams.jsSettings.runJs).toMatchObject({
        code: result.code,
        version: result.runtimeVersion,
        sourceMode: 'inline',
        sourceRef: result.sourceRef,
      });
      expect(flowModel.stepParams.jsSettings.runJs.settings).toEqual(currentSettings);
      expect(flowModel.stepParams.jsSettings.runJs).not.toHaveProperty('sourceBinding');
      expect(syncUsages).toHaveBeenCalledWith(
        { rootUid: pageLocator.modelUid, action: 'jsTemplates.detachToInline' },
        expect.objectContaining({ transaction }),
      );
      expect(updateCommit).toHaveBeenCalledWith(expect.objectContaining({ filterByTk: 'runjs_new_commit' }));
      expect(assertApplicationOwnership).toHaveBeenCalledTimes(4);
      expect(getTemplate).toHaveBeenCalledTimes(2);
      expect(sourceReader.pullCommit).toHaveBeenCalledWith(
        {
          projectId: pageBinding.projectId,
          commitId: pageEntry.compiledCommitId,
          includeContent: 'all',
        },
        expect.not.objectContaining({ transaction: expect.anything() }),
      );
      expect(sourceReader.pullCommit).toHaveBeenCalledOnce();
      expect(vscFileService.getRepository).toHaveBeenCalledTimes(3);
      expect(operationModel.getValues()).toMatchObject({ status: 'completed', result });
      expect(operationModel.model.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed', result }),
        expect.objectContaining({ transaction }),
      );
      expect(recordLifecycleEvent).toHaveBeenCalledTimes(1);
      expect(recordLifecycleEvent).toHaveBeenCalledWith({
        projectId: pageBinding.projectId,
        action: 'detachJsTemplateToInline',
        result: 'success',
        requestId: 'req_detach_inline',
        actorUserId: '1',
        message: 'JS Template detached to inline RunJS',
        details: {
          destinationType: 'inline',
          templateId: pageBinding.templateId,
          kind: 'js-page',
          runJSRepoId: 'runjs_repo',
        },
        transaction,
      });
      expect(result).toMatchObject({
        runJSRepoId: 'runjs_repo',
        commitId: 'runjs_new_commit',
        ownerFingerprint: 'owner_after',
        code: expect.stringContaining(`nocobase-runjs://bundle/${sourceId}.js`),
        sourceRef: {
          type: 'vsc-file',
          repoId: 'runjs_repo',
          commitId: 'runjs_new_commit',
          entry: 'src/client/index.tsx',
        },
      });
    });

    it.each([
      ['host-write', 'forced host write rollback'],
      ['usage-sync', 'forced usage sync rollback'],
      ['audit', 'forced audit rollback'],
      ['operation-complete', 'forced operation complete rollback'],
    ] as const)('rolls back every resource after a %s failure', async (failureStage, message) => {
      const fixture = createDetachJsTemplateToInlineTransactionFailureFixture(failureStage);

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: `detach-to-inline-${failureStage}-rollback`,
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toThrow(message);

      expect(fixture.ensureAndPush).toHaveBeenCalledOnce();
      expect(fixture.getState()).toEqual({
        flowModel: fixture.initialFlowModel,
        repositoryId: null,
        commitCount: 0,
        usageActive: true,
        auditCount: 0,
      });
      expect(fixture.operationModel.getValues()).toMatchObject({ status: 'failed', errorCode: 'Error' });
    });

    it('publishes only one of two different idempotency keys racing for a missing repository', async () => {
      const operationModel = createJsTemplateSourceOperationModel();
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      let flowModel = {
        uid: locator.modelUid,
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code: 'ctx.render("external");',
              version: 'v1',
              sourceMode: 'js-template',
              sourceBinding: { ...binding },
              sourceRef: {
                type: 'vsc-file',
                repoId: 'old_inline_repo',
                commitId: 'old_inline_commit',
                entry: 'src/client/index.ts',
              },
            },
          },
        },
      };
      const db = {
        sequelize: {
          transaction: (run: (current: Transaction) => Promise<unknown>) => run(transaction),
        },
        getCollection: () => ({
          model: { findByPk: vi.fn(async () => clone(flowModel)) },
          repository: {
            findModelById: vi.fn(async () => clone(flowModel)),
            patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
              flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
            }),
          },
        }),
        getRepository: (name: string) =>
          name === 'jsTemplateSourceOperations' ? { model: operationModel.model } : { update: vi.fn() },
      } as unknown as Database;
      let releaseFirstEnsure: (() => void) | undefined;
      const secondEnsureEntered = new Promise<void>((resolve) => {
        releaseFirstEnsure = resolve;
      });
      let ensureCallCount = 0;
      let repositoryHead: string | null = null;
      let commitCount = 0;
      const identity = buildRunJSSourceRepositoryIdentity(locator);
      const ensureAndPush = vi.fn(async () => {
        ensureCallCount += 1;
        const callNumber = ensureCallCount;
        if (callNumber === 1) {
          await secondEnsureEntered;
        } else {
          releaseFirstEnsure?.();
        }
        if (repositoryHead) {
          throw new VscError('BASE_COMMIT_OUTDATED', 'missing repository was published by another request');
        }
        repositoryHead = `runjs_commit_${callNumber}`;
        commitCount += 1;
        return {
          repository: {
            id: 'runjs_repo_race',
            ...identity,
            status: 'active' as const,
            defaultRef: 'head' as const,
            headCommitId: repositoryHead,
            headSeq: 1,
          },
          commit: {
            id: repositoryHead,
            repoId: 'runjs_repo_race',
            seq: 1,
            parentCommitId: null,
            treeHash: 'tree_race',
            hash: 'commit_hash_race',
            message: 'Detach to inline',
            authorId: '1',
            metadata: {},
          },
          tree: { hash: 'tree_race', entryCount: 2, byteSize: 100 },
        };
      });
      const adapter = {
        kind: 'flowModel.step',
        assertCanWrite: vi.fn(async () => undefined),
        readLegacy: vi.fn(async () => ({
          code: 'ctx.render("external");',
          version: 'v1',
          label: 'JS block',
          surfaceStyle: 'render' as const,
          language: 'typescript' as const,
          ownerFingerprint: 'owner_before',
          metadata: { modelUse: 'JSBlockModel' },
        })),
        writeRuntime: vi.fn(
          async (input: {
            artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
            commitId: string;
          }) => {
            const runJS = flowModel.stepParams.jsSettings.runJs;
            runJS.code = input.artifact.code;
            runJS.version = input.artifact.version;
            runJS.sourceRef = {
              type: 'vsc-file',
              repoId: String(input.artifact.metadata?.repoId || ''),
              commitId: input.commitId,
              entry: String(input.artifact.entryPath || ''),
            };
          },
        ),
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const service = new DetachJsTemplateToInlineService(
        db,
        {
          assertApplicationOwnership: vi.fn(async () => undefined),
          getProject: vi.fn(async () => detachProject),
          lockInternalProjectForUpdate: vi.fn(async () => detachProject),
        } as never,
        { getTemplate: vi.fn(async () => entry) } as never,
        createDetachCommitSourceReader([{ path: entry.entryPath, content: 'ctx.render("inline");' }]) as never,
        {
          prepareEntry: vi.fn((compileInput: JsTemplateWorkspaceCompileInput) =>
            new JsTemplateWorkspaceCompilerBridge().prepareEntry(compileInput),
          ),
        } as never,
        { syncFlowModelUsagesForNodeTree: vi.fn(async () => undefined) } as never,
        () =>
          ({
            findRepositoryByIdentity: vi.fn(async () => null),
            ensureAndPush,
          }) as unknown as VscFileService,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
        'main',
        { recordLifecycleEvent: vi.fn(async () => undefined) } as never,
      );
      const input = {
        expectedProjectHeadCommitId: detachProject.headCommitId,
        locator,
        projectId: binding.projectId,
        templateId: binding.templateId,
      };

      const outcomes = await Promise.allSettled([
        service.detachToInline(
          { ...input, idempotencyKey: 'missing-race-a' },
          { actorUserId: '1', adapterContext: {} },
        ),
        service.detachToInline(
          { ...input, idempotencyKey: 'missing-race-b' },
          { actorUserId: '1', adapterContext: {} },
        ),
      ]);
      const fulfilled = outcomes.filter((outcome) => outcome.status === 'fulfilled');
      const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]).toMatchObject({
        reason: {
          code: 'JS_TEMPLATE_SOURCE_ERROR',
          details: { sourceCode: 'BASE_COMMIT_OUTDATED' },
        },
      });
      expect(ensureAndPush).toHaveBeenCalledTimes(2);
      expect(commitCount).toBe(1);
      expect(repositoryHead).toMatch(/^runjs_commit_/u);
      expect(flowModel.stepParams.jsSettings.runJs).toMatchObject({
        sourceMode: 'inline',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'runjs_repo_race',
          commitId: repositoryHead,
        },
      });
      expect(operationModel.getAllValues().filter((values) => values.status === 'completed')).toHaveLength(1);
      expect(operationModel.getAllValues().filter((values) => values.status === 'failed')).toHaveLength(1);
    });

    it('rolls back a newly created repository, inline host, and usage index after a late failure', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const operationModel = createJsTemplateSourceOperationModel();
      const identity = buildRunJSSourceRepositoryIdentity(locator);
      const initialRunJS = {
        code: 'ctx.render("preserved inline");',
        version: 'v1',
        sourceMode: 'js-template',
        sourceBinding: { ...binding },
        settings: { title: 'Revenue' },
        sourceRef: {
          type: 'vsc-file',
          repoId: 'runjs_repo',
          commitId: 'runjs_head_before',
          entry: 'src/client/index.tsx',
        },
      };
      let flowModel = {
        uid: locator.modelUid,
        use: 'JSBlockModel',
        stepParams: { jsSettings: { runJs: clone(initialRunJS) } },
      };
      type MockRepository = {
        id: string;
        ownerType: string;
        ownerId: string;
        name: string;
        status: 'active';
        defaultRef: 'head';
        headCommitId: string;
        headSeq: number;
      };
      let repository: MockRepository | null = null;
      let commits: Array<{ id: string; repoId: string; seq: number }> = [];
      let usages = [{ id: 'usage_sales', projectId: binding.projectId, templateId: binding.templateId }];
      const initialFlowModel = clone(flowModel);
      const initialRepository = clone(repository);
      const initialCommits = clone(commits);
      const initialUsages = clone(usages);
      const observedBeforeFailure = {
        inlineHost: false,
        advancedHead: false,
        removedUsage: false,
      };

      const db = {
        sequelize: {
          transaction: async (run: (current: Transaction) => Promise<unknown>) => {
            try {
              return await run(transaction);
            } catch (error) {
              flowModel = clone(initialFlowModel);
              repository = clone(initialRepository);
              commits = clone(initialCommits);
              usages = clone(initialUsages);
              throw error;
            }
          },
        },
        getCollection: () => ({
          model: { findByPk: vi.fn(async () => clone(flowModel)) },
          repository: {
            findModelById: vi.fn(async () => clone(flowModel)),
            patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
              flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
            }),
          },
        }),
        getRepository: (name: string) =>
          name === 'jsTemplateSourceOperations' ? { model: operationModel.model } : { update: vi.fn() },
      } as unknown as Database;
      const adapter = {
        kind: 'flowModel.step',
        assertCanWrite: vi.fn(),
        readLegacy: vi.fn(async () => ({
          code: initialRunJS.code,
          version: initialRunJS.version,
          label: 'JS block',
          surfaceStyle: 'render' as const,
          language: 'typescript' as const,
          ownerFingerprint: 'owner_before',
          metadata: { modelUse: 'JSBlockModel' },
        })),
        writeRuntime: vi.fn(
          async (input: {
            artifact: { code: string; version: string; entryPath?: string; metadata?: Record<string, unknown> };
            commitId: string;
          }) => {
            flowModel.stepParams.jsSettings.runJs.code = input.artifact.code;
            flowModel.stepParams.jsSettings.runJs.version = input.artifact.version;
            flowModel.stepParams.jsSettings.runJs.sourceRef = {
              type: 'vsc-file',
              repoId: String(input.artifact.metadata?.repoId || ''),
              commitId: input.commitId,
              entry: String(input.artifact.entryPath || 'src/client/index.tsx'),
            };
          },
        ),
        getFingerprint: vi.fn(async () => 'owner_after'),
      };
      const pushedCommit = {
        id: 'runjs_head_after',
        repoId: 'runjs_repo',
        seq: 1,
        parentCommitId: null,
        treeHash: 'tree_hash_after',
        hash: 'commit_hash_after',
        message: 'Detach to inline',
        authorId: '1',
        metadata: {},
      };
      const vscFileService = {
        findRepositoryByIdentity: vi.fn(async () => null),
        ensureAndPush: vi.fn(async () => {
          repository = {
            id: pushedCommit.repoId,
            ownerType: identity.ownerType,
            ownerId: identity.ownerId,
            name: identity.name,
            status: 'active',
            defaultRef: 'head',
            headCommitId: pushedCommit.id,
            headSeq: pushedCommit.seq,
          };
          commits.push({ id: pushedCommit.id, repoId: pushedCommit.repoId, seq: pushedCommit.seq });
          return {
            repository: clone(repository),
            commit: pushedCommit,
            tree: { hash: pushedCommit.treeHash, entryCount: 2, byteSize: 100 },
          };
        }),
      } as unknown as VscFileService;
      const syncUsages = vi.fn(async () => {
        usages = [];
        const runJS = flowModel.stepParams.jsSettings.runJs;
        observedBeforeFailure.inlineHost = runJS.sourceMode === 'inline' && !('sourceBinding' in runJS);
        observedBeforeFailure.advancedHead = repository?.headCommitId === pushedCommit.id && commits.length === 1;
        observedBeforeFailure.removedUsage = usages.length === 0;
        throw new Error('forced detach-to-inline usage rollback');
      });
      const service = new DetachJsTemplateToInlineService(
        db,
        {
          assertApplicationOwnership: vi.fn(async () => undefined),
          getProject: vi.fn(async () => detachProject),
          lockInternalProjectForUpdate: vi.fn(async () => detachProject),
        } as never,
        { getTemplate: vi.fn(async () => entry) } as never,
        createDetachCommitSourceReader([
          { path: entry.entryPath, content: 'ctx.render("inline after detach");' },
        ]) as never,
        {
          prepareEntry: vi.fn((compileInput: JsTemplateWorkspaceCompileInput) =>
            new JsTemplateWorkspaceCompilerBridge().prepareEntry(compileInput),
          ),
        } as never,
        { syncFlowModelUsagesForNodeTree: syncUsages } as never,
        () => vscFileService,
        () => ({ require: () => adapter }) as unknown as RunJSSourceAdapterRegistry,
      );

      await expect(
        service.detachToInline(
          {
            idempotencyKey: 'detach-to-inline-rollback',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toThrow('forced detach-to-inline usage rollback');

      expect(observedBeforeFailure).toEqual({
        inlineHost: true,
        advancedHead: true,
        removedUsage: true,
      });
      expect(flowModel).toEqual(initialFlowModel);
      expect(flowModel.stepParams.jsSettings.runJs).toMatchObject({
        sourceMode: 'js-template',
        sourceBinding: binding,
        code: initialRunJS.code,
        version: initialRunJS.version,
        settings: initialRunJS.settings,
        sourceRef: initialRunJS.sourceRef,
      });
      expect(repository).toEqual(initialRepository);
      expect(commits).toEqual(initialCommits);
      expect(usages).toEqual(initialUsages);
      expect(operationModel.getValues()).toMatchObject({ status: 'failed', errorCode: 'Error' });
    });

    it('rejects a host that no longer points to the selected JS Template entry', async () => {
      const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;
      const operationModel = createJsTemplateSourceOperationModel();
      const flowModel = {
        uid: locator.modelUid,
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: {
            runJs: {
              code: '',
              version: 'v2',
              sourceMode: 'js-template',
              sourceBinding: { ...binding, templateId: 'jtt_other' },
            },
          },
        },
      };
      const db = {
        sequelize: {
          transaction: (run: (current: Transaction) => Promise<unknown>) => run(transaction),
        },
        getCollection: () => ({
          model: { findByPk: vi.fn(async () => flowModel) },
          repository: { findModelById: vi.fn(async () => flowModel), patch: vi.fn() },
        }),
        getRepository: () => ({ model: operationModel.model }),
      } as unknown as Database;
      const service = new DetachJsTemplateToInlineService(
        db,
        { assertApplicationOwnership: vi.fn(async () => undefined) } as never,
        { getTemplate: vi.fn() } as never,
        createDetachCommitSourceReader() as never,
        { prepareEntry: vi.fn() } as never,
        { syncFlowModelUsagesForNodeTree: vi.fn() } as never,
        () => ({}) as VscFileService,
        () =>
          ({
            require: () => ({
              kind: 'flowModel.step',
              assertCanWrite: vi.fn(),
            }),
          }) as unknown as RunJSSourceAdapterRegistry,
      );

      await expect(
        service.detachToInline(
          {
            idempotencyKey: 'detach-to-inline-stale-binding',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED' });
      expect(operationModel.getValues()).toMatchObject({
        status: 'failed',
        errorCode: 'JS_TEMPLATE_BINDING_OUTDATED',
      });
    });
  });

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
});

describe('JS Template conversion resource integration', () => {
  // Old case -> new owner:
  // detach-to-inline / normalizes the detachToInline resource input and request context -> this suite.
  // New owner: service errors are mapped to the stable HTTP response contract by the public resource.

  const locator = {
    kind: 'flowModel.step',
    modelUid: 'fm_js_block',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  } as const;

  const binding = {
    type: 'js-template-entry',
    projectId: 'jtp_sales',
    templateId: 'jtt_sales',
    kind: 'js-block',
  } as const;

  const entryPath = 'src/client/js-blocks/sales/index.tsx';

  describe('detach-to-inline resource', () => {
    it('keeps the public conversion request schemas aligned with the normalized resource inputs', () => {
      const saveAsJsTemplateRequest = swaggerDocument.components.schemas.SaveAsJsTemplateRequest;
      const detachToInlineRequest = swaggerDocument.components.schemas.DetachJsTemplateToInlineRequest;

      expect(saveAsJsTemplateRequest.required).toEqual([
        'idempotencyKey',
        'locator',
        'expectedOwnerFingerprint',
        'sourceRepoId',
        'sourceHeadCommitId',
        'entryPath',
        'runtimeVersion',
        'files',
        'destination',
        'templateName',
      ]);
      expect(Object.keys(saveAsJsTemplateRequest.properties).sort()).toEqual(
        [
          'idempotencyKey',
          'locator',
          'expectedOwnerFingerprint',
          'sourceRepoId',
          'sourceHeadCommitId',
          'entryPath',
          'runtimeVersion',
          'files',
          'originBinding',
          'destination',
          'templateName',
          'templateTitle',
        ].sort(),
      );
      expect(detachToInlineRequest.required).toEqual([
        'idempotencyKey',
        'locator',
        'projectId',
        'templateId',
        'expectedProjectHeadCommitId',
      ]);
      expect(Object.keys(detachToInlineRequest.properties).sort()).toEqual(
        ['idempotencyKey', 'locator', 'projectId', 'templateId', 'expectedProjectHeadCommitId'].sort(),
      );
    });

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

    it('normalizes the detachToInline resource input and request context', async () => {
      const detachToInline = vi.fn(async () => ({ code: 'ctx.render(<div />);', runtimeVersion: 'v2' }));
      const resource = createJsTemplatesResource(
        {} as never,
        {} as never,
        {} as JsTemplateCompilePreviewService,
        undefined,
        { detachToInline } as unknown as DetachJsTemplateToInlineService,
      );
      const can = vi.fn().mockReturnValue({});
      const ctx = {
        action: {
          params: {
            values: {
              idempotencyKey: '  detach-to-inline-sales-v1  ',
              expectedProjectHeadCommitId: 'commit_template_head',
              locator,
              projectId: binding.projectId,
              templateId: binding.templateId,
            },
          },
        },
        auth: { user: { id: 9 } },
        can,
        request: {
          headers: {
            'x-request-id': 'req_detach_inline',
            'x-request-source': 'unit-resource',
          },
        },
      } as unknown as Context;

      await resource.actions?.detachToInline?.(ctx, async () => undefined);

      expect(detachToInline).toHaveBeenCalledWith(
        {
          idempotencyKey: 'detach-to-inline-sales-v1',
          expectedProjectHeadCommitId: 'commit_template_head',
          locator,
          projectId: binding.projectId,
          templateId: binding.templateId,
        },
        expect.objectContaining({
          actorUserId: '9',
          requestId: 'req_detach_inline',
          requestSource: 'unit-resource',
          can,
          adapterContext: expect.objectContaining({ currentUser: { id: 9 } }),
        }),
      );
      expect((ctx as { body?: unknown }).body).toEqual({ code: 'ctx.render(<div />);', runtimeVersion: 'v2' });
    });

    it.each(['entryPath', 'kind', 'version', 'files'] as const)(
      'rejects forged detach source field %s before invoking the service',
      async (forgedField) => {
        const detachToInline = vi.fn();
        const resource = createJsTemplatesResource(
          {} as never,
          {} as never,
          {} as JsTemplateCompilePreviewService,
          undefined,
          { detachToInline } as unknown as DetachJsTemplateToInlineService,
        );
        const ctx = {
          action: {
            params: {
              values: {
                idempotencyKey: 'detach-to-inline-forged-source',
                expectedProjectHeadCommitId: 'commit_template_head',
                locator,
                projectId: binding.projectId,
                templateId: binding.templateId,
                [forgedField]: forgedField === 'files' ? [{ path: entryPath, content: 'forged' }] : 'forged',
              },
            },
          },
          auth: { user: { id: 9 } },
          request: { headers: {} },
        } as unknown as Context;

        await resource.actions?.detachToInline?.(ctx, async () => undefined);

        expect(detachToInline).not.toHaveBeenCalled();
        expect((ctx as { status?: number }).status).toBe(400);
        expect((ctx as { body?: { errors?: Array<{ message?: string }> } }).body?.errors?.[0]?.message).toContain(
          forgedField,
        );
      },
    );

    it('maps detach-to-inline service errors to the public HTTP response contract', async () => {
      const error = new JsTemplateError(
        'JS_TEMPLATE_BINDING_OUTDATED',
        'The binding changed before the detach completed',
        {
          details: { projectId: binding.projectId, templateId: binding.templateId },
        },
      );
      const detachToInline = vi.fn(async () => {
        throw error;
      });
      const resource = createJsTemplatesResource(
        {} as never,
        {} as never,
        {} as JsTemplateCompilePreviewService,
        undefined,
        { detachToInline } as unknown as DetachJsTemplateToInlineService,
      );
      const ctx = {
        action: {
          params: {
            values: {
              idempotencyKey: 'detach-to-inline-error-v1',
              expectedProjectHeadCommitId: 'commit_template_head',
              locator,
              projectId: binding.projectId,
              templateId: binding.templateId,
            },
          },
        },
        auth: { user: { id: 9 } },
        request: { headers: {} },
      } as unknown as Context;

      await resource.actions?.detachToInline?.(ctx, async () => undefined);

      expect((ctx as { withoutDataWrapping?: boolean }).withoutDataWrapping).toBe(true);
      expect((ctx as { type?: string }).type).toBe('application/json');
      expect((ctx as { status?: number }).status).toBe(409);
      expect((ctx as { body?: unknown }).body).toEqual(error.toResponseBody());
    });
  });
});
