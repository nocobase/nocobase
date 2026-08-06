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
import type { JsTemplate, JsTemplateKind, JsTemplateProject, JsTemplateRuntimeSourceBinding } from '../../shared/types';
import swaggerDocument from '../../swagger';
import { createJsTemplatesResource } from '../resources/jsTemplates';
import type { JsTemplateCompilePreviewService } from '../services/JsTemplateCompilePreviewService';
import {
  DetachJsTemplateToInlineService,
  isDetachJsTemplateToInlineHostSupported,
} from '../services/DetachJsTemplateToInlineService';
import { JsTemplateSourceOperationStore } from '../services/JsTemplateSourceOperationStore';
import {
  JsTemplateWorkspaceCompilerBridge,
  type JsTemplateWorkspaceCompileInput,
} from '../services/JsTemplateWorkspaceCompilerBridge';
import {
  buildRunJSFilesHash,
  type RunJSSourceAdapterRegistry,
  type VscFileChange,
  type VscFileService,
  type VscRepositoryRecord,
  VscError,
} from '../vsc-file';
import { buildRunJSSourceRepositoryIdentity, canonicalizeRunJSCompileFiles } from '../vsc-file/public-api';

const project: JsTemplateProject = {
  id: 'jtp_existing',
  name: 'shared-tools',
  normalizedName: 'shared-tools',
  title: 'Shared tools',
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit_2',
};

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

