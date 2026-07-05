/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import type { Database } from '@nocobase/database';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import JSZip from 'jszip';

import { VscError, isVscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import {
  defaultRunJSEntryPath,
  resolveRunJSWorkspaceEntryPath,
  runJSManifestPath,
  validateRunJSWorkspacePathValue,
} from '../../shared/runjs-workspace-path';
import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import {
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSLegacySource,
  type RunJSSourceAdapterContext,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceKind,
  type RunJSSourcePermissionResult,
  type RunJSRuntimeArtifact,
  type RunJSSourcePermissionCheck,
  type RunJSSourceOpenResult,
  type RunJSSourcePublishInput,
  type RunJSSourcePublishResult,
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
import type { FileDiffResult } from '../services/DiffService';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';
import { compileRunJSSourceWorkspace, type CompileRunJSSourceWorkspaceResult } from './compiler';

export const runJSSourceActionNames = [
  'open',
  'openLatest',
  'restoreFromCode',
  'compilePreview',
  'publish',
  'exportZip',
  'importZip',
  'syncStatus',
  'listHistory',
  'getVersion',
  'diffVersion',
] as const;

type RunJSSourceActionName = (typeof runJSSourceActionNames)[number];

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

const actionRunners: Record<RunJSSourceActionName, RunJSSourceActionRunner> = {
  open: async (db, registry, permissionHooks, _authoringInspectors, input, ctx): Promise<RunJSSourceOpenResult> => {
    return openRunJSWorkspace(db, registry, permissionHooks, input, ctx, {
      assertPublishedOwnerFingerprint: true,
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
      assertPublishedOwnerFingerprint: false,
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
    const locator = normalizeRunJSSourceLocator(input.locator);
    const adapter = registry.require(locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);
      const userId = adapterCtx.userId;

      await adapter.assertCanWrite({ locator, ctx: adapterCtx });
      const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
      await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);

      const repositoryIdentity = buildRunJSSourceRepositoryIdentity(locator);
      const repository = await openOrCreateRunJSRepository(
        db,
        service,
        repositoryIdentity,
        locator.kind,
        legacy,
        serviceCtx,
      );
      const baseCommitId = repository.headCommitId;
      const basePublishedCommitId = repository.publishedCommitId;
      const basePublishedOwnerFingerprint =
        (await getPublishedOwnerFingerprintForRepository(service, repository, serviceCtx)) || legacy.ownerFingerprint;
      const baseFiles = baseCommitId
        ? (
            await service.pullCommit(
              {
                repoId: repository.id,
                commitId: baseCommitId,
                includeContent: 'all',
              },
              serviceCtx,
            )
          ).files || []
        : [];
      const publishFiles = legacyToPublishedFileChanges(legacy, baseFiles);
      const compileFiles = await materializeRunJSCompileFiles(
        db,
        repository.id,
        baseCommitId,
        {
          files: publishFiles,
        },
        serviceCtx,
      );
      const entryPath = resolveLegacyEntryPath(legacy);
      const runtimeVersion = legacy.version;

      assertRunJSCompileInputLimits(compileFiles);
      const compiled = compileRunJSSourceWorkspace({
        files: compileFiles,
        entry: entryPath,
        runtimeVersion,
        surfaceStyle: legacy.surfaceStyle,
        locator,
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
      const publishMetadata = {
        sourceKind: locator.kind,
        ownerFingerprint: legacy.ownerFingerprint,
        baseOwnerFingerprint: legacy.ownerFingerprint,
        basePublishedOwnerFingerprint,
        filesHash: artifact.filesHash,
        entry: artifact.entryPath || null,
        runtimeVersion: artifact.version,
        surfaceStyle: legacy.surfaceStyle,
        runtimeCodeHash,
      };
      const pushResult = await service.push(
        {
          repoId: repository.id,
          baseCommitId,
          message: 'Recover RunJS source from current code',
          files: publishFiles,
          allowEmptyCommit: true,
          authorId: userId,
          metadata: publishMetadata,
        },
        serviceCtx,
      );
      await service.updateRef(
        {
          repoId: repository.id,
          name: 'published',
          targetCommitId: pushResult.commit.id,
          basePublishedCommitId,
        },
        serviceCtx,
      );
      await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);
      await adapter.writePublished({
        locator,
        artifact,
        commitId: pushResult.commit.id,
        baseOwnerFingerprint: legacy.ownerFingerprint,
        ctx: adapterCtx,
      });
      const nextOwnerFingerprint = await adapter.getFingerprint({
        locator,
        ctx: adapterCtx,
      });
      await updateRunJSPublishedCommitMetadata(
        db,
        pushResult.commit,
        {
          ...publishMetadata,
          ownerFingerprint: nextOwnerFingerprint,
        },
        transaction,
      );

      const refreshedLegacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
      const published = await service.pull(
        { repoId: repository.id, ref: 'published', includeContent: 'all' },
        serviceCtx,
      );
      const permissions = await getRunJSSourcePermissions(
        adapter,
        locator,
        adapterCtx,
        permissionHooks,
        published.repository,
        serviceCtx,
      );
      const history = await service.listCommits({ repoId: repository.id }, serviceCtx);

      return buildOpenResult({
        locator,
        repositoryIdentity,
        legacy: refreshedLegacy,
        repository: published.repository,
        files: ensureRunJSManifestFiles(refreshedLegacy, published.files || []),
        history,
        permissions,
        publishedOwnerFingerprint: nextOwnerFingerprint,
      });
    });
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
    const compiled = compileRunJSSourceWorkspace({
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
  publish: async (
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourcePublishResult> => {
    const publishInput = normalizePublishInput(input);
    const adapter = registry.require(publishInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const request = adapterCtx.request;
      const userId = adapterCtx.userId;

      await adapter.assertCanWrite({ locator: publishInput.locator, ctx: adapterCtx });
      const legacy = await adapter.readLegacy({ locator: publishInput.locator, ctx: adapterCtx });

      await assertCurrentOwnerFingerprint(adapter, publishInput.locator, adapterCtx, publishInput.baseOwnerFingerprint);

      const repositoryIdentity = buildRunJSSourceRepositoryIdentity(publishInput.locator);
      const serviceCtx = {
        authorId: userId,
        request,
        transaction,
      };
      const repository = publishInput.repoId
        ? await service.getRepository({ repoId: publishInput.repoId }, serviceCtx)
        : (
            await service.ensureRepository(
              {
                ...repositoryIdentity,
                authorId: userId,
                metadata: {
                  sourceKind: publishInput.locator.kind,
                },
              },
              serviceCtx,
            )
          ).repository;
      assertRepositoryMatchesIdentity(repository, repositoryIdentity, publishInput.locator.kind);
      const basePublishedOwnerFingerprint =
        publishInput.basePublishedOwnerFingerprint || publishInput.baseOwnerFingerprint;
      await assertPublishedOwnerFingerprintCurrent(service, repository, basePublishedOwnerFingerprint, serviceCtx);
      const publishBase = resolvePublishBase(repository, publishInput);
      const initialCompileFiles = await materializeRunJSCompileFiles(
        db,
        repository.id,
        publishBase.baseCommitId,
        {
          files: publishInput.files,
        },
        serviceCtx,
      );
      const entryPath = selectEntryPath(initialCompileFiles, publishInput.entryPath);
      const runtimeVersion = publishInput.version || legacy.version;
      const publishFiles = withRunJSManifestChange(
        publishInput.files,
        runJSManifestFileChange(entryPath, runtimeVersion, legacy.surfaceStyle, publishInput.files),
      );
      const compileFiles = await materializeRunJSCompileFiles(
        db,
        repository.id,
        publishBase.baseCommitId,
        {
          files: publishFiles,
        },
        serviceCtx,
      );
      assertRunJSCompileInputLimits(compileFiles);
      const compiled = compileRunJSSourceWorkspace({
        files: compileFiles,
        entry: entryPath,
        runtimeVersion,
        surfaceStyle: legacy.surfaceStyle,
        locator: publishInput.locator,
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
      const publishMetadata = {
        sourceKind: publishInput.locator.kind,
        ownerFingerprint: publishInput.baseOwnerFingerprint,
        baseOwnerFingerprint: publishInput.baseOwnerFingerprint,
        basePublishedOwnerFingerprint,
        filesHash: artifact.filesHash,
        entry: artifact.entryPath || null,
        runtimeVersion: artifact.version,
        surfaceStyle: legacy.surfaceStyle,
        runtimeCodeHash,
      };
      const pushResult = await service.push(
        {
          repoId: repository.id,
          baseCommitId: publishBase.baseCommitId,
          message: publishInput.message,
          files: publishFiles,
          authorId: userId,
          metadata: publishMetadata,
        },
        serviceCtx,
      );
      const published = await service.updateRef(
        {
          repoId: repository.id,
          name: 'published',
          targetCommitId: pushResult.commit.id,
          basePublishedCommitId: publishBase.basePublishedCommitId,
        },
        serviceCtx,
      );
      await assertCurrentOwnerFingerprint(adapter, publishInput.locator, adapterCtx, publishInput.baseOwnerFingerprint);
      const writeResult = await adapter.writePublished({
        locator: publishInput.locator,
        artifact,
        commitId: pushResult.commit.id,
        baseOwnerFingerprint: publishInput.baseOwnerFingerprint,
        ctx: adapterCtx,
      });
      const nextOwnerFingerprint = await adapter.getFingerprint({
        locator: publishInput.locator,
        ctx: adapterCtx,
      });
      const commit = await updateRunJSPublishedCommitMetadata(
        db,
        pushResult.commit,
        {
          ...publishMetadata,
          ownerFingerprint: nextOwnerFingerprint,
        },
        transaction,
      );

      return {
        locator: publishInput.locator,
        locatorKind: publishInput.locator.kind,
        repository: published.repository,
        commit,
        publishedRef: published.ref,
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
    });
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
      const repository = await getOrCreateRunJSRepositoryForInput(
        db,
        service,
        exportInput.locator,
        exportInput.repoId,
        legacy,
        serviceCtx,
      );
      const commitId = exportInput.commitId || repository.publishedCommitId || repository.headCommitId;
      const files = commitId
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
        : [];
      const buffer = await createRunJSWorkspaceZip(ensureRunJSManifestFiles(legacy, files));

      ctx.withoutDataWrapping = true;
      ctx.type = 'application/zip';
      ctx.set?.('Content-Type', 'application/zip');
      ctx.set?.('Content-Disposition', `attachment; filename="${buildRunJSZipFileName(legacy)}"`);

      return buffer;
    });
  },
  importZip: async (
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceImportZipResult> => {
    const importInput = normalizeImportZipInput(input);
    const service = new VscFileService(db, permissionHooks);

    const importedFiles = await readRunJSWorkspaceZip(importInput.zipBase64);
    const serviceCtx = createServiceContext(createAdapterContext(ctx), undefined);
    const baseFiles = importInput.repoId
      ? await loadRunJSPublishedFilesForSnapshot(service, importInput, serviceCtx)
      : [];
    const files = createSnapshotFileChanges(baseFiles, importedFiles);
    const manifest = readRunJSWorkspaceManifest(importedFiles);
    const result = (await actionRunners.publish(
      db,
      registry,
      permissionHooks,
      authoringInspectors,
      {
        locator: importInput.locator,
        repoId: importInput.repoId,
        baseCommitId: importInput.baseCommitId,
        basePublishedCommitId: importInput.basePublishedCommitId,
        baseOwnerFingerprint: importInput.baseOwnerFingerprint,
        basePublishedOwnerFingerprint: importInput.basePublishedOwnerFingerprint,
        message: importInput.message,
        files,
        entryPath: importInput.entryPath || manifest.entryPath,
        version: importInput.version || manifest.version,
      },
      ctx,
    )) as RunJSSourcePublishResult;

    return {
      ...result,
      import: {
        fileCount: importedFiles.length,
        filesHash: result.artifact.filesHash,
      },
    };
  },
  syncStatus: async (
    db,
    registry,
    permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceSyncStatusResult> => {
    const syncInput = normalizeSyncStatusInput(input);
    const adapter = registry.require(syncInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: syncInput.locator, ctx: adapterCtx });
      const legacy = await adapter.readLegacy({ locator: syncInput.locator, ctx: adapterCtx });
      const repository = await getOrCreateRunJSRepositoryForInput(
        db,
        service,
        syncInput.locator,
        syncInput.repoId,
        legacy,
        serviceCtx,
      );
      const publishedCommit = repository.publishedCommitId
        ? await service.getCommit({ repoId: repository.id, commitId: repository.publishedCommitId }, serviceCtx)
        : null;
      const metadata = publishedCommit?.metadata || {};

      return {
        locator: syncInput.locator,
        locatorKind: syncInput.locator.kind,
        repository: serializeRepository(repository),
        publishedCommitId: repository.publishedCommitId,
        headCommitId: repository.headCommitId,
        filesHash: toNullableStringValue(metadata.filesHash),
        runtimeCodeHash: toNullableStringValue(metadata.runtimeCodeHash),
        entry: toNullableStringValue(metadata.entry),
        runtimeVersion: toNullableStringValue(metadata.runtimeVersion),
        updatedAt: publishedCommit?.createdAt || null,
        ownerFingerprint: toNullableStringValue(metadata.ownerFingerprint),
      };
    });
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
      const items = serializeHistory(commits, repository.publishedCommitId);

      return {
        locator: historyInput.locator,
        locatorKind: historyInput.locator.kind,
        repository: serializeRepository(repository),
        commits: items,
        items,
        nextBeforeSeq: items.length ? items[items.length - 1].seq : null,
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
        commit: markPublishedCommit(commit, repository.publishedCommitId),
        files: pull?.files || [],
      };
    });
  },
  diffVersion: async (
    db,
    registry,
    permissionHooks,
    _authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceDiffVersionResult> => {
    const diffInput = normalizeDiffVersionInput(input);
    const adapter = registry.require(diffInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: diffInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, diffInput.repoId, diffInput.locator, serviceCtx);
      const toCommitId = diffInput.toCommitId || diffInput.commitId;
      const toCommit = await service.getCommit({ repoId: repository.id, commitId: toCommitId }, serviceCtx);
      const fromCommitId = diffInput.fromCommitId ?? toCommit.parentCommitId;
      const diff = fromCommitId
        ? await service.diffCommits({ repoId: repository.id, fromCommitId, toCommitId: toCommit.id }, serviceCtx)
        : diffWorkspaceFiles(
            [],
            (
              (
                await service.pullCommit(
                  { repoId: repository.id, commitId: toCommit.id, includeContent: 'all' },
                  serviceCtx,
                )
              ).files || []
            ).map(fileChangeFromPulledFile),
          );

      return {
        locator: diffInput.locator,
        locatorKind: diffInput.locator.kind,
        repository: serializeRepository(repository),
        fromCommitId,
        toCommitId: toCommit.id,
        fromIsPublished: Boolean(fromCommitId && fromCommitId === repository.publishedCommitId),
        toIsPublished: toCommit.id === repository.publishedCommitId,
        diff,
      };
    });
  },
};

type RunJSSourceLocatorInput = RunJSSourcePublishInput['locator'];

type RunJSSourceRepositoryResponse = VscRepositoryRecord & {
  repoId: string;
};

interface RunJSSourceRepoInput {
  locator: RunJSSourceLocatorInput;
  repoId: string;
}

interface RunJSSourceCompilePreviewInput {
  locator: RunJSSourceLocatorInput;
  repoId?: string;
  baseCommitId?: string | null;
  files: VscFileChange[];
  entryPath?: string;
  version?: string;
}

interface RunJSSourceExportZipInput {
  locator: RunJSSourceLocatorInput;
  repoId?: string;
  commitId?: string;
}

interface RunJSSourceImportZipInput {
  locator: RunJSSourceLocatorInput;
  repoId?: string;
  baseCommitId: string | null;
  basePublishedCommitId: string | null;
  baseOwnerFingerprint: string;
  basePublishedOwnerFingerprint?: string;
  message: string;
  zipBase64: string;
  entryPath?: string;
  version?: string;
}

interface RunJSSourceSyncStatusInput {
  locator: RunJSSourceLocatorInput;
  repoId?: string;
}

interface RunJSSourceHistoryInput extends RunJSSourceRepoInput {
  limit?: number;
  beforeSeq?: number;
}

interface RunJSSourceGetVersionInput extends RunJSSourceRepoInput {
  commitId: string;
  includeFiles: boolean;
}

interface RunJSSourceDiffVersionInput extends RunJSSourceRepoInput {
  commitId: string;
  fromCommitId?: string;
  toCommitId?: string;
}

interface RunJSSourceCompilePreviewResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  artifact: RunJSRuntimeArtifact;
}

interface RunJSCompileMaterializationInput {
  files: VscFileChange[];
}

interface OpenRunJSWorkspaceOptions {
  assertPublishedOwnerFingerprint: boolean;
}

interface RunJSSourceHistoryItem extends VscCommitRecord {
  isPublished: boolean;
}

interface RunJSSourceHistoryResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  commits: RunJSSourceHistoryItem[];
  items: RunJSSourceHistoryItem[];
  nextBeforeSeq: number | null;
}

