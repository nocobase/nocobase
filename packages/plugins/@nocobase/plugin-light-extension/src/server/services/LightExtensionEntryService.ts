/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { extractRunJSSettingsDefault } from '@nocobase/runjs/settings';
import { createHash } from 'crypto';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryHealthStatus,
  LightExtensionEntryRecord,
  LightExtensionEntryRuntimeArtifact,
  LightExtensionRepoRecord,
} from '../../shared/types';
import { LightExtensionFileService } from './LightExtensionFileService';
import { assertPreparedCandidateWorkspace, type PreparedCandidateWorkspace } from './PreparedCandidateWorkspace';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { LightExtensionRepoService } from './LightExtensionRepoService';
import {
  type LightExtensionEntryValidationResult,
  LightExtensionValidator,
  hasErrorDiagnostic,
  sortDiagnostics,
  toValidatorFiles,
} from './LightExtensionValidator';
import { hasUsableRuntimeArtifact } from './runtimeArtifact';

export interface EntryReferenceFingerprint {
  entryId: string;
  repoId: string;
  kind: string;
  healthStatus: LightExtensionEntryHealthStatus;
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  runtimeUsable: boolean;
}

export interface EntryReconcileChange {
  entry: LightExtensionEntryRecord;
  previousEntry?: LightExtensionEntryRecord | null;
  before: EntryReferenceFingerprint | null;
  after: EntryReferenceFingerprint;
  created: boolean;
  restored: boolean;
  missing: boolean;
  settingsChanged: boolean;
  metadataChanged: boolean;
  unchanged: boolean;
}

export interface EntryReconcileResult {
  entries: LightExtensionEntryRecord[];
  changes: EntryReconcileChange[];
  createdEntries: EntryReconcileChange[];
  restoredEntries: EntryReconcileChange[];
  missingEntries: EntryReconcileChange[];
  settingsChangedEntries: EntryReconcileChange[];
  metadataChangedEntries: EntryReconcileChange[];
  unchangedEntries: EntryReconcileChange[];
}

export interface LightExtensionPreparedEntries {
  repo: LightExtensionRepoRecord;
  commitId: string;
  diagnostics: LightExtensionDiagnostic[];
  entries: LightExtensionEntryRecord[];
  reconcile: EntryReconcileResult;
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

      const validateWorkspace = () =>
        this.validator.validateWorkspace({
          files: toValidatorFiles(pull.files || []),
        });
      const validation = operationContext.compileMetrics
        ? operationContext.compileMetrics.measure('workspaceValidation', validateWorkspace)
        : validateWorkspace();
      operationContext.compileMetrics?.set('entryCount', validation.entries.length);
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

