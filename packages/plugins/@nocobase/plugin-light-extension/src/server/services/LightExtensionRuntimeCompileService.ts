/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, type RunJSRuntimeArtifact } from '@nocobase/runjs';
import { posix as pathPosix } from 'path';

import {
  LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
  LIGHT_EXTENSION_SUPPORTED_KINDS,
  type LightExtensionKind,
} from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionSaveSourceInput,
  LightExtensionSaveSourceResult,
} from '../../shared/types';
import { entryFromModel, LightExtensionEntryService } from './LightExtensionEntryService';
import {
  classifyLightExtensionCompileMetricsError,
  combineLightExtensionCompileMetricsRecorders,
  LightExtensionCompileMetricsProbe,
  type LightExtensionCompileMetricsCollector,
} from './LightExtensionCompileMetrics';
import { LightExtensionFileService, type LightExtensionReplaceSourceSnapshotInput } from './LightExtensionFileService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { sortDiagnostics } from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

type ReferenceRefreshService = {
  refreshReferencesForRepo: (repoId: string, ctx?: LightExtensionServiceContext) => Promise<void>;
};

export interface LightExtensionRemoteSnapshotCompileResult {
  repo: LightExtensionSaveSourceResult['repo'];
  commitId: string;
  contentHash: string;
  changed: boolean;
  compile: LightExtensionSaveSourceResult['compile'];
  diagnostics: LightExtensionDiagnostic[];
}

