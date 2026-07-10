/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { randomUUID } from 'crypto';

import { LIGHT_EXTENSION_ENABLED_KINDS, type LightExtensionKind } from '../../constants';
import { LightExtensionError, isLightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryHealthStatus,
  LightExtensionEntryRecord,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionRepoHealthStatus,
  LightExtensionScanEntryResult,
  LightExtensionScanResult,
} from '../../shared/types';
import { LightExtensionAuditService } from './LightExtensionAuditService';
import { LightExtensionFileService } from './LightExtensionFileService';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import {
  LIGHT_EXTENSION_VALIDATOR_VERSION,
  LightExtensionEntryValidationResult,
  LightExtensionValidator,
  entryHasErrors,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './LightExtensionValidator';

export interface LightExtensionScanInput {
  repoId: string;
  ref?: string;
}

export class LightExtensionEntryScanner {
  constructor(
    private readonly db: Database,
    private readonly auditService: LightExtensionAuditService,
    private readonly fileService: LightExtensionFileService,
    private readonly repoService: LightExtensionRepoService,
    private readonly validator = new LightExtensionValidator(),
  ) {}

  async scanRepo(
    input: LightExtensionScanInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionScanResult> {
    const scanStartedAt = new Date();
    if (typeof input.ref !== 'undefined') {
      throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'scan only supports the current repository head');
    }

    const requestId = ctx.requestId || randomUUID();
    try {
      return await this.withTransaction(ctx.transaction, async (transaction) => {
        await this.repoService.lockInternalRepoForUpdate(input.repoId, { ...ctx, transaction });
        const scannedAt = new Date();
        const scanContext = {
          ...ctx,
          requestId,
          requestSource: ctx.requestSource || 'light-extension-scan',
          transaction,
        };
        const pull = await this.fileService.pull(
          {
            repoId: input.repoId,
            includeContent: 'all',
          },
          scanContext,
        );
        const validation = this.validator.validateWorkspace({
          files: toValidatorFiles(pull.files || []),
        });
        const commitId = pull.commit?.id || null;
        const scannedEntries = await this.persistScanEntries(
          input.repoId,
          validation.entries,
          commitId,
          scannedAt,
          transaction,
        );
        const missing = await this.markMissingEntries(
          input.repoId,
          validation.entries,
          commitId,
          scannedAt,
          transaction,
        );
        const entries = sortScanEntryResults([...scannedEntries, ...missing.entries]);
        const diagnostics = sortDiagnostics([...validation.diagnostics, ...missing.diagnostics]);

        const errorCount = diagnostics.filter((item) => item.severity === 'error').length;
        const warningCount = diagnostics.filter((item) => item.severity === 'warning').length;
        const repoHealthStatus = getRepoHealthStatus(diagnostics, entries);
        await this.db.getRepository('lightExtensionRepos').update({
          filterByTk: input.repoId,
          values: {
            healthStatus: repoHealthStatus,
            lastScannedCommitId: commitId,
            lastScannedAt: scannedAt,
            lastError: errorCount > 0 ? diagnostics.find((item) => item.severity === 'error')?.message : null,
          },
          transaction,
        });

        await this.auditService.recordScanEvent({
          repoId: input.repoId,
          action: 'scan',
          result: errorCount > 0 ? 'blocked' : 'success',
          requestId,
          actorUserId: ctx.actorUserId,
          commitId,
          entryCount: entries.length,
          diagnosticCount: diagnostics.length,
          errorCount,
          warningCount,
          diagnostics,
          reasonCode: errorCount > 0 ? 'validation_failed' : undefined,
          message:
            errorCount > 0 ? 'Light extension scan completed with validation errors' : 'Light extension scan completed',
          transaction,
        });

        return {
          repo: await this.repoService.getRepo(input.repoId, scanContext),
          commitId,
          accepted: errorCount === 0,
          diagnostics,
          entries,
          capabilities: validation.capabilities,
        };
      });
    } catch (error) {
      if (shouldRecordAbortedScan(error)) {
        try {
          await this.recordAbortedScan(input.repoId, ctx, requestId, scanStartedAt, error, ctx.transaction);
        } catch {
          // Best-effort abort recording must not mask the source scan error.
        }
      }
      throw error;
    }
  }

  async listEntries(repoId: string, ctx: LightExtensionServiceContext = {}): Promise<LightExtensionEntryRecord[]> {
    await this.repoService.getRepo(repoId, ctx);
    const records = await this.db.getRepository('lightExtensionEntries').find({
      filter: {
        repoId,
      },
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

  private async persistScanEntries(
    repoId: string,
    entries: LightExtensionEntryValidationResult[],
    commitId: string | null,
    scannedAt: Date,
    transaction: Transaction,
  ): Promise<LightExtensionScanEntryResult[]> {
    const results: LightExtensionScanEntryResult[] = [];

    for (const entry of entries) {
      const existing = await this.db.getRepository('lightExtensionEntries').findOne({
        filter: {
          repoId,
          target: entry.target,
          kind: entry.kind,
          entryName: entry.entryName,
        },
        transaction,
      });
      const healthStatus = getEntryHealthStatus(entry);
      const values = {
        repoId,
        target: entry.target,
        kind: entry.kind,
        entryName: entry.entryName,
        entryPath: entry.entryPath,
        metaPath: entry.metaPath,
        settingsPath: entry.settingsPath,
        title: entry.title,
        description: entry.description,
        category: entry.category,
        icon: entry.icon,
        tags: entry.tags,
        sort: entry.sort,
        settingsSchema: entry.settingsSchema,
        healthStatus,
        diagnostics: entry.diagnostics,
        validatorVersion: LIGHT_EXTENSION_VALIDATOR_VERSION,
        lastScannedCommitId: commitId,
        lastScannedAt: scannedAt,
        ...(healthStatus === 'ready' ? {} : emptyRuntimeFields()),
      };

      if (existing) {
        await existing.update(values, { transaction });
        results.push({
          entry: entryFromModel(existing),
          created: false,
        });
      } else {
        const created = await this.db.getRepository('lightExtensionEntries').create({
          values,
          transaction,
        });
        results.push({
          entry: entryFromModel(created),
          created: true,
        });
      }
    }

    return results;
  }

  private async markMissingEntries(
    repoId: string,
    scannedEntries: LightExtensionEntryValidationResult[],
    commitId: string | null,
    scannedAt: Date,
    transaction: Transaction,
  ): Promise<{ diagnostics: LightExtensionDiagnostic[]; entries: LightExtensionScanEntryResult[] }> {
    const diagnostics: LightExtensionDiagnostic[] = [];
    const entries: LightExtensionScanEntryResult[] = [];
    const scannedKeys = new Set(scannedEntries.map((entry) => `${entry.target}:${entry.kind}:${entry.entryName}`));
    const existingEntries = await this.db.getRepository('lightExtensionEntries').find({
      filter: {
        repoId,
      },
      sort: ['target', 'kind', 'entryName'],
      transaction,
    });

    for (const record of existingEntries) {
      const key = `${record.get('target')}:${record.get('kind')}:${record.get('entryName')}`;
      if (scannedKeys.has(key)) {
        continue;
      }

      const entryName = String(record.get('entryName') || '');
      const kind = String(record.get('kind') || '');
      const missingDiagnostic = {
        code: 'entry_missing',
        severity: 'error',
        message: 'Entry source files were not found during scan',
        path: nullableString(record.get('entryPath')) || undefined,
        kind,
        entryName,
      } satisfies LightExtensionDiagnostic;
      await record.update(
        {
          healthStatus: 'missing',
          diagnostics: [missingDiagnostic],
          validatorVersion: LIGHT_EXTENSION_VALIDATOR_VERSION,
          lastScannedCommitId: commitId,
          lastScannedAt: scannedAt,
          ...emptyRuntimeFields(),
        },
        { transaction },
      );
      diagnostics.push(missingDiagnostic);
      entries.push({
        entry: entryFromModel(record),
        created: false,
      });
    }

    return { diagnostics, entries };
  }

  private async recordAbortedScan(
    repoId: string,
    ctx: LightExtensionServiceContext,
    requestId: string,
    scanStartedAt: Date,
    error: unknown,
    transaction?: Transaction,
  ): Promise<void> {
    let repoExists = false;
    try {
      repoExists = await this.repoRecordExists(repoId, transaction);
    } catch {
      return;
    }
    if (!repoExists) {
      return;
    }

    try {
      await this.withTransaction(transaction, async (transaction) => {
        const repo = await this.db.getRepository('lightExtensionRepos').findOne({
          filterByTk: repoId,
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!repo) {
          return;
        }

        const currentLastScannedAt = normalizeDateValue(repo.get('lastScannedAt'));
        if (currentLastScannedAt && isAtOrAfterScanStart(currentLastScannedAt, scanStartedAt)) {
          return;
        }

        await repo.update(
          {
            healthStatus: 'scan_failed',
            lastError: errorMessage(error),
            lastScannedAt: new Date(),
          },
          { transaction },
        );
      });
    } catch {
      // Best-effort repo status update must not prevent the blocked audit attempt.
    }

    try {
      await this.auditService.recordScanEvent({
        repoId,
        action: 'scan',
        result: 'blocked',
        requestId,
        actorUserId: ctx.actorUserId,
        commitId: null,
        entryCount: 0,
        diagnosticCount: 1,
        errorCount: 1,
        warningCount: 0,
        diagnostics: [
          {
            code: scanAbortCode(error),
            severity: 'error',
            message: errorMessage(error),
          },
        ],
        reasonCode: scanAbortCode(error),
        message: 'Light extension scan aborted',
        transaction,
      });
    } catch {
      // Best-effort abort audit must not mask the original scan failure.
    }
  }

  private async repoRecordExists(repoId: string, transaction?: Transaction): Promise<boolean> {
    const record = await this.db.getModel('lightExtensionRepos').findByPk(repoId, { transaction });

    return Boolean(record);
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
    filesHash: nullableString(record.get('filesHash')),
    settingsDefaultsHash: nullableString(record.get('settingsDefaultsHash')),
    compiledAt: normalizeDate(record.get('compiledAt')),
    healthStatus: record.get('healthStatus') as LightExtensionEntryHealthStatus,
    diagnostics: normalizeDiagnostics(record.get('diagnostics')),
    validatorVersion: nullableString(record.get('validatorVersion')),
    lastScannedCommitId: nullableString(record.get('lastScannedCommitId')),
    lastScannedAt: normalizeDate(record.get('lastScannedAt')),
    createdAt: normalizeDate(record.get('createdAt')),
    updatedAt: normalizeDate(record.get('updatedAt')),
  };
}

function getRepoHealthStatus(
  diagnostics: LightExtensionDiagnostic[],
  entries: LightExtensionScanEntryResult[],
): LightExtensionRepoHealthStatus {
  if (!hasErrorDiagnostic(diagnostics)) {
    return 'ready';
  }

  if (entries.some((item) => item.entry.healthStatus === 'ready')) {
    return 'partial_failed';
  }

  return 'scan_failed';
}

function getEntryHealthStatus(entry: LightExtensionEntryValidationResult): LightExtensionEntryHealthStatus {
  if (entryHasErrors(entry)) {
    return 'failed';
  }

  if (!(LIGHT_EXTENSION_ENABLED_KINDS as readonly LightExtensionKind[]).includes(entry.kind)) {
    return 'disabled';
  }

  return 'ready';
}

function sortScanEntryResults(entries: LightExtensionScanEntryResult[]): LightExtensionScanEntryResult[] {
  return [...entries].sort((left, right) =>
    [left.entry.target, left.entry.kind, left.entry.entryName, left.entry.id]
      .join('\u0000')
      .localeCompare([right.entry.target, right.entry.kind, right.entry.entryName, right.entry.id].join('\u0000')),
  );
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

function scanAbortCode(error: unknown): string {
  return error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
    ? (error as { code: string }).code
    : 'scan_aborted';
}

function shouldRecordAbortedScan(error: unknown): boolean {
  return !isLightExtensionError(error) || error.code === 'LIGHT_EXTENSION_SOURCE_ERROR';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 512) : 'Light extension scan failed';
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return typeof value === 'string' ? value : null;
}

function normalizeDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}

export function isAtOrAfterScanStart(value: Date, scanStartedAt: Date): boolean {
  return value.getTime() >= scanStartedAt.getTime();
}
