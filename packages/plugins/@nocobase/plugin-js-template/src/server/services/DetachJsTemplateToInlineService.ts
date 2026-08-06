/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import type { RunJSRuntimeArtifact } from '@nocobase/runjs';
import {
  assertRunJSCompileInputLimits,
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  canonicalizeRunJSCompileFiles,
  compileRunJSSourceWorkspace,
  isVscError,
  type RunJSSourceAdapterContext,
  type RunJSSourceAdapterRegistry,
  type RunJSSourceLocator,
  type VscCommitRecord,
  type VscFileChange,
  type VscRepositoryIdentity,
  type VscRepositoryRecord,
  type VscServiceContext,
  VscFileService,
} from '../vsc-file/public-api';
import { createHash, randomUUID } from 'crypto';
import { posix as pathPosix } from 'path';

import type {
  DetachJsTemplateToInlineInput,
  DetachJsTemplateToInlineResult,
  JsTemplateKind,
  JsTemplatePullResult,
  JsTemplateRuntimeSourceBinding,
  SaveAsJsTemplateWorkspaceFile,
} from '../../shared/types';
import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import { isJsTemplateRuntimeSourceBinding, JS_TEMPLATE_SOURCE_MODE } from '../../shared/jsTemplateRunJSPersistence';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import type { JsTemplateFileService } from './JsTemplateFileService';
import { JsTemplateService, templateFromModel } from './JsTemplateService';
import { getUsageOwnerAdapterByUse } from './JsTemplateUsageOwnerRegistry';
import type { JsTemplateUsageService } from './JsTemplateUsageService';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import {
  JsTemplateSourceOperationStore,
  type JsTemplateSourceOperationDescriptor,
  type JsTemplateSourceOperationReservation,
} from './JsTemplateSourceOperationStore';
import { JsTemplateWorkspaceCompilerBridge } from './JsTemplateWorkspaceCompilerBridge';
import { rewriteJsTemplateAuthoringImports } from './conversion/jsTemplateAuthoringImports';
import {
  buildRelativeSourceCandidatePaths,
  collectRelativeModuleReferences,
  isSourceCodeFile,
  normalizeSourceWorkspacePath,
  resolveRelativeSourcePath,
  rewriteRelativeImports,
} from './sourceRelocation';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const RUNJS_ENTRY_ROOT = 'src/client';
const JS_TEMPLATE_SHARED_ROOT = 'src/shared';
const JS_TEMPLATE_DESCRIPTOR_FILE = 'entry.json';
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

type AdapterRegistryProvider = () => RunJSSourceAdapterRegistry | null;
type VscFileServiceProvider = () => VscFileService | null;
type JsTemplateCommitSourceReader = Pick<JsTemplateFileService, 'pullCommit'>;

type FlowModelStepLocator = Extract<RunJSSourceLocator, { kind: 'flowModel.step' }>;

type JsonRecord = Record<string, unknown>;

type FlowModelRepositoryLike = {
  findModelById: (
    uid: string,
    options?: { includeAsyncNode?: boolean; transaction?: Transaction },
  ) => Promise<JsonRecord | null>;
  patch: (values: JsonRecord, options: { transaction: Transaction }) => Promise<unknown>;
};

export interface DetachJsTemplateToInlineServiceContext extends JsTemplateServiceContext {
  adapterContext: RunJSSourceAdapterContext;
}

interface PreparedDetachJsTemplateToInline {
  locator: FlowModelStepLocator;
  source: ServerOwnedJsTemplateSource;
  entryPath: string;
  ownerFingerprint: string;
  surfaceStyle: string;
  artifact: RunJSRuntimeArtifact;
  commitMetadata: Record<string, unknown>;
  repositoryIdentity: VscRepositoryIdentity;
  expectedRepository: VscRepositoryRecord | null;
  changes: VscFileChange[];
}

interface ServerOwnedJsTemplateSource {
  binding: JsTemplateRuntimeSourceBinding;
  entryPath: string;
  kind: JsTemplateKind;
  runtimeVersion: string;
}

export class DetachJsTemplateToInlineService {
  private readonly sourceOperationStore: JsTemplateSourceOperationStore;

  constructor(
    private readonly db: Database,
    private readonly projectService: JsTemplateProjectService,
    private readonly templateService: JsTemplateService,
    private readonly commitSourceReader: JsTemplateCommitSourceReader,
    private readonly workspaceCompilerBridge: JsTemplateWorkspaceCompilerBridge,
    private readonly usageService: JsTemplateUsageService,
    private readonly getVscFileService: VscFileServiceProvider,
    private readonly getAdapterRegistry: AdapterRegistryProvider,
    private readonly applicationName = 'main',
    private readonly auditService: JsTemplateAuditService = new JsTemplateAuditService(db),
  ) {
    this.sourceOperationStore = new JsTemplateSourceOperationStore(db, applicationName);
  }

