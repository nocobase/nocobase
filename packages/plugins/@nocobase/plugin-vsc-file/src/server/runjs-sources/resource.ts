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
import { posix as pathPosix } from 'path';
import ts from 'typescript';

import { VscError, isVscError, type VscErrorCode } from '../../shared/errors';
import { sha256Hex } from '../../shared/hash';
import { normalizePath, pathHash, pathLowerHash } from '../../shared/path';
import { validateRunJSWorkspacePathValue } from '../../shared/runjs-workspace-path';
import { maxFileSize, maxFilesPerRepo, maxRepoTextSize } from '../../shared/constants';
import {
  buildRunJSFilesHash,
  buildRunJSRuntimeCodeHash,
  buildRunJSSourceRepositoryIdentity,
  normalizeRunJSSourceLocator,
  type RunJSCompileDiagnostic,
  type RunJSLegacySource,
  type RunJSSourceAdapterContext,
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
  VscDraftFileChange,
  VscDraftFileRecord,
  VscDraftRecord,
  VscFileChange,
  VscRepositoryIdentity,
  VscRepositoryRecord,
  VscTreeEntryInput,
} from '../../shared/types';
import { normalizeText } from '../../shared/text';
import type { VscPermissionHookRegistry, VscPermissionRequestMetadata } from '../permissions';
import type { FileDiffResult } from '../services/DiffService';
import { VscFileService, type PulledFile, type VscServiceContext } from '../services/VscFileService';
import type { RunJSSourceAdapterRegistry } from './RunJSSourceAdapterRegistry';

export const runJSSourceActionNames = [
  'open',
  'saveDraft',
  'rebaseDraft',
  'discardDraft',
  'diffDraft',
  'compilePreview',
  'publish',
  'listHistory',
  'getVersion',
  'diffVersion',
  'restoreAsDraft',
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
};

type RunJSSourceActionRunner = (
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  input: ResourceActionInput,
  ctx: RunJSSourceResourceContext,
) => Promise<unknown>;