interface RunJSSourceVersionResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  commit: RunJSSourceHistoryItem;
  files: PulledFile[];
}

interface RunJSSourceDiffVersionResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  fromCommitId: string | null;
  toCommitId: string;
  fromIsPublished: boolean;
  toIsPublished: boolean;
  diff: FileDiffResult;
}

interface RunJSSourcePermissions {
  canWrite: boolean;
  canPublish: boolean;
}

interface BuildOpenResultInput {
  locator: RunJSSourceLocatorInput;
  repositoryIdentity: VscRepositoryIdentity;
  legacy: RunJSLegacySource;
  publishedOwnerFingerprint?: string | null;
  repository: VscRepositoryRecord;
  files: PulledFile[];
  history: VscCommitRecord[];
  permissions: RunJSSourcePermissions;
}

interface WorkspaceFile {
  path: string;
  pathHash: string;
  content: string;
  language?: string;
  mode?: string;
}

interface RunJSContentFile {
  path: string;
  content: string;
}

interface PublishCompileFile {
  path: string;
  content: string;
  blobHash?: string;
  size?: number;
  language?: string;
  mode?: string;
}

interface RunJSSourceImportZipResult extends RunJSSourcePublishResult {
  import: {
    fileCount: number;
    filesHash: string;
  };
}

interface RunJSSourceSyncStatusResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  publishedCommitId: string | null;
  headCommitId: string | null;
  filesHash: string | null;
  runtimeCodeHash: string | null;
  entry: string | null;
  runtimeVersion: string | null;
  updatedAt: string | null;
  ownerFingerprint: string | null;
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

async function readRunJSWorkspaceZip(zipBase64: string): Promise<VscFileChange[]> {
  const buffer = decodeBase64Buffer(zipBase64, 'zipBase64');
  if (buffer.length > maxRepoTextSize) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP size must not exceed ${maxRepoTextSize} bytes`, {
      details: {
        size: buffer.length,
        maxRepoTextSize,
      },
    });
  }

  const zip = await JSZip.loadAsync(buffer);
  const filesByPath = new Map<string, VscFileChange>();
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  for (const entry of entries) {
    const path = normalizeAllowedRunJSWorkspacePath(entry.name, 'zip.entry');
    if (filesByPath.has(path)) {
      throw new VscError('PATH_INVALID', `Duplicate file path "${path}" in ZIP`);
    }
    filesByPath.set(path, {
      path,
      operation: 'upsert',
      content: await entry.async('string'),
    });
  }

  const files = Array.from(filesByPath.values()).sort((left, right) => left.path.localeCompare(right.path));
  assertRunJSCompileInputLimits(files);

  return files;
}

function decodeBase64Buffer(value: string, field: string): Buffer {
  const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
  if (!normalized.trim()) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${field}" is invalid`);
  }

  return Buffer.from(normalized, 'base64');
}