  async detachToInline(
    input: DetachJsTemplateToInlineInput,
    ctx: DetachJsTemplateToInlineServiceContext,
  ): Promise<DetachJsTemplateToInlineResult> {
    let operation: JsTemplateSourceOperationReservation | undefined;
    try {
      const idempotencyKey = assertDetachJsTemplateToInlineInputSupported(input);
      const descriptor = createDetachJsTemplateToInlineOperationDescriptor(input, idempotencyKey);
      const inspected = await this.sourceOperationStore.inspect(descriptor);
      if (inspected.replayResult) {
        await this.assertCanReplayDetachJsTemplateToInline(input, inspected.replayResult, ctx);
        return inspected.replayResult;
      }
      const claimed = await this.sourceOperationStore.claim(descriptor);
      if (claimed.replayResult) {
        await this.assertCanReplayDetachJsTemplateToInline(input, claimed.replayResult, ctx);
        return claimed.replayResult;
      }
      operation = claimed.reservation;
      const vscFileService = this.getVscFileService();
      if (!vscFileService) {
        throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
      }
      const prepared = await this.prepareDetachJsTemplateToInline(input, ctx, vscFileService);
      return await this.db.sequelize.transaction(async (transaction) => {
        const result = await this.applyDetachJsTemplateToInline(input, ctx, prepared, vscFileService, transaction);
        await this.recordDetachJsTemplateToInlineSuccessAudit(input, prepared, result, ctx, transaction);
        await this.sourceOperationStore.complete(operation, result, transaction);
        return result;
      });
    } catch (error) {
      await this.sourceOperationStore.fail(operation, error);
      throw normalizeDetachJsTemplateToInlineError(error);
    }
  }

  private async assertCanReplayDetachJsTemplateToInline(
    input: DetachJsTemplateToInlineInput,
    result: DetachJsTemplateToInlineResult,
    ctx: DetachJsTemplateToInlineServiceContext,
  ): Promise<void> {
    const locator = requireFlowModelStepLocator(input.locator);
    const registry = this.getAdapterRegistry();
    const vscFileService = this.getVscFileService();
    if (!registry || !vscFileService) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    await registry.require(locator.kind).assertCanWrite({
      locator,
      ctx: { ...ctx.adapterContext, sourceTransition: 'external-to-inline' },
    });
    await this.projectService.assertApplicationOwnership(input.projectId, this.applicationName, ctx);
    await vscFileService.getRepository(
      { repoId: result.runJSRepoId },
      {
        authorId: ctx.actorUserId,
        request: {
          ...ctx.adapterContext.request,
          resourceName: 'runJSSources',
          actionName: 'save',
        },
      },
    );
  }

  private async prepareDetachJsTemplateToInline(
    input: DetachJsTemplateToInlineInput,
    ctx: DetachJsTemplateToInlineServiceContext,
    vscFileService: VscFileService,
  ): Promise<PreparedDetachJsTemplateToInline> {
    const locator = requireFlowModelStepLocator(input.locator);
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }

    const adapter = registry.require(locator.kind);
    const adapterContext: RunJSSourceAdapterContext = {
      ...ctx.adapterContext,
      sourceTransition: 'external-to-inline',
    };
    const serviceContext: JsTemplateServiceContext = { ...ctx };
    const vscContext: VscServiceContext = {
      authorId: ctx.actorUserId,
      request: {
        ...adapterContext.request,
        resourceName: 'runJSSources',
        actionName: 'save',
      },
    };

    await adapter.assertCanWrite({ locator, ctx: adapterContext });
    const currentModel = await getFlowModel(this.db, locator.modelUid);
    const binding = requireCurrentJsTemplateBinding(currentModel, locator, input);
    await this.projectService.assertApplicationOwnership(input.projectId, this.applicationName, serviceContext);
    const project = await this.projectService.getProject(input.projectId, serviceContext);
    assertExpectedProjectHead(project.headCommitId, input);
    const template = await this.templateService.getTemplate(input.templateId, serviceContext);
    const source = deriveServerOwnedJsTemplateSource(template, binding, input);

    const legacy = await adapter.readLegacy({ locator, ctx: adapterContext });
    if (!isDetachJsTemplateToInlineHostSupported(source.kind, legacy.metadata?.modelUse)) {
      throw unsupportedLocator(locator);
    }