const actionRunners: Record<RunJSSourceActionName, RunJSSourceActionRunner> = {
  open: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceOpenResult> => {
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
      await assertPublishedOwnerFingerprintCurrent(service, repository, legacy.ownerFingerprint, serviceCtx);
      const published = await service.pull(
        { repoId: repository.id, ref: 'published', includeContent: 'all' },
        serviceCtx,
      );
      const draft = adapterCtx.userId
        ? await service.getDraft({ repoId: repository.id, userId: adapterCtx.userId, includeContent: true }, serviceCtx)
        : null;
      const history = await service.listCommits({ repoId: repository.id }, serviceCtx);
      const permissions = await getRunJSSourcePermissions(
        adapter,
        locator,
        adapterCtx,
        permissionHooks,
        published.repository,
        serviceCtx,
      );

      return buildOpenResult({
        locator,
        repositoryIdentity,
        legacy,
        repository: published.repository,
        files: published.files || [],
        draft,
        history,
        permissions,
      });
    });
  },
  saveDraft: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDraftResult> => {
    const draftInput = normalizeSaveDraftInput(input);
    const adapter = registry.require(draftInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);
      const userId = requireCurrentUserId(adapterCtx);

      await adapter.assertCanWrite({ locator: draftInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, draftInput.repoId, draftInput.locator, serviceCtx);
      assertDraftBaseCurrent(repository, draftInput.baseCommitId);
      const draft = await service.saveDraft(
        {
          repoId: repository.id,
          userId,
          baseCommitId: draftInput.baseCommitId,
          files: draftInput.files,
          includeContent: true,
          replaceFiles: true,
        },
        serviceCtx,
      );

      return {
        locator: draftInput.locator,
        locatorKind: draftInput.locator.kind,
        repository: serializeRepository(repository),
        draft: serializeDraft(draft),
        files: draft.files,
      };
    });
  },
  rebaseDraft: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDraftResult> => {
    const draftInput = normalizeSaveDraftInput(input);
    const adapter = registry.require(draftInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);
      const userId = requireCurrentUserId(adapterCtx);

      await adapter.assertCanWrite({ locator: draftInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, draftInput.repoId, draftInput.locator, serviceCtx);
      assertDraftBaseCurrent(repository, draftInput.baseCommitId);

      await service.discardDraft({ repoId: repository.id, userId }, serviceCtx);
      const draft = await service.saveDraft(
        {
          repoId: repository.id,
          userId,
          baseCommitId: draftInput.baseCommitId,
          files: draftInput.files,
          includeContent: true,
          replaceFiles: true,
        },
        serviceCtx,
      );

      return {
        locator: draftInput.locator,
        locatorKind: draftInput.locator.kind,
        repository: serializeRepository(repository),
        draft: serializeDraft(draft),
        files: draft.files,
      };
    });
  },
  discardDraft: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDiscardDraftResult> => {
    const draftInput = normalizeRepoInput(input);
    const adapter = registry.require(draftInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);
      const userId = requireCurrentUserId(adapterCtx);

      await adapter.assertCanWrite({ locator: draftInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, draftInput.repoId, draftInput.locator, serviceCtx);
      const draft = await service.discardDraft({ repoId: repository.id, userId }, serviceCtx);

      return {
        locator: draftInput.locator,
        locatorKind: draftInput.locator.kind,
        repository: serializeRepository(repository),
        draft,
      };
    });
  },
  diffDraft: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDiffDraftResult> => {
    const diffInput = normalizeDiffDraftInput(input);
    const adapter = registry.require(diffInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);

      await adapter.assertCanRead({ locator: diffInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, diffInput.repoId, diffInput.locator, serviceCtx);
      if (!diffInput.files) {
        const userId = requireCurrentUserId(adapterCtx);

        return {
          locator: diffInput.locator,
          locatorKind: diffInput.locator.kind,
          repository: serializeRepository(repository),
          diff: await service.diffDraft({ repoId: repository.id, userId }, serviceCtx),
        };
      }

      const baseCommitId = diffInput.baseCommitId ?? repository.publishedCommitId ?? repository.headCommitId;
      const baseFiles = baseCommitId
        ? (
            await service.pullCommit(
              { repoId: repository.id, commitId: baseCommitId, includeContent: 'all' },
              serviceCtx,
            )
          ).files || []
        : [];

      return {
        locator: diffInput.locator,
        locatorKind: diffInput.locator.kind,
        repository: serializeRepository(repository),
        diff: diffWorkspaceFiles(baseFiles, diffInput.files),
      };
    });
  },
  compilePreview: async (_db, registry, _permissionHooks, input, ctx): Promise<RunJSSourceCompilePreviewResult> => {
    const previewInput = normalizeCompilePreviewInput(input);
    const adapter = registry.require(previewInput.locator.kind);
    const adapterCtx = createAdapterContext(ctx);

    await adapter.assertCanRead({ locator: previewInput.locator, ctx: adapterCtx });
    assertRunJSCompileInputLimits(previewInput.files);
    const compiled = compileRunJSFiles({
      files: previewInput.files,
      entryPath: previewInput.entryPath,
      version: previewInput.version,
    });

    return {
      locator: previewInput.locator,
      locatorKind: previewInput.locator.kind,
      artifact: compiled.artifact,
    };
  },
  publish: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourcePublishResult> => {
    const publishInput = normalizePublishInput(input);
    const adapter = registry.require(publishInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const request = adapterCtx.request;
      const userId = adapterCtx.userId;

      await adapter.assertCanWrite({ locator: publishInput.locator, ctx: adapterCtx });

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
      await assertPublishedOwnerFingerprintCurrent(service, repository, publishInput.baseOwnerFingerprint, serviceCtx);
      const publishBase = resolvePublishBase(repository, publishInput);
      assertRunJSCompileInputLimits(publishInput.files);
      const compiled = compileRunJSFiles({
        files: publishInput.files,
        entryPath: publishInput.entryPath || publishInput.artifact?.entryPath,
        version: publishInput.version || publishInput.artifact?.version,
      });
      assertRunJSCompileSucceeded(compiled);
      const artifact = compiled.artifact;
      artifact.metadata = {
        ...artifact.metadata,
        repoId: repository.id,
      };
      const pushResult = await service.push(
        {
          repoId: repository.id,
          baseCommitId: publishBase.baseCommitId,
          message: publishInput.message,
          files: publishInput.files,
          draftId: publishInput.draftId,
          authorId: userId,
          metadata: {
            sourceKind: publishInput.locator.kind,
            ownerFingerprint: publishInput.baseOwnerFingerprint,
            baseOwnerFingerprint: publishInput.baseOwnerFingerprint,
            filesHash: artifact.filesHash,
          },
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
          sourceKind: publishInput.locator.kind,
          ownerFingerprint: nextOwnerFingerprint,
          baseOwnerFingerprint: publishInput.baseOwnerFingerprint,
          filesHash: artifact.filesHash,
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
          runtimeCodeHash: buildRunJSRuntimeCodeHash(artifact.code),
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
  listHistory: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceHistoryResult> => {
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
  getVersion: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceVersionResult> => {
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
  diffVersion: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDiffVersionResult> => {
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
  restoreAsDraft: async (db, registry, permissionHooks, input, ctx): Promise<RunJSSourceDraftResult> => {
    const restoreInput = normalizeRestoreAsDraftInput(input);
    const adapter = registry.require(restoreInput.locator.kind);
    const service = new VscFileService(db, permissionHooks);

    return db.sequelize.transaction(async (transaction) => {
      const adapterCtx = createAdapterContext(ctx, transaction);
      const serviceCtx = createServiceContext(adapterCtx, transaction);
      const userId = requireCurrentUserId(adapterCtx);

      await adapter.assertCanWrite({ locator: restoreInput.locator, ctx: adapterCtx });
      const repository = await getRunJSRepository(service, restoreInput.repoId, restoreInput.locator, serviceCtx);
      assertDraftBaseCurrent(repository, restoreInput.baseCommitId);

      const sourceFiles =
        (
          await service.pullCommit(
            {
              repoId: repository.id,
              commitId: restoreInput.sourceCommitId,
              includeContent: 'all',
            },
            serviceCtx,
          )
        ).files || [];
      const baseFiles = restoreInput.baseCommitId
        ? (
            await service.pullCommit(
              {
                repoId: repository.id,
                commitId: restoreInput.baseCommitId,
                includeContent: 'all',
              },
              serviceCtx,
            )
          ).files || []
        : [];
      const files = draftChangesFromRestore(sourceFiles, baseFiles);
      const draft = await service.saveDraft(
        {
          repoId: repository.id,
          userId,
          baseCommitId: restoreInput.baseCommitId,
          files,
          includeContent: true,
          replaceFiles: true,
        },
        serviceCtx,
      );

      return {
        locator: restoreInput.locator,
        locatorKind: restoreInput.locator.kind,
        repository: serializeRepository(repository),
        draft: serializeDraft(draft),
        files: draft.files,
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

interface RunJSSourceSaveDraftInput extends RunJSSourceRepoInput {
  baseCommitId: string | null;
  files: VscDraftFileChange[];
}

interface RunJSSourceDiffDraftInput extends RunJSSourceRepoInput {
  baseCommitId?: string | null;
  files?: VscFileChange[];
}

interface RunJSSourceCompilePreviewInput {
  locator: RunJSSourceLocatorInput;
  files: VscFileChange[];
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

interface RunJSSourceDiffVersionInput extends RunJSSourceRepoInput {
  commitId: string;
  fromCommitId?: string;
  toCommitId?: string;
}

interface RunJSSourceRestoreAsDraftInput extends RunJSSourceRepoInput {
  sourceCommitId: string;
  baseCommitId: string | null;
}

interface RunJSSourceDraftResponse {
  id: string;
  baseCommitId: string | null;
  status: VscDraftRecord['status'];
  files: VscDraftFileRecord[];
}

interface ActiveDraftLike {
  draft: VscDraftRecord;
  files: VscDraftFileRecord[];
}

interface RunJSSourceDraftResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  draft: RunJSSourceDraftResponse;
  files: VscDraftFileRecord[];
}

interface RunJSSourceDiscardDraftResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  draft: VscDraftRecord | null;
}

interface RunJSSourceDiffDraftResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  repository: RunJSSourceRepositoryResponse;
  diff: FileDiffResult;
}

interface RunJSSourceCompilePreviewResult {
  locator: RunJSSourceLocatorInput;
  locatorKind: RunJSSourceKind;
  artifact: RunJSRuntimeArtifact;
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
  repository: VscRepositoryRecord;
  files: PulledFile[];
  draft: ActiveDraftLike | null;
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

type RunJSCompileFailureCode = Extract<
  VscErrorCode,
  'RUNJS_COMPILE_FAILED' | 'RUNJS_ENTRY_NOT_FOUND' | 'RUNJS_IMPORT_NOT_ALLOWED'
>;

interface CompileRunJSInput {
  files: VscFileChange[];
  entryPath?: string;
  version?: string;
}

interface CompileRunJSResult {
  artifact: RunJSRuntimeArtifact;
  failureCode?: RunJSCompileFailureCode;
}

interface RunJSContentFile {
  path: string;
  content: string;
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
      initialFiles: [legacyToInitialFile(legacy)],
      message: 'Initialize RunJS source',
      authorId: serviceCtx.authorId,
      metadata: {
        sourceKind,
        ownerFingerprint: legacy.ownerFingerprint,
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
    path: normalizeAllowedRunJSWorkspacePath(legacy.entryPath || legacy.entry || 'src/main.tsx', 'legacy.entryPath'),
    content: legacy.code,
    language: legacy.language,
  };
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
      action: 'saveDraft',
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

function buildOpenResult(input: BuildOpenResultInput): RunJSSourceOpenResult & Record<string, unknown> {
  const history = serializeHistory(input.history, input.repository.publishedCommitId);

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
    draft: input.draft ? serializeDraft(input.draft) : null,
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

function serializeDraft(input: ActiveDraftLike): RunJSSourceDraftResponse {
  return {
    id: input.draft.id,
    baseCommitId: input.draft.baseCommitId,
    status: input.draft.status,
    files: input.files,
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

function requireCurrentUserId(ctx: RunJSSourceAdapterContext): string {
  if (ctx.userId) {
    return ctx.userId;
  }

  throw new VscError('PERMISSION_DENIED', 'RunJS source action requires a logged-in user');
}

function assertDraftBaseCurrent(repository: VscRepositoryRecord, baseCommitId: string | null): void {
  const expectedBaseCommitId = repository.publishedCommitId ?? repository.headCommitId;
  if (expectedBaseCommitId === baseCommitId) {
    return;
  }

  throw new VscError('DRAFT_BASE_OUTDATED', 'RunJS draft base is no longer current', {
    details: {
      expected: expectedBaseCommitId,
      received: baseCommitId,
    },
  });
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

function draftChangesFromRestore(sourceFiles: PulledFile[], baseFiles: PulledFile[]): VscDraftFileChange[] {
  const sourcePaths = new Set(sourceFiles.map((file) => normalizePath(file.path)));
  const changes = sourceFiles.map((file) => ({
    path: normalizePath(file.path),
    operation: 'upsert' as const,
    content: file.content || '',
    language: file.language,
    mode: file.mode,
  }));

  for (const baseFile of baseFiles) {
    const normalizedPath = normalizePath(baseFile.path);
    if (!sourcePaths.has(normalizedPath)) {
      changes.push({
        path: normalizedPath,
        operation: 'delete',
      });
    }
  }

  return changes;
}

function compileRunJSFiles(input: CompileRunJSInput): CompileRunJSResult {
  const entryPath = normalizePath(input.entryPath || selectEntryPath(input.files));
  const files = contentFilesFromChanges(input.files);
  const bundle = bundleRunJSFiles(files, entryPath);
  const code = bundle.code;
  const diagnostics = [...bundle.diagnostics, ...collectTypeScriptDiagnostics(code, entryPath)];

  return {
    artifact: {
      code,
      version: input.version || 'v2',
      diagnostics,
      filesHash: buildRunJSFilesHash(input.files),
      entryPath,
    },
    failureCode: bundle.failureCode || (hasErrorDiagnostic(diagnostics) ? 'RUNJS_COMPILE_FAILED' : undefined),
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

function assertRunJSCompileSucceeded(result: CompileRunJSResult): void {
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

function bundleRunJSFiles(
  files: Map<string, RunJSContentFile>,
  entryPath: string,
): { code: string; diagnostics: RunJSCompileDiagnostic[]; failureCode?: RunJSCompileFailureCode } {
  const diagnostics: RunJSCompileDiagnostic[] = [];
  const orderedFiles: RunJSContentFile[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  let failureCode: RunJSCompileFailureCode | undefined;

  const visit = (path: string) => {
    const file = files.get(path);
    if (!file) {
      diagnostics.push({
        severity: 'error',
        path,
        message: `Entry file "${path}" was not found`,
      });
      failureCode = failureCode || 'RUNJS_ENTRY_NOT_FOUND';
      return;
    }
    if (visited.has(path)) {
      return;
    }
    if (visiting.has(path)) {
      diagnostics.push({
        severity: 'error',
        path,
        message: `Circular import involving "${path}" is not supported`,
      });
      failureCode = failureCode || 'RUNJS_COMPILE_FAILED';
      return;
    }

    visiting.add(path);
    for (const specifier of collectImportSpecifiers(file.content)) {
      if (!specifier.startsWith('.')) {
        diagnostics.push({
          severity: 'error',
          path,
          message: `Import "${specifier}" is not allowed`,
        });
        failureCode = failureCode || 'RUNJS_IMPORT_NOT_ALLOWED';
        continue;
      }

      const resolved = resolveRelativeRunJSImport(path, specifier, files);
      if (!resolved) {
        diagnostics.push({
          severity: 'error',
          path,
          message: `Import "${specifier}" could not be resolved`,
        });
        failureCode = failureCode || 'RUNJS_IMPORT_NOT_ALLOWED';
        continue;
      }
      visit(resolved);
    }
    visiting.delete(path);
    visited.add(path);
    orderedFiles.push(file);
  };

  visit(entryPath);

  return {
    code: orderedFiles.map((file) => stripRunJSModuleSyntax(file.content)).join('\n'),
    diagnostics,
    failureCode,
  };
}

function collectImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const importPattern = /^\s*import(?:\s+type)?(?:[\s\S]*?\sfrom\s*)?['"]([^'"]+)['"];?\s*$/gm;
  let match = importPattern.exec(content);

  while (match) {
    specifiers.push(match[1]);
    match = importPattern.exec(content);
  }

  return specifiers;
}

function resolveRelativeRunJSImport(
  fromPath: string,
  specifier: string,
  files: Map<string, RunJSContentFile>,
): string | null {
  const directory = pathPosix.dirname(fromPath);
  const joinedPath = normalizePath(pathPosix.join(directory === '.' ? '' : directory, specifier));
  const candidates = [
    joinedPath,
    `${joinedPath}.ts`,
    `${joinedPath}.tsx`,
    `${joinedPath}.js`,
    `${joinedPath}.jsx`,
    pathPosix.join(joinedPath, 'index.ts'),
    pathPosix.join(joinedPath, 'index.tsx'),
    pathPosix.join(joinedPath, 'index.js'),
    pathPosix.join(joinedPath, 'index.jsx'),
  ];

  return candidates.map((candidate) => normalizePath(candidate)).find((candidate) => files.has(candidate)) || null;
}

function stripRunJSModuleSyntax(content: string): string {
  return content
    .replace(/^\s*import(?:[\s\S]*?)from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '')
    .replace(/\bexport\s+(?=(const|let|var|function|class|async function|type|interface|enum)\b)/g, '')
    .replace(/\bexport\s+default\s+/g, '');
}

function collectTypeScriptDiagnostics(code: string, entryPath: string): RunJSCompileDiagnostic[] {
  if (!code) {
    return [];
  }

  const result = ts.transpileModule(code, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: entryPath,
    reportDiagnostics: true,
  });

  return (result.diagnostics || [])
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => {
      const position =
        diagnostic.file && typeof diagnostic.start === 'number'
          ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
          : null;

      return compactObject({
        severity: 'error',
        path: diagnostic.file?.fileName || entryPath,
        line: position ? position.line + 1 : undefined,
        column: position ? position.character + 1 : undefined,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      }) as unknown as RunJSCompileDiagnostic;
    });
}

function hasErrorDiagnostic(diagnostics: RunJSCompileDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
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
  if (!repository.publishedCommitId) {
    return;
  }

  const publishedCommit = await service.getCommit(
    {
      repoId: repository.id,
      commitId: repository.publishedCommitId,
    },
    serviceCtx,
  );
  const publishedOwnerFingerprint = getPublishedOwnerFingerprint(publishedCommit);
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
): ResourceOptions {
  return {
    name: 'runJSSources',
    only: [...runJSSourceActionNames],
    actions: Object.fromEntries(
      runJSSourceActionNames.map((actionName) => [
        actionName,
        createRunJSSourceAction(db, registry, permissionHooks, actionRunners[actionName]),
      ]),
    ) as Record<RunJSSourceActionName, HandlerType>,
  };
}

function createRunJSSourceAction(
  db: Database,
  registry: RunJSSourceAdapterRegistry,
  permissionHooks: VscPermissionHookRegistry | undefined,
  run: RunJSSourceActionRunner,
): HandlerType {
  return async (ctx: Context, next) => {
    const resourceCtx = ctx as RunJSSourceResourceContext;

    try {
      resourceCtx.body = await run(db, registry, permissionHooks, getActionInput(resourceCtx), resourceCtx);
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

function normalizeSaveDraftInput(input: ResourceActionInput): RunJSSourceSaveDraftInput {
  return {
    ...normalizeRepoInput(input),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
    files: requireArray(input, 'files', normalizeRunJSDraftFileChange, { allowEmpty: true }),
  };
}

function normalizeDiffDraftInput(input: ResourceActionInput): RunJSSourceDiffDraftInput {
  return {
    ...normalizeRepoInput(input),
    baseCommitId: optionalNullableString(input, 'baseCommitId'),
    files: optionalArray(input, 'files', normalizeRunJSFileChange),
  };
}

function normalizeCompilePreviewInput(input: ResourceActionInput): RunJSSourceCompilePreviewInput {
  return {
    locator: normalizeRunJSSourceLocator(input.locator),
    files: requireArray(input, 'files', normalizeRunJSPreviewFileChange),
    entryPath: optionalRunJSWorkspacePath(input, 'entry') || optionalRunJSWorkspacePath(input, 'entryPath'),
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

function normalizeRestoreAsDraftInput(input: ResourceActionInput): RunJSSourceRestoreAsDraftInput {
  return {
    ...normalizeRepoInput(input),
    sourceCommitId: requireString(input, 'sourceCommitId'),
    baseCommitId: requireNullableString(input, 'baseCommitId'),
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
    message: requireCommitMessage(input.message),
    files: requireArray(input, 'files', normalizeRunJSFileChange),
    artifact: optionalRuntimeArtifact(input.artifact),
    draftId: optionalString(input, 'draftId'),
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

function selectEntryPath(files: VscFileChange[]): string {
  return files.find((file) => file.path === 'src/main.tsx')?.path || files[0]?.path || 'src/main.tsx';
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

function optionalArray<T>(
  input: ResourceActionInput,
  key: string,
  normalize: (value: unknown, label: string) => T,
): T[] | undefined {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new VscError('RUNJS_SOURCE_LOCATOR_INVALID', `RunJS source field "${key}" must be an array`);
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

function normalizeDraftFileChange(value: unknown, label: string): VscDraftFileChange {
  const file = normalizeFileChange(value, label);

  return compactObject({
    path: file.path,
    operation: file.operation || 'upsert',
    content: file.content,
    language: file.language,
    mode: file.mode,
  }) as VscDraftFileChange;
}

function normalizeRunJSDraftFileChange(value: unknown, label: string): VscDraftFileChange {
  return normalizeRunJSFilePath(normalizeDraftFileChange(value, label), `${label}.path`);
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

function optionalRuntimeArtifact(value: unknown): Partial<RunJSRuntimeArtifact> | undefined {
  if (value === undefined) {
    return undefined;
  }
  const input = requireRecord(value, 'artifact');
  const diagnosticsValue = input.diagnostics;

  return compactObject({
    code: optionalString(input, 'code'),
    version: optionalString(input, 'version'),
    sourceMap: optionalString(input, 'sourceMap'),
    diagnostics: Array.isArray(diagnosticsValue) ? diagnosticsValue : undefined,
    filesHash: optionalString(input, 'filesHash'),
    entryPath: optionalRunJSWorkspacePath(input, 'entryPath'),
    metadata: optionalRecord(input, 'metadata'),
  }) as Partial<RunJSRuntimeArtifact>;
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
