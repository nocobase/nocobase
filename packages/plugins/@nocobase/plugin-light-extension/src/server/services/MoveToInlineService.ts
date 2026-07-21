/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
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
  type VscRepositoryRecord,
  type VscServiceContext,
  VscFileService,
} from '../vsc-file/public-api';
import { createHash } from 'crypto';
import { posix as pathPosix } from 'path';
import ts from 'typescript';

import type {
  LightExtensionMoveSourceWorkspaceFile,
  LightExtensionMoveToInlineInput,
  LightExtensionMoveToInlineResult,
  LightExtensionRuntimeSourceBinding,
} from '../../shared/types';
import { LightExtensionError } from '../../shared/errors';
import { createLightExtensionProblemFactory } from '../../shared/problems';
import { LightExtensionEntryService } from './LightExtensionEntryService';
import { rewriteRelativeImports } from './MoveSourceService';
import { getReferenceOwnerAdapterByUse } from './ReferenceOwnerRegistry';
import type { ReferenceService } from './ReferenceService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import {
  LightExtensionWorkspaceCompilerBridge,
  rewriteLightExtensionSdkRuntimeImports,
} from './LightExtensionWorkspaceCompilerBridge';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const RUNJS_ENTRY_ROOT = 'src/client';
const LIGHT_EXTENSION_SHARED_ROOT = 'src/shared';
const LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE = 'entry.json';
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;
const RESOLVABLE_EXTENSIONS = [...CODE_EXTENSIONS, '.json'] as const;
const UNSAFE_PATH_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);
const LIGHT_EXTENSION_SDK_TYPE_MODULES = new Set([
  '@nocobase/light-extension-sdk/client',
  '@nocobase/light-extension-sdk/shared',
]);
const LIGHT_EXTENSION_SETTINGS_TYPE_PREFIX = 'light-extension:settings/';

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

export interface MoveToInlineServiceContext extends LightExtensionServiceContext {
  adapterContext: RunJSSourceAdapterContext;
}

export class MoveToInlineService {
  constructor(
    private readonly db: Database,
    private readonly entryService: LightExtensionEntryService,
    private readonly workspaceCompilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly referenceService: ReferenceService,
    private readonly getVscFileService: VscFileServiceProvider,
    private readonly getAdapterRegistry: AdapterRegistryProvider,
  ) {}

  async moveToInline(
    input: LightExtensionMoveToInlineInput,
    ctx: MoveToInlineServiceContext,
  ): Promise<LightExtensionMoveToInlineResult> {
    try {
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
      return await this.db.sequelize.transaction((transaction) =>
        this.moveToInlineInTransaction(input, ctx, relocatedFiles, transaction),
      );
    } catch (error) {
      throw normalizeMoveToInlineError(error);
    }
  }

  private async moveToInlineInTransaction(
    input: LightExtensionMoveToInlineInput,
    ctx: MoveToInlineServiceContext,
    relocatedFiles: LightExtensionMoveSourceWorkspaceFile[],
    transaction: Transaction,
  ): Promise<LightExtensionMoveToInlineResult> {
    const locator = requireFlowModelStepLocator(input.locator);
    const registry = this.getAdapterRegistry();
    const vscFileService = this.getVscFileService();
    if (!registry || !vscFileService) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }

    const adapter = registry.require(locator.kind);
    const adapterContext: RunJSSourceAdapterContext = {
      ...ctx.adapterContext,
      sourceTransition: 'external-to-inline',
      transaction,
    };
    const serviceContext: LightExtensionServiceContext = {
      ...ctx,
      transaction,
    };
    const vscContext: VscServiceContext = {
      authorId: ctx.actorUserId,
      request: {
        ...adapterContext.request,
        resourceName: 'runJSSources',
        actionName: 'save',
      },
      transaction,
    };

    await adapter.assertCanWrite({ locator, ctx: adapterContext });
    const currentModel = await getFlowModel(this.db, locator.modelUid, transaction);
    assertCurrentLightExtensionBinding(currentModel, locator, input);

    const identity = buildRunJSSourceRepositoryIdentity(locator);
    const ensured = await vscFileService.ensureRepository(
      {
        ...identity,
        authorId: ctx.actorUserId,
        metadata: {
          sourceKind: locator.kind,
        },
      },
      vscContext,
    );
    const repository = await vscFileService.getRepositoryForUpdate({ repoId: ensured.repository.id }, vscContext);
    assertRepositoryIdentity(repository, identity);

