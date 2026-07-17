/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import type {
  RunJSLegacySource,
  RunJSSourceAdapter,
  RunJSSourceAdapterContext,
  RunJSSourceAdapterRegistry,
  RunJSSourceLocator,
} from '@nocobase/plugin-vsc-file';
import { isVscError } from '@nocobase/plugin-vsc-file';
import type { RunJSExternalSourceBinding, RunJSRuntimeWriteResult } from '@nocobase/server';
import ts from 'typescript';
import { posix as pathPosix } from 'path';

import {
  LIGHT_EXTENSION_ENTRY_KEY_PATTERN,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import { createLightExtensionBaseTemplate } from '../../shared/default-template';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionEntryRecord,
  LightExtensionFileChange,
  LightExtensionMoveSourceInput,
  LightExtensionMoveSourceResult,
  LightExtensionMoveSourceWorkspaceFile,
  LightExtensionRuntimeSourceBinding,
} from '../../shared/types';
import { LightExtensionEntryService } from './LightExtensionEntryService';
import { LightExtensionFileService } from './LightExtensionFileService';
import { getReferenceOwnerAdapterByUse } from './ReferenceOwnerRegistry';
import type { ReferenceService } from './ReferenceService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import { LightExtensionRuntimeCompileService } from './LightExtensionRuntimeCompileService';

const RUNJS_MANIFEST_PATH = '.nocobase/runjs-source.json';
const INLINE_ENTRY_DESCRIPTOR_PATH = 'src/client/entry.json';
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const;
const RESOLVABLE_EXTENSIONS = [...CODE_EXTENSIONS, '.json'] as const;

const ENTRY_ROOTS: Record<LightExtensionKind, string> = {
  'js-block': 'src/client/js-blocks',
  'js-page': 'src/client/js-pages',
  'js-field': 'src/client/js-fields',
  'js-action': 'src/client/js-actions',
  'js-item': 'src/client/js-items',
  runjs: 'src/client/runjs',
};

export interface MoveSourceServiceContext extends LightExtensionServiceContext {
  adapterContext: RunJSSourceAdapterContext;
}

type AdapterRegistryProvider = () => RunJSSourceAdapterRegistry | null;

type ExternalBindingAdapter = RunJSSourceAdapter & {
  writeExternalBinding: (input: {
    locator: RunJSSourceLocator;
    binding: RunJSExternalSourceBinding;
    baseOwnerFingerprint: string;
    ctx: RunJSSourceAdapterContext;
  }) => Promise<RunJSRuntimeWriteResult> | RunJSRuntimeWriteResult;
};

export class MoveSourceService {
  constructor(
    private readonly db: Database,
    private readonly repoService: LightExtensionRepoService,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly runtimeCompileService: LightExtensionRuntimeCompileService,
    private readonly referenceService: ReferenceService,
    private readonly getAdapterRegistry: AdapterRegistryProvider,
  ) {}

  async moveSource(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
  ): Promise<LightExtensionMoveSourceResult> {
    try {
      return await this.db.sequelize.transaction((transaction) =>
        this.moveSourceInTransaction(input, ctx, transaction),
      );
    } catch (error) {
      throw normalizeMoveSourceError(error);
    }
  }