    const sourceSnapshot = await this.commitSourceReader.pullCommit(
      {
        projectId: input.projectId,
        commitId: input.expectedProjectHeadCommitId,
        includeContent: 'all',
      },
      serviceContext,
    );
    const sourceFiles = materializeCommittedSourceFiles(sourceSnapshot, input);
    const relocatedFiles = collectAndRelocateInlineFiles({
      files: sourceFiles,
      entryPath: source.entryPath,
      kind: source.kind,
    });
    assertRunJSCompileInputLimits([
      ...relocatedFiles,
      {
        path: RUNJS_MANIFEST_PATH,
        content: '',
      },
    ]);

    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const repository = await vscFileService.findRepositoryByIdentity(identity, vscContext);
    if (repository) {
      assertRepositoryIdentity(repository, identity);
    }

    const entryPath = relocateEntryPath(source.entryPath);
    const sourcePreparation = this.workspaceCompilerBridge.prepareEntry({
      projectId: input.projectId,
      templateId: input.templateId,
      operation: 'runtimeCompile',
      kind: source.kind,
      templateName: template.templateName,
      entryPath,
      runtimeVersion: source.runtimeVersion,
      files: relocatedFiles,
    });
    if (!sourcePreparation.accepted) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Inline source could not be compiled', {
        status: 422,
        details: {
          projectId: input.projectId,
          templateId: input.templateId,
          diagnostics: sourcePreparation.diagnostics,
          failureCode: sourcePreparation.failureCode,
        },
      });
    }

    const sourceInputFiles = sourcePreparation.files.map((file): SaveAsJsTemplateWorkspaceFile => {
      if (typeof file.content !== 'string') {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Prepared inline source file content is missing', {
          details: { path: file.path },
        });
      }
      return {
        path: file.path,
        content: file.content,
        language: file.language,
      };
    });
    const desiredFiles = withRunJSManifest(
      sourceInputFiles,
      entryPath,
      sourcePreparation.runtimeVersion,
      legacy.surfaceStyle,
    );
    const targetBaseFiles = repository
      ? (
          await vscFileService.pull(
            {
              repoId: repository.id,
              includeContent: 'none',
            },
            vscContext,
          )
        ).files
      : [];
    const candidateWorkspaceFiles = canonicalizeRunJSCompileFiles(desiredFiles, targetBaseFiles || []);
    assertRunJSCompileInputLimits(candidateWorkspaceFiles);
    const compilerInputFiles = candidateWorkspaceFiles;
    const compileResult = await compileRunJSSourceWorkspace({
      files: compilerInputFiles,
      entry: entryPath,
      runtimeVersion: sourcePreparation.runtimeVersion,
      surfaceStyle: legacy.surfaceStyle,
      locator,
      legacy: {
        version: legacy.version,
        surfaceStyle: legacy.surfaceStyle,
        language: legacy.language,
        metadata: legacy.metadata,
      },
    });
    const compileErrors = compileResult.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
    if (compileErrors.length > 0) {
      throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Inline source could not be compiled', {
        status: 422,
        details: {
          projectId: input.projectId,
          templateId: input.templateId,
          diagnostics: compileErrors,
          failureCode: compileResult.failureCode,
        },
      });
    }
    const commitChanges = buildOverwriteChanges(targetBaseFiles || [], candidateWorkspaceFiles);
    const artifact: RunJSRuntimeArtifact = {
      ...compileResult.artifact,
      entryPath,
      metadata: {
        ...compileResult.artifact.metadata,
        ...sourcePreparation.metadata,
        runtimeCodeHash: buildRunJSRuntimeCodeHash(compileResult.artifact.code),
      },
    };
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
    const commitMetadata = {
      sourceKind: locator.kind,
      ownerFingerprint: legacy.ownerFingerprint,
      filesHash: artifact.filesHash,
      entry: entryPath,
      runtimeVersion: artifact.version,
      surfaceStyle: legacy.surfaceStyle,
      runtimeCodeHash,
    };
    return {
      locator,
      source,
      entryPath,
      ownerFingerprint: legacy.ownerFingerprint,
      surfaceStyle: legacy.surfaceStyle,
      artifact,
      commitMetadata,
      repositoryIdentity: identity,
      expectedRepository: repository,
      changes: commitChanges,
    };
  }

  private async applyDetachJsTemplateToInline(
    input: DetachJsTemplateToInlineInput,
    ctx: DetachJsTemplateToInlineServiceContext,
    prepared: PreparedDetachJsTemplateToInline,
    vscFileService: VscFileService,
    transaction: Transaction,
  ): Promise<DetachJsTemplateToInlineResult> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }
    const adapter = registry.require(prepared.locator.kind);
    const adapterContext: RunJSSourceAdapterContext = {
      ...ctx.adapterContext,
      sourceTransition: 'external-to-inline',
      transaction,
    };
    const serviceContext: JsTemplateServiceContext = { ...ctx, transaction };
    const vscContext: VscServiceContext = {
      authorId: ctx.actorUserId,
      request: {
        ...adapterContext.request,
        resourceName: 'runJSSources',
        actionName: 'save',
      },
      transaction,
    };

    await adapter.assertCanWrite({ locator: prepared.locator, ctx: adapterContext });
    const lockedFlowModel = await lockFlowModel(this.db, prepared.locator.modelUid, transaction);
    requireCurrentJsTemplateBinding(lockedFlowModel, prepared.locator, input, prepared.source.kind);
    const project = await this.projectService.lockInternalProjectForUpdate(input.projectId, serviceContext);
    assertExpectedProjectHead(project.headCommitId, input);
    const template = await lockJsTemplate(this.db, input.templateId, transaction);
    assertServerOwnedJsTemplateSourceCurrent(template, prepared.source, input);
    const legacy = await adapter.readLegacy({ locator: prepared.locator, ctx: adapterContext });
    if (!isDetachJsTemplateToInlineHostSupported(prepared.source.kind, legacy.metadata?.modelUse)) {
      throw unsupportedLocator(prepared.locator);
    }
    if (legacy.ownerFingerprint !== prepared.ownerFingerprint || legacy.surfaceStyle !== prepared.surfaceStyle) {
      throw bindingOutdated(input);
    }

    const pushed = await vscFileService.ensureAndPush(
      {
        identity: prepared.repositoryIdentity,
        expectedRepository: prepared.expectedRepository,
        message: `Detach JS Template ${input.templateId} to inline code`.slice(0, 200),
        files: prepared.changes,
        allowEmptyCommit: true,
        authorId: ctx.actorUserId,
        metadata: prepared.commitMetadata,
      },
      vscContext,
    );

    await adapter.writeRuntime({
      locator: prepared.locator,
      artifact: {
        ...prepared.artifact,
        metadata: {
          ...prepared.artifact.metadata,
          repoId: pushed.repository.id,
        },
      },
      commitId: pushed.commit.id,
      baseOwnerFingerprint: prepared.ownerFingerprint,
      ctx: adapterContext,
    });
    await setFlowModelSourceModeInline(this.db, prepared.locator, input, prepared.source.kind, transaction);
    const ownerFingerprint = await adapter.getFingerprint({ locator: prepared.locator, ctx: adapterContext });
    await updateRunJSCommitMetadata(
      this.db,
      pushed.commit,
      {
        ...prepared.commitMetadata,
        ownerFingerprint,
      },
      transaction,
    );

    await this.usageService.syncFlowModelUsagesForNodeTree(
      {
        rootUid: prepared.locator.modelUid,
        action: 'jsTemplates.detachToInline',
      },
      serviceContext,
    );

    const sourceRef = {
      type: 'vsc-file' as const,
      repoId: pushed.repository.id,
      commitId: pushed.commit.id,
      entry: prepared.entryPath,
    };
    return {
      runJSRepoId: pushed.repository.id,
      commitId: pushed.commit.id,
      ownerFingerprint,
      code: prepared.artifact.code,
      runtimeVersion: prepared.artifact.version,
      entryPath: prepared.entryPath,
      filesHash: prepared.artifact.filesHash,
      sourceRef,
    };
  }

  private async recordDetachJsTemplateToInlineSuccessAudit(
    input: DetachJsTemplateToInlineInput,
    prepared: PreparedDetachJsTemplateToInline,
    result: DetachJsTemplateToInlineResult,
    ctx: DetachJsTemplateToInlineServiceContext,
    transaction: Transaction,
  ): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      projectId: input.projectId,
      action: 'detachJsTemplateToInline',
      result: 'success',
      requestId: ctx.requestId || randomUUID(),
      actorUserId: ctx.actorUserId,
      message: 'JS Template detached to inline RunJS',
      details: {
        destinationType: 'inline',
        templateId: input.templateId,
        kind: prepared.source.kind,
        runJSRepoId: result.runJSRepoId,
      },
      transaction,
    });
  }
}

