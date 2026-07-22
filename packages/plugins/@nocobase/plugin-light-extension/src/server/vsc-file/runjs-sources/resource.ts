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
import type {
  FlowSurfaceRunJSWorkspaceBootstrapInput,
  FlowSurfaceRunJSWorkspaceBootstrapPort,
} from '@nocobase/plugin-flow-engine';
import type { HandlerType, ResourceOptions } from '@nocobase/resourcer';
import JSZip, { type JSZipObject } from 'jszip';
import type { Readable } from 'stream';

import { VscError, isVscError } from '../../../shared/vsc-file/errors';
import { sha256Hex } from '../../../shared/vsc-file/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../../shared/vsc-file/path';
import {
  defaultRunJSEntryPath,
  resolveRunJSWorkspaceEntryPath,
  runJSManifestPath,
  validateRunJSWorkspacePathValue,
} from '../../../shared/vsc-file/runjs-workspace-path';
import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../../shared/vsc-file/constants';
import {
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSLegacySource,
  type RunJSSourceInitialSource,
  type RunJSSourceAdapterContext,
  type RunJSSourceAuthoringLegacyInfo,
  type RunJSSourceAuthoringInspector,
  type RunJSSourceKind,
  type RunJSSourcePermissionResult,
  type RunJSRuntimeArtifact,
  type RunJSSourcePermissionCheck,
  type RunJSSourceOpenResult,
  type RunJSSourceSaveInput,
  type RunJSSourceSaveResult,
} from '../../../shared/vsc-file/runjs-source-types';
import type {
  VscCommitRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscTreeEntryInput,
} from '../../../shared/vsc-file/types';
import { normalizeText } from '../../../shared/vsc-file/text';
import type { VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';
import { canonicalizeRunJSCompileFile } from './canonicalCompileFiles';
import { compileRunJSSourceWorkspace, type CompileRunJSSourceWorkspaceResult } from './compiler';

const inlineRunJSEntryDescriptorPath = 'src/client/entry.json';
const emptyRunJSRenderSource = 'ctx.render(null);';

export const runJSSourceActionNames = [
  'open',
  'openLatest',
  'restoreFromCode',
  'compilePreview',
  'save',
  'exportZip',
  'importZip',
  'listHistory',
  'getVersion',
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
      const saveFiles = legacyToRuntimeFileChanges(legacy, baseFiles);
      const compileFiles = await materializeRunJSCompileFiles(
        db,
        repository.id,
        baseCommitId,
        {
          files: saveFiles,
        },
        serviceCtx,
      );
      const entryPath = resolveLegacyEntryPath(legacy);
      const runtimeVersion = legacy.version;

      assertRunJSCompileInputLimits(compileFiles);
      const compiled = await compileRunJSSourceWorkspace({
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
      const saveMetadata = {
        sourceKind: locator.kind,
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
          message: 'Recover RunJS source from current code',
          files: saveFiles,
          allowEmptyCommit: true,
          authorId: userId,
          metadata: saveMetadata,
        },
        serviceCtx,
      );
      await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);
      await adapter.writeRuntime({
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
      await updateRunJSCommitMetadata(
        db,
        pushResult.commit,
        {
          ...saveMetadata,
          ownerFingerprint: nextOwnerFingerprint,
        },
        transaction,
      );

      const refreshedLegacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
      const head = await service.pull({ repoId: repository.id, ref: 'head', includeContent: 'all' }, serviceCtx);
      const permissions = await getRunJSSourcePermissions(
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
        legacy: refreshedLegacy,
        repository: head.repository,
        files: ensureRunJSManifestFiles(refreshedLegacy, head.files || []),
        history,
        permissions,
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
  save: async (db, registry, permissionHooks, authoringInspectors, input, ctx): Promise<RunJSSourceSaveResult> => {
    const saveInput = normalizeSaveInput(input);
    const adapter = registry.require(saveInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const request = adapterCtx.request;
      const userId = adapterCtx.userId;

      await adapter.assertCanWrite({ locator: saveInput.locator, ctx: adapterCtx });

      const repositoryIdentity = buildRunJSSourceRepositoryIdentity(saveInput.locator);
      const serviceCtx = {
        authorId: userId,
        request,
        transaction,
      };
      const repository = saveInput.repoId
        ? await service.getRepositoryForUpdate({ repoId: saveInput.repoId }, serviceCtx)
        : await service.getRepositoryForUpdate(
            {
              repoId: (
                await service.ensureRepository(
                  {
                    ...repositoryIdentity,
                    authorId: userId,
                    metadata: {
                      sourceKind: saveInput.locator.kind,
                    },
                  },
                  serviceCtx,
                )
              ).repository.id,
            },
            serviceCtx,
          );
      assertRepositoryMatchesIdentity(repository, repositoryIdentity, saveInput.locator.kind);
      assertBaseCommitMatches(saveInput.baseCommitId, repository.headCommitId);
      const legacy = await adapter.readLegacy({ locator: saveInput.locator, ctx: adapterCtx });
      const baseCommitId = repository.headCommitId;
      const headOwnerFingerprint = await getHeadOwnerFingerprintForRepository(service, repository, serviceCtx);
      assertBaseOwnerFingerprintMatches(
        saveInput.baseOwnerFingerprint,
        headOwnerFingerprint,
        legacy.ownerFingerprint,
        saveInput.locator.kind,
      );
      assertHeadOwnerFingerprintMatches(headOwnerFingerprint, legacy.ownerFingerprint);
      await assertCurrentOwnerFingerprint(adapter, saveInput.locator, adapterCtx, legacy.ownerFingerprint);
      const validatedOwnerFingerprint = legacy.ownerFingerprint;
      const initialCompileFiles = await buildOverwriteRunJSFileChanges(
        db,
        repository.id,
        baseCommitId,
        saveInput.files,
        serviceCtx,
      );
      const entryPath = selectEntryPath(initialCompileFiles, saveInput.entryPath);
      const runtimeVersion = saveInput.version || legacy.version;
      const saveFiles = withRunJSManifestChange(
        saveInput.files,
        runJSManifestFileChange(entryPath, runtimeVersion, legacy.surfaceStyle, saveInput.files),
      );
      const overwriteFiles = await buildOverwriteRunJSFileChanges(
        db,
        repository.id,
        baseCommitId,
        saveFiles,
        serviceCtx,
      );
      const compileFiles = await materializeRunJSCompileFiles(
        db,
        repository.id,
        baseCommitId,
        {
          files: overwriteFiles,
        },
        serviceCtx,
      );
      assertRunJSCompileInputLimits(compileFiles);
      const compiled = await compileRunJSSourceWorkspace({
        files: compileFiles,
        entry: entryPath,
        runtimeVersion,
        surfaceStyle: legacy.surfaceStyle,
        locator: saveInput.locator,
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
        sourceKind: saveInput.locator.kind,
        ownerFingerprint: validatedOwnerFingerprint,
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
          message: saveInput.message,
          files: overwriteFiles,
          authorId: userId,
          metadata: saveMetadata,
        },
        serviceCtx,
      );
      await assertCurrentOwnerFingerprint(adapter, saveInput.locator, adapterCtx, validatedOwnerFingerprint);
      const writeResult = await adapter.writeRuntime({
        locator: saveInput.locator,
        artifact,
        commitId: pushResult.commit.id,
        baseOwnerFingerprint: validatedOwnerFingerprint,
        ctx: adapterCtx,
      });
      const nextOwnerFingerprint = await adapter.getFingerprint({
        locator: saveInput.locator,
        ctx: adapterCtx,
      });
      const commit = await updateRunJSCommitMetadata(
        db,
        pushResult.commit,
        {
          ...saveMetadata,
          ownerFingerprint: nextOwnerFingerprint,
        },
        transaction,
      );

      return {
        locator: saveInput.locator,
        locatorKind: saveInput.locator.kind,
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
    db,
    registry,
    permissionHooks,
    authoringInspectors,
    input,
    ctx,
  ): Promise<RunJSSourceImportZipResult> => {
    const importInput = normalizeImportZipInput(input);

    const importedFiles = await readRunJSWorkspaceZip(importInput.zipBase64);
    const manifest = readRunJSWorkspaceManifest(importedFiles);
    const result = (await actionRunners.save(
      db,
      registry,
      permissionHooks,
      authoringInspectors,
      {
        locator: importInput.locator,
        repoId: importInput.repoId,
        baseCommitId: importInput.baseCommitId,
        baseOwnerFingerprint: importInput.baseOwnerFingerprint,
        message: importInput.message,
        files: importedFiles,
        entryPath: importInput.entryPath || manifest.entryPath,
        version: importInput.version || manifest.version,
      },
      ctx,
    )) as RunJSSourceSaveResult;

    return {
      ...result,
      import: {
        fileCount: importedFiles.length,
        filesHash: result.artifact.filesHash,
      },
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

export function createFlowSurfaceRunJSWorkspaceBootstrapPort(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks?: VscPermissionHookRegistry,
  authoringInspectors?: RunJSSourceAuthoringInspectorRegistry,
): FlowSurfaceRunJSWorkspaceBootstrapPort {
  return async (input) => {
    await bootstrapFlowSurfaceRunJSWorkspace(db, registry, permissionHooks, authoringInspectors, input);

    return {
      status: 'ready',
      retryable: false,
    };
  };
}

async function bootstrapFlowSurfaceRunJSWorkspace(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  authoringInspectors: RunJSSourceAuthoringInspectorRegistry | undefined,
  input: FlowSurfaceRunJSWorkspaceBootstrapInput,
): Promise<void> {
  const locator = normalizeRunJSSourceLocator(input.locator);
  const adapter = registry.require(locator.kind);
  const service = new VscFileService(db, permissionHooks);
  const adapterCtx = createBootstrapAdapterContext(input);
  const serviceCtx = createServiceContext(adapterCtx, input.transaction);

  await adapter.assertCanWrite({ locator, ctx: adapterCtx });
  const legacy = await adapter.readLegacy({ locator, ctx: adapterCtx });
  assertBootstrapHostMatches(input.hostKind, legacy);
  await assertCurrentOwnerFingerprint(adapter, locator, adapterCtx, legacy.ownerFingerprint);

  const repositoryIdentity = buildRunJSSourceRepositoryIdentity(locator);
  let repository = await findRunJSRepositoryByIdentity(db, service, repositoryIdentity, serviceCtx);
  if (!repository) {
    const initialFiles = buildRunJSBootstrapInitialFiles(input.hostKind, locator, legacy);
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
  } else {
    repository = await service.getRepositoryForUpdate({ repoId: repository.id }, serviceCtx);
  }

  assertRepositoryMatchesIdentity(repository, repositoryIdentity, locator.kind);
  const head = await service.pull({ repoId: repository.id, ref: 'head', includeContent: 'all' }, serviceCtx);
  const missingFiles = buildMissingRunJSBootstrapFiles(input.hostKind, locator, legacy, head.files || []);
  const compileFiles = await materializeRunJSCompileFiles(
    db,
    repository.id,
    repository.headCommitId,
    { files: missingFiles },
    serviceCtx,
  );
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

function createBootstrapAdapterContext(input: FlowSurfaceRunJSWorkspaceBootstrapInput): RunJSSourceAdapterContext {
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
  hostKind: FlowSurfaceRunJSWorkspaceBootstrapInput['hostKind'],
  legacy: RunJSLegacySource,
): void {
  const expectedModelUse = hostKind === 'js-page' ? 'JSPageModel' : 'JSBlockModel';
  if (legacy.metadata?.modelUse === expectedModelUse) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS workspace bootstrap expected ${expectedModelUse}`, {
    details: {
      hostKind,
      modelUse: legacy.metadata?.modelUse,
    },
  });
}

function buildRunJSBootstrapInitialFiles(
  hostKind: FlowSurfaceRunJSWorkspaceBootstrapInput['hostKind'],
  locator: RunJSSourceSaveInput['locator'],
  legacy: RunJSLegacySource,
): VscTreeEntryInput[] {
  const source = legacy.code.trim() ? legacy.code : emptyRunJSRenderSource;
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
  hostKind: FlowSurfaceRunJSWorkspaceBootstrapInput['hostKind'],
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
  hostKind: FlowSurfaceRunJSWorkspaceBootstrapInput['hostKind'],
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
  baseOwnerFingerprint: string;
  message: string;
  zipBase64: string;
  entryPath?: string;
  version?: string;
}

interface RunJSSourceHistoryInput extends RunJSSourceRepoInput {
  limit?: number;
  beforeSeq?: number;
}

interface RunJSSourceGetVersionInput extends RunJSSourceRepoInput {
  commitId: string;
  includeFiles: boolean;
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
  assertHeadOwnerFingerprint: boolean;
  ensureRepository: boolean;
}

interface RunJSSourceHistoryResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  items: VscCommitRecord[];
  nextBeforeSeq: number | null;
}

interface RunJSSourceVersionResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  commit: VscCommitRecord;
  files: PulledFile[];
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

interface RunJSSourceImportZipResult extends RunJSSourceSaveResult {
  import: {
    fileCount: number;
    filesHash: string;
  };
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
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (entries.length > maxFilesPerRepo) {
    throw new VscError('REPO_LIMIT_EXCEEDED', `ZIP must not contain more than ${maxFilesPerRepo} files`, {
      details: {
        fileCount: entries.length,
        maxFilesPerRepo,
      },
    });
  }
  const budget = { totalBytes: 0 };

  for (const entry of entries) {
    const path = normalizeAllowedRunJSWorkspacePath(entry.name, 'zip.entry');
    if (filesByPath.has(path)) {
      throw new VscError('PATH_INVALID', `Duplicate file path "${path}" in ZIP`);
    }
    filesByPath.set(path, {
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
  budget: { totalBytes: number },
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

  return normalizeText(Buffer.concat(chunks, fileBytes).toString('utf8'));
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
  if (typeof source.code !== 'string' || typeof source.version !== 'string' || !source.version) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', 'RunJS initial source is invalid');
  }

  return {
    code: source.code,
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

function legacyToRuntimeFileChanges(legacy: RunJSLegacySource, baseFiles: PulledFile[]): VscFileChange[] {
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
    repository: serializeRepository(input.repository),
    files: input.files,
    permissions: {
      canRead: true,
      canWrite: input.permissions.canWrite,
      canSave: input.permissions.canSave,
    },
    history: {
      items: input.history,
    },
  };
}

function serializeRepository(repository: VscRepositoryRecord): RunJSSourceRepositoryResponse {
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
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    repoId: optionalString(input, 'repoId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    baseOwnerFingerprint: requireString(input, 'baseOwnerFingerprint'),
    message: requireCommitMessage(input.message || 'Import RunJS workspace'),
    zipBase64: requireString(input, 'zipBase64'),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    version: optionalString(input, 'version'),
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
  const expectedOwnerFingerprint = headOwnerFingerprint || currentOwnerFingerprint;
  if (baseOwnerFingerprint === expectedOwnerFingerprint && baseOwnerFingerprint === currentOwnerFingerprint) {
    return;
  }

  throw new VscError('RUNJS_SOURCE_OWNER_OUTDATED', 'RunJS owner changed after the workspace was opened', {
    details: {
      expected: currentOwnerFingerprint,
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

function compactObject(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return undefined;
}
