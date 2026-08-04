/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { stableSerialize, type RunJSRuntimeArtifact } from '@nocobase/runjs';
import { buildRunJSArtifactHash, buildRunJSRuntimeCodeHash, sha256Hex } from '@nocobase/runjs/server';
import { Buffer } from 'node:buffer';

import { JS_TEMPLATE_COLLECTIONS } from '../../constants';
import { JsTemplateError } from '../../shared/errors';
import type { JsTemplateDiagnostic } from '../../shared/types';
import {
  JS_TEMPLATE_AUTHORING_SURFACES,
  assertStructuredClonePlainData,
  type JsTemplateCompileResult,
  type JsTemplateCompileSuccessResult,
} from './JsTemplateCompileContract';
import { sortDiagnostics } from './JsTemplateValidator';

const artifactUpdateFields = [
  'runtimeCodeHash',
  'code',
  'sourceMap',
  'version',
  'entryPath',
  'runtimeContract',
  'byteSize',
] as const;
const templateUpdateFields = [
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

export interface ApplyCompiledTemplatesBatch {
  commitId: string;
  results: readonly JsTemplateCompileResult[];
}

export interface ApplyCompiledTemplatesResult {
  artifactCount: number;
  templateCount: number;
  compiledAt: Date;
  templateIds: string[];
}

export interface CompiledTemplatesStore {
  runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T>;
  loadTemplates(templateIds: string[], transaction: Transaction): Promise<Array<Record<string, unknown>>>;
  bulkUpsertArtifacts(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void>;
  bulkUpsertTemplates(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void>;
}

interface PreparedApplyBatch {
  artifacts: Array<Record<string, unknown>>;
  compiledAt: Date;
  templateIds: string[];
  results: JsTemplateCompileSuccessResult[];
}

export class ApplyCompiledTemplatesService {
  constructor(
    private readonly store: CompiledTemplatesStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  static forDatabase(db: Database): ApplyCompiledTemplatesService {
    return new ApplyCompiledTemplatesService(new SequelizeCompiledTemplatesStore(db));
  }

  async applyCompiledTemplates(
    batch: ApplyCompiledTemplatesBatch,
    transaction?: Transaction,
  ): Promise<ApplyCompiledTemplatesResult> {
    const prepared = prepareApplyBatch(batch, this.now());
    if (prepared.results.length === 0) {
      return {
        artifactCount: 0,
        templateCount: 0,
        compiledAt: prepared.compiledAt,
        templateIds: [],
      };
    }
    const apply = (activeTransaction: Transaction) => this.applyPreparedBatch(prepared, batch, activeTransaction);
    return transaction ? apply(transaction) : this.store.runInTransaction(apply);
  }

  private async applyPreparedBatch(
    prepared: PreparedApplyBatch,
    batch: ApplyCompiledTemplatesBatch,
    transaction: Transaction,
  ): Promise<ApplyCompiledTemplatesResult> {
    const storedTemplates = await this.store.loadTemplates(prepared.templateIds, transaction);
    const templatesById = new Map(
      storedTemplates.map((template) => [requiredString(template.id, 'Stored JS Template id'), template]),
    );
    if (templatesById.size !== prepared.templateIds.length) {
      const missing = prepared.templateIds.filter((templateId) => !templatesById.has(templateId));
      throw new JsTemplateError(
        'JS_TEMPLATE_SOURCE_ERROR',
        `Cannot apply compiled JS Templates because persisted templates are missing: ${missing.join(', ')}`,
      );
    }
    const templateRows = prepared.results.map((result) => {
      const stored = templatesById.get(result.templateId);
      if (!stored) {
        throw new JsTemplateError('JS_TEMPLATE_SOURCE_ERROR', `JS Template "${result.templateId}" is missing`);
      }
      assertStoredTemplateMatchesResult(stored, result);
      return {
        ...stored,
        ...buildTemplateApplyValues(stored, result, batch.commitId, prepared.compiledAt),
      };
    });

    await this.store.bulkUpsertArtifacts(prepared.artifacts, transaction);
    await this.store.bulkUpsertTemplates(templateRows, transaction);
    return {
      artifactCount: prepared.artifacts.length,
      templateCount: templateRows.length,
      compiledAt: prepared.compiledAt,
      templateIds: prepared.templateIds,
    };
  }
}

export async function applyCompiledTemplates(
  db: Database,
  batch: ApplyCompiledTemplatesBatch,
  transaction?: Transaction,
): Promise<ApplyCompiledTemplatesResult> {
  return ApplyCompiledTemplatesService.forDatabase(db).applyCompiledTemplates(batch, transaction);
}

export class SequelizeCompiledTemplatesStore implements CompiledTemplatesStore {
  constructor(private readonly db: Database) {}

  runInTransaction<T>(callback: (transaction: Transaction) => Promise<T>): Promise<T> {
    return this.db.sequelize.transaction(callback);
  }

  async loadTemplates(templateIds: string[], transaction: Transaction): Promise<Array<Record<string, unknown>>> {
    const rows = await this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.templates).findAll({
      where: { id: templateIds },
      transaction,
    });
    return rows.map((row) => row.toJSON() as Record<string, unknown>);
  }

  async bulkUpsertArtifacts(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.artifacts).bulkCreate(rows, {
      updateOnDuplicate: [...artifactUpdateFields],
      transaction,
    });
  }

  async bulkUpsertTemplates(rows: Array<Record<string, unknown>>, transaction: Transaction): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    await this.db.getModel<Model>(JS_TEMPLATE_COLLECTIONS.templates).bulkCreate(rows, {
      conflictAttributes: ['id'],
      updateOnDuplicate: [...templateUpdateFields],
      transaction,
    });
  }
}

function prepareApplyBatch(batch: ApplyCompiledTemplatesBatch, compiledAt: Date): PreparedApplyBatch {
  if (typeof batch.commitId !== 'string' || !batch.commitId.trim()) {
    throw new TypeError('Apply batch commitId must be a non-empty string');
  }
  if (!Array.isArray(batch.results)) {
    throw new TypeError('Apply batch results must be an array');
  }
  const failures = batch.results.filter((result) => !result.accepted);
  if (failures.length > 0) {
    const diagnostics = failures.flatMap((result) => sortDiagnostics(result.diagnostics));
    throw new JsTemplateError('JS_TEMPLATE_VALIDATION_FAILED', 'JS Template source cannot be compiled', {
      status: 422,
      details: {
        commitId: batch.commitId,
        diagnostics,
        templates: failures.map((result) => ({
          templateId: result.templateId,
          templateName: result.templateName,
          kind: result.kind,
          entryPath: result.entryPath,
          status: 'failed',
          diagnostics: result.diagnostics,
          failureCode: result.failureCode,
        })),
      },
    });
  }
  const results = (batch.results as JsTemplateCompileSuccessResult[])
    .slice()
    .sort((left, right) => left.ordinal - right.ordinal || left.templateId.localeCompare(right.templateId));
  const templateIds = new Set<string>();
  const artifacts = new Map<string, Record<string, unknown>>();
  for (const result of results) {
    assertStructuredClonePlainData(result, 'Compiled JS Template apply result');
    validateSuccessfulCompileResult(result);
    if (templateIds.has(result.templateId)) {
      throw new TypeError(`Apply batch contains duplicate JS Template "${result.templateId}"`);
    }
    templateIds.add(result.templateId);
    const artifactRow = buildArtifactRow(result);
    setConsistentRow(artifacts, result.artifactHash, artifactRow, 'artifactHash');
  }
  return {
    artifacts: [...artifacts.values()],
    compiledAt,
    templateIds: [...templateIds],
    results,
  };
}

function validateSuccessfulCompileResult(result: JsTemplateCompileSuccessResult): void {
  if (result.compilerBuildId !== result.inputManifest.compilerBuildId) {
    throw new TypeError(`Compiled result build identity mismatch for JS Template "${result.templateId}"`);
  }
  if (result.compileKey !== sha256Hex(stableSerialize(result.inputManifest))) {
    throw new TypeError(`Compiled result compileKey mismatch for JS Template "${result.templateId}"`);
  }
  if (result.filesHash !== sha256Hex(stableSerialize(result.inputManifest.files))) {
    throw new TypeError(`Compiled result filesHash mismatch for JS Template "${result.templateId}"`);
  }
  if (result.runtimeCodeHash !== buildRunJSRuntimeCodeHash(result.artifact.code)) {
    throw new TypeError(`Compiled result runtime code hash mismatch for JS Template "${result.templateId}"`);
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
    throw new TypeError(`Compiled result artifact hash mismatch for JS Template "${result.templateId}"`);
  }
}

function buildArtifactRow(result: JsTemplateCompileSuccessResult): Record<string, unknown> {
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

function buildTemplateApplyValues(
  stored: Record<string, unknown>,
  result: JsTemplateCompileSuccessResult,
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
    metadata: buildTemplateRuntimeMetadata(stored, result),
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

function buildTemplateRuntimeMetadata(
  stored: Record<string, unknown>,
  result: JsTemplateCompileSuccessResult,
): Record<string, unknown> {
  const surface = JS_TEMPLATE_AUTHORING_SURFACES[result.kind];
  return {
    entryPath: result.inputManifest.entryPath,
    runtimeVersion: result.inputManifest.runtimeVersion,
    target: 'client',
    projectId: requiredString(stored.projectId, 'Stored JS Template projectId'),
    templateId: result.templateId,
    kind: result.kind,
    templateName: result.templateName,
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

function assertStoredTemplateMatchesResult(
  stored: Record<string, unknown>,
  result: JsTemplateCompileSuccessResult,
): void {
  const matches =
    stored.id === result.templateId &&
    stored.projectId === result.projectId &&
    stored.templateName === result.templateName &&
    stored.kind === result.kind &&
    stored.entryPath === result.entryPath;
  if (!matches) {
    throw new JsTemplateError(
      'JS_TEMPLATE_SOURCE_ERROR',
      `Persisted JS Template identity changed before compiled result apply: ${result.templateId}`,
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
    throw new TypeError(`Apply batch contains conflicting rows for ${keyField} "${key}"`);
  }
  rows.set(key, row);
}

function normalizeDiagnostics(value: unknown): JsTemplateDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is JsTemplateDiagnostic =>
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
