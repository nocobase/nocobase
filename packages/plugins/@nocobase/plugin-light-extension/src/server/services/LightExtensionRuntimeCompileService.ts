/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Transaction } from '@nocobase/database';
import { buildRunJSRuntimeCodeHash, type RunJSRuntimeArtifact } from '@nocobase/plugin-vsc-file';
import { createHash } from 'crypto';
import { posix as pathPosix } from 'path';

import { LIGHT_EXTENSION_ENABLED_KINDS, type LightExtensionKind } from '../../constants';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionSaveSourceInput,
  LightExtensionSaveSourceResult,
  LightExtensionScanResult,
} from '../../shared/types';
import { entryFromModel } from './LightExtensionEntryScanner';
import { LightExtensionEntryScanner } from './LightExtensionEntryScanner';
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
    private readonly entryScanner: LightExtensionEntryScanner,
    private readonly compilerBridge: LightExtensionWorkspaceCompilerBridge,
  ) {}

  useReferenceService(referenceService: ReferenceRefreshService): void {
    this.referenceService = referenceService;
  }

  async saveSource(
    input: LightExtensionSaveSourceInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionSaveSourceResult> {
    const push = await this.fileService.push(
      {
        ...input,
        baseCommitId: input.baseCommitId ?? null,
        allowEmptyCommit: input.allowEmptyCommit ?? true,
      },
      ctx,
    );
    const scan = await this.entryScanner.scanRepo(
      {
        repoId: input.repoId,
      },
      {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-save-source',
      },
    );
    const compile = await this.compileCurrentRuntime(input.repoId, push.commit.id, scan, ctx);
    const diagnostics = sortDiagnostics([
      ...scan.diagnostics,
      ...compile.entries.flatMap((entry) => entry.diagnostics),
    ]);

    await this.referenceService?.refreshReferencesForRepo(input.repoId, ctx);

    return {
      repo: compile.repo,
      commit: push.commit,
      tree: push.tree,
      scan,
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
    scan: LightExtensionScanResult,
    ctx: LightExtensionServiceContext = {},
  ): Promise<
    Pick<LightExtensionSaveSourceResult['compile'], 'status' | 'entries'> & {
      repo: LightExtensionSaveSourceResult['repo'];
    }
  > {
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
    const readyEntries = scan.entries
      .map((item) => item.entry)
      .filter((entry) => entry.healthStatus === 'ready' && isEnabledKind(entry.kind));

    for (const entry of readyEntries) {
      const compiled = await this.compilerBridge.compileEntry(
        {
          repoId,
          entryId: entry.id,
          kind: entry.kind as LightExtensionKind,
          entryName: entry.entryName,
          entryPath: entry.entryPath,
          files: getEntryCompileFiles(pull.files || [], entry),
        },
        {
          ...ctx,
          can: undefined,
          requestSource: ctx.requestSource || 'light-extension-runtime-compile',
        },
      );

      if (!compiled.accepted) {
        await this.persistFailedCompile(entry, compiled.diagnostics, ctx.transaction);
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

    if (compileEntries.some((entry) => entry.status === 'success')) {
      await this.db.getRepository('lightExtensionRepos').update({
        filterByTk: repoId,
        values: {
          lastCompiledAt: new Date(),
        },
        transaction: ctx.transaction,
      });
    }

    const repo = await this.db.getRepository('lightExtensionRepos').findOne({
      filterByTk: repoId,
      transaction: ctx.transaction,
    });

    const successCount = compileEntries.filter((entry) => entry.status === 'success').length;
    const failedCount = compileEntries.filter((entry) => entry.status === 'failed').length;
    return {
      repo: repo ? repoFromModelLike(repo) : scan.repo,
      status:
        compileEntries.length === 0
          ? 'skipped'
          : failedCount === 0
            ? 'success'
            : successCount > 0
              ? 'partial_success'
              : 'failed',
      entries: compileEntries,
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
    const values = {
      compiledCommitId: input.commitId,
      runtimeArtifact: cloneRuntimeArtifact(input.artifact, {
        runtimeCodeHash,
        runtimeContract: 'light-extension.current-runtime.v1',
      }),
      runtimeVersion: input.artifact.version,
      surfaceStyle: input.surfaceStyle,
      runtimeCodeHash,
      filesHash: input.artifact.filesHash || '',
      settingsDefaultsHash,
      compiledAt: new Date(),
      diagnostics: sortDiagnostics([...input.entry.diagnostics, ...input.diagnostics]),
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

  private async persistFailedCompile(
    entry: LightExtensionEntryRecord,
    diagnostics: LightExtensionDiagnostic[],
    transaction?: Transaction,
  ): Promise<void> {
    const record = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entry.id,
      transaction,
    });
    if (!record) {
      return;
    }

    await record.update(
      {
        compiledCommitId: null,
        runtimeArtifact: null,
        runtimeVersion: null,
        surfaceStyle: null,
        runtimeCodeHash: null,
        filesHash: null,
        settingsDefaultsHash: null,
        compiledAt: null,
        diagnostics: sortDiagnostics([...entry.diagnostics, ...diagnostics]),
      },
      { transaction },
    );
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

function isEnabledKind(kind: string): boolean {
  return (LIGHT_EXTENSION_ENABLED_KINDS as readonly string[]).includes(kind);
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
    version: normalizeNumber(record.get('version'), 1),
    lifecycleStatus: record.get('lifecycleStatus') as LightExtensionSaveSourceResult['repo']['lifecycleStatus'],
    healthStatus: record.get('healthStatus') as LightExtensionSaveSourceResult['repo']['healthStatus'],
    headCommitId: nullableString(record.get('headCommitId')),
    lastScannedCommitId: nullableString(record.get('lastScannedCommitId')),
    lastError: nullableString(record.get('lastError')),
    lastScannedAt: normalizeDate(record.get('lastScannedAt')),
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

function normalizeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