export function collectAndRelocateInlineFiles(workspace: {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  kind?: JsTemplateKind;
}): SaveAsJsTemplateWorkspaceFile[] {
  const sourceFiles = new Map<string, SaveAsJsTemplateWorkspaceFile>();
  for (const file of workspace.files) {
    const path = normalizeSourceWorkspacePath(file.path);
    if (sourceFiles.has(path)) {
      throw invalidInput(`Duplicate workspace path "${path}"`);
    }
    sourceFiles.set(path, { ...file, path });
  }

  const entryPath = normalizeSourceWorkspacePath(workspace.entryPath);
  const entryFile = sourceFiles.get(entryPath);
  if (!entryFile || !isSourceCodeFile(entryPath)) {
    throw invalidInput('JS Template source entry file is missing or invalid');
  }
  const entryRoot = pathPosix.dirname(entryPath);
  const selectedPaths = collectReachablePaths(sourceFiles, entryPath, entryRoot);
  const descriptorPath = `${entryRoot}/${JS_TEMPLATE_DESCRIPTOR_FILE}`;
  if (sourceFiles.has(descriptorPath)) {
    selectedPaths.add(descriptorPath);
  }
  const targetBySource = new Map<string, string>();
  const targetPaths = new Set<string>();
  for (const sourcePath of selectedPaths) {
    const targetPath =
      sourcePath === entryPath
        ? relocateEntryPath(entryPath)
        : sourcePath.startsWith(`${entryRoot}/`)
          ? `${RUNJS_ENTRY_ROOT}/${pathPosix.relative(entryRoot, sourcePath)}`
          : sourcePath;
    if (targetPaths.has(targetPath)) {
      throw invalidInput(`Workspace files collide after relocation at "${targetPath}"`);
    }
    targetBySource.set(sourcePath, targetPath);
    targetPaths.add(targetPath);
  }

  return Array.from(selectedPaths)
    .sort((left, right) => left.localeCompare(right))
    .map((sourcePath) => {
      const sourceFile = sourceFiles.get(sourcePath);
      const targetPath = targetBySource.get(sourcePath);
      if (!sourceFile || !targetPath) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Inline source relocation failed');
      }
      const rewrittenImports = rewriteRelativeImports(sourceFile.content, sourcePath, targetPath, targetBySource);
      const rewrittenAuthoringImports = rewriteJsTemplateAuthoringImports(targetPath, rewrittenImports);
      if (rewrittenAuthoringImports.diagnostics.length > 0) {
        throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Inline source contains invalid authoring imports', {
          status: 422,
          details: {
            failureCode: 'JS_TEMPLATE_COMPILE_DENIED',
            diagnostics: rewrittenAuthoringImports.diagnostics,
          },
        });
      }
      return {
        ...sourceFile,
        path: targetPath,
        content: rewrittenAuthoringImports.content,
      };
    });
}

