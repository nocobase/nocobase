/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database, Transaction } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';
import JSZip, { type JSZipObject } from 'jszip';
import type { Readable } from 'stream';
import { TextDecoder } from 'util';

import { VscError, isVscError, type RunJSCompileFailedDetails } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import {
  defaultRunJSEntryPath,
  resolveRunJSWorkspaceEntryPath,
  runJSManifestPath,
  validateRunJSWorkspacePathValue,
} from '../../shared/runjs-workspace-path';
import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import { runJSSourceRequestActionNames } from '../../shared/runjs-source-contracts';
import {
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSLegacySource,
  type RunJSSourceCompilePreviewInput,
  type RunJSSourceCompilePreviewResult,
  type RunJSSourceDiffInput,
  type RunJSSourceDiffResult,
  type RunJSSourceExportZipInput,
  type RunJSSourceGetVersionInput,
  type RunJSSourceHistoryInput,
  type RunJSSourceHistoryResult,
  type RunJSSourceInitialSource,
  type RunJSSourceImportZipInput,
  type RunJSSourceImportZipResult,
  type RunJSSourceAdapterContext,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceKind,
  type RunJSSourcePermissionResult,
  type RunJSSourcePermissionCheck,
  type RunJSSourceOpenResult,
  type RunJSSourceOpenSettingsDescriptor,
  type RunJSSourceRepositoryRecord,
  type RunJSSourceRequestActionName,
  type RunJSSourceFileChange,
  type RunJSSourceSaveChangesInput,
  type RunJSSourceSaveInput,
  type RunJSSourceSaveResult,
  type RunJSSourceVersionResult,
  type RunJSSourceWorkspaceFile,
} from '../../shared/runjs-source-types';
import type {
  VscCommitRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscTreeEntryInput,
} from '../../shared/types';
import { normalizeText } from '../../shared/text';
import type { VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';
import type { RunJSAuthoringCapabilityRegistry } from './RunJSAuthoringCapabilityRegistry';
import { createRunJSAuthoringCapabilities } from '../../shared/authoring-contract';
import { canonicalizeRunJSCompileFile } from './canonicalCompileFiles';
import { compileRunJSSourceWorkspace } from './lazyCompiler';
import { buildRunJSWorkspaceSettingsHashes, parseRunJSWorkspaceSettingsDescriptor } from './settingsDescriptor';
import type { CompileRunJSSourceWorkspaceResult } from '@nocobase/runjs/compiler';

const inlineRunJSEntryDescriptorPath = 'src/client/entry.json';
const emptyRunJSRenderSource = 'ctx.render(null);';
const emptyRunJSActionSource = 'return;';
const maxZipCompressionRatio = 20;

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

export const runJSSourceActionNames = ['capabilities', ...runJSSourceRequestActionNames] as const;

type RunJSSourceActionName = (typeof runJSSourceActionNames)[number];
type RunJSSourceWorkspaceActionName = RunJSSourceRequestActionName;

type ResourceActionInput = Record<string, unknown>;

type RunJSSourceResourceContext = Context & {
  action?: {
    params?: unknown;
    resourceName?: string;
    actionName?: string;
  };
  auth?: {
    user?: unknown;
  };
  request?: {
    path?: string;
    method?: string;
    header?: Record<string, string | string[] | undefined>;
    headers?: Record<string, string | string[] | undefined>;
  };
  dataSource?: {
    name?: unknown;
  };
  state?: Record<string, unknown>;
  can?: (options: RunJSSourcePermissionCheck) => unknown;
  withoutDataWrapping?: boolean;
  type?: string;
  status?: number;
  body?: unknown;
  set?: (name: string, value: string) => void;
};

type RunJSSourceActionRunner = (
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  authoringInspectors: RunJSSourceAuthoringInspectorRegistry | undefined,
  input: ResourceActionInput,
  ctx: RunJSSourceResourceContext,
) => Promise<unknown>;

const actionRunners: Record<RunJSSourceWorkspaceActionName, RunJSSourceActionRunner> = {
  open: async (db, registry, permissionHooks, _authoringInspectors, input, ctx): Promise<RunJSSourceOpenResult> => {
    return openRunJSWorkspace(db, registry, permissionHooks, input, ctx, {
      assertHeadOwnerFingerprint: true,
      ensureRepository: true,
    });
  },
  openLatest: async (
    db,
    registry,
    permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceOpenResult> => {
    return openRunJSWorkspace(db, registry, permissionHooks, input, ctx, {
      assertHeadOwnerFingerprint: false,
      ensureRepository: false,
    });
  },
  restoreFromCode: async (
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceOpenResult> => {
    return writeRunJSSource(db, registry, permissionHooks, authoringInspectors, ctx, {
      locator: normalizeRunJSSourceLocator(input.locator),
      message: 'Recover RunJS source from current code',
      source: 'runtime',
      allowEmptyCommit: true,
    }) as Promise<RunJSSourceOpenResult>;
  },
  compilePreview: async (
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceCompilePreviewResult> => {
    const previewInput = normalizeCompilePreviewInput(input);
    const adapter = registry.require(previewInput.locator.kind);
    const adapterCtx = createAdapterContext(ctx);

    await adapter.assertCanRead({ locator: previewInput.locator, ctx: adapterCtx });
    const legacy = await adapter.readLegacy({ locator: previewInput.locator, ctx: adapterCtx });
    const compileFiles = previewInput.repoId
      ? await materializeCompilePreviewFiles(
          db,
          new VscFileService(db, permissionHooks),
          previewInput,
          createServiceContext(adapterCtx, undefined),
        )
      : previewInput.files;
    assertRunJSCompileInputLimits(compileFiles);
    const compiled = await compileRunJSSourceWorkspace({
      files: compileFiles,
      entry: selectEntryPath(compileFiles, previewInput.entryPath),
      runtimeVersion: previewInput.version || legacy.version,
      surfaceStyle: legacy.surfaceStyle,
      locator: previewInput.locator,
      legacy: legacyAuthoringInfo(legacy),
      inspectAuthoring: createRunJSSourceAuthoringInspector(authoringInspectors),
    });

    return {
      locator: previewInput.locator,
      locatorKind: previewInput.locator.kind,
      artifact: compiled.artifact,
    };
  },
  // Published snapshot compatibility alias; both Save actions share writeRunJSSource and its single transaction.
  save: async (db, registry, permissionHooks, authoringInspectors, input, ctx): Promise<RunJSSourceSaveResult> => {
    const saveInput = normalizeSaveInput(input);
    return writeRunJSSource(db, registry, permissionHooks, authoringInspectors, ctx, {
      ...saveInput,
      source: 'snapshot',
    }) as Promise<RunJSSourceSaveResult>;
  },
  saveChanges: async (
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceSaveResult> => {
    const saveInput = normalizeSaveChangesInput(input);
    return writeRunJSSource(db, registry, permissionHooks, authoringInspectors, ctx, {
      ...saveInput,
      source: 'delta',
    }) as Promise<RunJSSourceSaveResult>;
  },
  exportZip: async (db, registry, permissionHooks, _authoringInspectors, input, ctx): Promise<Buffer> => {
    const exportInput = normalizeExportZipInput(input);
    const adapter = registry.require(exportInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: exportInput.locator, ctx: adapterCtx });
      const legacy = await adapter.readLegacy({ locator: exportInput.locator, ctx: adapterCtx });
      const repository = exportInput.repoId
        ? await getRunJSRepository(service, exportInput.repoId, exportInput.locator, serviceCtx)
        : await findRunJSRepositoryByIdentity(
            db,
            service,
            buildRunJSSourceRepositoryIdentity(exportInput.locator),
            serviceCtx,
          );
      const commitId = exportInput.commitId || repository?.headCommitId;
      const files =
        repository && commitId
          ? (
              await service.pullCommit(
                {
                  repoId: repository.id,
                  commitId,
                  includeContent: 'all',
                },
                serviceCtx,
              )
            ).files || []
          : createLegacyWorkspaceFiles(legacy);
      const buffer = await createRunJSWorkspaceZip(ensureRunJSManifestFiles(legacy, files));

      ctx.withoutDataWrapping = true;
      ctx.type = 'application/zip';
      ctx.set?.('Content-Type', 'application/zip');
      ctx.set?.('Content-Disposition', `attachment; filename="${buildRunJSZipFileName(legacy)}"`);

      return buffer;
    });
  },
  importZip: async (
    _db,
    registry,
    _permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceImportZipResult> => {
    const importInput = normalizeImportZipInput(input);
    const adapter = registry.require(importInput.locator.kind);
    await adapter.assertCanWrite({ locator: importInput.locator, ctx: createAdapterContext(ctx) });
    const files = await readRunJSWorkspaceZip(importInput.zipBase64);
    const manifest = readRunJSWorkspaceManifest(files);

    return {
      locator: importInput.locator,
      locatorKind: importInput.locator.kind,
      files: files.map((file) => ({
        path: file.path,
        content: typeof file.content === 'string' ? file.content : '',
        ...(file.language ? { language: file.language } : {}),
        ...(file.mode ? { mode: file.mode } : {}),
      })),
      manifest: {
        entryPath: manifest.entryPath || null,
        runtimeVersion: manifest.version || null,
      },
      entryPath: selectEntryPath(files, manifest.entryPath),
      fileCount: files.length,
      diagnostics: [],
    };
  },
  listHistory: async (
    db,
    registry,
    permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceHistoryResult> => {
    const historyInput = normalizeHistoryInput(input);
    const adapter = registry.require(historyInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: historyInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, historyInput.repoId, historyInput.locator, serviceCtx);
      const commits = await service.listCommits(
        {
          repoId: repository.id,
          limit: historyInput.limit,
          beforeSeq: historyInput.beforeSeq,
        },
        serviceCtx,
      );
      const items = commits;

      return {
        locator: historyInput.locator,
        locatorKind: historyInput.locator.kind,
        repository: serializeRepository(repository),
        items,
        nextBeforeSeq: items.length ? items[items.length - 1].seq : null,
      };
    });
  },
  diff: async (db, registry, permissionHooks, _authoringInspectors, input, ctx): Promise<RunJSSourceDiffResult> => {
    const diffInput = normalizeDiffInput(input);
    const adapter = registry.require(diffInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: diffInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, diffInput.repoId, diffInput.locator, serviceCtx);
      const diff = await service.diff(
        {
          repoId: repository.id,
          fromCommitId: diffInput.fromCommitId,
          toCommitId: diffInput.toCommitId,
        },
        serviceCtx,
      );

      return {
        locator: diffInput.locator,
        locatorKind: diffInput.locator.kind,
        repository: serializeRepository(repository),
        fromCommitId: diffInput.fromCommitId,
        toCommitId: diffInput.toCommitId,
        ...diff,
      };
    });
  },
  getVersion: async (
    db,
    registry,
    permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceVersionResult> => {
    const versionInput = normalizeGetVersionInput(input);
    const adapter = registry.require(versionInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: versionInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, versionInput.repoId, versionInput.locator, serviceCtx);
      const commit = await service.getCommit({ repoId: repository.id, commitId: versionInput.commitId }, serviceCtx);
      const pull = versionInput.includeFiles
        ? await service.pullCommit({ repoId: repository.id, commitId: commit.id, includeContent: 'all' }, serviceCtx)
        : null;

      return {
        locator: versionInput.locator,
        locatorKind: versionInput.locator.kind,
        repository: serializeRepository(repository),
        commit,
        files: pull?.files || [],
      };
    });
  },
};

