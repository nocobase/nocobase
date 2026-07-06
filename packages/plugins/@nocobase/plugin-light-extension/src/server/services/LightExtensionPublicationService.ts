/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { buildRunJSRuntimeCodeHash, type RunJSRuntimeArtifact } from '@nocobase/plugin-vsc-file';
import { createHash } from 'crypto';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnostic,
  LightExtensionPublicationArtifactMetadata,
  LightExtensionPublicationMetadataRecord,
} from '../../shared/types';
import type { LightExtensionServiceContext } from './LightExtensionRepoService';
import { sortDiagnostics } from './LightExtensionValidator';

export interface LightExtensionCreatePublicationInput {
  repoId: string;
  entryId: string;
  commitId: string;
  entryPath: string;
  target?: 'client';
  kind: string;
  surfaceStyle: string;
  runtimeVersion?: string;
  artifact: RunJSRuntimeArtifact;
  settingsSchemaSnapshot?: Record<string, unknown> | null;
  settingsDefaultsSnapshot?: unknown;
  diagnostics?: LightExtensionDiagnostic[];
}

export interface LightExtensionPublicationRecord extends LightExtensionPublicationMetadataRecord {
  artifact: RunJSRuntimeArtifact;
}

export class LightExtensionPublicationService {
  constructor(private readonly db: Database) {}

  async createOrGetPublication(
    input: LightExtensionCreatePublicationInput,
    ctx: LightExtensionServiceContext = {},
  ): Promise<LightExtensionPublicationRecord> {
    assertPublicationInput(input);
    const settingsSchemaSnapshot = cloneRecordOrNull(input.settingsSchemaSnapshot);
    const settingsDefaultsSnapshot =
      typeof input.settingsDefaultsSnapshot === 'undefined'
        ? extractSettingsDefaults(settingsSchemaSnapshot)
        : cloneJsonValue(input.settingsDefaultsSnapshot);
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(input.artifact.code);
    const settingsSchemaHash = stableJsonHash(settingsSchemaSnapshot);
    const settingsDefaultsHash = stableJsonHash(settingsDefaultsSnapshot);
    const filesHash = input.artifact.filesHash;
    const existing = await this.db.getRepository('lightExtensionEntryPublications').findOne({
      filter: {
        entryId: input.entryId,
        commitId: input.commitId,
        filesHash,
        runtimeCodeHash,
        settingsDefaultsHash,
      },
      transaction: ctx.transaction,
    });

    if (existing) {
      return publicationFromModel(existing);
    }

    const created = await this.db.getRepository('lightExtensionEntryPublications').create({
      values: {
        repoId: input.repoId,
        entryId: input.entryId,
        commitId: input.commitId,
        entryPath: input.entryPath,
        target: input.target || 'client',
        kind: input.kind,
        surfaceStyle: input.surfaceStyle,
        runtimeVersion: input.runtimeVersion || input.artifact.version,
        artifact: cloneRuntimeArtifact(input.artifact, {
          runtimeCodeHash,
          publicationContract: 'light-extension.external-runjs.v1',
        }),
        settingsSchemaSnapshot,
        settingsDefaultsSnapshot,
        settingsSchemaHash,
        settingsDefaultsHash,
        filesHash,
        runtimeCodeHash,
        diagnostics: sortDiagnostics(input.diagnostics || input.artifact.diagnostics || []),
        createdById: ctx.actorUserId || undefined,
        createdFromRequestSource: ctx.requestSource,
        createdAt: new Date(),
      },
      transaction: ctx.transaction,
    });

    return publicationFromModel(created);
  }
}

export function publicationFromModel(record: Model): LightExtensionPublicationRecord {
  const artifact = normalizeRuntimeArtifact(record.get('artifact'));
  return {
    id: String(record.get('id')),
    repoId: String(record.get('repoId')),
    entryId: String(record.get('entryId')),
    commitId: String(record.get('commitId')),
    entryPath: String(record.get('entryPath')),
    target: 'client',
    kind: String(record.get('kind')),
    surfaceStyle: String(record.get('surfaceStyle')),
    runtimeVersion: String(record.get('runtimeVersion')),
    artifact,
    settingsSchemaSnapshot: normalizeRecordOrNull(record.get('settingsSchemaSnapshot')),
    settingsDefaultsSnapshot: cloneJsonValue(record.get('settingsDefaultsSnapshot')),
    settingsSchemaHash: String(record.get('settingsSchemaHash') || ''),
    settingsDefaultsHash: String(record.get('settingsDefaultsHash') || ''),
    filesHash: String(record.get('filesHash')),
    runtimeCodeHash: String(record.get('runtimeCodeHash')),
    diagnostics: normalizeDiagnostics(record.get('diagnostics')),
    createdById: nullableString(record.get('createdById')),
    createdFromRequestSource: nullableString(record.get('createdFromRequestSource')),
    createdAt: normalizeDate(record.get('createdAt')),
  };
}