  private async moveSourceInTransaction(
    input: LightExtensionMoveSourceInput,
    ctx: MoveSourceServiceContext,
    transaction: Transaction,
  ): Promise<LightExtensionMoveSourceResult> {
    const registry = this.getAdapterRegistry();
    if (!registry) {
      throw new LightExtensionError('LIGHT_EXTENSION_RUNTIME_UNAVAILABLE', 'RunJS source service is unavailable');
    }

    const adapter = registry.require(input.locator.kind);
    if (!supportsExternalBinding(adapter)) {
      throw unsupportedLocator(input.locator);
    }

    const adapterContext: RunJSSourceAdapterContext = {
      ...ctx.adapterContext,
      transaction,
    };
    const serviceContext: LightExtensionServiceContext = {
      ...ctx,
      transaction,
    };

    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterContext });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterContext });
    assertOwnerFingerprint(input.expectedOwnerFingerprint, legacy.ownerFingerprint);

    const kind = resolveLightExtensionKind(input.locator, legacy);
    const category = resolveMovedEntryCategory(kind, legacy);
    const entryFiles = relocateRunJSWorkspace({
      files: input.files,
      entryPath: input.entryPath,
      kind,
      entryName: input.entryName,
      entryTitle: input.entryTitle,
      category,
    });
    const commitMessage = buildMoveCommitMessage(input);

    const repo =
      input.destination.type === 'new'
        ? await this.createDestinationRepo(input, entryFiles, commitMessage, serviceContext)
        : await this.updateDestinationRepo(
            input.destination.repoId,
            kind,
            input.entryName,
            entryFiles,
            commitMessage,
            serviceContext,
          );

    const entry = await this.requireEntry(repo.id, kind, input.entryName, serviceContext);
    const binding = buildSourceBinding(repo, entry, kind);
    const writeResult = await adapter.writeExternalBinding({
      locator: input.locator,
      binding: {
        sourceMode: 'light-extension',
        sourceBinding: { ...binding },
      },
      baseOwnerFingerprint: input.expectedOwnerFingerprint,
      ctx: adapterContext,
    });
    const ownerFingerprint =
      writeResult.ownerFingerprint || (await adapter.getFingerprint({ locator: input.locator, ctx: adapterContext }));

    await this.referenceService.syncFlowModelReferencesForNodeTree(
      {
        rootUid: getFlowModelUid(input.locator),
        action: 'lightExtensions.moveSource',
      },
      serviceContext,
    );

    return {
      repo,
      entry,
      binding,
      ownerFingerprint,
    };
  }

  private async createDestinationRepo(
    input: LightExtensionMoveSourceInput,
    entryFiles: LightExtensionFileChange[],
    commitMessage: string,
    ctx: LightExtensionServiceContext,
  ) {
    if (input.destination.type !== 'new') {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'New light extension destination is required');
    }

    const repo = await this.repoService.createRepo(
      {
        name: input.destination.name,
        title: input.destination.title,
        description: input.destination.description,
        initialFiles: [...createLightExtensionBaseTemplate(), ...entryFiles.map(toInitialTreeEntry)],
        message: commitMessage,
      },
      ctx,
    );
    if (!repo.headCommitId) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Created light extension has no source commit');
    }

    const compiled = await this.runtimeCompileService.compileCurrentRuntime(repo.id, repo.headCommitId, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-move-source',
    });
    return compiled.repo;
  }

  private async updateDestinationRepo(
    repoId: string,
    kind: LightExtensionKind,
    entryName: string,
    entryFiles: LightExtensionFileChange[],
    commitMessage: string,
    ctx: LightExtensionServiceContext,
  ) {
    await this.repoService.lockInternalRepoForUpdate(repoId, ctx);
    const current = await this.fileService.pull({ repoId, includeContent: 'none' }, ctx);
    const entryRoot = getEntryRoot(kind, entryName);
    if ((current.files || []).some((file) => file.path === entryRoot || file.path.startsWith(`${entryRoot}/`))) {
      throw entryConflict(repoId, kind, entryName);
    }

    const entries = await this.entryService.listEntries(repoId, ctx);
    if (entries.some((entry) => entry.kind === kind && entry.entryName === entryName)) {
      throw entryConflict(repoId, kind, entryName);
    }

    const saved = await this.runtimeCompileService.saveSource(
      {
        repoId,
        expectedHeadCommitId: current.commit?.id || null,
        message: commitMessage,
        files: entryFiles,
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-move-source',
      },
    );
    return saved.repo;
  }

  private async requireEntry(
    repoId: string,
    kind: LightExtensionKind,
    entryName: string,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionEntryRecord> {
    const entries = await this.entryService.listEntries(repoId, ctx);
    const entry = entries.find(
      (candidate) => candidate.kind === kind && candidate.entryName === entryName && candidate.healthStatus === 'ready',
    );
    if (!entry) {
      throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', 'Moved light extension entry was not created', {
        details: { repoId, kind, entryName },
      });
    }
    return entry;
  }
}