    const entry = await this.entryService.getEntry(input.entryId, serviceContext);
    if (
      entry.repoId !== input.repoId ||
      entry.kind !== input.kind ||
      normalizeWorkspacePath(entry.entryPath) !== normalizeWorkspacePath(input.entryPath)
    ) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_BINDING_OUTDATED',
        'The selected light extension entry changed before it could be moved to inline code',
        {
          status: 409,
          details: {
            repoId: input.repoId,
            entryId: input.entryId,
            entryPath: input.entryPath,
            kind: input.kind,
          },
        },
      );
    }

    const legacy = await adapter.readLegacy({ locator, ctx: adapterContext });
    if (!isMoveToInlineHostSupported(input.kind, legacy.metadata?.modelUse)) {
      throw unsupportedLocator(locator);
    }

    const entryPath = relocateEntryPath(input.entryPath);
    const compileResult = await this.workspaceCompilerBridge.compileEntry(
      {
        repoId: input.repoId,
        entryId: input.entryId,
        operation: 'runtimeCompile',
        kind: input.kind,
        entryName: entry.entryName,
        entryPath,
        runtimeVersion: input.version,
        files: relocatedFiles,
      },
      serviceContext,
    );
    if (!compileResult.accepted) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Inline source could not be compiled', {
        status: 422,
        details: {
          repoId: input.repoId,
          entryId: input.entryId,
          problems: compileResult.problems,
          failureCode: compileResult.failureCode,
        },
      });
    }

    const desiredFiles = withRunJSManifest(
      relocatedFiles,
      entryPath,
      compileResult.artifact.version,
      legacy.surfaceStyle,
    );
    const currentFiles = (
      await vscFileService.pull(
        {
          repoId: repository.id,
          includeContent: 'none',
        },
        vscContext,
      )
    ).files;
    const canonicalFiles = canonicalizeRunJSCompileFiles(desiredFiles, currentFiles || []);
    assertRunJSCompileInputLimits(canonicalFiles);
    const canonicalCompileResult = await compileRunJSSourceWorkspace({
      files: canonicalFiles,
      entry: entryPath,
      runtimeVersion: compileResult.artifact.version,
      surfaceStyle: legacy.surfaceStyle,
      locator,
      legacy: {
        version: legacy.version,
        surfaceStyle: legacy.surfaceStyle,
        language: legacy.language,
        metadata: legacy.metadata,
      },
    });
    const canonicalCompileErrors = canonicalCompileResult.artifact.diagnostics.filter(
      (diagnostic) => diagnostic.severity === 'error',
    );
    if (canonicalCompileErrors.length > 0) {
      const createProblem = createLightExtensionProblemFactory({
        snapshotId: compileResult.artifact.filesHash,
        requestId: serviceContext.requestId || `move-to-inline:${input.entryId}`,
        source: 'runjs-compiler',
        phase: 'compile',
      });
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Inline source could not be compiled', {
        status: 422,
        details: {
          repoId: input.repoId,
          entryId: input.entryId,
          problems: canonicalCompileErrors.map((problem) =>
            createProblem({
              code: problem.code || problem.ruleId || 'RUNJS_COMPILE_FAILED',
              severity: problem.severity === 'warning' ? 'warning' : 'error',
              message: problem.message,
              path: problem.path,
              range:
                problem.line || problem.column
                  ? { start: { line: problem.line || 1, column: problem.column || 1 } }
                  : undefined,
              details: problem.details,
            }),
          ),
          failureCode: canonicalCompileResult.failureCode,
        },
      });
    }
    const changes = buildOverwriteChanges(currentFiles || [], canonicalFiles);
    const artifact = {
      ...compileResult.artifact,
      ...canonicalCompileResult.artifact,
      entryPath,
      metadata: {
        ...canonicalCompileResult.artifact.metadata,
        ...compileResult.artifact.metadata,
        repoId: repository.id,
        runtimeCodeHash: buildRunJSRuntimeCodeHash(canonicalCompileResult.artifact.code),
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
    const pushed = await vscFileService.push(
      {
        repoId: repository.id,
        baseCommitId: repository.headCommitId,
        message: `Move light extension entry ${input.entryId} to inline code`.slice(0, 200),
        files: changes,
        allowEmptyCommit: true,
        authorId: ctx.actorUserId,
        metadata: commitMetadata,
      },
      vscContext,
    );

    await lockFlowModel(this.db, locator.modelUid, transaction);
    assertCurrentLightExtensionBinding(await getFlowModel(this.db, locator.modelUid, transaction), locator, input);
    await adapter.writeRuntime({
      locator,
      artifact,
      commitId: pushed.commit.id,
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx: adapterContext,
    });
    await setFlowModelSourceModeInline(this.db, locator, input, transaction);
    const ownerFingerprint = await adapter.getFingerprint({ locator, ctx: adapterContext });
    await updateRunJSCommitMetadata(
      this.db,
      pushed.commit,
      {
        ...commitMetadata,
        ownerFingerprint,
      },
      transaction,
    );

    await this.referenceService.syncFlowModelReferencesForNodeTree(
      {
        rootUid: locator.modelUid,
        action: 'lightExtensions.moveToInline',
      },
      serviceContext,
    );

    const sourceRef = {
      type: 'vsc-file' as const,
      repoId: repository.id,
      commitId: pushed.commit.id,
      entry: entryPath,
    };
    return {
      runJSRepoId: repository.id,
      commitId: pushed.commit.id,
      ownerFingerprint,
      code: artifact.code,
      version: artifact.version,
      entryPath,
      filesHash: artifact.filesHash,
      sourceRef,
    };
  }
}