function createSnapshotFileChanges(baseFiles: PulledFile[], snapshotFiles: VscFileChange[]): VscFileChange[] {
  const snapshotPaths = new Set(snapshotFiles.map((file) => normalizePath(file.path)));
  const changes = [...snapshotFiles];

  for (const baseFile of baseFiles) {
    const normalizedPath = normalizePath(baseFile.path);
    if (!snapshotPaths.has(normalizedPath)) {
      changes.push({
        path: normalizedPath,
        operation: 'delete',
      });
    }
  }

  return changes.sort((left, right) => left.path.localeCompare(right.path));
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

async function loadRunJSPublishedFilesForSnapshot(
  service: VscFileService,
  input: RunJSSourceImportZipInput,
  serviceCtx: VscServiceContext,
): Promise<PulledFile[]> {
  if (!input.repoId || !input.baseCommitId) {
    return [];
  }

  const repository = await getRunJSRepository(service, input.repoId, input.locator, serviceCtx);
  return (
    (
      await service.pullCommit(
        {
          repoId: repository.id,
          commitId: input.baseCommitId,
          includeContent: 'all',
        },
        serviceCtx,
      )
    ).files || []
  );
}

async function getOrCreateRunJSRepositoryForInput(
  db: Database,
  service: VscFileService,
  locator: RunJSSourceLocatorInput,
  repoId: string | undefined,
  legacy: RunJSLegacySource,
  serviceCtx: VscServiceContext,
): Promise<VscRepositoryRecord> {
  if (repoId) {
    return getRunJSRepository(service, repoId, locator, serviceCtx);
  }

  return openOrCreateRunJSRepository(
    db,
    service,
    buildRunJSSourceRepositoryIdentity(locator),
    locator.kind,
    legacy,
    serviceCtx,
  );
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
    const repositoryIdentity = buildRunJSSourceRepositoryIdentity(locator);
    const repository = await openOrCreateRunJSRepository(
      db,
      service,
      repositoryIdentity,
      locator.kind,
      legacy,
      serviceCtx,
    );
    const publishedOwnerFingerprint = await getPublishedOwnerFingerprintForRepository(service, repository, serviceCtx);

    if (options.assertPublishedOwnerFingerprint) {
      assertPublishedOwnerFingerprintMatches(publishedOwnerFingerprint, legacy.ownerFingerprint);
    }

    const published = await service.pull(
      { repoId: repository.id, ref: 'published', includeContent: 'all' },
      serviceCtx,
    );
    const permissions = await getRunJSSourcePermissions(
      adapter,
      locator,
      adapterCtx,
      permissionHooks,
      published.repository,
      serviceCtx,
    );
    const history = await service.listCommits({ repoId: repository.id }, serviceCtx);

    return buildOpenResult({
      locator,
      repositoryIdentity,
      legacy,
      publishedOwnerFingerprint,
      repository: published.repository,
      files: ensureRunJSManifestFiles(legacy, published.files || []),
      history,
      permissions,
    });
  });
}