export class LightExtensionRuntimeCompileService {
  private referenceService?: ReferenceRefreshService;

  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
    private readonly metricsCollector?: LightExtensionCompileMetricsCollector,
  ) {}

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
  }

  async saveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSaveSourceResult> {
    const probe = new LightExtensionCompileMetricsProbe('saveSource', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    compileMetrics?.set('changedFileCount', input.files.length);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const save = await probe.measureAsync('transaction', () => {
        if (ctx.transaction) {
          return this.saveSourceInTransaction(input, { ...ctx, compileMetrics });
        }

        return this.db.sequelize.transaction((transaction) =>
          this.saveSourceInTransaction(input, {
            ...ctx,
            compileMetrics,
            transaction,
          }),
        );
      });
      result = 'success';
      return save;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  async replaceSourceSnapshot(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionRemoteSnapshotCompileResult> {
    if (ctx.transaction) {
      return this.replaceSourceSnapshotInTransaction(input, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.replaceSourceSnapshotInTransaction(input, { ...ctx, transaction }),
    );
  }

  private async replaceSourceSnapshotInTransaction(
    input: LightExtensionReplaceSourceSnapshotInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionRemoteSnapshotCompileResult> {
    const replacement = await this.fileService.replaceSourceSnapshot(input, ctx);
    const commitId = replacement.commit?.id || replacement.repo.headCommitId;
    if (!commitId) {
      throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Light extension source has no commit after pull');
    }
    if (!replacement.changed) {
      return {
        repo: replacement.repo,
        commitId,
        contentHash: replacement.contentHash,
        changed: false,
        compile: { status: 'skipped', entries: [] },
        diagnostics: [],
      };
    }

    const compile = await this.compileCurrentRuntime(input.repoId, commitId, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-remote-pull',
    });
    await this.referenceService?.refreshReferencesForRepo(input.repoId, ctx);

    return {
      repo: compile.repo,
      commitId,
      contentHash: replacement.contentHash,
      changed: true,
      compile: {
        status: compile.status,
        entries: compile.entries,
      },
      diagnostics: sortDiagnostics(compile.diagnostics),
    };
  }

  private async saveSourceInTransaction(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionSaveSourceResult> {
    const pushSource = () =>
      this.fileService.push(
        {
          ...input,
          allowEmptyCommit: false,
        },
        ctx,
      );
    const push = ctx.compileMetrics ? await ctx.compileMetrics.measureAsync('push', pushSource) : await pushSource();
    const compile = await this.compileCurrentRuntime(input.repoId, push.commit.id, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-save-source',
    });
    const diagnostics = sortDiagnostics(compile.diagnostics);

    const referenceService = this.referenceService;
    if (referenceService) {
      ctx.compileMetrics?.increment('referenceScanCount');
      const refreshReferences = () => referenceService.refreshReferencesForRepo(input.repoId, ctx);
      if (ctx.compileMetrics) {
        await ctx.compileMetrics.measureAsync('referenceRefresh', refreshReferences);
      } else {
        await refreshReferences();
      }
    }

    return {
      repo: compile.repo,
      commit: push.commit,
      tree: push.tree,
      compile: {
        status: compile.status,
        entries: compile.entries,
      },
      diagnostics,
    };
  }

  async compileCurrentRuntime(
    repoId: string,
    commitId: string,
    ctx: LightExtensionServiceContext = {},
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const probe = new LightExtensionCompileMetricsProbe('runtimeCompile', this.metricsCollector);
    const compileMetrics = combineLightExtensionCompileMetricsRecorders(ctx.compileMetrics, probe);
    let result: 'success' | 'rejected' | 'failed' | 'outdated' = 'failed';
    try {
      const compile = await probe.measureAsync('transaction', () => {
        if (ctx.transaction) {
          return this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, compileMetrics });
        }

        return this.db.sequelize.transaction((transaction) =>
          this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, compileMetrics, transaction }),
        );
      });
      result = 'success';
      return compile;
    } catch (error) {
      result = classifyLightExtensionCompileMetricsError(error);
      throw error;
    } finally {
      await probe.finish(result);
    }
  }

  private async compileCurrentRuntimeInTransaction(
    repoId: string,
    commitId: string,
    ctx: LightExtensionServiceContext,
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
      diagnostics: LightExtensionDiagnostic[];
    }
  > {
    const prepareEntries = () => this.entryService.prepareEntries(repoId, ctx);
    const prepared = ctx.compileMetrics
      ? await ctx.compileMetrics.measureAsync('treePrepare', prepareEntries)
      : await prepareEntries();
    if (prepared.commitId !== commitId) {
      throw new Error(
        `Light extension repository head changed before compile: expected=${commitId}, actual=${prepared.commitId}`,
      );
    }
    const pull = await this.fileService.pullCommit(
      {
        repoId,
        commitId,
        includeContent: 'all',
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-runtime-compile',
      },
    );
    const compileEntries: LightExtensionSaveSourceResult['compile']['entries'] = [];
    const planEntries = () =>
      prepared.entries.filter((entry) => entry.healthStatus === 'ready' && isSupportedKind(entry.kind));
    const readyEntries = ctx.compileMetrics ? ctx.compileMetrics.measure('compilePlan', planEntries) : planEntries();
    ctx.compileMetrics?.set('affectedEntryCount', readyEntries.length);
    ctx.compileMetrics?.set('skippedEntryCount', prepared.entries.length - readyEntries.length);

    for (const entry of readyEntries) {
      ctx.compileMetrics?.increment('compiledEntryCount');
      const compileEntry = () =>
        this.compilerBridge.compileEntry(
          {
            repoId,
            entryId: entry.id,
            operation: 'runtimeCompile',
            kind: entry.kind as LightExtensionKind,
            entryName: entry.entryName,
            entryPath: entry.entryPath,
            files: getEntryCompileFiles(pull.files || [], entry),
          },
          {
            ...ctx,
            requestSource: ctx.requestSource || 'light-extension-runtime-compile',
          },
        );
      const compiled = ctx.compileMetrics
        ? await ctx.compileMetrics.measureAsync('compileEntries', compileEntry)
        : await compileEntry();

      if (!compiled.accepted) {
        compileEntries.push({
          entryId: entry.id,
          entryName: entry.entryName,
          kind: entry.kind,
          entryPath: entry.entryPath,
          status: 'failed',
          diagnostics: compiled.diagnostics,
          failureCode: compiled.failureCode || 'compile_failed',
        });
        continue;
      }

      const persistArtifact = () =>
        this.persistSuccessfulCompile(
          {
            entry,
            commitId,
            artifact: compiled.artifact,
            surfaceStyle: compiled.surface.surfaceStyle,
            diagnostics: compiled.diagnostics,
          },
          ctx.transaction,
        );
      const persisted = ctx.compileMetrics
        ? await ctx.compileMetrics.measureAsync('artifactPersist', persistArtifact)
        : await persistArtifact();
      compileEntries.push({
        entryId: persisted.id,
        entryName: persisted.entryName,
        kind: persisted.kind,
        entryPath: persisted.entryPath,
        status: 'success',
        diagnostics: compiled.diagnostics,
        artifact: {
          version: compiled.artifact.version,
          entryPath: compiled.artifact.entryPath,
          filesHash: compiled.artifact.filesHash,
          metadata: normalizeRecord(compiled.artifact.metadata),
        },
      });
    }

    const successCount = compileEntries.filter((entry) => entry.status === 'success').length;
    const failedCount = compileEntries.filter((entry) => entry.status === 'failed').length;
    const diagnostics = sortDiagnostics([
      ...prepared.diagnostics,
      ...compileEntries.flatMap((entry) => entry.diagnostics),
    ]);
    if (failedCount > 0) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId,
          commitId,
          diagnostics,
          entries: compileEntries,
        },
      });
    }
    await this.db.getRepository('lightExtensionRepos').update({
      filterByTk: repoId,
      values: {
        healthStatus: 'ready',
        ...(successCount > 0 ? { lastCompiledAt: new Date() } : {}),
      },
      transaction: ctx.transaction,
    });

    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    return {
      repo: withEntrySummary(repo ? repoFromModelLike(repo) : prepared.repo, prepared.entries),
      status: compileEntries.length === 0 ? 'skipped' : 'success',
      entries: compileEntries,
      diagnostics,
    };
  }

  private async persistSuccessfulCompile(
    input: {
      entry: LightExtensionEntryRecord;
      commitId: string;
      artifact: RunJSRuntimeArtifact;
      surfaceStyle: string;
      diagnostics: LightExtensionDiagnostic[];
    },
    transaction?: Transaction,
  ): Promise<LightExtensionEntryRecord> {
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(input.artifact.code);
    const entryPath = input.artifact.entryPath || input.entry.entryPath;
    const artifactHash = buildRunJSArtifactHash({
      code: input.artifact.code,
      sourceMap: input.artifact.sourceMap,
      version: input.artifact.version,
      entryPath,
      runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
    });
    await this.db.getRepository('lightExtensionRuntimeArtifacts').updateOrCreate({
      filterKeys: ['artifactHash'],
      values: {
        artifactHash,
        runtimeCodeHash,
        code: input.artifact.code,
        sourceMap: input.artifact.sourceMap || null,
        version: input.artifact.version,
        entryPath,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
        byteSize:
          Buffer.byteLength(input.artifact.code, 'utf8') + Buffer.byteLength(input.artifact.sourceMap || '', 'utf8'),
      },
      transaction,
    });
    const values = {
      compiledCommitId: input.commitId,
      runtimeArtifact: cloneRuntimeArtifact(input.artifact, {
        runtimeCodeHash,
        artifactHash,
        runtimeContract: LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT,
      }),
      runtimeVersion: input.artifact.version,
      surfaceStyle: input.surfaceStyle,
      runtimeCodeHash,
      artifactHash,
      filesHash: input.artifact.filesHash || '',
      compiledAt: new Date(),
      diagnostics: sortDiagnostics([...input.entry.diagnostics, ...input.diagnostics]),
      healthStatus: 'ready',
    };

    const entry = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: input.entry.id,
      transaction,
    });
    if (!entry) {
      return input.entry;
    }

    await entry.update(values, { transaction });
    return entryFromModel(entry);
  }
}