function collectReachablePaths(
  files: Map<string, SaveAsJsTemplateWorkspaceFile>,
  entryPath: string,
  entryRoot: string,
): Set<string> {
  const selected = new Set<string>();
  const pending = [entryPath];

  while (pending.length) {
    const path = pending.shift();
    if (!path || selected.has(path)) {
      continue;
    }
    selected.add(path);
    const file = files.get(path);
    if (!file || !isSourceCodeFile(path)) {
      continue;
    }

    for (const reference of collectRelativeModuleReferences(path, file.content)) {
      const importedPath = resolveRelativeSourcePath(path, reference.specifier, (candidate) => files.has(candidate));
      if (!importedPath) {
        throw unresolvedStaticReference(path, reference);
      }
      if (!isAllowedEntryDependency(importedPath, entryRoot)) {
        throw invalidInput(`Entry imports a file outside its own directory or ${JS_TEMPLATE_SHARED_ROOT}`);
      }
      if (!selected.has(importedPath)) {
        pending.push(importedPath);
      }
    }
  }

  return selected;
}

function unresolvedStaticReference(
  importer: string,
  reference: ReturnType<typeof collectRelativeModuleReferences>[number],
): JsTemplateError {
  const candidatePaths = buildRelativeSourceCandidatePaths(importer, reference.specifier);
  return new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'Inline source contains an unresolved static import', {
    status: 422,
    details: {
      failureCode: 'RUNJS_IMPORT_NOT_FOUND',
      diagnostics: [
        {
          severity: 'error',
          code: 'RUNJS_IMPORT_NOT_FOUND',
          path: importer,
          line: reference.line,
          column: reference.column,
          message: `Import "${reference.specifier}" could not be resolved`,
          details: {
            importer,
            specifier: reference.specifier,
            candidatePaths,
            kind: reference.typeOnly ? 'type' : 'runtime',
          },
        },
      ],
    },
  });
}

function isAllowedEntryDependency(path: string, entryRoot: string): boolean {
  return path === entryRoot || path.startsWith(`${entryRoot}/`) || path.startsWith(`${JS_TEMPLATE_SHARED_ROOT}/`);
}

