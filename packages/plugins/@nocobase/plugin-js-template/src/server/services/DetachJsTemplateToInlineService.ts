/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
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
import ts from 'typescript';

import type {
  SaveAsJsTemplateWorkspaceFile,
  DetachJsTemplateToInlineInput,
  DetachJsTemplateToInlineResult,
  JsTemplateRuntimeSourceBinding,
} from '../../shared/types';
import { JsTemplateError } from '../../shared/errors';
import { JS_TEMPLATE_SOURCE_BINDING_TYPE, JS_TEMPLATE_SOURCE_MODE } from '../../shared/jsTemplateRunJSPersistence';
import { JsTemplateAuditService } from './JsTemplateAuditService';
import { JsTemplateService } from './JsTemplateService';
import { getUsageOwnerAdapterByUse } from './JsTemplateUsageOwnerRegistry';
import type { JsTemplateUsageService } from './JsTemplateUsageService';
import type { JsTemplateServiceContext } from './JsTemplateProjectService';
import { JsTemplateProjectService } from './JsTemplateProjectService';
import {
  JsTemplateSourceOperationStore,
  type JsTemplateSourceOperationReservation,
} from './JsTemplateSourceOperationStore';
import {
  JsTemplateWorkspaceCompilerBridge,
  rewriteJsTemplateSdkRuntimeImports,
} from './JsTemplateWorkspaceCompilerBridge';
import {
  collectRelativeModuleSpecifiers,
  getSourceScriptKind,
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
const JS_TEMPLATE_SDK_TYPE_MODULES = new Set(['@nocobase/js-template-sdk/client', '@nocobase/js-template-sdk/shared']);
const JS_TEMPLATE_SETTINGS_TYPE_PREFIX = 'js-template:settings/';

type AdapterRegistryProvider = () => RunJSSourceAdapterRegistry | null;
type VscFileServiceProvider = () => VscFileService | null;

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
  entryPath: string;
  ownerFingerprint: string;
  surfaceStyle: string;
  artifact: RunJSRuntimeArtifact;
  commitMetadata: Record<string, unknown>;
  repositoryIdentity: VscRepositoryIdentity;
  expectedRepository: VscRepositoryRecord | null;
  changes: VscFileChange[];
}

export class DetachJsTemplateToInlineService {
  private readonly sourceOperationStore: JsTemplateSourceOperationStore;