export function toPublicationMetadata(
  record: LightExtensionPublicationRecord,
): LightExtensionPublicationMetadataRecord {
  return {
    id: record.id,
    repoId: record.repoId,
    entryId: record.entryId,
    commitId: record.commitId,
    entryPath: record.entryPath,
    target: record.target,
    kind: record.kind,
    surfaceStyle: record.surfaceStyle,
    runtimeVersion: record.runtimeVersion,
    artifact: summarizeArtifact(record.artifact),
    settingsSchemaSnapshot: cloneRecordOrNull(record.settingsSchemaSnapshot),
    settingsDefaultsSnapshot: cloneJsonValue(record.settingsDefaultsSnapshot),
    settingsSchemaHash: record.settingsSchemaHash,
    settingsDefaultsHash: record.settingsDefaultsHash,
    filesHash: record.filesHash,
    runtimeCodeHash: record.runtimeCodeHash,
    diagnostics: record.diagnostics,
    createdById: record.createdById,
    createdFromRequestSource: record.createdFromRequestSource,
    createdAt: record.createdAt,
  };
}

function assertPublicationInput(input: LightExtensionCreatePublicationInput): void {
  if (!input.repoId || !input.entryId || !input.commitId || !input.entryPath) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Publication identity fields are required');
  }
  if (!input.artifact?.code || !input.artifact.filesHash) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Compiled runtime artifact is required');
  }
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

function normalizeRuntimeArtifact(value: unknown): RunJSRuntimeArtifact {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Publication artifact is invalid');
  }

  const artifact = value as Partial<RunJSRuntimeArtifact>;
  return {
    code: typeof artifact.code === 'string' ? artifact.code : '',
    sourceMap: artifact.sourceMap,
    version: typeof artifact.version === 'string' ? artifact.version : 'v2',
    entryPath: typeof artifact.entryPath === 'string' ? artifact.entryPath : '',
    filesHash: typeof artifact.filesHash === 'string' ? artifact.filesHash : '',
    diagnostics: normalizeDiagnostics(artifact.diagnostics),
    metadata: normalizeRecord(artifact.metadata),
  };
}

function summarizeArtifact(artifact: RunJSRuntimeArtifact): LightExtensionPublicationArtifactMetadata {
  return {
    version: artifact.version,
    entryPath: artifact.entryPath,
    filesHash: artifact.filesHash,
    metadata: normalizeRecord(artifact.metadata),
    diagnostics: normalizeDiagnostics(artifact.diagnostics),
  };
}

function extractSettingsDefaults(schema: Record<string, unknown> | null): unknown {
  if (!schema) {
    return null;
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'default')) {
    return cloneJsonValue(schema.default);
  }

  const properties = schema.properties;
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      continue;
    }
    const childDefault = extractSettingsDefaults(value as Record<string, unknown>);
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
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function normalizeDiagnostics(value: unknown): LightExtensionDiagnostic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sortDiagnostics(
    value
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .map((item) => {
        const diagnostic = item as Partial<LightExtensionDiagnostic>;
        return {
          code: typeof diagnostic.code === 'string' ? diagnostic.code : 'unknown',
          severity: diagnostic.severity === 'warning' ? 'warning' : 'error',
          message: typeof diagnostic.message === 'string' ? diagnostic.message : '',
          path: typeof diagnostic.path === 'string' ? diagnostic.path : undefined,
          line: typeof diagnostic.line === 'number' ? diagnostic.line : undefined,
          column: typeof diagnostic.column === 'number' ? diagnostic.column : undefined,
          kind: typeof diagnostic.kind === 'string' ? diagnostic.kind : undefined,
          entryName: typeof diagnostic.entryName === 'string' ? diagnostic.entryName : undefined,
          details: normalizeRecord(diagnostic.details),
        };
      }),
  );
}

function normalizeRecordOrNull(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return cloneRecord(value as Record<string, unknown>);
}

function cloneRecordOrNull(value: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  return value ? cloneRecord(value) : null;
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

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return cloneRecord(value as Record<string, unknown>);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }

  return null;
}