function relocateEntryPath(entryPath: string): string {
  return `${RUNJS_ENTRY_ROOT}/index${pathPosix.extname(normalizeSourceWorkspacePath(entryPath))}`;
}

function withRunJSManifest(
  files: SaveAsJsTemplateWorkspaceFile[],
  entryPath: string,
  runtimeVersion: string,
  surfaceStyle: string,
): SaveAsJsTemplateWorkspaceFile[] {
  return [
    ...files,
    {
      path: RUNJS_MANIFEST_PATH,
      content: `${JSON.stringify(
        {
          schemaVersion: 1,
          entry: entryPath,
          runtimeVersion,
          surfaceStyle,
          compiler: {
            module: 'virtual-esm',
            jsx: true,
          },
        },
        null,
        2,
      )}\n`,
      language: 'json',
    },
  ];
}

function buildOverwriteChanges(
  currentFiles: Array<{ path: string }>,
  desiredFiles: SaveAsJsTemplateWorkspaceFile[],
): VscFileChange[] {
  const desiredPaths = new Set(desiredFiles.map((file) => file.path));
  return [
    ...desiredFiles.map((file) => ({
      ...file,
      operation: 'upsert' as const,
    })),
    ...currentFiles
      .filter((file) => !desiredPaths.has(file.path))
      .map((file) => ({
        path: file.path,
        operation: 'delete' as const,
      })),
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function requireFlowModelStepLocator(locator: RunJSSourceLocator): FlowModelStepLocator {
  if (locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(locator);
  }
  return locator;
}

export function isDetachJsTemplateToInlineHostSupported(kind: string, modelUse: unknown): boolean {
  if (kind === 'runjs' || typeof modelUse !== 'string') {
    return false;
  }
  return getUsageOwnerAdapterByUse(modelUse)?.kind === kind;
}

async function lockFlowModel(db: Database, modelUid: string, transaction: Transaction): Promise<JsonRecord> {
  const model = await db.getCollection('flowModels').model.findByPk(modelUid, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!model) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', `FlowModel "${modelUid}" was not found`, {
      status: 404,
    });
  }
  const value = typeof model.toJSON === 'function' ? model.toJSON() : model;
  if (!isRecord(value)) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', `FlowModel "${modelUid}" could not be read`);
  }
  return value;
}

async function lockJsTemplate(db: Database, templateId: string, transaction: Transaction) {
  const template = await db.getCollection(JS_TEMPLATE_COLLECTIONS.templates).model.findByPk(templateId, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!template) {
    throw new JsTemplateError('JS_TEMPLATE_NOT_FOUND', `JS Template "${templateId}" was not found`);
  }
  return templateFromModel(template as Model);
}

async function getFlowModel(db: Database, modelUid: string, transaction?: Transaction): Promise<JsonRecord> {
  const model = await getFlowModelRepository(db).findModelById(modelUid, {
    includeAsyncNode: true,
    transaction,
  });
  if (!model) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', `FlowModel "${modelUid}" was not found`, {
      status: 404,
    });
  }
  return model;
}

function getFlowModelRepository(db: Database): FlowModelRepositoryLike {
  return db.getCollection('flowModels').repository as unknown as FlowModelRepositoryLike;
}

function requireCurrentJsTemplateBinding(
  model: JsonRecord,
  locator: FlowModelStepLocator,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId'>,
  expectedKind?: JsTemplateKind,
): JsTemplateRuntimeSourceBinding {
  const sourceRoot = getAtPath(model, [
    'stepParams',
    locator.flowKey,
    locator.stepKey,
    ...locator.paramPath.slice(0, -1),
  ]);
  if (!isRecord(sourceRoot) || sourceRoot.sourceMode !== JS_TEMPLATE_SOURCE_MODE) {
    throw bindingOutdated(input);
  }
  const sourceBinding = sourceRoot.sourceBinding;
  if (!isJsTemplateRuntimeSourceBinding(sourceBinding)) {
    throw bindingOutdated(input);
  }
  if (
    sourceBinding.projectId !== input.projectId ||
    sourceBinding.templateId !== input.templateId ||
    (expectedKind !== undefined && sourceBinding.kind !== expectedKind)
  ) {
    throw bindingOutdated(input, expectedKind);
  }
  return sourceBinding;
}