async function writeRunJSSource(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  authoringInspectors: RunJSSourceAuthoringInspectorRegistry | undefined,
  ctx: RunJSSourceResourceContext,
  input: RunJSSourceWriteInput,
): Promise<RunJSSourceSaveResult | RunJSSourceOpenResult> {
  const adapter = registry.require(input.locator.kind);
  const service = new VscFileService(db, permissionHooks);

  if (input.repoId) {
    const preflightCtx = createAdapterContext(ctx);
    await service.getRepository({ repoId: input.repoId }, createServiceContext(preflightCtx, undefined));
  }

  return db.sequelize.transaction(async (transaction) => {
    const adapterCtx = createAdapterContext(ctx, transaction);
    const serviceCtx = createServiceContext(adapterCtx, transaction);
    const repositoryIdentity = buildRunJSSourceRepositoryIdentity(input.locator);

    await adapter.assertCanWrite({ locator: input.locator, ctx: adapterCtx });
    const legacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterCtx });
    const repoId = await resolveRunJSSourceWriteRepositoryId(service, repositoryIdentity, legacy, input, serviceCtx);
    const repository = await service.getRepositoryForUpdate({ repoId }, serviceCtx);
    assertRepositoryMatchesIdentity(repository, repositoryIdentity, input.locator.kind);

    if (input.source !== 'runtime') {
      assertBaseCommitMatches(input.baseCommitId, repository.headCommitId);
      const headOwnerFingerprint = await getHeadOwnerFingerprintForRepository(service, repository, serviceCtx);
      assertBaseOwnerFingerprintMatches(
        input.baseOwnerFingerprint,
        headOwnerFingerprint,
        legacy.ownerFingerprint,
        input.locator.kind,
      );
    }
    await assertCurrentOwnerFingerprint(adapter, input.locator, adapterCtx, legacy.ownerFingerprint);

    const baseCommitId = repository.headCommitId;
    const baseFiles = baseCommitId ? await loadCommitFilesForCompile(db, repository.id, baseCommitId, transaction) : [];
    const changes =
      input.source === 'snapshot'
        ? buildOverwriteRunJSFileDelta(baseFiles, input.files)
        : input.source === 'delta'
          ? input.changes
          : legacyToRuntimeFileChanges(legacy, baseFiles);
    assertIncrementalRunJSFileChanges(baseFiles, changes);

    const candidateWithoutManifest = await materializeRunJSCompileFiles(
      db,
      repository.id,
      baseCommitId,
      { files: changes },
      serviceCtx,
    );
    const preferredEntryPath =
      input.source === 'snapshot' ? input.entryPath || readRunJSWorkspaceManifestEntry(input.files) : input.entryPath;
    const entryPath =
      input.source === 'runtime'
        ? resolveLegacyEntryPath(legacy)
        : selectEntryPath(candidateWithoutManifest, preferredEntryPath);
    const runtimeVersion = input.source === 'runtime' ? legacy.version : input.version || legacy.version;
    const manifestSource =
      input.source === 'snapshot' ? input.files : input.source === 'delta' ? candidateWithoutManifest : [];
    const manifestChange: RunJSSourceFileChange = {
      ...runJSManifestFileChange(entryPath, runtimeVersion, legacy.surfaceStyle, manifestSource),
      operation: 'upsert',
      expectedBlobHash: baseFiles.find((file) => normalizePath(file.path) === runJSManifestPath)?.blobHash || null,
    };
    const saveFiles = [...changes, manifestChange];
    const compileFiles = withRunJSManifestChange(candidateWithoutManifest, manifestChange).sort((left, right) =>
      left.path.localeCompare(right.path),
    );
    assertRunJSCompileInputLimits(compileFiles);
    const compiled = await compileRunJSSourceWorkspace({
      files: compileFiles,
      entry: entryPath,
      runtimeVersion,
      surfaceStyle: legacy.surfaceStyle,
      locator: input.locator,
      legacy: legacyAuthoringInfo(legacy),
      inspectAuthoring: createRunJSSourceAuthoringInspector(authoringInspectors),
    });
    assertRunJSCompileSucceeded(compiled);

    const artifact = compiled.artifact;
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(artifact.code);
    artifact.metadata = {
      ...artifact.metadata,
      repoId: repository.id,
      runtimeCodeHash,
    };
    const saveMetadata = {
      sourceKind: input.locator.kind,
      ownerFingerprint: legacy.ownerFingerprint,
      filesHash: artifact.filesHash,
      entry: artifact.entryPath || null,
      runtimeVersion: artifact.version,
      surfaceStyle: legacy.surfaceStyle,
      runtimeCodeHash,
    };
    const pushResult = await pushRunJSSourceCommit(
      service,
      {
        repoId: repository.id,
        baseCommitId,
        message: input.message,
        files: saveFiles,
        allowEmptyCommit: input.allowEmptyCommit,
        authorId: adapterCtx.userId,
        metadata: saveMetadata,
      },
      serviceCtx,
    );
    await assertCurrentOwnerFingerprint(adapter, input.locator, adapterCtx, legacy.ownerFingerprint);
    const writeResult = await adapter.writeRuntime({
      locator: input.locator,
      artifact,
      commitId: pushResult.commit.id,
      baseOwnerFingerprint: legacy.ownerFingerprint,
      ctx: adapterCtx,
    });
    const nextOwnerFingerprint = await adapter.getFingerprint({ locator: input.locator, ctx: adapterCtx });
    const commit = await updateRunJSCommitMetadata(
      db,
      pushResult.commit,
      {
        ...saveMetadata,
        ownerFingerprint: nextOwnerFingerprint,
      },
      transaction,
    );

    if (input.source !== 'runtime') {
      return {
        locator: input.locator,
        locatorKind: input.locator.kind,
        repository: pushResult.repository,
        commit,
        artifact: {
          entryPath: artifact.entryPath || null,
          filesHash: artifact.filesHash,
          runtimeCodeHash,
          diagnostics: artifact.diagnostics,
        },
        ownerFingerprint: nextOwnerFingerprint,
        writeResult: {
          ...writeResult,
          ownerFingerprint: nextOwnerFingerprint,
        },
      };
    }

    const refreshedLegacy = await adapter.readLegacy({ locator: input.locator, ctx: adapterCtx });
    const head = await service.pull({ repoId: repository.id, ref: 'head', includeContent: 'all' }, serviceCtx);
    const permissions = await getRunJSSourcePermissions(
      adapter,
      input.locator,
      adapterCtx,
      permissionHooks,
      head.repository,
      serviceCtx,
    );
    const history = await service.listCommits({ repoId: repository.id }, serviceCtx);

    return buildOpenResult({
      locator: input.locator,
      repositoryIdentity,
      legacy: refreshedLegacy,
      repository: head.repository,
      files: ensureRunJSManifestFiles(refreshedLegacy, head.files || []),
      history,
      permissions,
    });
  });
}

