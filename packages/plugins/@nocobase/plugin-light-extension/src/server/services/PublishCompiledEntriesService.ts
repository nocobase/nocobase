/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import {
  buildRunJSArtifactHash,
  buildRunJSRuntimeCodeHash,
  sha256Hex,
  stableSerialize,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';
import { Buffer } from 'node:buffer';

import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionDiagnostic } from '../../shared/types';
import {
  LIGHT_EXTENSION_AUTHORING_SURFACES,
  assertStructuredClonePlainData,
  type LightExtensionCompileResult,
  type LightExtensionCompileSuccessResult,
} from './LightExtensionCompileContract';
import { sortDiagnostics } from './LightExtensionValidator';

const artifactUpdateFields = [
  'runtimeCodeHash',
  'code',
  'sourceMap',
  'version',
  'entryPath',
  'runtimeContract',
  'byteSize',
] as const;
const entryUpdateFields = [
  'compiledCommitId',
  'compiledInputKey',
  'compilerBuildId',
  'runtimeArtifact',
  'runtimeVersion',
  'surfaceStyle',
  'runtimeCodeHash',
  'artifactHash',
  'filesHash',
  'compiledAt',
  'diagnostics',
  'healthStatus',
] as const;

export interface PublishCompiledEntriesBatch {
  commitId: string;
  results: readonly LightExtensionCompileResult[];
}

export interface PublishCompiledEntriesResult {
  artifactCount: number;
  entryCount: number;
  compiledAt: Date;
  entryIds: string[];
}