function deriveServerOwnedJsTemplateSource(
  template: Awaited<ReturnType<JsTemplateService['getTemplate']>>,
  binding: JsTemplateRuntimeSourceBinding,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'expectedProjectHeadCommitId'>,
): ServerOwnedJsTemplateSource {
  const runtimeVersion = template.runtimeArtifact?.runtimeVersion || template.runtimeVersion;
  if (
    template.id !== input.templateId ||
    template.projectId !== input.projectId ||
    template.compiledCommitId !== input.expectedProjectHeadCommitId ||
    template.kind !== binding.kind ||
    typeof runtimeVersion !== 'string' ||
    !runtimeVersion.trim() ||
    (template.runtimeArtifact !== null &&
      normalizeSourceWorkspacePath(template.runtimeArtifact.entryPath) !==
        normalizeSourceWorkspacePath(template.entryPath)) ||
    (template.runtimeVersion !== null && template.runtimeVersion !== runtimeVersion)
  ) {
    throw templateOutdated(input, binding.kind);
  }
  return {
    binding,
    entryPath: normalizeSourceWorkspacePath(template.entryPath),
    kind: template.kind,
    runtimeVersion,
  };
}

function assertServerOwnedJsTemplateSourceCurrent(
  template: Awaited<ReturnType<JsTemplateService['getTemplate']>>,
  expected: ServerOwnedJsTemplateSource,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'expectedProjectHeadCommitId'>,
): void {
  const current = deriveServerOwnedJsTemplateSource(template, expected.binding, input);
  if (
    current.entryPath !== expected.entryPath ||
    current.kind !== expected.kind ||
    current.runtimeVersion !== expected.runtimeVersion
  ) {
    throw templateOutdated(input, expected.kind);
  }
}

function assertExpectedProjectHead(
  currentHeadCommitId: string | null,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'expectedProjectHeadCommitId'>,
): void {
  if (currentHeadCommitId === input.expectedProjectHeadCommitId) {
    return;
  }
  throw new JsTemplateError(
    'JS_TEMPLATE_SOURCE_OUTDATED',
    'The Source Project Head changed before the JS Template could be detached to inline code',
    {
      details: {
        projectId: input.projectId,
        templateId: input.templateId,
        expectedProjectHeadCommitId: input.expectedProjectHeadCommitId,
        currentProjectHeadCommitId: currentHeadCommitId,
      },
    },
  );
}

function materializeCommittedSourceFiles(
  snapshot: JsTemplatePullResult,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'expectedProjectHeadCommitId'>,
): SaveAsJsTemplateWorkspaceFile[] {
  if (snapshot.commit?.id !== input.expectedProjectHeadCommitId || !Array.isArray(snapshot.files)) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'The exact JS Template source commit could not be read', {
      status: 409,
      details: input,
    });
  }

  return snapshot.files.map((file) => {
    if (typeof file.content !== 'string') {
      throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Committed JS Template source content is missing', {
        details: { ...input, path: file.path },
      });
    }
    return {
      path: file.path,
      content: file.content,
      language: file.language,
      mode: file.mode,
    };
  });
}

async function setFlowModelSourceModeInline(
  db: Database,
  locator: FlowModelStepLocator,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId'>,
  kind: JsTemplateKind,
  transaction: Transaction,
): Promise<void> {
  const model = await getFlowModel(db, locator.modelUid, transaction);
  requireCurrentJsTemplateBinding(model, locator, input, kind);
  const stepParams = cloneRecord(model.stepParams);
  const step = cloneRecord(getAtPath(stepParams, [locator.flowKey, locator.stepKey]));
  setAtPath(stepParams, [locator.flowKey, locator.stepKey], step);
  const sourceRootPath = locator.paramPath.slice(0, -1);
  const sourceRoot = sourceRootPath.length ? cloneRecord(getAtPath(step, sourceRootPath)) : step;
  sourceRoot.sourceMode = 'inline';
  delete sourceRoot.sourceBinding;
  if (sourceRootPath.length) {
    setAtPath(step, sourceRootPath, sourceRoot);
  }
  await getFlowModelRepository(db).patch(
    {
      uid: locator.modelUid,
      stepParams,
    },
    { transaction },
  );
}

function assertRepositoryIdentity(
  repository: VscRepositoryRecord,
  identity: ReturnType<typeof buildRunJSSourceRepositoryIdentity>,
): void {
  if (
    repository.ownerType !== identity.ownerType ||
    repository.ownerId !== identity.ownerId ||
    repository.name !== identity.name
  ) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'RunJS source repository identity mismatch', {
      status: 409,
    });
  }
}

async function updateRunJSCommitMetadata(
  db: Database,
  commit: VscCommitRecord,
  metadata: Record<string, unknown>,
  transaction: Transaction,
): Promise<void> {
  const nextMetadata = {
    ...(commit.metadata || {}),
    ...metadata,
  };
  const hash = createHash('sha256')
    .update(
      [
        commit.repoId,
        String(commit.seq),
        commit.parentCommitId || '',
        commit.treeHash,
        commit.message,
        commit.authorId || '',
        JSON.stringify(nextMetadata),
      ].join('\0'),
    )
    .digest('hex');

  await db.getRepository('vscFileCommits').update({
    filterByTk: commit.id,
    values: {
      hash,
      metadata: nextMetadata,
    },
    transaction,
  });
}