async function openOrCreateRunJSRepository(
  db: Database,
  service: VscFileService,
  identity: VscRepositoryIdentity,
  sourceKind: RunJSSourceKind,
  legacy: RunJSLegacySource,
  serviceCtx: VscServiceContext,
): Promise<VscRepositoryRecord> {
  const existingRepository = await findRunJSRepositoryByIdentity(db, service, identity, serviceCtx);
  if (existingRepository) {
    return existingRepository;
  }

  return ensureRunJSRepository(service, identity, sourceKind, legacy, serviceCtx);
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

  if (!ensured.initialCommit) {
    return ensured.repository;
  }

  return (
    await service.updateRef(
      {
        repoId: ensured.repository.id,
        name: 'published',
        targetCommitId: ensured.initialCommit.id,
        basePublishedCommitId: null,
      },
      serviceCtx,
    )
  ).repository;
}

function legacyToInitialFile(legacy: RunJSLegacySource): VscTreeEntryInput {
  return {
    path: resolveLegacyEntryPath(legacy),
    content: legacy.code,
    language: legacy.language,
  };
}

function legacyToPublishedFileChanges(legacy: RunJSLegacySource, baseFiles: PulledFile[]): VscFileChange[] {
  const nextFiles = [legacyToInitialFile(legacy), defaultRunJSManifestFile(legacy)];
  const nextPaths = new Set(nextFiles.map((file) => normalizePath(file.path)));
  const changes: VscFileChange[] = nextFiles.map((file) => ({
    ...file,
    operation: 'upsert' as const,
  }));

  for (const baseFile of baseFiles) {
    const normalizedPath = normalizePath(baseFile.path);
    if (!nextPaths.has(normalizedPath)) {
      changes.push({
        path: normalizedPath,
        operation: 'delete',
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
    runtimeVersion: resolveRunJSManifestRuntimeVersion(surfaceStyle, runtimeVersion),
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

function resolveRunJSManifestRuntimeVersion(
  surfaceStyle: RunJSLegacySource['surfaceStyle'],
  runtimeVersion: string,
): string {
  return surfaceStyle === 'workflow' ? 'workflow-js' : runtimeVersion;
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
  const canWrite = await canWriteRunJSSource(adapter, locator, adapterCtx, permissionHooks, repository, serviceCtx);
  const canPublish = await canPublishRunJSSource(adapter, locator, adapterCtx, permissionHooks, repository, serviceCtx);

  return {
    canWrite,
    canPublish,
  };
}

async function canWriteRunJSSource(
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

async function canPublishRunJSSource(
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
    await permissionHooks?.assertAllowed({
      userId: serviceCtx.authorId ?? null,
      action: 'updateRef',
      repoId: repository.id,
      repository,
      request: serviceCtx.request,
      refName: 'published',
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
  return [
    ...files,
    {
      path: manifest.path,
      pathHash: pathHash(manifest.path),
      pathLowerHash: pathLowerHash(manifest.path),
      blobHash: '',
      size: Buffer.byteLength(String(manifest.content || ''), 'utf8'),
      language: manifest.language || 'json',
      mode: manifest.mode || '100644',
      content: String(manifest.content || ''),
    },
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function buildOpenResult(input: BuildOpenResultInput): RunJSSourceOpenResult & Record<string, unknown> {
  const history = serializeHistory(input.history, input.repository.publishedCommitId);
  const publishedOwnerFingerprint = input.publishedOwnerFingerprint || input.legacy.ownerFingerprint;

  return {
    locator: input.locator,
    locatorKind: input.locator.kind,
    repositoryIdentity: input.repositoryIdentity,
    legacy: input.legacy,
    ownerFingerprint: input.legacy.ownerFingerprint,
    publishedOwnerFingerprint,
    source: {
      label: input.legacy.label,
      kind: input.locator.kind,
      surfaceStyle: input.legacy.surfaceStyle,
      runtimeVersion: input.legacy.version,
      language: input.legacy.language,
      ownerFingerprint: input.legacy.ownerFingerprint,
      publishedOwnerFingerprint,
      metadata: input.legacy.metadata,
    },
    repository: serializeRepository(input.repository),
    files: input.files,
    permissions: {
      canRead: true,
      canWrite: input.permissions.canWrite,
      canPublish: input.permissions.canPublish,
    },
    history: {
      commits: history,
      items: history,
    },
  };
}

function serializeRepository(repository: VscRepositoryRecord): RunJSSourceRepositoryResponse {
  return {
    ...repository,
    repoId: repository.id,
  };
}

function serializeHistory(commits: VscCommitRecord[], publishedCommitId: string | null): RunJSSourceHistoryItem[] {
  return commits.map((commit) => markPublishedCommit(commit, publishedCommitId));
}

function markPublishedCommit(commit: VscCommitRecord, publishedCommitId: string | null): RunJSSourceHistoryItem {
  return {
    ...commit,
    isPublished: commit.id === publishedCommitId,
  };
}

function resolvePublishBase(
  repository: VscRepositoryRecord,
  input: RunJSSourcePublishInput,
): Pick<RunJSSourcePublishInput, 'baseCommitId' | 'basePublishedCommitId'> {
  if (
    input.repoId ||
    input.baseCommitId !== null ||
    input.basePublishedCommitId !== null ||
    !repository.headCommitId ||
    repository.publishedCommitId !== repository.headCommitId
  ) {
    return {
      baseCommitId: input.baseCommitId,
      basePublishedCommitId: input.basePublishedCommitId,
    };
  }

  return {
    baseCommitId: repository.headCommitId,
    basePublishedCommitId: repository.publishedCommitId,
  };
}

function diffWorkspaceFiles(baseFiles: PulledFile[], changes: VscFileChange[]): FileDiffResult {
  const baseByPath = new Map(baseFiles.map((file) => [normalizePath(file.path), workspaceFileFromPulledFile(file)]));
  const nextByPath = new Map(baseByPath);

  for (const change of changes) {
    const normalizedPath = normalizePath(change.path);
    const operation = change.operation || 'upsert';

    if (operation === 'delete') {
      nextByPath.delete(normalizedPath);
      continue;
    }

    const current = baseByPath.get(normalizedPath);
    nextByPath.set(normalizedPath, {
      path: normalizedPath,
      pathHash: pathHash(normalizedPath),
      content: typeof change.content === 'string' ? change.content : current?.content || '',
      language: change.language || current?.language,
      mode: change.mode || current?.mode,
    });
  }

  return diffWorkspaceFileMaps(baseByPath, nextByPath);
}

function diffWorkspaceFileMaps(
  baseByPath: Map<string, WorkspaceFile>,
  nextByPath: Map<string, WorkspaceFile>,
): FileDiffResult {
  const files: FileDiffResult['files'] = [];
  const paths = Array.from(new Set([...baseByPath.keys(), ...nextByPath.keys()])).sort();

  for (const path of paths) {
    const base = baseByPath.get(path);
    const next = nextByPath.get(path);
    if (base && next && base.content === next.content && base.language === next.language && base.mode === next.mode) {
      continue;
    }

    const status = !base ? 'added' : !next ? 'deleted' : 'modified';
    const lineCounts = countChangedLines(base?.content || '', next?.content || '');
    files.push({
      status,
      path,
      pathHash: pathHash(path),
      oldPath: base?.path,
      oldPathHash: base?.pathHash,
      language: next?.language,
      oldLanguage: base?.language,
      mode: next?.mode,
      oldMode: base?.mode,
      size: next ? Buffer.byteLength(next.content) : undefined,
      oldSize: base ? Buffer.byteLength(base.content) : undefined,
      additions: lineCounts.additions,
      deletions: lineCounts.deletions,
      tooLarge: false,
    });
  }

  return {
    files,
    summary: {
      added: files.filter((file) => file.status === 'added').length,
      modified: files.filter((file) => file.status === 'modified').length,
      deleted: files.filter((file) => file.status === 'deleted').length,
      unchanged: 0,
      renamed: 0,
    },
  };
}

function workspaceFileFromPulledFile(file: PulledFile): WorkspaceFile {
  const normalizedPath = normalizePath(file.path);

  return {
    path: normalizedPath,
    pathHash: file.pathHash || pathHash(normalizedPath),
    content: file.content || '',
    language: file.language,
    mode: file.mode,
  };
}

function countChangedLines(oldContent: string, newContent: string): { additions: number; deletions: number } {
  if (!oldContent) {
    return {
      additions: countLines(newContent),
      deletions: 0,
    };
  }
  if (!newContent) {
    return {
      additions: 0,
      deletions: countLines(oldContent),
    };
  }

  return {
    additions: countLines(newContent),
    deletions: countLines(oldContent),
  };
}

function countLines(content: string): number {
  if (!content) {
    return 0;
  }

  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

function fileChangeFromPulledFile(file: PulledFile): VscFileChange {
  return {
    path: file.path,
    operation: 'upsert',
    content: file.content || '',
    language: file.language,
    mode: file.mode,
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
  const baseCommitId =
    input.baseCommitId === undefined ? repository.publishedCommitId ?? repository.headCommitId : input.baseCommitId;

  return materializeRunJSCompileFiles(
    db,
    repository.id,
    baseCommitId,
    {
      files: input.files,
    },
    serviceCtx,
  );
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
    const content = await resolvePublishCompileFileContent(db, change, allowedBlobHashes, serviceCtx.transaction);
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

function canonicalCompileFileChange(file: PublishCompileFile): VscFileChange {
  const change: VscFileChange = {
    path: file.path,
    operation: 'upsert',
    content: file.content,
  };
  if (file.language) {
    change.language = file.language;
  }
  if (file.mode) {
    change.mode = file.mode;
  }

  return change;
}

async function loadCommitFilesForCompile(
  db: Database,
  repoId: string,
  commitId: string,
  transaction: VscServiceContext['transaction'],
): Promise<PublishCompileFile[]> {
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
  const files: PublishCompileFile[] = [];
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

async function resolvePublishCompileFileContent(
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

  throw new VscError(result.failureCode || 'RUNJS_COMPILE_FAILED', 'RunJS source could not be compiled', {
    details: {
      diagnostics: errorDiagnostics,
    },
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
  locator: RunJSSourcePublishInput['locator'],
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

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source owner was changed by another writer', {
    details: {
      expected: currentFingerprint,
      received: baseOwnerFingerprint,
      kind: locator.kind,
    },
  });
}

async function assertPublishedOwnerFingerprintCurrent(
  service: VscFileService,
  repository: VscRepositoryRecord,
  currentOwnerFingerprint: string,
  serviceCtx: VscServiceContext,
): Promise<void> {
  const publishedOwnerFingerprint = await getPublishedOwnerFingerprintForRepository(service, repository, serviceCtx);
  assertPublishedOwnerFingerprintMatches(publishedOwnerFingerprint, currentOwnerFingerprint);
}

async function getPublishedOwnerFingerprintForRepository(
  service: VscFileService,
  repository: VscRepositoryRecord,
  serviceCtx: VscServiceContext,
): Promise<string | null> {
  if (!repository.publishedCommitId) {
    return null;
  }

  const publishedCommit = await service.getCommit(
    {
      repoId: repository.id,
      commitId: repository.publishedCommitId,
    },
    serviceCtx,
  );

  return getPublishedOwnerFingerprint(publishedCommit);
}

function assertPublishedOwnerFingerprintMatches(
  publishedOwnerFingerprint: string | null,
  currentOwnerFingerprint: string,
): void {
  if (!publishedOwnerFingerprint || publishedOwnerFingerprint === currentOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS source owner was changed by another writer', {
    details: {
      expected: publishedOwnerFingerprint,
      received: currentOwnerFingerprint,
    },
  });
}

function getPublishedOwnerFingerprint(commit: VscCommitRecord): string | null {
  const ownerFingerprint = commit.metadata?.ownerFingerprint;
  return typeof ownerFingerprint === 'string' && ownerFingerprint ? ownerFingerprint : null;
}

async function updateRunJSPublishedCommitMetadata(
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
): ResourceOptions {
  return {
    name: 'runJSSources',
    only: [...runJSSourceActionNames],
    actions: Object.fromEntries(
      runJSSourceActionNames.map((actionName) => [
        actionName,
        createRunJSSourceAction(db, registry, permissionHooks, authoringInspectors, actionRunners[actionName]),
      ]),
    ) as Record<RunJSSourceActionName, HandlerType>,
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
  const repoId = optionalString(input, 'repoId');
  const hasExplicitBaseInput = hasOwn(input, 'baseCommitId') || hasOwn(input, 'basePublishedCommitId');

  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId,
    baseCommitId: normalizePublishBaseInput(input, 'baseCommitId', repoId, hasExplicitBaseInput),
    basePublishedCommitId: normalizePublishBaseInput(input, 'basePublishedCommitId', repoId, hasExplicitBaseInput),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    basePublishedOwnerFingerprint: optionalString(input, 'basePublishedOwnerFingerprint'),
    message: requireCommitMessage(input.message || 'Import RunJS workspace'),
    zipBase64: requireString(input, 'zipBase64'),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function normalizeSyncStatusInput(input: ResourceActionInput): RunJSSourceSyncStatusInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
  };
}

function normalizeHistoryInput(input: ResourceActionInput): RunJSSourceHistoryInput {
  return {
    ...normalizeRepoInput(input),
    limit: optionalNumber(input, 'limit'),
    beforeSeq: optionalNumber(input, 'beforeSeq'),
  };
}

function normalizeGetVersionInput(input: ResourceActionInput): RunJSSourceGetVersionInput {
  return {
    ...normalizeRepoInput(input),
    commitId: requireString(input, 'commitId'),
    includeFiles: optionalBoolean(input, 'includeFiles') ?? false,
  };
}

function normalizeDiffVersionInput(input: ResourceActionInput): RunJSSourceDiffVersionInput {
  const commitId = optionalString(input, 'commitId');
  const toCommitId = optionalString(input, 'toCommitId');
  const targetCommitId = toCommitId || commitId;

  if (!targetCommitId) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS source field "commitId" or "toCommitId" is required');
  }

  return {
    ...normalizeRepoInput(input),
    commitId: targetCommitId,
    fromCommitId: optionalString(input, 'fromCommitId'),
    toCommitId,
  };
}

function normalizePublishInput(input: ResourceActionInput): RunJSSourcePublishInput {
  const repoId = optionalString(input, 'repoId');
  const hasExplicitBaseInput = hasOwn(input, 'baseCommitId') || hasOwn(input, 'basePublishedCommitId');

  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId,
    baseCommitId: normalizePublishBaseInput(input, 'baseCommitId', repoId, hasExplicitBaseInput),
    basePublishedCommitId: normalizePublishBaseInput(input, 'basePublishedCommitId', repoId, hasExplicitBaseInput),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    basePublishedOwnerFingerprint: optionalString(input, 'basePublishedOwnerFingerprint'),
    message: requireCommitMessage(input.message),
    files: requireArray(input, 'files', normalizeRunJSFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
  };
}

function normalizePublishBaseInput(
  input: ResourceActionInput,
  key: 'baseCommitId' | 'basePublishedCommitId',
  repoId: string | undefined,
  hasExplicitBaseInput: boolean,
): string | null {
  if (repoId || hasExplicitBaseInput) {
    return requireNullableString(input, key);
  }

  return null;
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

function hasOwn(input: ResourceActionInput, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function requireNullableString(input: ResourceActionInput, key: string): string | null {
  const value = input[key];
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be a string or null`);
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

function requireCommitMessage(value: unknown): string {
  if (typeof value !== 'string') {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS publish commit message is required');
  }
  const message = value.trim();
  if (message.length < 3 || message.length > 200) {
    throw new VscError('RUNJS_COMMIT_MESSAGE_INVALID', 'RunJS publish commit message must be 3-200 characters');
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
  }) as VscFileChange;
}

function normalizeRunJSFileChange(value: unknown, label: string): VscFileChange {
  return normalizeRunJSFilePath(normalizeFileChange(value, label), `${label}.path`);
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

function optionalRecord(input: ResourceActionInput, key: string): Record<string, unknown> | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be an object`);
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

function toNullableStringValue(value: unknown): string | null {
  const stringValue = toStringValue(value);
  return stringValue || null;
}