export function collectAndRelocateInlineFiles(input: {
  files: LightExtensionMoveSourceWorkspaceFile[];
  entryPath: string;
  kind?: LightExtensionMoveToInlineInput['kind'];
}): LightExtensionMoveSourceWorkspaceFile[] {
  const sourceFiles = new Map<string, LightExtensionMoveSourceWorkspaceFile>();
  for (const file of input.files) {
    const path = normalizeWorkspacePath(file.path);
    if (sourceFiles.has(path)) {
      throw invalidInput(`Duplicate workspace path "${path}"`);
    }
    sourceFiles.set(path, { ...file, path });
  }

  const entryPath = normalizeWorkspacePath(input.entryPath);
  const entryFile = sourceFiles.get(entryPath);
  if (!entryFile || !isCodeFile(entryPath)) {
    throw invalidInput('Light extension entry file is missing or invalid');
  }
  const entryRoot = pathPosix.dirname(entryPath);
  const selectedPaths = collectReachablePaths(sourceFiles, entryPath, entryRoot);
  const descriptorPath = `${entryRoot}/${LIGHT_EXTENSION_ENTRY_DESCRIPTOR_FILE}`;
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
        throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Inline source relocation failed');
      }
      const rewrittenImports = rewriteRelativeImports(sourceFile.content, sourcePath, targetPath, targetBySource);
      const rewrittenSdkImports = rewriteLightExtensionSdkRuntimeImports(targetPath, rewrittenImports);
      return {
        ...sourceFile,
        path: targetPath,
        content: rewriteLightExtensionTypeImportsForInline(targetPath, rewrittenSdkImports, input.kind),
      };
    });
}

