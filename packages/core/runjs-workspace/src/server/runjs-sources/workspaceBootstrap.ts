/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';

import { VscError, isVscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath } from '../../shared/path';
import { defaultRunJSEntryPath, runJSManifestPath } from '../../shared/runjs-workspace-path';
import {
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSLegacySource,
  type RunJSSourceAdapterContext,
  type RunJSSourceKind,
  type RunJSSourceSaveInput,
} from '../../shared/runjs-source-types';
import type {
  VscCommitRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscTreeEntryInput,
} from '../../shared/types';
import type { VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import {
  assertRepositoryMatchesIdentity,
  assertRunJSCompileInputLimits,
  assertRunJSCompileSucceeded,
  createRunJSSourceAuthoringInspector,
  legacyAuthoringInfo,
  materializeRunJSCompileFiles,
} from './compileMaterialization';
import { compileRunJSSourceWorkspace } from './lazyCompiler';
import { selectEntryPath } from './workspaceZip';

export const inlineRunJSEntryDescriptorPath = 'src/client/entry.json';
const emptyRunJSRenderSource = 'ctx.render(null);';
const emptyRunJSActionSource = 'return;';

export const RUNJS_WORKSPACE_HOSTS = {
  JSPageModel: 'js-page',
  JSBlockModel: 'js-block',
  JSFieldModel: 'js-field',
  JSEditableFieldModel: 'js-editable-field',
  JSColumnModel: 'js-column',
  JSItemModel: 'js-item',
  JSItemActionModel: 'js-item-action',
  JSActionModel: 'js-action',
  JSRecordActionModel: 'js-record-action',
  JSCollectionActionModel: 'js-collection-action',
  JSFormActionModel: 'js-form-action',
  FilterFormJSActionModel: 'filter-form-js-action',
} as const;

export type RunJSWorkspaceModelUse = keyof typeof RUNJS_WORKSPACE_HOSTS;
export type RunJSWorkspaceHostKind = (typeof RUNJS_WORKSPACE_HOSTS)[RunJSWorkspaceModelUse];

export interface RunJSWorkspaceBootstrapInput {
  hostKind: RunJSWorkspaceHostKind;
  modelUse: RunJSWorkspaceModelUse;
  locator: unknown;
  transaction: Transaction;
  authoringContext: Partial<
    Pick<RunJSSourceAdapterContext, 'userId' | 'request' | 'state' | 'currentUser' | 'timezone' | 'can'>
  >;
}

export interface RunJSWorkspaceBootstrapResult {
  status: 'ready' | 'pending' | 'error';
  retryable: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export type RunJSWorkspaceBootstrapPort = (
  input: RunJSWorkspaceBootstrapInput,
) => Promise<RunJSWorkspaceBootstrapResult>;

export function createFlowSurfaceRunJSWorkspaceBootstrapPort(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks?: VscPermissionHookRegistry,
  authoringInspectors?: RunJSSourceAuthoringInspectorRegistry,
): RunJSWorkspaceBootstrapPort {
  return async (input) => {
    try {
      await db.sequelize.transaction({ transaction: input.transaction }, async (transaction) => {
        await bootstrapFlowSurfaceRunJSWorkspace(db, registry, permissionHooks, authoringInspectors, {
          ...input,
          transaction,
        });
      });
    } catch (error) {
      return buildFlowSurfaceRunJSWorkspaceBootstrapFailure(error);
    }

    return {
      status: 'ready',
      retryable: false,
    };
  };
}

function buildFlowSurfaceRunJSWorkspaceBootstrapFailure(
  error: unknown,
): Awaited<ReturnType<RunJSWorkspaceBootstrapPort>> {
  if (isVscError(error)) {
    const retryable = error.status === 409 || error.status >= 500;
    return {
      status: retryable ? 'pending' : 'error',
      retryable,
      error: {
        code: error.code,
        message: error.message,
      },
    };
  }

  return {
    status: 'pending',
    retryable: true,
    error: {
      code: 'FLOW_SURFACE_RUNJS_BOOTSTRAP_FAILED',
      message: error instanceof Error && error.message ? error.message : 'RunJS workspace bootstrap failed',
    },
  };
}

async function bootstrapFlowSurfaceRunJSWorkspace(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  authoringInspectors: RunJSSourceAuthoringInspectorRegistry | undefined,
  input: RunJSWorkspaceBootstrapInput,
): Promise<void> {
  const locator = normalizeRunJSSourceLocator(input.locator);
  const adapter = registry.require(locator.kind);
  const service = new VscFileService(db, permissionHooks);
  const adapterCtx = createBootstrapAdapterContext(input);
  const serviceCtx = createServiceContext(adapterCtx, input.transaction);

  await adapter.assertCanWrite({ locator, ctx: adapterCtx });
  const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
  assertBootstrapHostMatches(input, legacy);
  await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);

  const repositoryIdentity = buildRunJSSourceRepositoryIdentity(locator);
  let repository = await findRunJSRepositoryByIdentity(db, service, repositoryIdentity, serviceCtx);
  let initialFiles: VscTreeEntryInput[] | undefined;
  let missingFiles: VscFileChange[];
  let compileFiles: VscFileChange[];
  if (!repository) {
    initialFiles = buildRunJSBootstrapInitialFiles(input.hostKind, locator, legacy);
    missingFiles = [];
    compileFiles = initialFiles.map((file) => ({
      ...file,
      operation: 'upsert',
    }));
  } else {
    repository = await service.getRepositoryForUpdate({ repoId: repository.id }, serviceCtx);
    assertRepositoryMatchesIdentity(repository, repositoryIdentity, locator.kind);
    const head = await service.pull({ repoId: repository.id, ref: 'head', includeContent: 'all' }, serviceCtx);
    missingFiles = buildMissingRunJSBootstrapFiles(input.hostKind, locator, legacy, head.files || []);
    compileFiles = await materializeRunJSCompileFiles(
      db,
      repository.id,
      repository.headCommitId,
      { files: missingFiles },
      serviceCtx,
    );
  }

  const entryPath = selectEntryPath(compileFiles, defaultRunJSEntryPath);
  assertRunJSCompileInputLimits(compileFiles);
  const compiled = await compileRunJSSourceWorkspace({
    files: compileFiles,
    entry: entryPath,
    runtimeVersion: legacy.version,
    surfaceStyle: legacy.surfaceStyle,
    locator,
    legacy: legacyAuthoringInfo(legacy),
    inspectAuthoring: createRunJSSourceAuthoringInspector(authoringInspectors),
  });
  assertRunJSCompileSucceeded(compiled);

  if (!repository) {
    const ensured = await service.ensureRepository(
      {
        ...repositoryIdentity,
        initialFiles,
        message: 'Initialize RunJS workspace',
        authorId: serviceCtx.authorId,
        metadata: buildRunJSBootstrapCommitMetadata(locator.kind, legacy, initialFiles),
      },
      serviceCtx,
    );
    repository = ensured.repository;
  }

  const artifact = compiled.artifact;
  const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
  artifact.metadata = {
    ...artifact.metadata,
    repoId: repository.id,
    runtimeCodeHash,
  };
  const saveMetadata = {
    sourceKind: locator.kind,
    ownerFingerprint: legacy.ownerFingerprint,
    filesHash: artifact.filesHash,
    entry: artifact.entryPath || entryPath,
    runtimeVersion: artifact.version,
    surfaceStyle: legacy.surfaceStyle,
    runtimeCodeHash,
  };
  let commit: VscCommitRecord;
  if (missingFiles.length) {
    const pushResult = await pushRunJSSourceCommit(
      service,
      {
        repoId: repository.id,
        baseCommitId: repository.headCommitId,
        message: 'Complete RunJS workspace initialization',
        files: missingFiles,
        authorId: serviceCtx.authorId,
        metadata: saveMetadata,
      },
      serviceCtx,
    );
    repository = pushResult.repository;
    commit = pushResult.commit;
  } else {
    if (!repository.headCommitId) {
      throw new VscError('INTERNAL_ERROR', 'RunJS workspace bootstrap did not persist a repository Head');
    }
    commit = await service.getCommit({ repoId: repository.id, commitId: repository.headCommitId }, serviceCtx);
  }

  await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);
  await adapter.writeRuntime({
    locator,
    artifact,
    commitId: commit.id,
    baseOwnerFingerprint: legacy.ownerFingerprint,
    ctx: adapterCtx,
  });
  const nextOwnerFingerprint = await adapter.getFingerprint({ locator, ctx: adapterCtx });
  await updateRunJSCommitMetadata(
    db,
    commit,
    {
      ...saveMetadata,
      ownerFingerprint: nextOwnerFingerprint,
    },
    input.transaction,
  );
}