      const reconcileEntries = () => this.reconcileEntries(repoId, validation.entries, commitId, transaction);
      const reconcile = operationContext.compileMetrics
        ? await operationContext.compileMetrics.measureAsync('entryReconcile', reconcileEntries)
        : await reconcileEntries();
      return {
        repo: await this.repoService.getRepo(repoId, operationContext),
        commitId,
        diagnostics,
        entries: reconcile.entries,
        reconcile,
      };
    });
  }

  async reconcilePreparedCandidate(
    candidate: PreparedCandidateWorkspace,
    ctx: LightExtensionServiceContext,
  ): Promise<LightExtensionPreparedEntries> {
    const transaction = ctx.transaction;
    if (!transaction) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'A transaction is required to reconcile a prepared candidate workspace',
      );
    }
    assertPreparedCandidateWorkspace(candidate, {
      transaction,
      repoId: candidate.repo.id,
      commitId: candidate.commit.id,
    });

    const diagnostics = sortDiagnostics(candidate.validation.diagnostics);
    if (hasErrorDiagnostic(diagnostics)) {
      throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
        status: 422,
        details: {
          repoId: candidate.repo.id,
          commitId: candidate.commit.id,
          diagnostics,
        },
      });
    }

    const reconcileEntries = () =>
      this.reconcileEntries(candidate.repo.id, candidate.validation.entries, candidate.commit.id, transaction);
    const reconcile = ctx.compileMetrics
      ? await ctx.compileMetrics.measureAsync('entryReconcile', reconcileEntries)
      : await reconcileEntries();

    return {
      repo: candidate.repo,
      commitId: candidate.commit.id,
      diagnostics,
      entries: reconcile.entries,
      reconcile,
    };
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

  async reconcileEntries(
    repoId: string,
    sourceEntries: LightExtensionEntryValidationResult[],
    repoHeadCommitId: string | null,
    transaction: Transaction,
  ): Promise<EntryReconcileResult> {
    const repository = this.db.getRepository('lightExtensionEntries');
    const existingRecords = await repository.find({
      filter: { repoId },
      sort: ['target', 'kind', 'entryName'],
      transaction,
    });
    const existingByIdentity = new Map<string, Model>();
    for (const record of existingRecords) {
      const identity = getEntryIdentityFromModel(record);
      if (existingByIdentity.has(identity)) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_ENTRY_CONFLICT',
          `Duplicate light extension entry identity "${formatEntryIdentity(record)}"`,
          {
            details: {
              repoId,
              entryIdentity: formatEntryIdentity(record),
            },
          },
        );
      }
      existingByIdentity.set(identity, record);
    }

    const sourceByIdentity = new Map<string, LightExtensionEntryValidationResult>();
    for (const sourceEntry of sourceEntries) {
      const identity = getEntryIdentity(sourceEntry);
      if (sourceByIdentity.has(identity)) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_ENTRY_CONFLICT',
          `Duplicate light extension source entry identity "${formatSourceEntryIdentity(sourceEntry)}"`,
          {
            details: {
              repoId,
              entryIdentity: formatSourceEntryIdentity(sourceEntry),
            },
          },
        );
      }
      sourceByIdentity.set(identity, sourceEntry);
    }

    const changes: EntryReconcileChange[] = [];
    const newEntryValues: Record<string, unknown>[] = [];
    const sortedSourceEntries = [...sourceByIdentity.values()].sort(compareSourceEntries);
    for (const sourceEntry of sortedSourceEntries) {
      const settingsHashes = buildLightExtensionSettingsHashes(sourceEntry.settingsSchema);
      const existing = existingByIdentity.get(getEntryIdentity(sourceEntry));
      const values: Record<string, unknown> = {
        repoId,
        target: sourceEntry.target,
        kind: sourceEntry.kind,
        entryName: sourceEntry.entryName,
        entryPath: sourceEntry.entryPath,
        descriptorPath: sourceEntry.descriptorPath,
        title: sourceEntry.title,
        description: sourceEntry.description,
        category: sourceEntry.category,
        icon: sourceEntry.icon,
        tags: sourceEntry.tags,
        sort: sourceEntry.sort,
        settingsSchema: sourceEntry.settingsSchema,
        settingsSchemaHash: settingsHashes.settingsSchemaHash,
        settingsDefaultsHash: settingsHashes.settingsDefaultsHash,
        healthStatus: 'ready',
        diagnostics: sourceEntry.diagnostics,
      };

      if (existing) {
        const beforeEntry = entryFromModel(existing);
        const changedValues = getChangedModelValues(existing, values);
        if (Object.keys(changedValues).length > 0) {
          await existing.update(changedValues, { transaction });
        }
        const entry = entryFromModel(existing);
        changes.push(
          createReconcileChange({
            entry,
            beforeEntry,
            repoHeadCommitId,
            changedFields: Object.keys(changedValues),
          }),
        );
        continue;
      }

      newEntryValues.push(values);
    }

    if (newEntryValues.length > 0) {
      const createdRecords = await repository.createMany({ records: newEntryValues, transaction });
      for (const [index, created] of createdRecords.entries()) {
        const entry = entryFromModel(created);
        changes.push(
          createReconcileChange({
            entry,
            beforeEntry: null,
            repoHeadCommitId,
            changedFields: Object.keys(newEntryValues[index] || {}),
          }),
        );
      }
    }

    for (const record of existingRecords) {
      if (sourceByIdentity.has(getEntryIdentityFromModel(record))) {
        continue;
      }

      const beforeEntry = entryFromModel(record);
      const changedValues = getChangedModelValues(record, {
        healthStatus: 'missing',
        diagnostics: [],
        ...emptyRuntimeFields(),
      });
      if (Object.keys(changedValues).length > 0) {
        await record.update(changedValues, { transaction });
      }
      changes.push(
        createReconcileChange({
          entry: entryFromModel(record),
          beforeEntry,
          repoHeadCommitId,
          changedFields: Object.keys(changedValues),
          markedMissing: Object.keys(changedValues).length > 0,
        }),
      );
    }

    return createEntryReconcileResult(changes);
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

const SETTINGS_FIELDS = new Set(['settingsSchema', 'settingsSchemaHash', 'settingsDefaultsHash']);
const METADATA_FIELDS = new Set([
  'entryPath',
  'descriptorPath',
  'title',
  'description',
  'category',
  'icon',
  'tags',
  'sort',
  'diagnostics',
]);

function createReconcileChange(input: {
  entry: LightExtensionEntryRecord;
  beforeEntry: LightExtensionEntryRecord | null;
  repoHeadCommitId: string | null;
  changedFields: string[];
  markedMissing?: boolean;
}): EntryReconcileChange {
  const created = !input.beforeEntry;
  const restored = input.beforeEntry?.healthStatus === 'missing' && input.entry.healthStatus === 'ready';
  const missing = Boolean(
    input.markedMissing || (input.beforeEntry?.healthStatus !== 'missing' && input.entry.healthStatus === 'missing'),
  );
  const settingsChanged = Boolean(input.beforeEntry && input.changedFields.some((field) => SETTINGS_FIELDS.has(field)));
  const metadataChanged = Boolean(input.beforeEntry && input.changedFields.some((field) => METADATA_FIELDS.has(field)));
  return {
    entry: input.entry,
    previousEntry: input.beforeEntry,
    before: input.beforeEntry ? createEntryReferenceFingerprint(input.beforeEntry, input.repoHeadCommitId) : null,
    after: createEntryReferenceFingerprint(input.entry, input.repoHeadCommitId),
    created,
    restored,
    missing,
    settingsChanged,
    metadataChanged,
    unchanged: !created && input.changedFields.length === 0,
  };
}