function rewriteLightExtensionTypeImportsForInline(
  path: string,
  content: string,
  kind?: LightExtensionMoveToInlineInput['kind'],
): string {
  if (!isCodeFile(path)) {
    return content;
  }

  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getScriptKind(path));
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const declaredNames = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const specifier = statement.moduleSpecifier.text;
    if (!LIGHT_EXTENSION_SDK_TYPE_MODULES.has(specifier) && !isInlineTypeModule(specifier, kind)) {
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

function isInlineTypeModule(specifier: string, kind?: LightExtensionMoveToInlineInput['kind']): boolean {
  if (LIGHT_EXTENSION_SDK_TYPE_MODULES.has(specifier)) {
    return true;
  }
  return Boolean(kind && specifier.startsWith(`${LIGHT_EXTENSION_SETTINGS_TYPE_PREFIX}client/${kind}/`));
}

function buildInlineTypeNamespace(localName: string, specifier: string): string {
  if (specifier.startsWith(LIGHT_EXTENSION_SETTINGS_TYPE_PREFIX)) {
    return `declare namespace ${localName} { export type Settings = Record<string, unknown>; export type SettingsSchemaSummary = Record<string, unknown>; export type Context = typeof ctx & { settings: Settings }; export type SettingsContext = Context; }`;
  }

  return `declare namespace ${localName} { export type LightExtensionRecord = Record<string, unknown>; export type LightExtensionSettingsContext<TSettings = Record<string, unknown>> = typeof ctx & { settings: TSettings }; export type LightExtensionDataContext<TSettings = Record<string, unknown>> = LightExtensionSettingsContext<TSettings>; export type JSBlockContext<TSettings = Record<string, unknown>> = LightExtensionDataContext<TSettings>; export type JSPageContext<TSettings = Record<string, unknown>> = LightExtensionDataContext<TSettings>; export type JSFieldContext<TSettings = Record<string, unknown>, TValue = unknown> = LightExtensionDataContext<TSettings> & { value?: TValue }; export type JSActionContext<TSettings = Record<string, unknown>> = LightExtensionDataContext<TSettings>; export type JSItemContext<TSettings = Record<string, unknown>, TValue = unknown> = LightExtensionDataContext<TSettings> & { value?: TValue }; export type RunJSContext<TSettings = Record<string, unknown>, TInput = unknown> = LightExtensionDataContext<TSettings> & { input?: TInput }; export function defineSettings<TSettings>(settings: TSettings): TSettings; export function assertSettings<TSettings>(settings: TSettings): TSettings; }`;
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
  if (specifier.startsWith(LIGHT_EXTENSION_SETTINGS_TYPE_PREFIX)) {
    if (importedName === 'Context' || importedName === 'SettingsContext') {
      return `(typeof ctx & { settings: Record<string, unknown> })`;
    }
    return 'Record<string, unknown>';
  }
  if (importedName === 'LightExtensionRecord') {
    return 'Record<string, unknown>';
  }
  if (importedName.endsWith('Context')) {
    return `(typeof ctx & { settings: ${firstTypeArgument} })`;
  }
  return 'unknown';
}

function buildInlineTypeDeclaration(importedName: string, localName: string, specifier: string): string {
  if (specifier.startsWith(LIGHT_EXTENSION_SETTINGS_TYPE_PREFIX)) {
    if (importedName === 'Context' || importedName === 'SettingsContext') {
      return `type ${localName} = typeof ctx & { settings: Record<string, unknown> };`;
    }
    return `type ${localName} = Record<string, unknown>;`;
  }

  if (importedName === 'LightExtensionRecord') {
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
  files: Map<string, LightExtensionMoveSourceWorkspaceFile>,
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
    if (!file || !isCodeFile(path)) {
      continue;
    }

    for (const specifier of collectRelativeModuleSpecifiers(path, file.content)) {
      const importedPath = resolveImportedPath(path, specifier, files);
      if (!importedPath) {
        continue;
      }
      if (!isAllowedEntryDependency(importedPath, entryRoot)) {
        throw invalidInput(`Entry imports a file outside its own directory or ${LIGHT_EXTENSION_SHARED_ROOT}`);
      }
      if (!selected.has(importedPath)) {
        pending.push(importedPath);
      }
    }
  }

  return selected;
}

function collectRelativeModuleSpecifiers(path: string, content: string): string[] {
  const sourceFile = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, getScriptKind(path));
  const specifiers: string[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) {
        continue;
      }
      const specifier = statement.moduleSpecifier.text;
      if (specifier.startsWith('.')) {
        specifiers.push(specifier);
      }
      continue;
    }

    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      specifiers.push(statement.moduleSpecifier.text);
    }
  }
  return specifiers;
}

function resolveImportedPath(
  sourcePath: string,
  specifier: string,
  files: Map<string, LightExtensionMoveSourceWorkspaceFile>,
): string | null {
  const basePath = normalizeWorkspacePath(pathPosix.join(pathPosix.dirname(sourcePath), specifier));
  const candidates = [
    basePath,
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];
  return candidates.find((candidate) => files.has(candidate)) || null;
}

function isAllowedEntryDependency(path: string, entryRoot: string): boolean {
  return path === entryRoot || path.startsWith(`${entryRoot}/`) || path.startsWith(`${LIGHT_EXTENSION_SHARED_ROOT}/`);
}

function relocateEntryPath(entryPath: string): string {
  return `${RUNJS_ENTRY_ROOT}/index${pathPosix.extname(normalizeWorkspacePath(entryPath))}`;
}

