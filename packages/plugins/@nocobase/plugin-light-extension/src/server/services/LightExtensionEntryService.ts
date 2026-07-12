/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryHealthStatus,
  LightExtensionEntryRecord,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionRepoRecord,
} from '../../shared/types';
import { LightExtensionFileService } from './LightExtensionFileService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import {
  type LightExtensionEntryValidationResult,
  LightExtensionValidator,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './LightExtensionValidator';

export interface LightExtensionPreparedEntries {
  repo: LightExtensionRepoRecord;
  commitId: string;
  diagnostics: LightExtensionDiagnostic[];
  entries: LightExtensionEntryRecord[];
}

export class LightExtensionEntryService {
  constructor(
    private readonly db: Database,
    private readonly fileService: LightExtensionFileService,
    private readonly repoService: LightExtensionRepoService,
    private readonly validator = new LightExtensionValidator(),
  ) {}

  async prepareEntries(repoId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionPreparedEntries> {
    return this.withTransaction(ctx.transaction, async (transaction) => {
      await this.repoService.lockInternalRepoForUpdate(repoId, { ...ctx, transaction });
      const operationContext = {
        ...ctx,
        requestSource: ctx.requestSource || 'light-extension-compile',
        transaction,
      };
      const pull = await this.fileService.pull(
        {
          repoId,
          includeContent: 'all',
        },
        operationContext,
      );
      const commitId = pull.commit?.id;
      if (!commitId) {
        throw new LightExtensionError('LIGHT_EXTENSION_SOURCE_ERROR', 'Light extension source has no commit');
      }

      const validation = this.validator.validateWorkspace({
        files: toValidatorFiles(pull.files || []),
      });
      const diagnostics = sortDiagnostics(validation.diagnostics);
      if (hasErrorDiagnostic(diagnostics)) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_VALIDATION_FAILED',
          'Light extension source cannot be compiled',
          {
            status: 422,
            details: {
              repoId,
              commitId,
              diagnostics,
            },
          },
        );
      }

      const entries = await this.reconcileEntries(repoId, validation.entries, transaction);
      return {
        repo: await this.repoService.getRepo(repoId, operationContext),
        commitId,
        diagnostics,
        entries,
      };
    });
  }

  async listEntries(repoId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionEntryRecord[]> {
    await this.repoService.getRepo(repoId, ctx);
    const records = await this.db.getRepository('lightExtensionEntries').find({
      filter: { repoId },
      sort: ['kind', 'entryName'],
      transaction: ctx.transaction,
    });

    return records.map(entryFromModel);
  }

  async getEntry(entryId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionEntryRecord> {
    const record = await this.db.getRepository('lightExtensionEntries').findOne({
      filterByTk: entryId,
      transaction: ctx.transaction,
    });

    if (!record) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_ENTRY_NOT_FOUND',
        `Light extension entry "${entryId}" was not found`,
      );
    }

    return entryFromModel(record);
  }

  private async reconcileEntries(
    repoId: string,
    sourceEntries: LightExtensionEntryValidationResult[],
    transaction: Transaction,
  ): Promise<LightExtensionEntryRecord[]> {
    const entries: LightExtensionEntryRecord[] = [];

    for (const sourceEntry of sourceEntries) {
      const existing = await this.db.getRepository('lightExtensionEntries').findOne({
        filter: {
          repoId,
          target: sourceEntry.target,
          kind: sourceEntry.kind,
          entryName: sourceEntry.entryName,
        },
        transaction,
      });
      const values = {
        repoId,
        target: sourceEntry.target,
        kind: sourceEntry.kind,
        entryName: sourceEntry.entryName,
        entryPath: sourceEntry.entryPath,
        metaPath: sourceEntry.metaPath,
        settingsPath: sourceEntry.settingsPath,
        title: sourceEntry.title,
        description: sourceEntry.description,
        category: sourceEntry.category,
        icon: sourceEntry.icon,
        tags: sourceEntry.tags,
        sort: sourceEntry.sort,
        settingsSchema: sourceEntry.settingsSchema,
        healthStatus: 'ready',
        diagnostics: sourceEntry.diagnostics,
      };

      if (existing) {
        await existing.update(values, { transaction });
        entries.push(entryFromModel(existing));
        continue;
      }

      const created = await this.db.getRepository('lightExtensionEntries').create({ values, transaction });
      entries.push(entryFromModel(created));
    }

    const sourceKeys = new Set(sourceEntries.map((entry) => `${entry.target}:${entry.kind}:${entry.entryName}`));
    const existingEntries = await this.db.getRepository('lightExtensionEntries').find({
      filter: { repoId },
      sort: ['target', 'kind', 'entryName'],
      transaction,
    });

    for (const record of existingEntries) {
      const key = `${record.get('target')}:${record.get('kind')}:${record.get('entryName')}`;
      if (sourceKeys.has(key)) {
        continue;
      }

      await record.update(
        {
          healthStatus: 'missing',
          diagnostics: [],
          ...emptyRuntimeFields(),
        },
        { transaction },
      );
      entries.push(entryFromModel(record));
    }

    return entries.sort((left, right) =>
      [left.target, left.kind, left.entryName, left.id]
        .join('\u0000')
        .localeCompare([right.target, right.kind, right.entryName, right.id].join('\u0000')),
    );
  }

  private async withTransaction<T>(
    transaction: Transaction | undefined,
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    if (transaction) {
      return run(transaction);
    }

    return this.db.sequelize.transaction(run);
  }
}