export interface CompiledEntriesPublishStore {
  runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
  loadEntries(entryIds: string[], transaction: Transaction): Promise<Array<Record<string, unknown>>>;
  bulkUpsertArtifacts(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void>;
  bulkUpsertEntries(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void>;
}

interface PreparedPublishBatch {
  artifacts: Array<Record<string, unknown>>;
  compiledAt: Date;
  entryIds: string[];
  results: LightExtensionCompileSuccessResult[];
}

export class PublishCompiledEntriesService {
  constructor(
    private readonly store: CompiledEntriesPublishStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  static forDatabase(db: Database): PublishCompiledEntriesService {
    return new PublishCompiledEntriesService(new SequelizeCompiledEntriesPublishStore(db));
  }

  async publishCompiledEntries(
    batch: PublishCompiledEntriesBatch,
    transaction?: Transaction,
  ): Promise<PublishCompiledEntriesResult> {
    const prepared = preparePublishBatch(batch, this.now());
    if (prepared.results.length === 0) {
      return {
        artifactCount: 0,
        entryCount: 0,
        compiledAt: prepared.compiledAt,
        entryIds: [],
      };
    }
    const publish = (activeTransaction: Transaction) => this.publishPreparedBatch(prepared, batch, activeTransaction);
    return transaction ? publish(transaction) : this.store.runInTransaction(publish);
  }

  private async publishPreparedBatch(
    prepared: PreparedPublishBatch,
    batch: PublishCompiledEntriesBatch,
    transaction: Transaction,
  ): Promise<PublishCompiledEntriesResult> {
    const storedEntries = await this.store.loadEntries(prepared.entryIds, transaction);
    const entriesById = new Map(storedEntries.map((entry) => [requiredString(entry.id, 'Stored entry id'), entry]));
    if (entriesById.size !== prepared.entryIds.length) {
      const missing = prepared.entryIds.filter((entryId) => !entriesById.has(entryId));
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        `Cannot publish compiled entries because persisted entries are missing: ${missing.join(', ')}`,
      );
    }
    const entryRows = prepared.results.map((result) => {
      const stored = entriesById.get(result.entryId);
      if (!stored) {
        throw new LightExtensionError(
          'LIGHT_EXTENSION_SOURCE_ERROR',
          `Light extension entry "${result.entryId}" is missing`,
        );
      }
      assertStoredEntryMatchesResult(stored, result);
      return {
        ...stored,
        ...buildEntryPublishValues(stored, result, batch.commitId, prepared.compiledAt),
      };
    });

    await this.store.bulkUpsertArtifacts(prepared.artifacts, transaction);
    await this.store.bulkUpsertEntries(entryRows, transaction);
    return {
      artifactCount: prepared.artifacts.length,
      entryCount: entryRows.length,
      compiledAt: prepared.compiledAt,
      entryIds: prepared.entryIds,
    };
  }
}

export async function publishCompiledEntries(
  db: Database,
  batch: PublishCompiledEntriesBatch,
  transaction?: Transaction,
): Promise<PublishCompiledEntriesResult> {
  return PublishCompiledEntriesService.forDatabase(db).publishCompiledEntries(batch, transaction);
}

export class SequelizeCompiledEntriesPublishStore implements CompiledEntriesPublishStore {
  constructor(private readonly db: Database) {}

  runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.sequelize.transaction(callback);
  }

  async loadEntries(entryIds: string[], transaction: Transaction): Promise<Array<Record<string, unknown>>> {
    const rows = await this.db.getModel<Model>('lightExtensionEntries').findAll({
      where: { id: entryIds },
      transaction,
    });
    return rows.map((row) => row.toJSON() as Record<string, unknown>);
  }

  async bulkUpsertArtifacts(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.db.getModel<Model>('lightExtensionRuntimeArtifacts').bulkCreate(rows, {
      updateOnDuplicate: [...artifactUpdateFields],
      transaction,
    });
  }

  async bulkUpsertEntries(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.db.getModel<Model>('lightExtensionEntries').bulkCreate(rows, {
      conflictAttributes: ['id'],
      updateOnDuplicate: [...entryUpdateFields],
      transaction,
    });
  }
}

function preparePublishBatch(batch: PublishCompiledEntriesBatch, compiledAt: Date): PreparedPublishBatch {
  if (typeof batch.commitId !== 'string' || !batch.commitId.trim()) {
    throw new TypeError('Publish batch commitId must be a non-empty string');
  }
  if (!Array.isArray(batch.results)) {
    throw new TypeError('Publish batch results must be an array');
  }
  const failures = batch.results.filter((result) => !result.accepted);
  if (failures.length > 0) {
    const diagnostics = failures.flatMap((result) => sortDiagnostics(result.diagnostics));
    throw new LightExtensionError('LIGHT_EXTENSION_VALIDATION_FAILED', 'Light extension source cannot be compiled', {
      status: 422,
      details: {
        commitId: batch.commitId,
        diagnostics,
        entries: failures.map((result) => ({
          entryId: result.entryId,
          entryName: result.entryName,
          kind: result.kind,
          entryPath: result.entryPath,
          status: 'failed',
          diagnostics: result.diagnostics,
          failureCode: result.failureCode,
        })),
      },
    });
  }
  const results = (batch.results as LightExtensionCompileSuccessResult[])
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal || left.entryId.localeCompare(right.entryId));
  const entryIds = new Set<string>();
  const artifacts = new Map<string, Record<string, unknown>>();
  for (const result of results) {
    assertStructuredClonePlainData(result, 'Compiled entry publish result');
    validateSuccessfulCompileResult(result);
    if (entryIds.has(result.entryId)) {
      throw new TypeError(`Publish batch contains duplicate entry "${result.entryId}"`);
    }
    entryIds.add(result.entryId);
    const artifactRow = buildArtifactRow(result);
    setConsistentRow(artifacts, result.artifactHash, artifactRow, 'artifactHash');
  }
  return {
    artifacts: [...artifacts.values()],
    compiledAt,
    entryIds: [...entryIds],
    results,
  };
}

function validateSuccessfulCompileResult(result: LightExtensionCompileSuccessResult): void {
  if (result.compilerBuildId !== result.inputManifest.compilerBuildId) {
    throw new TypeError(`Compiled result build identity mismatch for entry "${result.entryId}"`);
  }
  if (result.compileKey !== sha256Hex(stableSerialize(result.inputManifest))) {
    throw new TypeError(`Compiled result compileKey mismatch for entry "${result.entryId}"`);
  }
  if (result.filesHash !== sha256Hex(stableSerialize(result.inputManifest.files))) {
    throw new TypeError(`Compiled result filesHash mismatch for entry "${result.entryId}"`);
  }
  if (result.runtimeCodeHash !== buildRunJSRuntimeCodeHash(result.artifact.code)) {
    throw new TypeError(`Compiled result runtime code hash mismatch for entry "${result.entryId}"`);
  }
  const entryPath = result.artifact.entryPath || result.entryPath;
  const artifactHash = buildRunJSArtifactHash({
    code: result.artifact.code,
    sourceMap: result.artifact.sourceMap,
    version: result.artifact.version,
    entryPath,
    runtimeContract: result.inputManifest.runtimeContract,
  });
  if (result.artifactHash !== artifactHash) {
    throw new TypeError(`Compiled result artifact hash mismatch for entry "${result.entryId}"`);
  }
}