function getEntryCompileFiles(
  files: Array<{ path: string; content?: string; language?: string }>,
  entry: LightExtensionEntryRecord,
) {
  const rootPath = getEntryRootPath(entry.entryPath);

  return files
    .filter(
      (file) =>
        file.path !== entry.descriptorPath &&
        (file.path === rootPath || file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/')),
    )
    .map((file) => ({
      path: file.path,
      content: file.content,
      language: file.language,
    }));
}

function getEntryRootPath(entryPath: string): string {
  const normalized = pathPosix.normalize(entryPath.trim()).replace(/^\.\/+/, '');
  return pathPosix.extname(normalized) ? pathPosix.dirname(normalized) : normalized;
}

function isSupportedKind(kind: string): kind is LightExtensionKind {
  return (LIGHT_EXTENSION_SUPPORTED_KINDS as readonly string[]).includes(kind);
}

function cloneRuntimeArtifact(artifact: RunJSRuntimeArtifact, metadata: Record<string, unknown>): RunJSRuntimeArtifact {
  return {
    ...artifact,
    diagnostics: [...(artifact.diagnostics || [])],
    metadata: {
      ...(artifact.metadata || {}),
      ...metadata,
    },
  };
}

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  return isPlainRecord(value) ? cloneRecord(value) : undefined;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function repoFromModelLike(record: { get: (key: string) => unknown }): LightExtensionSaveSourceResult['repo'] {
  return {
    id: String(record.get('id')),
    name: String(record.get('name')),
    normalizedName: String(record.get('normalizedName')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    lifecycleStatus: record.get('lifecycleStatus') as LightExtensionSaveSourceResult['repo']['lifecycleStatus'],
    healthStatus: record.get('healthStatus') as LightExtensionSaveSourceResult['repo']['healthStatus'],
    headCommitId: nullableString(record.get('headCommitId')),
    lastCompiledAt: normalizeDate(record.get('lastCompiledAt')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function withEntrySummary(
  repo: LightExtensionSaveSourceResult['repo'],
  entries: LightExtensionEntryRecord[],
): LightExtensionSaveSourceResult['repo'] {
  const activeEntries = entries.filter((entry) => entry.healthStatus !== 'missing');
  const entryKinds: NonNullable<LightExtensionSaveSourceResult['repo']['entryKinds']> = {};
  for (const entry of activeEntries) {
    if (!isSupportedKind(entry.kind)) {
      continue;
    }
    entryKinds[entry.kind] = (entryKinds[entry.kind] || 0) + 1;
  }
  return {
    ...repo,
    entryCount: activeEntries.length,
    entryKinds,
  };
}