function emptyRuntimeFields() {
  return {
    compiledCommitId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
    settingsDefaultsHash: null,
    compiledAt: null,
  };
}

export function entryFromModel(record: Model): LightExtensionEntryRecord {
  return {
    id: String(record.get('id')),
    repoId: String(record.get('repoId')),
    target: 'client',
    kind: String(record.get('kind')),
    entryName: String(record.get('entryName')),
    entryPath: String(record.get('entryPath')),
    metaPath: nullableString(record.get('metaPath')),
    settingsPath: nullableString(record.get('settingsPath')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    category: nullableString(record.get('category')),
    icon: nullableString(record.get('icon')),
    tags: normalizeTags(record.get('tags')),
    sort: normalizeNullableNumber(record.get('sort')),
    settingsSchema: normalizeRecord(record.get('settingsSchema')),
    compiledCommitId: nullableString(record.get('compiledCommitId')),
    runtimeArtifact: normalizeRuntimeArtifact(record.get('runtimeArtifact')),
    runtimeVersion: nullableString(record.get('runtimeVersion')),
    surfaceStyle: nullableString(record.get('surfaceStyle')),
    runtimeCodeHash: nullableString(record.get('runtimeCodeHash')),
    artifactHash: nullableString(record.get('artifactHash')),
    filesHash: nullableString(record.get('filesHash')),
    settingsDefaultsHash: nullableString(record.get('settingsDefaultsHash')),
    compiledAt: normalizeDate(record.get('compiledAt')),
    healthStatus: record.get('healthStatus') as LightExtensionEntryHealthStatus,
    diagnostics: normalizeDiagnostics(record.get('diagnostics')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeTags(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    return null;
  }
  return value;
}

function normalizeDiagnostics(value: unknown): LightExtensionDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isDiagnostic);
}

function normalizeRuntimeArtifact(value: unknown): LightExtensionEntryRuntimeArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const artifact = value as Partial<LightExtensionEntryRuntimeArtifact>;
  if (typeof artifact.code !== 'string') {
    return null;
  }

  return {
    code: artifact.code,
    sourceMap: typeof artifact.sourceMap === 'string' ? artifact.sourceMap : undefined,
    version: typeof artifact.version === 'string' ? artifact.version : 'v2',
    entryPath: typeof artifact.entryPath === 'string' ? artifact.entryPath : '',
    filesHash: typeof artifact.filesHash === 'string' ? artifact.filesHash : undefined,
    diagnostics: normalizeDiagnostics(artifact.diagnostics),
    metadata: normalizeRecord(artifact.metadata) || undefined,
  };
}

function isDiagnostic(value: unknown): value is LightExtensionDiagnostic {
  return Boolean(value) && typeof value === 'object' && typeof (value as { code?: unknown }).code === 'string';
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}