function withRunJSManifest(
  files: LightExtensionMoveSourceWorkspaceFile[],
  entryPath: string,
  runtimeVersion: string,
  surfaceStyle: string,
): LightExtensionMoveSourceWorkspaceFile[] {
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
  desiredFiles: LightExtensionMoveSourceWorkspaceFile[],
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

export function isMoveToInlineHostSupported(kind: string, modelUse: unknown): boolean {
  if (kind === 'runjs' || typeof modelUse !== 'string') {
    return false;
  }
  return getReferenceOwnerAdapterByUse(modelUse)?.kind === kind;
}

async function lockFlowModel(db: Database, modelUid: string, transaction: Transaction): Promise<void> {
  await db.getCollection('flowModels').model.findByPk(modelUid, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

async function getFlowModel(db: Database, modelUid: string, transaction: Transaction): Promise<JsonRecord> {
  const model = await getFlowModelRepository(db).findModelById(modelUid, {
    includeAsyncNode: true,
    transaction,
  });
  if (!model) {
    throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', `FlowModel "${modelUid}" was not found`, {
      status: 404,
    });
  }
  return model;
}

function getFlowModelRepository(db: Database): FlowModelRepositoryLike {
  return db.getCollection('flowModels').repository as unknown as FlowModelRepositoryLike;
}

function assertCurrentLightExtensionBinding(
  model: JsonRecord,
  locator: FlowModelStepLocator,
  input: Pick<LightExtensionMoveToInlineInput, 'repoId' | 'entryId' | 'kind'>,
): void {
  const sourceRoot = getAtPath(model, [
    'stepParams',
    locator.flowKey,
    locator.stepKey,
    ...locator.paramPath.slice(0, -1),
  ]);
  if (!isRecord(sourceRoot) || sourceRoot.sourceMode !== 'light-extension') {
    throw bindingOutdated(input);
  }
  const sourceBinding = sourceRoot.sourceBinding;
  if (!isLightExtensionBinding(sourceBinding)) {
    throw bindingOutdated(input);
  }
  if (
    sourceBinding.repoId !== input.repoId ||
    sourceBinding.entryId !== input.entryId ||
    sourceBinding.kind !== input.kind
  ) {
    throw bindingOutdated(input);
  }
}

async function setFlowModelSourceModeInline(
  db: Database,
  locator: FlowModelStepLocator,
  input: Pick<LightExtensionMoveToInlineInput, 'repoId' | 'entryId' | 'kind'>,
  transaction: Transaction,
): Promise<void> {
  const model = await getFlowModel(db, locator.modelUid, transaction);
  assertCurrentLightExtensionBinding(model, locator, input);
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
    throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS source repository identity mismatch', {
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

function isLightExtensionBinding(value: unknown): value is LightExtensionRuntimeSourceBinding {
  return (
    isRecord(value) &&
    value.type === 'light-extension-entry' &&
    typeof value.repoId === 'string' &&
    typeof value.entryId === 'string' &&
    typeof value.kind === 'string'
  );
}

function normalizeWorkspacePath(value: string): string {
  const normalized = pathPosix.normalize(String(value || '').trim()).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw invalidInput(`Invalid workspace path "${value}"`);
  }
  return normalized;
}

function isCodeFile(path: string): boolean {
  return CODE_EXTENSIONS.includes(pathPosix.extname(path).toLowerCase() as (typeof CODE_EXTENSIONS)[number]);
}

function getScriptKind(path: string): ts.ScriptKind {
  if (path.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }
  if (path.endsWith('.jsx')) {
    return ts.ScriptKind.JSX;
  }
  if (path.endsWith('.js')) {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function bindingOutdated(
  input: Pick<LightExtensionMoveToInlineInput, 'repoId' | 'entryId' | 'kind'>,
): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_BINDING_OUTDATED',
    'The RunJS source binding changed before it could be moved to inline code',
    {
      status: 409,
      details: input,
    },
  );
}

function unsupportedLocator(locator: RunJSSourceLocator): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'This RunJS source cannot be moved to inline code', {
    details: {
      locatorKind: locator.kind,
    },
  });
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message, { status: 400 });
}

function normalizeMoveToInlineError(error: unknown): unknown {
  if (!isVscError(error)) {
    return error;
  }
  if (error.code === 'PERMISSION_DENIED') {
    return new LightExtensionError('LIGHT_EXTENSION_PERMISSION_DENIED', 'RunJS source write permission is required', {
      details: error.details,
    });
  }
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS inline source could not be saved', {
    status: error.status,
    details: {
      sourceCode: error.code,
      ...(error.details || {}),
    },
  });
}