async function resolveRunJSSourceWriteRepositoryId(
  service: VscFileService,
  repositoryIdentity: VscRepositoryIdentity,
  legacy: RunJSLegacySource,
  input: RunJSSourceWriteInput,
  serviceCtx: VscServiceContext,
): Promise<string> {
  if (input.repoId) {
    return input.repoId;
  }
  if (input.source === 'runtime') {
    return (await ensureRunJSRepository(service, repositoryIdentity, input.locator.kind, legacy, serviceCtx)).id;
  }

  return (
    await service.ensureRepository(
      {
        ...repositoryIdentity,
        authorId: serviceCtx.authorId,
        metadata: {
          sourceKind: input.locator.kind,
        },
      },
      serviceCtx,
    )
  ).repository.id;
}

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

async function pushRunJSSourceCommit(
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

type RunJSSourceLocatorInput = RunJSSourceSaveInput['locator'];

type RunJSSourceRepoInput = Pick<RunJSSourceHistoryInput, 'locator' | 'repoId'>;

interface RunJSCompileMaterializationInput {
  files: VscFileChange[];
}

type RunJSSourceWriteInput = {
  locator: RunJSSourceLocatorInput;
  repoId?: string;
  message: string;
  entryPath?: string;
  version?: string;
  allowEmptyCommit?: boolean;
} & (
  | {
      source: 'snapshot';
      baseCommitId: string | null;
      baseOwnerFingerprint: string;
      files: VscFileChange[];
    }
  | {
      source: 'delta';
      baseCommitId: string | null;
      baseOwnerFingerprint: string;
      changes: RunJSSourceFileChange[];
    }
  | { source: 'runtime' }
);

interface OpenRunJSWorkspaceOptions {
  assertHeadOwnerFingerprint: boolean;
  ensureRepository: boolean;
}

interface RunJSSourcePermissions {
  canWrite: boolean;
  canSave: boolean;
}

interface BuildOpenResultInput {
  locator: RunJSSourceLocatorInput;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  repository: VscRepositoryRecord;
  files: PulledFile[];
  history: VscCommitRecord[];
  permissions: RunJSSourcePermissions;
}

interface RunJSContentFile {
  path: string;
  content: string;
}

interface SaveCompileFile {
  path: string;
  content: string;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

async function createRunJSWorkspaceZip(files: PulledFile[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    zip.file(file.path, file.content || '');
  }

  return zip.generateAsync({
    compression: 'DEFLATE',
    type: 'nodebuffer',
  });
}

export async function readRunJSWorkspaceZip(zipBase64: string): Promise<VscFileChange[]> {
  const buffer = decodeBase64Buffer(zipBase64, 'zipBase64');
  if (buffer.length > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP size must not exceed ${maxRepoTextSize} bytes`, {
      details: {
        size: buffer.length,
        maxRepoTextSize,
      },
    });
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new VscError('PATH_INVALID', 'RunJS workspace ZIP is invalid', {
      details: {
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }
  const filesByPath = new Map<string, VscFileChange>();
  const zipEntries = Object.values(zip.files);
  for (const entry of zipEntries) {
    if (isRunJSZipSymbolicLink(entry)) {
      throw new VscError('PATH_INVALID', `ZIP entry "${getRunJSZipEntryName(entry)}" must not be a symbolic link`);
    }
  }
  const entries = zipEntries.filter((entry) => !entry.dir);
  if (entries.length > maxFilesPerRepo) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP must not contain more than ${maxFilesPerRepo} files`, {
      details: {
        fileCount: entries.length,
        maxFilesPerRepo,
      },
    });
  }
  const budget = { totalBytes: 0, declaredBytes: 0, compressedBytes: buffer.length };

  for (const entry of entries) {
    const path = normalizeAllowedRunJSWorkspacePath(getRunJSZipEntryName(entry), 'zip.entry');
    const pathKey = path.toLocaleLowerCase('en-US');
    if (filesByPath.has(pathKey)) {
      throw new VscError('PATH_INVALID', `Duplicate file path "${path}" in ZIP`);
    }
    filesByPath.set(pathKey, {
      path,
      operation: 'upsert',
      content: await readRunJSZipEntryText(entry, path, budget),
    });
  }

  const files = Array.from(filesByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  assertRunJSCompileInputLimits(files);

  return files;
}

async function readRunJSZipEntryText(
  entry: JSZipObject,
  path: string,
  budget: { totalBytes: number; declaredBytes: number; compressedBytes: number },
): Promise<string> {
  const declaredSize = getZipEntryDeclaredSize(entry);
  if (declaredSize !== null && declaredSize > maxFileSize) {
    throw new VscError('FILE_TOO_LARGE', `ZIP entry "${path}" exceeds ${maxFileSize} bytes`, {
      details: {
        path,
        size: declaredSize,
        maxFileSize,
      },
    });
  }
  if (declaredSize !== null) {
    budget.declaredBytes += declaredSize;
    assertRunJSZipCompressionRatio(budget.compressedBytes, budget.declaredBytes);
  }
  if (declaredSize !== null && budget.totalBytes + declaredSize > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${maxRepoTextSize} bytes`, {
      details: {
        byteSize: budget.totalBytes + declaredSize,
        maxRepoTextSize,
      },
    });
  }

  const chunks: Buffer[] = [];
  let fileBytes = 0;
  let limitError: VscError | null = null;

  try {
    const stream = entry.nodeStream('nodebuffer') as Readable;
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        stream.removeListener('data', onData);
        stream.removeListener('end', onEnd);
        stream.removeListener('error', onError);
      };
      const finish = (error?: Error) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };
      const stopAtLimit = () => {
        stream.pause();
        finish();
        stream.destroy();
      };
      const onData = (chunk: Buffer | Uint8Array | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        fileBytes += buffer.length;
        budget.totalBytes += buffer.length;
        if (fileBytes > maxFileSize) {
          limitError = new VscError('FILE_TOO_LARGE', `ZIP entry "${path}" exceeds ${maxFileSize} bytes`, {
            details: {
              path,
              size: fileBytes,
              maxFileSize,
            },
          });
          stopAtLimit();
          return;
        }
        if (budget.totalBytes > maxRepoTextSize) {
          limitError = new VscError('REPO_LIMIT_EXCEEDED', `ZIP content exceeds ${maxRepoTextSize} bytes`, {
            details: {
              byteSize: budget.totalBytes,
              maxRepoTextSize,
            },
          });
          stopAtLimit();
          return;
        }
        chunks.push(buffer);
      };
      const onEnd = () => finish();
      const onError = (error: Error) => finish(error);

      stream.on('data', onData);
      stream.once('end', onEnd);
      stream.once('error', onError);
    });
  } catch (error) {
    if (isVscError(error)) {
      throw error;
    }
    throw new VscError('PATH_INVALID', `ZIP entry "${path}" could not be read`, {
      details: {
        path,
        reason: error instanceof Error ? error.message : String(error),
      },
    });
  }

  if (limitError) {
    throw limitError;
  }

  assertRunJSZipCompressionRatio(budget.compressedBytes, budget.totalBytes);
  let content: string;
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, fileBytes));
  } catch {
    throw new VscError('TEXT_ENCODING_INVALID', `ZIP entry "${path}" must be valid UTF-8 text`, {
      details: { path },
    });
  }
  return normalizeText(content);
}

function assertRunJSZipCompressionRatio(compressedBytes: number, uncompressedBytes: number): void {
  if (compressedBytes > 0 && uncompressedBytes / compressedBytes > maxZipCompressionRatio) {
    throw new VscError('REPO_LIMIT_EXCEEDED', 'ZIP compression ratio is too high', {
      details: { compressedBytes, uncompressedBytes, maxZipCompressionRatio },
    });
  }
}

function getRunJSZipEntryName(entry: JSZipObject): string {
  return entry.unsafeOriginalName || entry.name;
}

function isRunJSZipSymbolicLink(entry: JSZipObject): boolean {
  const rawPermissions = entry.unixPermissions;
  const permissions = typeof rawPermissions === 'string' ? Number.parseInt(rawPermissions, 8) : rawPermissions;
  return typeof permissions === 'number' && (permissions & 0o170000) === 0o120000;
}

function getZipEntryDeclaredSize(entry: JSZipObject): number | null {
  const size = (entry as JSZipObject & { _data?: { uncompressedSize?: unknown } })._data?.uncompressedSize;
  return typeof size === 'number' && Number.isSafeInteger(size) && size >= 0 ? size : null;
}

function decodeBase64Buffer(value: string, field: string): Buffer {
  const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  if (!normalized.trim()) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }

  return Buffer.from(normalized, 'base64');
}

function readRunJSWorkspaceManifest(files: VscFileChange[]): { entryPath?: string; version?: string } {
  const manifest = files.find((file) => normalizePath(file.path) === runJSManifestPath);
  if (!manifest || typeof manifest.content !== 'string' || !manifest.content.trim()) {
    return {};
  }

  try {
    const value = JSON.parse(manifest.content) as Record<string, unknown>;
    const entry = toStringValue(value.entry);
    const runtimeVersion = toStringValue(value.runtimeVersion);

    return compactObject({
      entryPath: entry ? normalizeAllowedRunJSWorkspacePath(entry, 'manifest.entry') : undefined,
      version: runtimeVersion,
    }) as { entryPath?: string; version?: string };
  } catch (error) {
    if (isVscError(error)) {
      throw error;
    }
    throw new VscError('PATH_INVALID', 'RunJS manifest in ZIP is invalid', {
      details: {
        path: runJSManifestPath,
      },
    });
  }
}

function buildRunJSZipFileName(legacy: RunJSLegacySource): string {
  const baseName = (legacy.label || 'runjs-workspace').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${baseName || 'runjs-workspace'}.zip`;
}

function createServiceContext(
  adapterCtx: RunJSSourceAdapterContext,
  transaction: VscServiceContext['transaction'],
): VscServiceContext {
  return {
    authorId: adapterCtx.userId,
    request: adapterCtx.request as VscPermissionRequestMetadata | undefined,
    transaction,
  };
}

function createRunJSSourceAuthoringInspector(
  registry?: RunJSSourceAuthoringInspectorRegistry,
): RunJSSourceAuthoringInspector | undefined {
  if (!registry) {
    return undefined;
  }

  return (input) => registry.inspect(input);
}

function legacyAuthoringInfo(legacy: RunJSLegacySource): RunJSSourceAuthoringLegacyInfo {
  return {
    version: legacy.version,
    surfaceStyle: legacy.surfaceStyle,
    language: legacy.language,
    metadata: legacy.metadata,
  };
}

async function openRunJSWorkspace(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  input: ResourceActionInput,
  ctx: RunJSSourceResourceContext,
  options: OpenRunJSWorkspaceOptions,
): Promise<RunJSSourceOpenResult> {
  const locator = normalizeRunJSSourceLocator(input.locator);
  const adapter = registry.require(locator.kind);
  const service = new VscFileService(db, permissionHooks);

  return db.sequelize.transaction(async (transaction) => {
    const adapterCtx = createAdapterContext(ctx, transaction);
    const serviceCtx = createServiceContext(adapterCtx, transaction);

    await adapter.assertCanRead({ locator, ctx: adapterCtx });
    const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
    const workspaceLegacy = applyInitialRunJSSource(legacy, normalizeInitialRunJSSource(input.initialSource));
    const repositoryIdentity = buildRunJSSourceRepositoryIdentity(locator);
    let repository = await findRunJSRepositoryByIdentity(db, service, repositoryIdentity, serviceCtx);
    let permissions: RunJSSourcePermissions | undefined;
    if (!repository) {
      const virtualRepository = createVirtualRunJSRepository(repositoryIdentity);
      permissions = await getRunJSSourcePermissions(
        adapter,
        locator,
        adapterCtx,
        permissionHooks,
        virtualRepository,
        serviceCtx,
      );
      if (!permissions.canSave) {
        return buildOpenResult({
          locator,
          repositoryIdentity,
          legacy: workspaceLegacy,
          repository: virtualRepository,
          files: createLegacyWorkspaceFiles(workspaceLegacy),
          history: [],
          permissions,
        });
      }
      if (!options.ensureRepository) {
        return buildOpenResult({
          locator,
          repositoryIdentity,
          legacy: workspaceLegacy,
          repository: virtualRepository,
          files: createLegacyWorkspaceFiles(workspaceLegacy),
          history: [],
          permissions,
        });
      }
      repository = await ensureRunJSRepository(service, repositoryIdentity, locator.kind, workspaceLegacy, serviceCtx);
    }
    const headOwnerFingerprint = await getHeadOwnerFingerprintForRepository(service, repository, serviceCtx);

    if (options.assertHeadOwnerFingerprint) {
      assertHeadOwnerFingerprintMatches(headOwnerFingerprint, legacy.ownerFingerprint);
    }

    const head = await service.pull({ repoId: repository.id, ref: 'head', includeContent: 'all' }, serviceCtx);
    permissions ||= await getRunJSSourcePermissions(
      adapter,
      locator,
      adapterCtx,
      permissionHooks,
      head.repository,
      serviceCtx,
    );
    const history = await service.listCommits({ repoId: repository.id }, serviceCtx);

    return buildOpenResult({
      locator,
      repositoryIdentity,
      legacy: workspaceLegacy,
      repository: head.repository,
      files: ensureRunJSManifestFiles(workspaceLegacy, head.files || []),
      history,
      permissions,
    });
  });
}

function normalizeInitialRunJSSource(value: unknown): RunJSSourceInitialSource | undefined {
  if (value === undefined) {
    return undefined;
  }

  const source = toRecord(value);
  if (typeof source.version !== 'string' || !source.version) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS initial source is invalid');
  }
  // Missing code is treated as empty inline source (e.g. light-extension → inline with no stored code).
  if (source.code !== undefined && source.code !== null && typeof source.code !== 'string') {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS initial source is invalid');
  }

  return {
    code: typeof source.code === 'string' ? source.code : '',
    version: source.version,
  };
}

function applyInitialRunJSSource(
  legacy: RunJSLegacySource,
  initialSource: RunJSSourceInitialSource | undefined,
): RunJSLegacySource {
  if (!initialSource || !legacy.uninitialized) {
    return legacy;
  }

  return {
    ...legacy,
    code: initialSource.code,
    version: initialSource.version,
    language: initialSource.version === 'v1' ? 'javascript' : legacy.language,
  };
}

async function findRunJSRepositoryByIdentity(
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

async function ensureRunJSRepository(
  service: VscFileService,
  identity: VscRepositoryIdentity,
  sourceKind: RunJSSourceKind,
  legacy: RunJSLegacySource,
  serviceCtx: VscServiceContext,
): Promise<VscRepositoryRecord> {
  const ensured = await service.ensureRepository(
    {
      ...identity,
      initialFiles: [legacyToInitialFile(legacy), defaultRunJSManifestFile(legacy)],
      message: 'Initialize RunJS source',
      authorId: serviceCtx.authorId,
      metadata: {
        sourceKind,
        ownerFingerprint: legacy.ownerFingerprint,
        entry: resolveLegacyEntryPath(legacy),
        runtimeVersion: legacy.version,
        surfaceStyle: legacy.surfaceStyle,
        runtimeCodeHash: buildRunJSRuntimeCodeHash(legacy.code),
      },
    },
    serviceCtx,
  );

  return ensured.repository;
}

function legacyToInitialFile(legacy: RunJSLegacySource): VscTreeEntryInput {
  return {
    path: resolveLegacyEntryPath(legacy),
    content: legacy.code,
    language: legacy.language,
  };
}

function createLegacyWorkspaceFiles(legacy: RunJSLegacySource): PulledFile[] {
  const initialFile = legacyToInitialFile(legacy);
  const path = normalizePath(initialFile.path);
  const content = normalizeText(String(initialFile.content || ''));

  return ensureRunJSManifestFiles(legacy, [
    {
      path,
      pathHash: pathHash(path),
      pathLowerHash: pathLowerHash(path),
      blobHash: sha256Hex(content),
      size: Buffer.byteLength(content, 'utf8'),
      language: initialFile.language || legacy.language,
      mode: initialFile.mode || '100644',
      content,
    },
  ]);
}

function createVirtualRunJSRepository(identity: VscRepositoryIdentity): VscRepositoryRecord {
  return {
    id: '',
    ...identity,
    status: 'active',
    defaultRef: 'head',
    headCommitId: null,
    headSeq: 0,
  };
}

function legacyToRuntimeFileChanges(legacy: RunJSLegacySource, baseFiles: SaveCompileFile[]): RunJSSourceFileChange[] {
  const nextFiles = [legacyToInitialFile(legacy)];
  const nextPaths = new Set(nextFiles.map((file) => normalizePath(file.path)));
  const baseFilesByPath = new Map(baseFiles.map((file) => [normalizePath(file.path), file]));
  const changes: RunJSSourceFileChange[] = nextFiles.map((file) => {
    const path = normalizePath(file.path);
    return {
      ...file,
      path,
      operation: 'upsert' as const,
      expectedBlobHash: baseFilesByPath.get(path)?.blobHash || null,
    };
  });

  for (const baseFile of baseFiles) {
    const normalizedPath = normalizePath(baseFile.path);
    if (normalizedPath !== runJSManifestPath && !nextPaths.has(normalizedPath)) {
      changes.push({
        path: normalizedPath,
        operation: 'delete',
        expectedBlobHash: baseFile.blobHash || null,
      });
    }
  }

  return changes;
}

function defaultRunJSManifestFile(legacy: RunJSLegacySource): VscTreeEntryInput {
  return runJSManifestFile(resolveLegacyEntryPath(legacy), legacy.version, legacy.surfaceStyle);
}

function runJSManifestFile(
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

function runJSManifestFileChange(
  entry: string,
  runtimeVersion: string,
  surfaceStyle: RunJSLegacySource['surfaceStyle'],
  files: VscFileChange[] = [],
): VscFileChange {
  return {
    ...runJSManifestFile(entry, runtimeVersion, surfaceStyle, files),
    operation: 'upsert',
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

function resolveLegacyEntryPath(_legacy: RunJSLegacySource): string {
  return defaultRunJSEntryPath;
}

function withRunJSManifestChange(files: VscFileChange[], manifestFile: VscFileChange): VscFileChange[] {
  return [...files.filter((file) => normalizePath(file.path) !== runJSManifestPath), manifestFile];
}

async function getRunJSRepository(
  service: VscFileService,
  repoId: string,
  locator: RunJSSourceLocatorInput,
  serviceCtx: VscServiceContext,
): Promise<VscRepositoryRecord> {
  const repository = await service.getRepository({ repoId }, serviceCtx);
  assertRepositoryMatchesIdentity(repository, buildRunJSSourceRepositoryIdentity(locator), locator.kind);
  return repository;
}

async function getRunJSSourcePermissions(
  adapter: ReturnType<RunJSSourceAdapterRegistry['require']>,
  locator: RunJSSourceLocatorInput,
  adapterCtx: RunJSSourceAdapterContext,
  permissionHooks: VscPermissionHookRegistry | undefined,
  repository: VscRepositoryRecord,
  serviceCtx: VscServiceContext,
): Promise<RunJSSourcePermissions> {
  const canSave = await canSaveRunJSSource(adapter, locator, adapterCtx, permissionHooks, repository, serviceCtx);
  return {
    canWrite: canSave,
    canSave,
  };
}

async function canSaveRunJSSource(
  adapter: ReturnType<RunJSSourceAdapterRegistry['require']>,
  locator: RunJSSourceLocatorInput,
  adapterCtx: RunJSSourceAdapterContext,
  permissionHooks: VscPermissionHookRegistry | undefined,
  repository: VscRepositoryRecord,
  serviceCtx: VscServiceContext,
): Promise<boolean> {
  try {
    await adapter.assertCanWrite({ locator, ctx: adapterCtx });
    await permissionHooks?.assertAllowed({
      userId: serviceCtx.authorId ?? null,
      action: 'push',
      repoId: repository.id,
      repository,
      request: serviceCtx.request,
    });
    return true;
  } catch (error) {
    if (isVscError(error)) {
      return false;
    }
    throw error;
  }
}

function ensureRunJSManifestFiles(legacy: RunJSLegacySource, files: PulledFile[]): PulledFile[] {
  if (files.some((file) => normalizePath(file.path) === runJSManifestPath)) {
    return files;
  }

  const manifest = defaultRunJSManifestFile(legacy);
  const content = String(manifest.content || '');
  return [
    ...files,
    {
      path: manifest.path,
      pathHash: pathHash(manifest.path),
      pathLowerHash: pathLowerHash(manifest.path),
      blobHash: sha256Hex(content),
      size: Buffer.byteLength(content, 'utf8'),
      language: manifest.language || 'json',
      mode: manifest.mode || '100644',
      content,
    },
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function buildOpenSettingsDescriptor(repoId: string, files: PulledFile[]): RunJSSourceOpenSettingsDescriptor {
  const descriptorFile = files.find((file) => normalizePath(file.path) === inlineRunJSEntryDescriptorPath);
  // Inline workspaces may omit entry.json entirely: that means "no settings", not a hard failure.
  // Only validate when the file is present so bad JSON / invalid schema still surfaces.
  if (!descriptorFile) {
    const emptyHashes = buildRunJSWorkspaceSettingsHashes(null);
    return {
      descriptorPath: inlineRunJSEntryDescriptorPath,
      entryId: null,
      key: null,
      schema: null,
      defaults: {},
      settingsSchemaHash: emptyHashes.settingsSchemaHash,
      settingsDefaultsHash: emptyHashes.settingsDefaultsHash,
      diagnostics: [],
    };
  }

  const descriptor = parseRunJSWorkspaceSettingsDescriptor(
    inlineRunJSEntryDescriptorPath,
    typeof descriptorFile.content === 'string' ? descriptorFile.content : '',
  );
  const schema = descriptor.schema;
  const defaults = schema ? extractRunJSSettingsDefaults(schema) : {};
  const hashes = buildRunJSWorkspaceSettingsHashes(schema);
  const key = descriptor.key;

  return {
    descriptorPath: inlineRunJSEntryDescriptorPath,
    entryId: key && repoId ? `inline:${repoId}:${key}` : null,
    key,
    schema,
    defaults,
    settingsSchemaHash: hashes.settingsSchemaHash,
    settingsDefaultsHash: hashes.settingsDefaultsHash,
    diagnostics: descriptor.diagnostics,
  };
}

function buildOpenResult(input: BuildOpenResultInput): RunJSSourceOpenResult & Record<string, unknown> {
  const repository = serializeRepository(input.repository);
  return {
    locator: input.locator,
    locatorKind: input.locator.kind,
    repositoryIdentity: input.repositoryIdentity,
    legacy: input.legacy,
    ownerFingerprint: input.legacy.ownerFingerprint,
    source: {
      label: input.legacy.label,
      kind: input.locator.kind,
      surfaceStyle: input.legacy.surfaceStyle,
      runtimeVersion: input.legacy.version,
      language: input.legacy.language,
      ownerFingerprint: input.legacy.ownerFingerprint,
      metadata: input.legacy.metadata,
    },
    repository,
    files: input.files.map(serializeRunJSSourceWorkspaceFile),
    permissions: {
      canRead: true,
      canWrite: input.permissions.canWrite,
      canSave: input.permissions.canSave,
    },
    history: {
      items: input.history,
    },
    settingsDescriptor: buildOpenSettingsDescriptor(repository.repoId, input.files),
  };
}

function serializeRunJSSourceWorkspaceFile(file: PulledFile): RunJSSourceWorkspaceFile {
  const content = typeof file.content === 'string' ? file.content : undefined;
  return {
    path: file.path,
    content,
    blobHash: file.blobHash || (content === undefined ? '' : sha256Hex(normalizeText(content))),
    size: Number.isSafeInteger(file.size)
      ? file.size
      : Buffer.byteLength(content === undefined ? '' : normalizeText(content), 'utf8'),
    managed: normalizePath(file.path) === runJSManifestPath,
    language: file.language,
    mode: file.mode,
  };
}

function serializeRepository(repository: VscRepositoryRecord): RunJSSourceRepositoryRecord {
  return {
    ...repository,
    repoId: repository.id,
  };
}

async function materializeCompilePreviewFiles(
  db: Database,
  service: VscFileService,
  input: RunJSSourceCompilePreviewInput,
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  if (!input.repoId) {
    return input.files;
  }

  const repository = await service.getRepository({ repoId: input.repoId }, serviceCtx);
  assertRepositoryMatchesIdentity(repository, buildRunJSSourceRepositoryIdentity(input.locator), input.locator.kind);
  const baseCommitId = input.baseCommitId === undefined ? repository.headCommitId : input.baseCommitId;
  const overwriteFiles = await buildOverwriteRunJSFileChanges(db, repository.id, baseCommitId, input.files, serviceCtx);

  return materializeRunJSCompileFiles(
    db,
    repository.id,
    baseCommitId,
    {
      files: overwriteFiles,
    },
    serviceCtx,
  );
}

async function buildOverwriteRunJSFileChanges(
  db: Database,
  repoId: string,
  baseCommitId: string | null,
  files: VscFileChange[],
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  const baseFiles = baseCommitId
    ? await loadCommitFilesForCompile(db, repoId, baseCommitId, serviceCtx.transaction)
    : [];
  const basePaths = new Set(baseFiles.map((file) => file.path));
  const allowedBlobHashes = new Set(baseFiles.map((file) => file.blobHash).filter(isStringValue));
  const desiredFiles = new Map<string, SaveCompileFile>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    const operation = file.operation || 'upsert';

    if (operation === 'delete') {
      desiredFiles.delete(normalizedPath);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    desiredFiles.set(normalizedPath, {
      path: normalizedPath,
      content: await resolveSaveCompileFileContent(db, file, allowedBlobHashes, serviceCtx.transaction),
      language: file.language,
      mode: file.mode,
    });
  }

  const changes = Array.from(desiredFiles.values()).map(canonicalCompileFileChange);
  for (const path of basePaths) {
    if (!desiredFiles.has(path)) {
      changes.push({
        path,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

function buildOverwriteRunJSFileDelta(baseFiles: SaveCompileFile[], files: VscFileChange[]): RunJSSourceFileChange[] {
  const baseFilesByPath = new Map(baseFiles.map((file) => [normalizePath(file.path), file]));
  const baseFilesByBlobHash = new Map(
    baseFiles.filter((file) => file.blobHash).map((file) => [file.blobHash as string, file]),
  );
  const desiredFiles = new Map<string, SaveCompileFile>();

  for (const file of files) {
    const path = normalizePath(file.path);
    const operation = file.operation || 'upsert';
    if (path === runJSManifestPath) {
      continue;
    }
    if (operation === 'delete') {
      desiredFiles.delete(path);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    const blobFile = file.blobHash ? baseFilesByBlobHash.get(file.blobHash) : undefined;
    const content = typeof file.content === 'string' ? normalizeText(file.content) : blobFile?.content;
    if (content === undefined) {
      if (!file.blobHash) {
        throw new VscError('BLOB_NOT_FOUND', `Tree entry "${file.path}" must include content or an existing blob hash`);
      }
      throw new VscError('PERMISSION_DENIED', 'Blob hash is not available in the current repository context');
    }
    desiredFiles.set(path, {
      path,
      content,
      language: file.language,
      mode: file.mode,
    });
  }

  const changes: RunJSSourceFileChange[] = Array.from(desiredFiles.values())
    .filter((file) => {
      const baseFile = baseFilesByPath.get(file.path);
      return (
        !baseFile ||
        file.content !== normalizeText(baseFile.content) ||
        (file.language !== undefined && file.language !== baseFile.language) ||
        (file.mode !== undefined && file.mode !== baseFile.mode)
      );
    })
    .map((file) => ({
      ...canonicalCompileFileChange(file),
      operation: 'upsert',
      expectedBlobHash: baseFilesByPath.get(file.path)?.blobHash || null,
    }));
  for (const baseFile of baseFiles) {
    const path = normalizePath(baseFile.path);
    if (path !== runJSManifestPath && !desiredFiles.has(path)) {
      changes.push({
        path,
        operation: 'delete',
        expectedBlobHash: baseFile.blobHash || null,
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
}

async function materializeRunJSCompileFiles(
  db: Database,
  repoId: string,
  baseCommitId: string | null,
  input: RunJSCompileMaterializationInput,
  serviceCtx: VscServiceContext,
): Promise<VscFileChange[]> {
  const baseFiles = baseCommitId
    ? await loadCommitFilesForCompile(db, repoId, baseCommitId, serviceCtx.transaction)
    : [];
  const filesByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const allowedBlobHashes = new Set(baseFiles.map((file) => file.blobHash).filter(isStringValue));

  for (const change of input.files) {
    const normalizedPath = normalizePath(change.path);
    const operation = change.operation || 'upsert';

    if (operation === 'delete') {
      filesByPath.delete(normalizedPath);
      continue;
    }
    if (operation !== 'upsert') {
      throw new VscError('PATH_INVALID', `Unsupported file operation "${operation}"`);
    }

    const currentFile = filesByPath.get(normalizedPath);
    const content = await resolveSaveCompileFileContent(db, change, allowedBlobHashes, serviceCtx.transaction);
    filesByPath.set(normalizedPath, {
      path: normalizedPath,
      content,
      language: change.language || currentFile?.language,
      mode: change.mode || currentFile?.mode,
    });
  }

  return Array.from(filesByPath.values())
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(canonicalCompileFileChange);
}

function assertIncrementalRunJSFileChanges(baseFiles: SaveCompileFile[], changes: RunJSSourceFileChange[]): void {
  const baseFilesByPath = new Map(baseFiles.map((file) => [file.path, file]));
  const seenPaths = new Set<string>();

  for (const change of changes) {
    const path = normalizePath(change.path);
    if (path === runJSManifestPath) {
      throw new VscError('PERMISSION_DENIED', `RunJS managed file "${path}" cannot be changed directly`, {
        details: {
          path,
          managed: true,
        },
      });
    }
    if (seenPaths.has(path)) {
      throw new VscError('PATH_INVALID', `RunJS changes contain duplicate path "${path}"`, {
        details: { path },
      });
    }
    seenPaths.add(path);

    const currentFile = baseFilesByPath.get(path);
    const currentBlobHash = currentFile?.blobHash || null;
    if ((change.operation === 'delete' && !currentFile) || change.expectedBlobHash !== currentBlobHash) {
      throw new VscError('RUNJS_FILE_CONFLICT', `RunJS file "${path}" changed after it was opened`, {
        details: {
          path,
          expectedBlobHash: change.expectedBlobHash,
          currentBlobHash,
        },
      });
    }
  }
}

function canonicalCompileFileChange(file: SaveCompileFile): VscFileChange {
  return canonicalizeRunJSCompileFile(file);
}

async function loadCommitFilesForCompile(
  db: Database,
  repoId: string,
  commitId: string,
  transaction: VscServiceContext['transaction'],
): Promise<SaveCompileFile[]> {
  const commit = await db.getRepository('vscFileCommits').findOne({
    filter: {
      id: commitId,
      repoId,
    },
    fields: ['treeHash'],
    transaction,
  });
  if (!commit) {
    throw new VscError('COMMIT_NOT_FOUND', `Commit "${commitId}" was not found`);
  }

  const entries = await db.getRepository('vscFileTreeEntries').find({
    filter: {
      treeHash: commit.get('treeHash') as string,
    },
    fields: ['path', 'blobHash', 'size', 'language', 'mode'],
    sort: ['path'],
    transaction,
  });
  const files: SaveCompileFile[] = [];
  for (const entry of entries) {
    const blob = await loadBlobForCompile(db, entry.get('blobHash') as string, transaction);
    files.push({
      path: entry.get('path') as string,
      content: blob.content,
      blobHash: blob.hash,
      size: entry.get('size') as number,
      language: entry.get('language') as string,
      mode: entry.get('mode') as string,
    });
  }

  return files;
}

async function resolveSaveCompileFileContent(
  db: Database,
  change: VscFileChange,
  allowedBlobHashes: Set<string>,
  transaction: VscServiceContext['transaction'],
): Promise<string> {
  if (typeof change.content === 'string') {
    return normalizeText(change.content);
  }
  if (!change.blobHash) {
    throw new VscError('BLOB_NOT_FOUND', `Tree entry "${change.path}" must include content or an existing blob hash`);
  }
  if (!allowedBlobHashes.has(change.blobHash)) {
    throw new VscError('PERMISSION_DENIED', 'Blob hash is not available in the current repository context');
  }

  const blob = await loadBlobForCompile(db, change.blobHash, transaction);

  return blob.content;
}

async function loadBlobForCompile(
  db: Database,
  blobHash: string,
  transaction: VscServiceContext['transaction'],
): Promise<{ hash: string; size: number; content: string }> {
  const blob = await db.getRepository('vscFileBlobs').findOne({
    filterByTk: blobHash,
    fields: ['hash', 'size', 'content'],
    transaction,
  });
  if (!blob) {
    throw new VscError('BLOB_NOT_FOUND', `Blob "${blobHash}" was not found`);
  }

  return {
    hash: blob.get('hash') as string,
    size: blob.get('size') as number,
    content: blob.get('content') as string,
  };
}

export function assertRunJSCompileInputLimits(files: VscFileChange[]): void {
  const contentFiles = contentFilesFromChanges(files);
  if (contentFiles.size > maxFilesPerRepo) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `Tree must not exceed ${maxFilesPerRepo} files`, {
      details: { fileCount: contentFiles.size, maxFilesPerRepo },
    });
  }

  const byLowerPathHash = new Map<string, string>();
  let byteSize = 0;

  for (const file of contentFiles.values()) {
    const lowerHash = pathLowerHash(file.path);
    const conflictingPath = byLowerPathHash.get(lowerHash);
    if (conflictingPath && conflictingPath !== file.path) {
      throw new VscError('PATH_INVALID', `Case-only path conflict between "${conflictingPath}" and "${file.path}"`);
    }
    byLowerPathHash.set(lowerHash, file.path);

    const size = Buffer.byteLength(normalizeText(file.content), 'utf8');
    if (size > maxFileSize) {
      throw new VscError('FILE_TOO_LARGE', `File size must not exceed ${maxFileSize} bytes`, {
        details: { size, maxFileSize },
      });
    }
    byteSize += size;
  }

  if (byteSize > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `Tree content must not exceed ${maxRepoTextSize} bytes`, {
      details: { byteSize, maxRepoTextSize },
    });
  }
}

function assertRunJSCompileSucceeded(result: CompileRunJSSourceWorkspaceResult): void {
  const errorDiagnostics = result.artifact.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  if (!errorDiagnostics.length) {
    return;
  }

  throw new VscError('RUNJS_COMPILE_FAILED', 'RunJS source could not be compiled', {
    details: {
      diagnostics: errorDiagnostics,
    } satisfies RunJSCompileFailedDetails,
  });
}

function contentFilesFromChanges(files: VscFileChange[]): Map<string, RunJSContentFile> {
  const contentFiles = new Map<string, RunJSContentFile>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    if (file.operation === 'delete') {
      contentFiles.delete(normalizedPath);
      continue;
    }
    if (typeof file.content !== 'string') {
      continue;
    }

    contentFiles.set(normalizedPath, {
      path: normalizedPath,
      content: file.content,
    });
  }

  return contentFiles;
}

function isStringValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

async function assertCurrentOwnerFingerprint(
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

async function getHeadOwnerFingerprintForRepository(
  service: VscFileService,
  repository: VscRepositoryRecord,
  serviceCtx: VscServiceContext,
): Promise<string | null> {
  if (!repository.headCommitId) {
    return null;
  }

  const headCommit = await service.getCommit(
    {
      repoId: repository.id,
      commitId: repository.headCommitId,
    },
    serviceCtx,
  );

  return getCommitOwnerFingerprint(headCommit);
}

function assertHeadOwnerFingerprintMatches(headOwnerFingerprint: string | null, currentOwnerFingerprint: string): void {
  if (!headOwnerFingerprint || headOwnerFingerprint === currentOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS host code differs from the versioned source', {
    details: {
      expected: headOwnerFingerprint,
      received: currentOwnerFingerprint,
    },
  });
}

function getCommitOwnerFingerprint(commit: VscCommitRecord): string | null {
  const ownerFingerprint = commit.metadata?.ownerFingerprint;
  return typeof ownerFingerprint === 'string' && ownerFingerprint ? ownerFingerprint : null;
}

async function updateRunJSCommitMetadata(
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

export function createRunJSSourcesResource(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks?: VscPermissionHookRegistry,
  authoringInspectors?: RunJSSourceAuthoringInspectorRegistry,
  authoringCapabilities?: RunJSAuthoringCapabilityRegistry,
): ResourceOptions {
  const sourceActions = Object.fromEntries(
    runJSSourceActionNames
      .filter(
        (actionName): actionName is Exclude<RunJSSourceActionName, 'capabilities'> => actionName !== 'capabilities',
      )
      .map((actionName) => [
        actionName,
        createRunJSSourceAction(db, registry, permissionHooks, authoringInspectors, actionRunners[actionName]),
      ]),
  );
  return {
    name: 'runJSSources',
    only: [...runJSSourceActionNames],
    actions: {
      capabilities: createRunJSAuthoringCapabilitiesAction(authoringCapabilities),
      ...sourceActions,
    } as Record<RunJSSourceActionName, HandlerType>,
  };
}

function createRunJSAuthoringCapabilitiesAction(registry?: RunJSAuthoringCapabilityRegistry): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as RunJSSourceResourceContext;
    resourceCtx.withoutDataWrapping = true;
    resourceCtx.body = createRunJSAuthoringCapabilities(registry?.getExternalization());
    await next();
  };
}

function createRunJSSourceAction(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  authoringInspectors: RunJSSourceAuthoringInspectorRegistry | undefined,
  run: RunJSSourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as RunJSSourceResourceContext;

    try {
      resourceCtx.body = await run(
        db,
        registry,
        permissionHooks,
        authoringInspectors,
        getActionInput(resourceCtx),
        resourceCtx,
      );
      await next();
    } catch (error) {
      if (!isVscError(error)) {
        throw error;
      }

      resourceCtx.withoutDataWrapping = true;
      resourceCtx.type = 'application/json';
      resourceCtx.status = error.status;
      resourceCtx.body = error.toResponseBody();
    }
  };
}

function normalizeRepoInput(input: ResourceActionInput): RunJSSourceRepoInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: requireString(input, 'repoId'),
  };
}

function normalizeCompilePreviewInput(input: ResourceActionInput): RunJSSourceCompilePreviewInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: optionalNullableString(input, 'baseCommitId'),
    files: requireArray(input, 'files', normalizeRunJSPreviewFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entry') || optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function normalizeExportZipInput(input: ResourceActionInput): RunJSSourceExportZipInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    commitId: optionalString(input, 'commitId'),
  };
}

function normalizeImportZipInput(input: ResourceActionInput): RunJSSourceImportZipInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    zipBase64: requireString(input, 'zipBase64'),
  };
}

function normalizeHistoryInput(input: ResourceActionInput): RunJSSourceHistoryInput {
  return {
    ...normalizeRepoInput(input),
    limit: optionalNumber(input, 'limit'),
    beforeSeq: optionalNumber(input, 'beforeSeq'),
  };
}

function normalizeDiffInput(input: ResourceActionInput): RunJSSourceDiffInput {
  return {
    ...normalizeRepoInput(input),
    fromCommitId: requireString(input, 'fromCommitId'),
    toCommitId: requireString(input, 'toCommitId'),
  };
}

function normalizeGetVersionInput(input: ResourceActionInput): RunJSSourceGetVersionInput {
  return {
    ...normalizeRepoInput(input),
    commitId: requireString(input, 'commitId'),
    includeFiles: optionalBoolean(input, 'includeFiles') ?? false,
  };
}

function normalizeSaveInput(input: ResourceActionInput): RunJSSourceSaveInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    files: requireArray(input, 'files', normalizeRunJSFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function normalizeSaveChangesInput(input: ResourceActionInput): RunJSSourceSaveChangesInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: requireString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    changes: requireArray(input, 'changes', normalizeRunJSIncrementalFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function assertBaseCommitMatches(baseCommitId: string | null, currentHeadCommitId: string | null): void {
  if (baseCommitId === currentHeadCommitId) {
    return;
  }

  throw new VscError('BASE_COMMIT_OUTDATED', 'RunJS workspace Head changed after it was opened', {
    details: {
      expected: currentHeadCommitId,
      received: baseCommitId,
    },
  });
}

function assertBaseOwnerFingerprintMatches(
  baseOwnerFingerprint: string,
  headOwnerFingerprint: string | null,
  currentOwnerFingerprint: string,
  kind: RunJSSourceKind,
): void {
  if (baseOwnerFingerprint === currentOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS host code differs from the versioned source', {
    details: {
      received: baseOwnerFingerprint,
      headOwnerFingerprint,
      kind,
    },
  });
}

function createAdapterContext(ctx: RunJSSourceResourceContext, transaction?: unknown): RunJSSourceAdapterContext {
  return {
    userId: getCurrentUserId(ctx),
    request: getRequestMetadata(ctx),
    state: getCurrentState(ctx),
    currentUser: getCurrentUser(ctx),
    timezone: getRequestTimezone(ctx),
    transaction,
    can: (input) => normalizePermissionResult(ctx.can?.(input)),
  };
}

function assertRepositoryMatchesIdentity(
  repository: VscRepositoryRecord,
  identity: VscRepositoryIdentity,
  sourceKind: string,
): void {
  if (
    repository.ownerType === identity.ownerType &&
    repository.ownerId === identity.ownerId &&
    repository.name === identity.name
  ) {
    return;
  }

  throw new VscError('PERMISSION_DENIED', 'RunJS source repository does not match the requested locator', {
    details: {
      repoId: repository.id,
      sourceKind,
    },
  });
}

function selectEntryPath(files: VscFileChange[], preferredEntryPath?: string): string {
  const activeFiles = files.filter((file) => file.operation !== 'delete');
  return resolveRunJSWorkspaceEntryPath(
    activeFiles.map((file) => file.path),
    {
      fallback: defaultRunJSEntryPath,
      preferredEntries: [preferredEntryPath, readRunJSWorkspaceManifestEntry(activeFiles)],
    },
  );
}

function readRunJSWorkspaceManifestEntry(files: VscFileChange[]): string | undefined {
  const manifest = files.find((file) => normalizePath(file.path) === runJSManifestPath);
  if (!manifest || typeof manifest.content !== 'string' || !manifest.content.trim()) {
    return undefined;
  }

  try {
    const value = JSON.parse(manifest.content) as Record<string, unknown>;
    const entry = toStringValue(value.entry);
    if (!entry) {
      return undefined;
    }
    const validation = validateRunJSWorkspacePathValue(entry);
    return validation.valid ? validation.path : undefined;
  } catch (_) {
    return undefined;
  }
}

function getActionInput(ctx: RunJSSourceResourceContext): ResourceActionInput {
  const params = toRecord(ctx.action?.params);
  const values = toRecord(params.values);
  const { values: _values, ...queryParams } = params;

  return {
    ...queryParams,
    ...values,
  };
}

function getCurrentUserId(ctx: RunJSSourceResourceContext): string | null {
  const user = getCurrentUser(ctx);
  if (!user || typeof user !== 'object') {
    return null;
  }

  const userWithId = user as { id?: unknown };
  if (typeof userWithId.id === 'string' || typeof userWithId.id === 'number') {
    return String(userWithId.id);
  }

  const get = (user as { get?: (key: string) => unknown }).get;
  if (typeof get !== 'function') {
    return null;
  }

  const id = get('id');
  return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
}

function getCurrentUser(ctx: RunJSSourceResourceContext): unknown {
  const state = toRecord(ctx.state);
  return state.currentUser || ctx.auth?.user;
}

function getCurrentState(ctx: RunJSSourceResourceContext): Record<string, unknown> {
  return toRecord(ctx.state);
}

function getRequestMetadata(ctx: RunJSSourceResourceContext): Record<string, unknown> & VscPermissionRequestMetadata {
  const headers = ctx.request?.headers || ctx.request?.header || {};

  return compactObject({
    resourceName: ctx.action?.resourceName,
    actionName: ctx.action?.actionName,
    requestId: getHeader(headers, 'x-request-id') || getHeader(headers, 'x-correlation-id'),
    path: ctx.request?.path,
    method: ctx.request?.method,
    requestSource: getHeader(headers, 'x-request-source'),
    locale: getHeader(headers, 'x-locale'),
    timezone: getHeader(headers, 'x-timezone'),
    dataSource: getHeader(headers, 'x-data-source') || toStringValue(ctx.dataSource?.name),
  }) as Record<string, unknown> & VscPermissionRequestMetadata;
}

function getRequestTimezone(ctx: RunJSSourceResourceContext): string | undefined {
  const headers = ctx.request?.headers || ctx.request?.header || {};
  return getHeader(headers, 'x-timezone');
}

function normalizePermissionResult(value: unknown): RunJSSourcePermissionResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const input = value as { params?: unknown };
  if (!input.params || typeof input.params !== 'object' || Array.isArray(input.params)) {
    return {};
  }

  return {
    params: input.params as RunJSSourcePermissionResult['params'],
  };
}

function getHeader(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toRecord(value: unknown): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as ResourceActionInput;
}

function requireString(input: ResourceActionInput, key: string): string {
  const value = input[key];
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function optionalString(input: ResourceActionInput, key: string): string | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" is invalid`);
}

function optionalRunJSWorkspacePath(input: ResourceActionInput, key: string): string | undefined {
  const value = optionalString(input, key);
  if (value === undefined) {
    return undefined;
  }

  return normalizeAllowedRunJSWorkspacePath(value, key);
}

function optionalNullableString(input: ResourceActionInput, key: string): string | null | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a string or null`);
}

function requireNullableString(input: ResourceActionInput, key: string): string | null {
  if (input[key] === null) {
    return null;
  }

  return requireString(input, key);
}

function requireCommitMessage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS save commit message is required');
  }
  const message = value.trim();
  if (message.length < 3 || message.length > 200) {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS save commit message must be 3-200 characters');
  }

  return message;
}

function requireArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
  options: { allowEmpty?: boolean } = {},
): T[] {
  const value = input[key];
  if (!Array.isArray(value) || (!options.allowEmpty && value.length === 0)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a non-empty array`);
  }

  return value.map((item, index) => normalize(item, `${key}[${index}]`));
}

function normalizeFileChange(value: unknown, label: string): VscFileChange {
  const input = requireRecord(value, label);

  return compactObject({
    path: requireString(input, 'path'),
    operation: optionalFileOperation(input, 'operation', label),
    content: optionalString(input, 'content'),
    blobHash: optionalString(input, 'blobHash'),
    size: optionalNumber(input, 'size'),
    language: optionalString(input, 'language'),
    mode: optionalString(input, 'mode'),
  }) as unknown as VscFileChange;
}

function normalizeRunJSFileChange(value: unknown, label: string): VscFileChange {
  return normalizeRunJSFilePath(normalizeFileChange(value, label), `${label}.path`);
}

function normalizeRunJSIncrementalFileChange(value: unknown, label: string): RunJSSourceFileChange {
  const input = requireRecord(value, label);
  const operation = requireFileOperation(input, 'operation', label);
  const content = input.content;
  if (operation === 'upsert' && typeof content !== 'string') {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.content" must be a string`);
  }

  return normalizeRunJSFilePath(
    compactObject({
      path: requireString(input, 'path'),
      operation,
      expectedBlobHash: requireNullableString(input, 'expectedBlobHash'),
      content: operation === 'upsert' ? content : undefined,
      language: optionalString(input, 'language'),
      mode: optionalString(input, 'mode'),
    }) as unknown as RunJSSourceFileChange,
    `${label}.path`,
  );
}

function normalizePreviewFileChange(value: unknown, label: string): VscFileChange {
  const file = normalizeFileChange(value, label);

  return {
    ...file,
    operation: file.operation || 'upsert',
  };
}

function normalizeRunJSPreviewFileChange(value: unknown, label: string): VscFileChange {
  return normalizeRunJSFilePath(normalizePreviewFileChange(value, label), `${label}.path`);
}

function normalizeRunJSFilePath<TFile extends { path: string }>(file: TFile, label: string): TFile {
  return {
    ...file,
    path: normalizeAllowedRunJSWorkspacePath(file.path, label),
  };
}

function normalizeAllowedRunJSWorkspacePath(path: string, label: string): string {
  const validation = validateRunJSWorkspacePathValue(path);
  if (validation.valid && validation.path) {
    return validation.path;
  }

  throw new VscError('PATH_INVALID', validation.message || `RunJS source field "${label}" is invalid`, {
    details: {
      field: label,
      path: validation.path || path,
      reason: validation.reason || 'invalid',
    },
  });
}

function optionalFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): VscFileChange['operation'] | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value === 'upsert' || value === 'delete') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.${key}" is invalid`);
}

function requireFileOperation(
  input: ResourceActionInput,
  key: string,
  label: string,
): RunJSSourceFileChange['operation'] {
  const operation = optionalFileOperation(input, key, label);
  if (operation) {
    return operation;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}.${key}" is required`);
}

function requireRecord(value: unknown, label: string): ResourceActionInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${label}" must be an object`);
  }

  return value as ResourceActionInput;
}

function optionalNumber(input: ResourceActionInput, key: string): number | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a number`);
}

function optionalBoolean(input: ResourceActionInput, key: string): boolean | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a boolean`);
}

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}