function createEntryReconcileResult(rawChanges: EntryReconcileChange[]): EntryReconcileResult {
  const changes = [...rawChanges].sort((left, right) => compareEntries(left.entry, right.entry));
  return {
    entries: changes.map((change) => change.entry),
    changes,
    createdEntries: changes.filter((change) => change.created),
    restoredEntries: changes.filter((change) => change.restored),
    missingEntries: changes.filter((change) => change.missing),
    settingsChangedEntries: changes.filter((change) => change.settingsChanged),
    metadataChangedEntries: changes.filter((change) => change.metadataChanged),
    unchangedEntries: changes.filter((change) => change.unchanged),
  };
}

export function createEntryReferenceFingerprint(
  entry: LightExtensionEntryRecord,
  repoHeadCommitId: string | null,
): EntryReferenceFingerprint {
  return {
    entryId: entry.id,
    repoId: entry.repoId,
    kind: entry.kind,
    healthStatus: entry.healthStatus,
    settingsSchemaHash: entry.settingsSchemaHash,
    settingsDefaultsHash: entry.settingsDefaultsHash,
    runtimeUsable: hasUsableRuntimeArtifact(entry, repoHeadCommitId),
  };
}

function getChangedModelValues(record: Model, values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(([field, value]) => !storedValuesEqual(record.get(field), value)),
  );
}

function storedValuesEqual(left: unknown, right: unknown): boolean {
  if (left instanceof Date || right instanceof Date) {
    return normalizeDate(left) === normalizeDate(right);
  }
  return stableSerialize(left) === stableSerialize(right);
}

function getEntryIdentity(entry: Pick<LightExtensionEntryValidationResult, 'target' | 'kind' | 'entryName'>): string {
  return [entry.target, entry.kind, entry.entryName].join('\u0000');
}

function getEntryIdentityFromModel(record: Model): string {
  return [record.get('target'), record.get('kind'), record.get('entryName')].map(String).join('\u0000');
}

function formatSourceEntryIdentity(
  entry: Pick<LightExtensionEntryValidationResult, 'target' | 'kind' | 'entryName'>,
): string {
  return `${entry.target}:${entry.kind}:${entry.entryName}`;
}

function formatEntryIdentity(record: Model): string {
  return [record.get('target'), record.get('kind'), record.get('entryName')].map(String).join(':');
}

function compareSourceEntries(
  left: LightExtensionEntryValidationResult,
  right: LightExtensionEntryValidationResult,
): number {
  return getEntryIdentity(left).localeCompare(getEntryIdentity(right));
}

function compareEntries(left: LightExtensionEntryRecord, right: LightExtensionEntryRecord): number {
  return [left.target, left.kind, left.entryName, left.id]
    .join('\u0000')
    .localeCompare([right.target, right.kind, right.entryName, right.id].join('\u0000'));
}

function emptyRuntimeFields() {
  return {
    compiledCommitId: null,
    compiledInputKey: null,
    compilerBuildId: null,
    runtimeArtifact: null,
    runtimeVersion: null,
    surfaceStyle: null,
    runtimeCodeHash: null,
    artifactHash: null,
    filesHash: null,
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
    descriptorPath: String(record.get('descriptorPath')),
    title: nullableString(record.get('title')),
    description: nullableString(record.get('description')),
    category: nullableString(record.get('category')),
    icon: nullableString(record.get('icon')),
    tags: normalizeTags(record.get('tags')),
    sort: normalizeNullableNumber(record.get('sort')),
    settingsSchema: normalizeRecord(record.get('settingsSchema')),
    settingsSchemaHash: nullableString(record.get('settingsSchemaHash')),
    compiledCommitId: nullableString(record.get('compiledCommitId')),
    compiledInputKey: nullableString(record.get('compiledInputKey')),
    compilerBuildId: nullableString(record.get('compilerBuildId')),
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

export function buildLightExtensionSettingsHashes(settingsSchema: Record<string, unknown> | null): {
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
} {
  if (!settingsSchema) {
    return {
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
    };
  }

  return {
    settingsSchemaHash: sha256(settingsSchemaSerialize(settingsSchema)),
    settingsDefaultsHash: sha256(stableSerialize(extractRunJSSettingsDefault(settingsSchema).value)),
  };
}

function settingsSchemaSerialize(value: unknown, parentKey?: string): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => settingsSchemaSerialize(item)).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    const keys = parentKey === 'properties' ? Object.keys(value) : Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${settingsSchemaSerialize(value[key], key)}`).join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
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

function cloneJsonValue(value: unknown): unknown {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return JSON.parse(JSON.stringify(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