function createTestModel(values: Record<string, unknown>): Model {
  return { get: (key: string) => values[key] } as Model;
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

  function createDetachCommitSourceReader(
    files: Array<{ path: string; content?: string; language?: string; mode?: string }> = [
      { path: entry.entryPath, content: 'ctx.render(<div />);' },
    ],
    sourceCommitId?: string,
  ) {
    const pullCommit = vi.fn(async (input: { projectId: string; commitId: string; includeContent: string }) => ({
      project: { ...detachProject, id: input.projectId, headCommitId: input.commitId },
      commit: { id: sourceCommitId || input.commitId, projectId: input.projectId },
      tree: { hash: 'source_tree', entryCount: files.length, byteSize: 100 },
      unchanged: false,
      files: files.map((file) => ({
        pathHash: `path-${file.path}`,
        pathLowerHash: `path-lower-${file.path}`,
        blobHash: `blob-${file.path}`,
        size: file.content?.length || 0,
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
      sourceCommitId?: string;
      sourceFiles?: Array<{ path: string; content?: string; language?: string; mode?: string }>;
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
      getCollection: (name: string) =>
        name === 'jsTemplates'
          ? {
              model: {
                findByPk: vi.fn(async () =>
                  createTestModel(
                    (options.templateAfterPreparation || options.entry || entry) as Record<string, unknown>,
                  ),
                ),
              },
            }
          : {
              model: { findByPk: vi.fn(async () => lockedFlowModel) },
              repository: {
                findModelById: vi.fn(async () => flowModel),
                patch: vi.fn(),
              },
            },
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
    const sourceReader = createDetachCommitSourceReader(options.sourceFiles, options.sourceCommitId);
    const ensureAndPush = vi.fn(async () => {
      if (options.ensureError) {
        throw options.ensureError;
      }
      throw new Error('unexpected repository publish');
    });
    const syncFlowModelUsagesForNodeTree = vi.fn();
    const writeRuntime = vi.fn();
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
      { syncFlowModelUsagesForNodeTree } as never,
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
            writeRuntime,
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
      syncFlowModelUsagesForNodeTree,
      writeRuntime,
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
      getCollection: (name: string) =>
        name === 'jsTemplates'
          ? { model: { findByPk: vi.fn(async () => createTestModel({ ...entry })) } }
          : {
              model: { findByPk: vi.fn(async () => clone(flowModel)) },
              repository: {
                findModelById: vi.fn(async () => clone(flowModel)),
                patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
                  flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
                }),
              },
            },
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
    it.each<readonly [JsTemplateKind, unknown, boolean]>([
      ['js-block', 'JSBlockModel', true],
      ['js-field', 'JSFieldModel', true],
      ['js-field', 'JSEditableFieldModel', true],
      ['js-field', 'JSColumnModel', true],
      ['js-action', 'JSActionModel', true],
      ['js-item', 'JSItemModel', true],
      ['js-page', 'JSPageModel', true],
      ['js-page', 'JSBlockModel', false],
      ['js-block', 'JSColumnModel', false],
      ['js-block', undefined, false],
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

    it.each([
      {
        label: 'a non-public SDK type',
        content:
          'import type { MissingContext } from "@nocobase/js-template-sdk/client";\n' +
          'ctx.render(null as unknown as MissingContext);\n',
        diagnosticCode: 'import_not_allowed',
      },
      {
        label: 'an invalid settings specifier',
        content:
          'import type { Settings } from "js-template:settings/client/runjs/sales";\n' +
          'ctx.render(null as unknown as Settings);\n',
        diagnosticCode: 'settings_type_import_invalid',
      },
      {
        label: 'a runtime settings import',
        content:
          'import { Settings } from "js-template:settings/client/js-block/sales";\n' +
          'ctx.render(null as unknown as Settings);\n',
        diagnosticCode: 'settings_type_import_runtime_not_allowed',
      },
    ])(
      'rejects $label through compiler preparation before repository, Host, or Usage writes',
      async ({ content, diagnosticCode }) => {
        const fixture = createDetachJsTemplateToInlinePreflightFixture({
          sourceFiles: [{ path: entry.entryPath, content }],
        });

        await expect(
          fixture.service.detachToInline(
            {
              idempotencyKey: `detach-to-inline-invalid-authoring-${diagnosticCode}`,
              expectedProjectHeadCommitId: detachProject.headCommitId,
              locator,
              projectId: binding.projectId,
              templateId: binding.templateId,
            },
            { actorUserId: '1', adapterContext: {} },
          ),
        ).rejects.toMatchObject({
          code: 'JS_TEMPLATE_VALIDATION_FAILED',
          details: {
            failureCode: 'JS_TEMPLATE_COMPILE_DENIED',
            diagnostics: expect.arrayContaining([
              expect.objectContaining({
                code: diagnosticCode,
                path: 'src/client/index.tsx',
                line: 1,
              }),
            ]),
          },
        });

        expect(fixture.prepareEntry).toHaveBeenCalledOnce();
        expect(fixture.transaction).not.toHaveBeenCalled();
        expect(fixture.ensureAndPush).not.toHaveBeenCalled();
        expect(fixture.writeRuntime).not.toHaveBeenCalled();
        expect(fixture.syncFlowModelUsagesForNodeTree).not.toHaveBeenCalled();
      },
    );

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

    it('rejects a Template artifact compiled from a different commit before reading source', async () => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        entry: { ...entry, compiledCommitId: 'commit_previous' },
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: 'detach-stale-compiled-commit',
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_BINDING_OUTDATED', status: 409 });
      expect(fixture.pullSourceCommit).not.toHaveBeenCalled();
      expect(fixture.prepareEntry).not.toHaveBeenCalled();
      expect(fixture.transaction).not.toHaveBeenCalled();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
    });

    it.each([
      {
        label: 'a source reader response for another commit',
        options: { sourceCommitId: 'commit_other' },
      },
      {
        label: 'a committed file without source content',
        options: { sourceFiles: [{ path: entry.entryPath }] },
      },
    ])('rejects $label before opening a transaction', async ({ label, options }) => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture(options);

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: `detach-invalid-source-read-${label}`,
            expectedProjectHeadCommitId: detachProject.headCommitId,
            locator,
            projectId: binding.projectId,
            templateId: binding.templateId,
          },
          { actorUserId: '1', adapterContext: {} },
        ),
      ).rejects.toMatchObject({ code: 'JS_TEMPLATE_SOURCE_ERROR' });
      expect(fixture.prepareEntry).not.toHaveBeenCalled();
      expect(fixture.transaction).not.toHaveBeenCalled();
      expect(fixture.ensureAndPush).not.toHaveBeenCalled();
    });

    it('rechecks the Source Project Head under lock before committing Inline source', async () => {
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

    it.each([
      ['entryPath', { ...entry, entryPath: 'src/client/js-blocks/sales/renamed.tsx' }],
      ['kind', { ...entry, kind: 'js-page' as const }],
      ['runtimeVersion', { ...entry, runtimeVersion: 'v3' }],
      ['compiledCommitId', { ...entry, compiledCommitId: 'commit_recompiled' }],
    ])('rejects Template %s that changes after exact-commit source preparation', async (field, currentTemplate) => {
      const fixture = createDetachJsTemplateToInlinePreflightFixture({
        templateAfterPreparation: currentTemplate,
      });

      await expect(
        fixture.service.detachToInline(
          {
            idempotencyKey: `detach-template-${field}-race`,
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
        getCollection: (name: string) =>
          name === 'jsTemplates'
            ? { model: { findByPk: vi.fn(async () => createTestModel({ ...pageEntry })) } }
            : {
                model: { findByPk: lockFlowModelRecord },
                repository: { findModelById: vi.fn(async () => JSON.parse(JSON.stringify(flowModel))), patch },
              },
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
          content: [
            'import { defineSettings } from "@nocobase/js-template-sdk/client";',
            'import type { Settings } from "js-template:settings/client/js-page/page";',
            "import { used } from '../../../shared/used';",
            'const authoringSettings = defineSettings({ enabled: true });',
            'const settingsTypeProbe: Settings | null = null;',
            'ctx.render(`${String(used)}:${String(authoringSettings.enabled)}:${String(settingsTypeProbe)}`);',
            '',
          ].join('\n'),
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
      expect(JSON.stringify(prepareEntry.mock.calls)).toContain('@nocobase/js-template-sdk/client');
      expect(JSON.stringify(prepareEntry.mock.calls)).toContain('js-template:settings/client/js-page/page');
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
      expect(JSON.stringify(pushedFiles)).not.toContain('@nocobase/js-template-sdk/');
      expect(JSON.stringify(pushedFiles)).not.toContain('js-template:settings/');
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
      expect(getTemplate).toHaveBeenCalledOnce();
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

    it('commits only one of two different idempotency keys racing for a missing repository', async () => {
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
        getCollection: (name: string) =>
          name === 'jsTemplates'
            ? { model: { findByPk: vi.fn(async () => createTestModel({ ...entry })) } }
            : {
                model: { findByPk: vi.fn(async () => clone(flowModel)) },
                repository: {
                  findModelById: vi.fn(async () => clone(flowModel)),
                  patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
                    flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
                  }),
                },
              },
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
        getCollection: (name: string) =>
          name === 'jsTemplates'
            ? { model: { findByPk: vi.fn(async () => createTestModel({ ...entry })) } }
            : {
                model: { findByPk: vi.fn(async () => clone(flowModel)) },
                repository: {
                  findModelById: vi.fn(async () => clone(flowModel)),
                  patch: vi.fn(async (values: { stepParams: typeof flowModel.stepParams }) => {
                    flowModel = { ...flowModel, stepParams: clone(values.stepParams) };
                  }),
                },
              },
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

  describe('detach-to-inline resource', () => {
    it('keeps the public Detach request schema aligned with the normalized resource input', () => {
      const detachToInlineRequest = swaggerDocument.components.schemas.DetachJsTemplateToInlineRequest;

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
            resourceName: 'jsTemplates',
            actionName: 'detachToInline',
            filterByTk: undefined,
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
                [forgedField]: forgedField === 'files' ? [{ path: entry.entryPath, content: 'forged' }] : 'forged',
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

  function clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
});