function getAtPath(root: unknown, path: readonly string[]): unknown {
  let current = root;
  for (const segment of path) {
    if (!isRecord(current) || UNSAFE_PATH_SEGMENTS.has(segment)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function setAtPath(root: JsonRecord, path: readonly string[], value: unknown): void {
  if (!path.length || path.some((segment) => UNSAFE_PATH_SEGMENTS.has(segment))) {
    return;
  }
  let target = root;
  for (const segment of path.slice(0, -1)) {
    const next = cloneRecord(target[segment]);
    target[segment] = next;
    target = next;
  }
  target[path[path.length - 1]] = value;
}

function cloneRecord(value: unknown): JsonRecord {
  return isRecord(value) ? JSON.parse(JSON.stringify(value)) : {};
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertDetachJsTemplateToInlineInputSupported(input: DetachJsTemplateToInlineInput): string {
  if (typeof input.idempotencyKey !== 'string') {
    throw invalidInput('Detach to inline idempotency key must be a non-empty string');
  }
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw invalidInput('Detach to inline idempotency key must be a non-empty string');
  }
  if (idempotencyKey.length > 255) {
    throw invalidInput('Detach to inline idempotency key must be at most 255 characters');
  }
  if (typeof input.expectedProjectHeadCommitId !== 'string' || !input.expectedProjectHeadCommitId.trim()) {
    throw invalidInput('expectedProjectHeadCommitId must be a non-empty string');
  }
  return idempotencyKey;
}

function createDetachJsTemplateToInlineOperationDescriptor(
  input: DetachJsTemplateToInlineInput,
  idempotencyKey: string,
): JsTemplateSourceOperationDescriptor<
  DetachJsTemplateToInlineResult,
  Omit<DetachJsTemplateToInlineInput, 'idempotencyKey'>
> {
  return {
    action: 'detach-to-inline',
    idempotencyKey,
    request: {
      locator: input.locator,
      projectId: input.projectId,
      templateId: input.templateId,
      expectedProjectHeadCommitId: input.expectedProjectHeadCommitId,
    },
    parseResult: readDetachJsTemplateToInlineOperationResult,
  };
}

function readDetachJsTemplateToInlineOperationResult(value: unknown): DetachJsTemplateToInlineResult {
  if (
    !isRecord(value) ||
    typeof value.runJSRepoId !== 'string' ||
    typeof value.commitId !== 'string' ||
    typeof value.ownerFingerprint !== 'string' ||
    typeof value.code !== 'string' ||
    typeof value.runtimeVersion !== 'string' ||
    typeof value.entryPath !== 'string' ||
    typeof value.filesHash !== 'string' ||
    !value.filesHash.trim() ||
    !isRecord(value.sourceRef) ||
    value.sourceRef.type !== 'vsc-file' ||
    value.sourceRef.repoId !== value.runJSRepoId ||
    value.sourceRef.commitId !== value.commitId ||
    value.sourceRef.entry !== value.entryPath
  ) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Detach to inline operation has an invalid completed result');
  }
  return value as unknown as DetachJsTemplateToInlineResult;
}

function bindingOutdated(
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId'>,
  kind?: JsTemplateKind,
): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'The RunJS source binding changed before it could be detached to inline code',
    {
      status: 409,
      details: { ...input, ...(kind ? { kind } : {}) },
    },
  );
}

function templateOutdated(
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId'>,
  kind: JsTemplateKind,
): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'The selected JS Template changed before it could be detached to inline code',
    { status: 409, details: { ...input, kind } },
  );
}

function unsupportedLocator(locator: RunJSSourceLocator): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'This RunJS source cannot be detached to inline code', {
    details: {
      locatorKind: locator.kind,
    },
  });
}

function invalidInput(message: string): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', message, { status: 400 });
}

function normalizeDetachJsTemplateToInlineError(error: unknown): unknown {
  if (!isVscError(error)) {
    return error;
  }
  if (error.code === 'PERMISSION_DENIED') {
    return new JsTemplateError('JS_TEMPLATE_PERMISSION_DENIED', 'RunJS source write permission is required', {
      details: error.details,
    });
  }
  return new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'RunJS inline source could not be saved', {
    status: error.status,
    details: {
      sourceCode: error.code,
      ...(error.details || {}),
    },
  });
}