export function relocateRunJSWorkspace(input: {
  files: LightExtensionMoveSourceWorkspaceFile[];
  entryPath: string;
  kind: LightExtensionKind;
  entryName: string;
  entryTitle?: string | null;
  category?: string | null;
}): LightExtensionFileChange[] {
  if (!LIGHT_EXTENSION_ENTRY_KEY_PATTERN.test(input.entryName)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Entry name must be a lowercase slug');
  }

  const sourceFiles = input.files
    .map((file) => ({ ...file, path: normalizeWorkspacePath(file.path) }))
    .filter((file) => file.path !== RUNJS_MANIFEST_PATH);
  const normalizedEntryPath = normalizeWorkspacePath(input.entryPath);
  const entryFile = sourceFiles.find((file) => file.path === normalizedEntryPath);
  const entryExtension = pathPosix.extname(normalizedEntryPath).toLowerCase();
  if (!entryFile || !CODE_EXTENSIONS.includes(entryExtension as (typeof CODE_EXTENSIONS)[number])) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace entry file is invalid', {
      details: { entryPath: normalizedEntryPath },
    });
  }

  const sourceBasePath = pathPosix.dirname(normalizedEntryPath);
  const relocatableFiles = sourceFiles.filter(
    (file) => file.path !== `${sourceBasePath}/meta.json` && file.path !== `${sourceBasePath}/settings.json`,
  );
  const entryRoot = getEntryRoot(input.kind, input.entryName);
  const targetBySource = new Map<string, string>();
  const targetPaths = new Set<string>();

  for (const file of relocatableFiles) {
    const targetPath =
      file.path === normalizedEntryPath
        ? `${entryRoot}/index${entryExtension}`
        : file.path === INLINE_ENTRY_DESCRIPTOR_PATH
          ? `${entryRoot}/entry.json`
          : buildRelocatedPath(entryRoot, sourceBasePath, file.path);
    if (targetPaths.has(targetPath)) {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace files collide after relocation', {
        details: { path: targetPath },
      });
    }
    targetPaths.add(targetPath);
    targetBySource.set(file.path, targetPath);
  }

  const relocated = relocatableFiles.map<LightExtensionFileChange>((file) => {
    const targetPath = targetBySource.get(file.path);
    if (!targetPath) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS workspace relocation failed');
    }
    return {
      path: targetPath,
      content: rewriteRelativeImports(file.content, file.path, targetPath, targetBySource),
      language: file.language,
      mode: file.mode,
      operation: 'upsert',
    };
  });

  upsertEntryDescriptor(
    relocated,
    entryRoot,
    input.entryName,
    input.entryTitle?.trim() || null,
    input.category?.trim() || null,
  );

  return relocated;
}

