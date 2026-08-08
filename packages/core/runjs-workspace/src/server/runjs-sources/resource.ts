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
import { extractRunJSSettingsDefaults } from '@nocobase/runjs/settings';

import { VscError, isVscError } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import { defaultRunJSEntryPath, runJSManifestPath } from '../../shared/runjs-workspace-path';
import { runJSSourceRequestActionNames } from '../../shared/runjs-source-contracts';
import {
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSLegacySource,
  type RunJSSourceCompilePreviewResult,
  type RunJSSourceDiffResult,
  type RunJSSourceHistoryResult,
  type RunJSSourceInitialSource,
  type RunJSSourceImportZipResult,
  type RunJSSourceAdapterContext,
  type RunJSSourceKind,
  type RunJSSourceOpenResult,
  type RunJSSourceOpenSettingsDescriptor,
  type RunJSSourceRepositoryRecord,
  type RunJSSourceRequestActionName,
  type RunJSSourceFileChange,
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
import type { VscPermissionHookRegistry } from '../permissions';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAuthoringInspectorRegistry } from './RunJSSourceAuthoringInspectorRegistry';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';
import type { RunJSAuthoringCapabilityRegistry } from './RunJSAuthoringCapabilityRegistry';
import { createRunJSAuthoringCapabilities } from '../../shared/authoring-contract';
import {
  assertIncrementalRunJSFileChanges,
  assertRepositoryMatchesIdentity,
  assertRunJSCompileInputLimits,
  assertRunJSCompileSucceeded,
  buildOverwriteRunJSFileDelta,
  createRunJSSourceAuthoringInspector,
  legacyAuthoringInfo,
  loadCommitFilesForCompile,
  materializeCompilePreviewFiles,
  materializeRunJSCompileFiles,
  type SaveCompileFile,
} from './compileMaterialization';
import { compileRunJSSourceWorkspace } from './lazyCompiler';
import {
  createAdapterContext,
  getActionInput,
  normalizeCompilePreviewInput,
  normalizeDiffInput,
  normalizeExportZipInput,
  normalizeGetVersionInput,
  normalizeHistoryInput,
  normalizeImportZipInput,
  normalizeInitialRunJSSource,
  normalizeSaveChangesInput,
  normalizeSaveInput,
  type ResourceActionInput,
  type RunJSSourceResourceContext,
} from './resourceInput';
import { buildRunJSWorkspaceSettingsHashes, parseRunJSWorkspaceSettingsDescriptor } from './settingsDescriptor';
import {
  assertCurrentOwnerFingerprint,
  createServiceContext,
  findRunJSRepositoryByIdentity,
  inlineRunJSEntryDescriptorPath,
  pushRunJSSourceCommit,
  runJSManifestFile,
  updateRunJSCommitMetadata,
} from './workspaceBootstrap';
import {
  buildRunJSZipFileName,
  createRunJSWorkspaceZip,
  readRunJSWorkspaceManifest,
  readRunJSWorkspaceManifestEntry,
  readRunJSWorkspaceZip,
  selectEntryPath,
} from './workspaceZip';

export { assertRunJSCompileInputLimits } from './compileMaterialization';
export {
  createFlowSurfaceRunJSWorkspaceBootstrapPort,
  RUNJS_WORKSPACE_HOSTS,
  type RunJSWorkspaceBootstrapInput,
  type RunJSWorkspaceBootstrapPort,
  type RunJSWorkspaceBootstrapResult,
  type RunJSWorkspaceHostKind,
  type RunJSWorkspaceModelUse,
} from './workspaceBootstrap';
export { readRunJSWorkspaceZip } from './workspaceZip';

export const runJSSourceActionNames = ['capabilities', ...runJSSourceRequestActionNames] as const;

type RunJSSourceActionName = (typeof runJSSourceActionNames)[number];
type RunJSSourceWorkspaceActionName = RunJSSourceRequestActionName;

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

type RunJSSourceLocatorInput = RunJSSourceSaveInput['locator'];

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