function buildArtifactRow(result: LightExtensionCompileSuccessResult): Record<string, unknown> {
  return {
    artifactHash: result.artifactHash,
    runtimeCodeHash: result.runtimeCodeHash,
    code: result.artifact.code,
    sourceMap: result.artifact.sourceMap || null,
    version: result.artifact.version,
    entryPath: result.artifact.entryPath || result.entryPath,
    runtimeContract: result.inputManifest.runtimeContract,
    byteSize:
      Buffer.byteLength(result.artifact.code, 'utf8') + Buffer.byteLength(result.artifact.sourceMap || '', 'utf8'),
  };
}

function buildEntryPublishValues(
  stored: Record<string, unknown>,
  result: LightExtensionCompileSuccessResult,
  commitId: string,
  compiledAt: Date,
): Record<string, unknown> {
  const existingDiagnostics = normalizeDiagnostics(stored.diagnostics);
  const runtimeArtifact: RunJSRuntimeArtifact = {
    code: result.artifact.code,
    ...(result.artifact.sourceMap ? { sourceMap: result.artifact.sourceMap } : {}),
    version: result.artifact.version,
    entryPath: result.artifact.entryPath || result.entryPath,
    filesHash: result.artifact.filesHash,
    diagnostics: sortDiagnostics(result.diagnostics),
    metadata: buildEntryRuntimeMetadata(stored, result),
  };
  return {
    compiledCommitId: commitId,
    compiledInputKey: result.compileKey,
    compilerBuildId: result.compilerBuildId,
    runtimeArtifact,
    runtimeVersion: result.artifact.version,
    surfaceStyle: result.inputManifest.surfaceStyle,
    runtimeCodeHash: result.runtimeCodeHash,
    artifactHash: result.artifactHash,
    filesHash: result.artifact.filesHash || '',
    compiledAt,
    diagnostics: sortDiagnostics([...existingDiagnostics, ...result.diagnostics]),
    healthStatus: 'ready',
  };
}

function buildEntryRuntimeMetadata(
  stored: Record<string, unknown>,
  result: LightExtensionCompileSuccessResult,
): Record<string, unknown> {
  const surface = LIGHT_EXTENSION_AUTHORING_SURFACES[result.kind];
  return {
    entry: result.inputManifest.entryPath,
    runtimeVersion: result.inputManifest.runtimeVersion,
    target: 'client',
    repoId: requiredString(stored.repoId, 'Stored entry repoId'),
    entryId: result.entryId,
    kind: result.kind,
    entryName: result.entryName,
    modelUse: result.inputManifest.modelUse,
    surface: surface.surface,
    surfaceStyle: result.inputManifest.surfaceStyle,
    compilerSurfaceStyle: result.inputManifest.compilerSurfaceStyle,
    runtimeCodeHash: result.runtimeCodeHash,
    artifactHash: result.artifactHash,
    runtimeContract: result.inputManifest.runtimeContract,
    compilerBuildId: result.compilerBuildId,
  };
}

function assertStoredEntryMatchesResult(
  stored: Record<string, unknown>,
  result: LightExtensionCompileSuccessResult,
): void {
  const matches =
    stored.id === result.entryId &&
    stored.repoId === result.repoId &&
    stored.entryName === result.entryName &&
    stored.kind === result.kind &&
    stored.entryPath === result.entryPath;
  if (!matches) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_ERROR',
      `Persisted entry identity changed before compiled result publish: ${result.entryId}`,
    );
  }
}

function setConsistentRow(
  rows: Map<string, Record<string, unknown>>,
  key: string,
  row: Record<string, unknown>,
  keyField: string,
): void {
  const existing = rows.get(key);
  if (existing && stableSerialize(existing) !== stableSerialize(row)) {
    throw new TypeError(`Publish batch contains conflicting rows for ${keyField} "${key}"`);
  }
  rows.set(key, row);
}

function normalizeDiagnostics(value: unknown): LightExtensionDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is LightExtensionDiagnostic =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as { code?: unknown }).code === 'string' &&
      ['error', 'warning'].includes(String((item as { severity?: unknown }).severity)),
  );
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}