  constructor(
    private readonly db: Database,
    private readonly projectService: JsTemplateProjectService,
    private readonly templateService: JsTemplateService,
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
      assertDetachJsTemplateToInlineInputSupported(input);
      const descriptor = createDetachJsTemplateToInlineOperationDescriptor(input);
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
      assertRunJSCompileInputLimits(input.files);
      const relocatedFiles = collectAndRelocateInlineFiles({
        files: input.files,
        entryPath: input.entryPath,
        kind: input.kind,
      });
      assertRunJSCompileInputLimits([
        ...relocatedFiles,
        {
          path: RUNJS_MANIFEST_PATH,
          content: '',
        },
      ]);
      const vscFileService = this.getVscFileService();
      if (!vscFileService) {
        throw new JsTemplateError('JS_TEMPLATE_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
      }
      const prepared = await this.prepareDetachJsTemplateToInline(input, ctx, relocatedFiles, vscFileService);
      return await this.db.sequelize.transaction(async (transaction) => {
        const result = await this.publishDetachJsTemplateToInline(input, ctx, prepared, vscFileService, transaction);
        await this.recordDetachJsTemplateToInlineSuccessAudit(input, result, ctx, transaction);
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
    relocatedFiles: SaveAsJsTemplateWorkspaceFile[],
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
    assertCurrentJsTemplateBinding(currentModel, locator, input);
    await this.projectService.assertApplicationOwnership(input.projectId, this.applicationName, serviceContext);
    const template = await this.templateService.getTemplate(input.templateId, serviceContext);
    assertCurrentTemplate(template, input);

    const legacy = await adapter.readLegacy({ locator, ctx: adapterContext });
    if (!isDetachJsTemplateToInlineHostSupported(input.kind, legacy.metadata?.modelUse)) {
      throw unsupportedLocator(locator);
    }

    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const repository = await vscFileService.findRepositoryByIdentity(identity, vscContext);
    if (repository) {
      assertRepositoryIdentity(repository, identity);
    }

    const entryPath = relocateEntryPath(input.entryPath);
    const sourcePreparation = this.workspaceCompilerBridge.prepareEntry({
      projectId: input.projectId,
      templateId: input.templateId,
      operation: 'runtimeCompile',
      kind: input.kind,
      templateName: template.templateName,
      entryPath,
      runtimeVersion: input.version,
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

  private async publishDetachJsTemplateToInline(
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
    assertCurrentJsTemplateBinding(
      await getFlowModel(this.db, prepared.locator.modelUid, transaction),
      prepared.locator,
      input,
    );
    const template = await this.templateService.getTemplate(input.templateId, serviceContext);
    assertCurrentTemplate(template, input);
    const legacy = await adapter.readLegacy({ locator: prepared.locator, ctx: adapterContext });
    if (!isDetachJsTemplateToInlineHostSupported(input.kind, legacy.metadata?.modelUse)) {
      throw unsupportedLocator(prepared.locator);
    }
    if (legacy.ownerFingerprint !== prepared.ownerFingerprint || legacy.surfaceStyle !== prepared.surfaceStyle) {
      throw bindingOutdated(input);
    }

    const pushed = await vscFileService.ensureAndPush(
      {
        identity: prepared.repositoryIdentity,
        expectedRepository: prepared.expectedRepository,
        message: `Move JS Template ${input.templateId} to inline code`.slice(0, 200),
        files: prepared.changes,
        allowEmptyCommit: true,
        authorId: ctx.actorUserId,
        metadata: prepared.commitMetadata,
      },
      vscContext,
    );

    await lockFlowModel(this.db, prepared.locator.modelUid, transaction);
    assertCurrentJsTemplateBinding(
      await getFlowModel(this.db, prepared.locator.modelUid, transaction),
      prepared.locator,
      input,
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
    await setFlowModelSourceModeInline(this.db, prepared.locator, input, transaction);
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
      version: prepared.artifact.version,
      entryPath: prepared.entryPath,
      filesHash: prepared.artifact.filesHash,
      sourceRef,
    };
  }

  private async recordDetachJsTemplateToInlineSuccessAudit(
    input: DetachJsTemplateToInlineInput,
    result: DetachJsTemplateToInlineResult,
    ctx: DetachJsTemplateToInlineServiceContext,
    transaction: Transaction,
  ): Promise<void> {
    await this.auditService.recordLifecycleEvent({
      projectId: input.projectId,
      action: 'saveAsJsTemplate',
      result: 'success',
      requestId: ctx.requestId || randomUUID(),
      actorUserId: ctx.actorUserId,
      message: 'JS Template moved to inline RunJS',
      details: {
        destinationType: 'inline',
        templateId: input.templateId,
        kind: input.kind,
        runJSRepoId: result.runJSRepoId,
      },
      transaction,
    });
  }
}

export function collectAndRelocateInlineFiles(input: {
  files: SaveAsJsTemplateWorkspaceFile[];
  entryPath: string;
  kind?: DetachJsTemplateToInlineInput['kind'];
}): SaveAsJsTemplateWorkspaceFile[] {
  const sourceFiles = new Map<string, SaveAsJsTemplateWorkspaceFile>();
  for (const file of input.files) {
    const path = normalizeSourceWorkspacePath(file.path);
    if (sourceFiles.has(path)) {
      throw invalidInput(`Duplicate workspace path "${path}"`);
    }
    sourceFiles.set(path, { ...file, path });
  }

  const entryPath = normalizeSourceWorkspacePath(input.entryPath);
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
  for (const sourcePath of selectedPaths) {
    const targetPath =
      sourcePath === entryPath
        ? relocateEntryPath(entryPath)
        : sourcePath.startsWith(`${entryRoot}/`)
          ? `${RUNJS_ENTRY_ROOT}/${pathPosix.relative(entryRoot, sourcePath)}`
          : sourcePath;
    if (Array.from(targetBySource.values()).includes(targetPath)) {
      throw invalidInput(`Workspace files collide after relocation at "${targetPath}"`);
    }
    targetBySource.set(sourcePath, targetPath);
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
      const rewrittenSdkImports = rewriteJsTemplateSdkRuntimeImports(targetPath, rewrittenImports);
      return {
        ...sourceFile,
        path: targetPath,
        content: rewriteJsTemplateTypeImportsForInline(targetPath, rewrittenSdkImports, input.kind),
      };
    });
}

function rewriteJsTemplateTypeImportsForInline(
  path: string,
  content: string,
  kind?: DetachJsTemplateToInlineInput['kind'],
): string {
  if (!isSourceCodeFile(path)) {
    return content;
  }

  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getSourceScriptKind(path));
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const declaredNames = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const specifier = statement.moduleSpecifier.text;
    if (!JS_TEMPLATE_SDK_TYPE_MODULES.has(specifier) && !isInlineTypeModule(specifier, kind)) {
      continue;
    }
    const importClause = statement.importClause;
    if (!importClause || importClause.name || !importClause.namedBindings) {
      continue;
    }
    if (ts.isNamespaceImport(importClause.namedBindings)) {
      if (!importClause.isTypeOnly) {
        continue;
      }
      replacements.push({
        start: statement.getStart(sourceFile),
        end: statement.end,
        value: buildInlineTypeNamespace(importClause.namedBindings.name.text, specifier),
      });
      continue;
    }
    if (!importClause.isTypeOnly && importClause.namedBindings.elements.some((element) => !element.isTypeOnly)) {
      continue;
    }

    const declarations = importClause.namedBindings.elements.flatMap((element) => {
      const localName = element.name.text;
      if (declaredNames.has(localName)) {
        return [];
      }
      declaredNames.add(localName);
      const importedName = element.propertyName?.text || localName;
      return [buildInlineTypeDeclaration(importedName, localName, specifier)];
    });
    replacements.push({
      start: statement.getStart(sourceFile),
      end: statement.end,
      value: declarations.join(' '),
    });
  }

  const visitImportTypes = (node: ts.Node) => {
    if (ts.isImportTypeNode(node)) {
      const specifier = getImportTypeSpecifier(node);
      if (specifier && isInlineTypeModule(specifier, kind)) {
        replacements.push({
          start: node.getStart(sourceFile),
          end: node.end,
          value: buildInlineImportType(node, sourceFile, specifier),
        });
        return;
      }
    }
    ts.forEachChild(node, visitImportTypes);
  };
  visitImportTypes(sourceFile);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      content,
    );
}

function isInlineTypeModule(specifier: string, kind?: DetachJsTemplateToInlineInput['kind']): boolean {
  if (JS_TEMPLATE_SDK_TYPE_MODULES.has(specifier)) {
    return true;
  }
  return Boolean(kind && specifier.startsWith(`${JS_TEMPLATE_SETTINGS_TYPE_PREFIX}client/${kind}/`));
}

function buildInlineTypeNamespace(localName: string, specifier: string): string {
  if (specifier.startsWith(JS_TEMPLATE_SETTINGS_TYPE_PREFIX)) {
    return `declare namespace ${localName} { export type Settings = Record<string, unknown>; export type SettingsSchemaSummary = Record<string, unknown>; export type Context = typeof ctx & { settings: Settings }; export type SettingsContext = Context; }`;
  }

  return `declare namespace ${localName} { export type JsTemplate = Record<string, unknown>; export type JsTemplateSettingsContext<TSettings = Record<string, unknown>> = typeof ctx & { settings: TSettings }; export type JsTemplateDataContext<TSettings = Record<string, unknown>> = JsTemplateSettingsContext<TSettings>; export type JSBlockContext<TSettings = Record<string, unknown>> = JsTemplateDataContext<TSettings>; export type JSPageContext<TSettings = Record<string, unknown>> = JsTemplateDataContext<TSettings>; export type JSFieldContext<TSettings = Record<string, unknown>, TValue = unknown> = JsTemplateDataContext<TSettings> & { value?: TValue }; export type JSActionContext<TSettings = Record<string, unknown>> = JsTemplateDataContext<TSettings>; export type JSItemContext<TSettings = Record<string, unknown>, TValue = unknown> = JsTemplateDataContext<TSettings> & { value?: TValue }; export type RunJSContext<TSettings = Record<string, unknown>, TInput = unknown> = JsTemplateDataContext<TSettings> & { input?: TInput }; export function defineSettings<TSettings>(settings: TSettings): TSettings; export function assertSettings<TSettings>(settings: TSettings): TSettings; }`;
}

function getImportTypeSpecifier(node: ts.ImportTypeNode): string | null {
  const argument = node.argument;
  if (!ts.isLiteralTypeNode(argument) || !ts.isStringLiteral(argument.literal)) {
    return null;
  }
  return argument.literal.text;
}

function buildInlineImportType(node: ts.ImportTypeNode, sourceFile: ts.SourceFile, specifier: string): string {
  const importedName = node.qualifier ? node.qualifier.getText(sourceFile).split('.').pop() || '' : '';
  const firstTypeArgument = node.typeArguments?.[0]?.getText(sourceFile) || 'Record<string, unknown>';
  if (specifier.startsWith(JS_TEMPLATE_SETTINGS_TYPE_PREFIX)) {
    if (importedName === 'Context' || importedName === 'SettingsContext') {
      return `(typeof ctx & { settings: Record<string, unknown> })`;
    }
    return 'Record<string, unknown>';
  }
  if (importedName === 'JsTemplate') {
    return 'Record<string, unknown>';
  }
  if (importedName.endsWith('Context')) {
    return `(typeof ctx & { settings: ${firstTypeArgument} })`;
  }
  return 'unknown';
}

function buildInlineTypeDeclaration(importedName: string, localName: string, specifier: string): string {
  if (specifier.startsWith(JS_TEMPLATE_SETTINGS_TYPE_PREFIX)) {
    if (importedName === 'Context' || importedName === 'SettingsContext') {
      return `type ${localName} = typeof ctx & { settings: Record<string, unknown> };`;
    }
    return `type ${localName} = Record<string, unknown>;`;
  }

  if (importedName === 'JsTemplate') {
    return `type ${localName} = Record<string, unknown>;`;
  }
  if (importedName === 'RunJSContext' && localName === 'RunJSContext') {
    return '';
  }
  if (importedName === 'JSPageContext') {
    return `type ${localName}<TSettings = Record<string, unknown>> = typeof ctx & { settings: TSettings };`;
  }
  if (importedName.endsWith('Context')) {
    return `type ${localName}<TSettings = Record<string, unknown>, TValue = unknown> = typeof ctx & { settings: TSettings; value?: TValue };`;
  }
  return `type ${localName} = unknown;`;
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

    for (const specifier of collectRelativeModuleSpecifiers(path, file.content)) {
      const importedPath = resolveRelativeSourcePath(path, specifier, (candidate) => files.has(candidate));
      if (!importedPath) {
        continue;
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

async function lockFlowModel(db: Database, modelUid: string, transaction: Transaction): Promise<void> {
  await db.getCollection('flowModels').model.findByPk(modelUid, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
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

function assertCurrentJsTemplateBinding(
  model: JsonRecord,
  locator: FlowModelStepLocator,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'kind'>,
): void {
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
  if (!isJsTemplateBinding(sourceBinding)) {
    throw bindingOutdated(input);
  }
  if (
    sourceBinding.projectId !== input.projectId ||
    sourceBinding.templateId !== input.templateId ||
    sourceBinding.kind !== input.kind
  ) {
    throw bindingOutdated(input);
  }
}

function assertCurrentTemplate(
  template: Awaited<ReturnType<JsTemplateService['getTemplate']>>,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'entryPath' | 'kind'>,
): void {
  if (
    template.id !== input.templateId ||
    template.projectId !== input.projectId ||
    template.kind !== input.kind ||
    normalizeSourceWorkspacePath(template.entryPath) !== normalizeSourceWorkspacePath(input.entryPath)
  ) {
    throw new JsTemplateError(
      'JS_TEMPLATE_BINDING_OUTDATED',
      'The selected JS Template changed before it could be moved to inline code',
      { status: 409, details: input },
    );
  }
}

async function setFlowModelSourceModeInline(
  db: Database,
  locator: FlowModelStepLocator,
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'kind'>,
  transaction: Transaction,
): Promise<void> {
  const model = await getFlowModel(db, locator.modelUid, transaction);
  assertCurrentJsTemplateBinding(model, locator, input);
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

function isJsTemplateBinding(value: unknown): value is JsTemplateRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === JS_TEMPLATE_SOURCE_BINDING_TYPE &&
    typeof value.projectId === 'string' &&
    typeof value.templateId === 'string' &&
    typeof value.kind === 'string'
  );
}

function assertDetachJsTemplateToInlineInputSupported(input: DetachJsTemplateToInlineInput): void {
  if (typeof input.idempotencyKey !== 'string' || !input.idempotencyKey.trim()) {
    throw invalidInput('Move to inline idempotency key must be a non-empty string');
  }
  if (input.idempotencyKey.length > 255) {
    throw invalidInput('Move to inline idempotency key must be at most 255 characters');
  }
}

function createDetachJsTemplateToInlineOperationDescriptor(input: DetachJsTemplateToInlineInput) {
  return {
    action: 'detach-to-inline',
    idempotencyKey: input.idempotencyKey,
    request: { ...input, idempotencyKey: undefined },
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
    typeof value.version !== 'string' ||
    typeof value.entryPath !== 'string' ||
    typeof value.filesHash !== 'string' ||
    !value.filesHash.trim() ||
    !isRecord(value.sourceRef) ||
    value.sourceRef.type !== 'vsc-file' ||
    value.sourceRef.repoId !== value.runJSRepoId ||
    value.sourceRef.commitId !== value.commitId ||
    value.sourceRef.entry !== value.entryPath
  ) {
    throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', 'Move to inline operation has an invalid completed result');
  }
  return value as unknown as DetachJsTemplateToInlineResult;
}

function bindingOutdated(
  input: Pick<DetachJsTemplateToInlineInput, 'projectId' | 'templateId' | 'kind'>,
): JsTemplateError {
  return new JsTemplateError(
    'JS_TEMPLATE_BINDING_OUTDATED',
    'The RunJS source binding changed before it could be moved to inline code',
    {
      status: 409,
      details: input,
    },
  );
}

function unsupportedLocator(locator: RunJSSourceLocator): JsTemplateError {
  return new JsTemplateError('JS_TEMPLATE_INVALID_INPUT', 'This RunJS source cannot be moved to inline code', {
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