function createBootstrapAdapterContext(input: RunJSWorkspaceBootstrapInput): RunJSSourceAdapterContext {
  const authoringContext = input.authoringContext;
  return {
    ...authoringContext,
    request: {
      ...(authoringContext.request || {}),
      resourceName: 'runJSSources',
      actionName: 'bootstrap',
    },
    transaction: input.transaction,
  };
}

function assertBootstrapHostMatches(
  input: Pick<RunJSWorkspaceBootstrapInput, 'hostKind' | 'modelUse'>,
  legacy: RunJSLegacySource,
): void {
  const expectedHostKind = RUNJS_WORKSPACE_HOSTS[input.modelUse];
  if (input.hostKind === expectedHostKind && legacy.metadata?.modelUse === input.modelUse) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS workspace bootstrap expected ${input.modelUse}`, {
    details: {
      hostKind: input.hostKind,
      expectedHostKind,
      expectedModelUse: input.modelUse,
      modelUse: legacy.metadata?.modelUse,
    },
  });
}

function buildRunJSBootstrapInitialFiles(
  hostKind: RunJSWorkspaceBootstrapInput['hostKind'],
  locator: RunJSSourceSaveInput['locator'],
  legacy: RunJSLegacySource,
): VscTreeEntryInput[] {
  const source = legacy.code.trim()
    ? legacy.code
    : legacy.surfaceStyle === 'action'
      ? emptyRunJSActionSource
      : emptyRunJSRenderSource;
  return [
    {
      path: defaultRunJSEntryPath,
      content: source,
      language: legacy.language,
    },
    runJSManifestFile(defaultRunJSEntryPath, legacy.version, legacy.surfaceStyle),
    buildRunJSEntryDescriptorFile(hostKind, locator),
  ];
}

function buildMissingRunJSBootstrapFiles(
  hostKind: RunJSWorkspaceBootstrapInput['hostKind'],
  locator: RunJSSourceSaveInput['locator'],
  legacy: RunJSLegacySource,
  existingFiles: PulledFile[],
): VscFileChange[] {
  const existingPaths = new Set(existingFiles.map((file) => normalizePath(file.path)));
  return buildRunJSBootstrapInitialFiles(hostKind, locator, legacy)
    .filter((file) => !existingPaths.has(normalizePath(file.path)))
    .map((file) => ({
      ...file,
      operation: 'upsert' as const,
    }));
}

function buildRunJSEntryDescriptorFile(
  hostKind: RunJSWorkspaceBootstrapInput['hostKind'],
  locator: RunJSSourceSaveInput['locator'],
): VscTreeEntryInput {
  const ownerId = buildRunJSSourceRepositoryIdentity(locator).ownerId;
  const descriptorKey = `inline-${hostKind}-${sha256Hex(ownerId).slice(0, 16)}`;
  return {
    path: inlineRunJSEntryDescriptorPath,
    content: `${JSON.stringify({ schemaVersion: 1, key: descriptorKey }, null, 2)}\n`,
    language: 'json',
  };
}

function buildRunJSBootstrapCommitMetadata(
  sourceKind: RunJSSourceKind,
  legacy: RunJSLegacySource,
  files: VscTreeEntryInput[],
): Record<string, unknown> {
  return {
    sourceKind,
    ownerFingerprint: legacy.ownerFingerprint,
    entry: defaultRunJSEntryPath,
    runtimeVersion: legacy.version,
    surfaceStyle: legacy.surfaceStyle,
    runtimeCodeHash: buildRunJSRuntimeCodeHash(String(files[0]?.content || '')),
  };
}

export async function pushRunJSSourceCommit(
  service: VscFileService,
  input: Parameters<VscFileService['push']>[0],
  serviceCtx: VscServiceContext,
) {
  try {
    return await service.push(input, serviceCtx);
  } catch (error) {
    if (isVscError(error) && error.code === 'NO_CHANGES') {
      throw new VscError('RUNJS_SAVE_NO_CHANGES', 'RunJS source has no changes to save');
    }
    throw error;
  }
}

export function createServiceContext(
  adapterCtx: RunJSSourceAdapterContext,
  transaction: VscServiceContext['transaction'],
): VscServiceContext {
  return {
    authorId: adapterCtx.userId,
    request: adapterCtx.request as VscPermissionRequestMetadata | undefined,
    transaction,
  };
}

export async function findRunJSRepositoryByIdentity(
  db: Database,
  service: VscFileService,
  identity: VscRepositoryIdentity,
  serviceCtx: VscServiceContext,
): Promise<VscRepositoryRecord | null> {
  const record = await db.getRepository('vscFileRepositories').findOne({
    filter: {
      ownerType: identity.ownerType,
      ownerId: identity.ownerId,
      name: identity.name,
    },
    fields: ['id'],
    transaction: serviceCtx.transaction,
  });
  const repoId = record?.get('id');

  if (typeof repoId !== 'string' || !repoId) {
    return null;
  }

  return service.getRepository({ repoId }, serviceCtx);
}

export function runJSManifestFile(
  entry: string,
  runtimeVersion: string,
  surfaceStyle: RunJSLegacySource['surfaceStyle'],
  files: VscFileChange[] = [],
): VscTreeEntryInput {
  return {
    path: runJSManifestPath,
    content: `${JSON.stringify(defaultRunJSManifest(entry, runtimeVersion, surfaceStyle, files), null, 2)}\n`,
    language: 'json',
  };
}

function defaultRunJSManifest(
  entry: string,
  runtimeVersion: string,
  surfaceStyle: RunJSLegacySource['surfaceStyle'],
  files: VscFileChange[] = [],
): Record<string, unknown> {
  const manifest: Record<string, unknown> = {
    schemaVersion: 1,
    entry,
    runtimeVersion,
    surfaceStyle,
    compiler: {
      module: 'virtual-esm',
      jsx: true,
    },
  };
  const folders = readRunJSManifestFoldersFromChanges(files);
  if (folders.length) {
    manifest.folders = folders;
  }

  return manifest;
}

function readRunJSManifestFoldersFromChanges(files: VscFileChange[]): string[] {
  const manifest = files.find((file) => normalizePath(file.path) === runJSManifestPath);
  if (!manifest || typeof manifest.content !== 'string' || !manifest.content.trim()) {
    return [];
  }

  try {
    const value = JSON.parse(manifest.content) as Record<string, unknown>;
    if (!Array.isArray(value.folders)) {
      return [];
    }

    const folders = new Set<string>();
    for (const folder of value.folders) {
      if (typeof folder !== 'string') {
        continue;
      }
      const normalized = normalizeRunJSWorkspaceFolderPath(folder);
      if (normalized) {
        folders.add(normalized);
      }
    }

    return Array.from(folders).sort((left, right) => left.localeCompare(right));
  } catch (_) {
    return [];
  }
}

function normalizeRunJSWorkspaceFolderPath(path: string): string | null {
  try {
    const normalized = normalizePath(path.trim().replace(/\/+$/, ''));
    if (normalized !== 'src' && !normalized.startsWith('src/')) {
      return null;
    }
    if (normalized.split('/').some((segment) => segment.startsWith('.'))) {
      return null;
    }
    return normalized;
  } catch (_) {
    return null;
  }
}

export async function assertCurrentOwnerFingerprint(
  adapter: ReturnType<RunJSSourceAdapterRegistry['require']>,
  locator: RunJSSourceSaveInput['locator'],
  ctx: RunJSSourceAdapterContext,
  baseOwnerFingerprint: string,
): Promise<void> {
  const currentFingerprint = await adapter.getFingerprint({
    locator,
    ctx,
  });
  if (currentFingerprint === baseOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS host code differs from the versioned source', {
    details: {
      expected: currentFingerprint,
      received: baseOwnerFingerprint,
      kind: locator.kind,
    },
  });
}

export async function updateRunJSCommitMetadata(
  db: Database,
  commit: VscCommitRecord,
  metadata: Record<string, unknown>,
  transaction: VscServiceContext['transaction'],
): Promise<VscCommitRecord> {
  const nextMetadata = {
    ...commit.metadata,
    ...metadata,
  };
  const hash = sha256Hex(
    [
      commit.repoId,
      String(commit.seq),
      commit.parentCommitId || '',
      commit.treeHash,
      commit.message,
      commit.authorId || '',
      JSON.stringify(nextMetadata),
    ].join('\0'),
  );

  await db.getRepository('vscFileCommits').update({
    filterByTk: commit.id,
    values: {
      hash,
      metadata: nextMetadata,
    },
    transaction,
  });

  return {
    ...commit,
    hash,
    metadata: nextMetadata,
  };
}
