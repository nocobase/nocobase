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
import { createHash } from 'crypto';
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
import { LightExtensionFileService } from './LightExtensionFileService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { sortDiagnostics } from './LightExtensionValidator';
import { LightExtensionWorkspaceCompilerBridge } from './LightExtensionWorkspaceCompilerBridge';

type ReferenceRefreshService = {
  refreshReferencesForRepo: (repoId: string, ctx?: LightExtensionServiceContext) => Promise<void>;
};

export class LightExtensionRuntimeCompileService {
  private referenceService?: ReferenceRefreshService;

  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly entryService: LightExtensionEntryService,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
  ) {}

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
  }

  async saveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSaveSourceResult> {
    if (ctx.transaction) {
      return this.saveSourceInTransaction(input, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.saveSourceInTransaction(input, {
        ...ctx,
        transaction,
      }),
    );
  }

  private async saveSourceInTransaction(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionSaveSourceResult> {
    const push = await this.fileService.push(
      {
        ...input,
        allowEmptyCommit: false,
      },
      ctx,
    );
    const compile = await this.compileCurrentRuntime(input.repoId, push.commit.id, {
      ...ctx,
      requestSource: ctx.requestSource || 'light-extension-save-source',
    });
    const diagnostics = sortDiagnostics(compile.diagnostics);

    await this.referenceService?.refreshReferencesForRepo(input.repoId, ctx);

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
    if (ctx.transaction) {
      return this.compileCurrentRuntimeInTransaction(repoId, commitId, ctx);
    }

    return this.db.sequelize.transaction((transaction) =>
      this.compileCurrentRuntimeInTransaction(repoId, commitId, { ...ctx, transaction }),
    );
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
    const prepared = await this.entryService.prepareEntries(repoId, ctx);
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
    const readyEntries = prepared.entries.filter(
      (entry) => entry.healthStatus === 'ready' && isSupportedKind(entry.kind),
    );

    for (const entry of readyEntries) {
      const compiled = await this.compilerBridge.compileEntry(
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

      const persisted = await this.persistSuccessfulCompile(
        {
          entry,
          commitId,
          artifact: compiled.artifact,
          surfaceStyle: compiled.surface.surfaceStyle,
          diagnostics: compiled.diagnostics,
        },
        ctx.transaction,
      );
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
    const settingsSchema = cloneRecordOrNull(input.entry.settingsSchema);
    const settingsDefaultsHash = stableJsonHash(extractSettingsDefaults(settingsSchema));
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
        settingsSchema,
      }),
      runtimeVersion: input.artifact.version,
      surfaceStyle: input.surfaceStyle,
      runtimeCodeHash,
      artifactHash,
      filesHash: input.artifact.filesHash || '',
      settingsDefaultsHash,
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
      (file) => file.path === rootPath || file.path.startsWith(`${rootPath}/`) || file.path.startsWith('src/shared/'),
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

function extractSettingsDefaults(schema: Record<string, unknown> | null): unknown {
  if (!schema) {
    return {};
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
    return cloneJsonValue(schema.default);
  }

  const properties = schema.properties;
  if (!isPlainRecord(properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!isPlainRecord(value)) {
      continue;
    }
    const childDefault = extractSettingsDefaults(value);
    if (
      typeof childDefault !== 'undefined' &&
      !(isPlainRecord(childDefault) && Object.keys(childDefault).length === 0)
    ) {
      defaults[key] = childDefault;
    }
  }

  return defaults;
}

function stableJsonHash(value: unknown): string {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function cloneRecordOrNull(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  return value ? cloneRecord(value) : null;
}

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  return isPlainRecord(value) ? cloneRecord(value) : undefined;
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
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