export function rewriteRelativeImports(
  content: string,
  sourcePath: string,
  targetPath: string,
  targetBySource: Map<string, string>,
): string {
  if (!CODE_EXTENSIONS.includes(pathPosix.extname(sourcePath).toLowerCase() as (typeof CODE_EXTENSIONS)[number])) {
    return content;
  }

  const sourceFile = ts.createSourceFile(sourcePath, content, ts.ScriptTarget.Latest, true);
  const replacements: Array<{ start: number; end: number; value: string }> = [];
  const visit = (node: ts.Node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      if (specifier.startsWith('.')) {
        const importedSourcePath = resolveImportedSourcePath(sourcePath, specifier, targetBySource);
        const importedTargetPath = importedSourcePath ? targetBySource.get(importedSourcePath) : undefined;
        if (importedTargetPath) {
          replacements.push({
            start: node.moduleSpecifier.getStart(sourceFile) + 1,
            end: node.moduleSpecifier.getEnd() - 1,
            value: buildRelativeSpecifier(targetPath, importedTargetPath, specifier),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, replacement) =>
        `${current.slice(0, replacement.start)}${replacement.value}${current.slice(replacement.end)}`,
      content,
    );
}

function resolveImportedSourcePath(
  sourcePath: string,
  specifier: string,
  targetBySource: Map<string, string>,
): string | null {
  const basePath = normalizeWorkspacePath(pathPosix.join(pathPosix.dirname(sourcePath), specifier));
  const candidates = [
    basePath,
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}${extension}`),
    ...RESOLVABLE_EXTENSIONS.map((extension) => `${basePath}/index${extension}`),
  ];
  return candidates.find((candidate) => targetBySource.has(candidate)) || null;
}

function buildRelativeSpecifier(fromPath: string, toPath: string, originalSpecifier: string): string {
  let relative = pathPosix.relative(pathPosix.dirname(fromPath), toPath);
  if (!pathPosix.extname(originalSpecifier)) {
    const extension = pathPosix.extname(relative);
    if (CODE_EXTENSIONS.includes(extension as (typeof CODE_EXTENSIONS)[number])) {
      relative = relative.slice(0, -extension.length);
    }
  }
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function buildRelocatedPath(entryRoot: string, sourceBasePath: string, sourcePath: string): string {
  const relative = pathPosix.relative(sourceBasePath, sourcePath);
  if (relative && relative !== '..' && !relative.startsWith('../')) {
    return `${entryRoot}/${relative}`;
  }
  return `${entryRoot}/__workspace/${sourcePath}`;
}

function normalizeWorkspacePath(value: string): string {
  const normalized = pathPosix.normalize(String(value || '').trim()).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS workspace contains an invalid file path', {
      details: { path: value },
    });
  }
  return normalized;
}

function resolveLightExtensionKind(locator: RunJSSourceLocator, legacy: RunJSLegacySource): LightExtensionKind {
  if (locator.kind === 'flowModel.nestedRunJS') {
    if (legacy.surfaceStyle !== 'value') {
      throw unsupportedLocator(locator);
    }
    return 'runjs';
  }
  if (locator.kind !== 'flowModel.step') {
    throw unsupportedLocator(locator);
  }

  const modelUse = typeof legacy.metadata?.modelUse === 'string' ? legacy.metadata.modelUse : '';
  const ownerAdapter = getReferenceOwnerAdapterByUse(modelUse);
  if (!ownerAdapter || !(LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(ownerAdapter.kind)) {
    throw unsupportedLocator(locator, modelUse);
  }
  return ownerAdapter.kind;
}

function resolveMovedEntryCategory(kind: LightExtensionKind, legacy: RunJSLegacySource): string | null {
  if (kind !== 'js-field') {
    return null;
  }
  return legacy.metadata?.modelUse === 'JSColumnModel' ? 'js-column' : 'js-field';
}

function buildSourceBinding(
  repo: LightExtensionMoveSourceResult['repo'],
  entry: LightExtensionEntryRecord,
  kind: LightExtensionKind,
): LightExtensionRuntimeSourceBinding {
  return {
    type: 'light-extension-entry',
    repoId: repo.id,
    repoTitle: repo.title || repo.name,
    entryId: entry.id,
    entryTitle: entry.title || entry.entryName,
    entryName: entry.entryName,
    entryPath: entry.entryPath,
    kind,
  };
}

function getEntryRoot(kind: LightExtensionKind, entryName: string): string {
  return `${ENTRY_ROOTS[kind]}/${entryName}`;
}

function getFlowModelUid(locator: RunJSSourceLocator): string {
  if (locator.kind === 'flowModel.step' || locator.kind === 'flowModel.nestedRunJS') {
    return locator.modelUid;
  }
  throw unsupportedLocator(locator);
}

function assertOwnerFingerprint(expected: string, current: string): void {
  if (expected === current) {
    return;
  }
  throw new LightExtensionError(
    'LIGHT_EXTENSION_BINDING_OUTDATED',
    'RunJS source changed before it could be moved to a light extension',
    {
      details: {
        expectedOwnerFingerprint: expected,
        currentOwnerFingerprint: current,
      },
    },
  );
}

function entryConflict(repoId: string, kind: LightExtensionKind, entryName: string): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_ENTRY_CONFLICT',
    `Light extension entry "${entryName}" already exists`,
    {
      details: { repoId, kind, entryName },
    },
  );
}

function unsupportedLocator(locator: RunJSSourceLocator, modelUse?: string): LightExtensionError {
  return new LightExtensionError(
    'LIGHT_EXTENSION_INVALID_INPUT',
    'This RunJS source cannot be moved to a light extension',
    {
      details: { locatorKind: locator.kind, modelUse },
    },
  );
}

function buildMoveCommitMessage(input: LightExtensionMoveSourceInput): string {
  const sourceVersion = input.sourceHeadCommitId || 'working-copy';
  return `Move RunJS source ${input.sourceRepoId}@${sourceVersion} to ${input.entryName}`.slice(0, 200);
}

function toInitialTreeEntry(file: LightExtensionFileChange) {
  const { operation: _operation, ...entry } = file;
  return entry;
}

function upsertEntryDescriptor(
  files: LightExtensionFileChange[],
  entryRoot: string,
  key: string,
  title: string | null,
  category: string | null,
): void {
  const descriptorPath = `${entryRoot}/entry.json`;
  const existing = files.find((file) => file.path === descriptorPath);
  const sourceDescriptor = existing ? parseEntryDescriptor(existing.content, descriptorPath) : {};
  const descriptor: Record<string, unknown> = {
    schemaVersion: 1,
    key,
  };
  if (title) {
    descriptor.title = title;
  }
  if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'description')) {
    descriptor.description = sourceDescriptor.description;
  }
  if (category) {
    descriptor.category = category;
  } else if (Object.prototype.hasOwnProperty.call(sourceDescriptor, 'category')) {
    descriptor.category = sourceDescriptor.category;
  }
  for (const field of ['icon', 'tags', 'sort', 'settings'] as const) {
    if (Object.prototype.hasOwnProperty.call(sourceDescriptor, field)) {
      descriptor[field] = sourceDescriptor[field];
    }
  }
  const content = `${JSON.stringify(descriptor, null, 2)}\n`;
  if (!existing) {
    files.push({
      path: descriptorPath,
      content,
      language: 'json',
      operation: 'upsert',
    });
    return;
  }

  existing.content = content;
  existing.language = 'json';
  existing.operation = 'upsert';
}

function parseEntryDescriptor(content: string, path: string): Record<string, unknown> {
  let descriptor: unknown;
  try {
    descriptor = JSON.parse(content);
  } catch {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS entry descriptor is invalid JSON', {
      details: { path },
    });
  }
  if (!descriptor || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'RunJS entry descriptor must be a JSON object', {
      details: { path },
    });
  }
  return { ...(descriptor as Record<string, unknown>) };
}

function supportsExternalBinding(adapter: RunJSSourceAdapter): adapter is ExternalBindingAdapter {
  return typeof (adapter as { writeExternalBinding?: unknown }).writeExternalBinding === 'function';
}

function normalizeMoveSourceError(error: unknown): unknown {
  if (!isVscError(error)) {
    return error;
  }
  if (error.code === 'RUNJS_SOURCE_OWNER_OUTDATED') {
    return new LightExtensionError(
      'LIGHT_EXTENSION_BINDING_OUTDATED',
      'RunJS source changed before it could be moved to a light extension',
      { details: error.details },
    );
  }
  if (error.code === 'PERMISSION_DENIED') {
    return new LightExtensionError('LIGHT_EXTENSION_PERMISSION_DENIED', 'RunJS source write permission is required', {
      details: error.details,
    });
  }
  return new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'RunJS source could not be moved', {
    status: error.status,
    details: {
      sourceCode: error.code,
      ...(error.details || {}),
    },
  });
}
