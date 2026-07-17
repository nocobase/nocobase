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
  stableSerialize,
  type RunJSRuntimeArtifact,
} from '@nocobase/runjs';

import { LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT } from '../../constants';
import { LightExtensionError } from '../../shared/errors';
import type { LightExtensionDiagnostic } from '../../shared/types';
import type { CompileInputManifest } from './LightExtensionCompileKey';
import { sortDiagnostics } from './LightExtensionValidator';

export interface TrustedCompileCacheExpectation {
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
  artifactHash?: string;
}

export interface TrustedCompileArtifact {
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
  artifactHash: string;
  runtimeCodeHash: string;
  code: string;
  sourceMap?: string;
  version: string;
  entryPath: string;
  artifactFilesHash: string;
  diagnostics: LightExtensionDiagnostic[];
  compiledAt: Date;
}

export interface TrustedCompileCacheLookup {
  hits: Map<string, TrustedCompileArtifact>;
  missingKeys: Set<string>;
  corruptKeys: Set<string>;
}

export interface PersistTrustedCompileArtifactInput {
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
  artifact: RunJSRuntimeArtifact;
  diagnostics: LightExtensionDiagnostic[];
}

/**
 * Owns the content-addressed Artifact plus compileKey mapping boundary shared by formal compilation and trusted
 * preview. Callers may only persist a server compiler result; clients never provide this service's input directly.
 */
export class LightExtensionTrustedCompileCacheService {
  constructor(private readonly db: Database) {}

  async persistAcceptedCompile(
    input: PersistTrustedCompileArtifactInput,
    transaction?: Transaction,
  ): Promise<TrustedCompileArtifact> {
    assertPersistInput(input);
    const compiledAt = new Date();
    const entryPath = input.artifact.entryPath || input.inputManifest.entryPath;
    const sourceMap = input.artifact.sourceMap || undefined;
    const runtimeCodeHash = buildRunJSRuntimeCodeHash(input.artifact.code);
    const artifactHash = buildRunJSArtifactHash({
      code: input.artifact.code,
      sourceMap,
      version: input.artifact.version,
      entryPath,
      runtimeContract: input.inputManifest.runtimeContract,
    });

    const existing = await this.db.getRepository('lightExtensionCompileCache').findOne({
      filterByTk: input.compileKey,
      transaction,
    });
    if (existing && existing.get('artifactHash') !== artifactHash) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_SOURCE_ERROR',
        'Trusted light extension compile cache contains a conflicting artifact',
      );
    }

    await this.db.getRepository('lightExtensionRuntimeArtifacts').updateOrCreate({
      filterKeys: ['artifactHash'],
      values: {
        artifactHash,
        runtimeCodeHash,
        code: input.artifact.code,
        sourceMap: sourceMap || null,
        version: input.artifact.version,
        entryPath,
        runtimeContract: input.inputManifest.runtimeContract,
        byteSize: Buffer.byteLength(input.artifact.code, 'utf8') + Buffer.byteLength(sourceMap || '', 'utf8'),
      },
      transaction,
    });
    const diagnostics = sortDiagnostics(input.diagnostics);
    const artifactFilesHash = input.artifact.filesHash || '';
    await this.db.getRepository('lightExtensionCompileCache').updateOrCreate({
      filterKeys: ['compileKey'],
      values: {
        compileKey: input.compileKey,
        artifactHash,
        compilerBuildId: input.inputManifest.compilerBuildId,
        runtimeContract: input.inputManifest.runtimeContract,
        filesHash: input.filesHash,
        artifactFilesHash,
        inputManifest: input.inputManifest,
        diagnostics,
        compiledAt,
      },
      transaction,
    });

    return {
      compileKey: input.compileKey,
      filesHash: input.filesHash,
      inputManifest: input.inputManifest,
      artifactHash,
      runtimeCodeHash,
      code: input.artifact.code,
      sourceMap,
      version: input.artifact.version,
      entryPath,
      artifactFilesHash,
      diagnostics,
      compiledAt,
    };
  }

  async loadVerified(
    expectations: readonly TrustedCompileCacheExpectation[],
    transaction?: Transaction,
  ): Promise<TrustedCompileCacheLookup> {
    if (expectations.length === 0) {
      return { hits: new Map(), missingKeys: new Set(), corruptKeys: new Set() };
    }

    const compileKeys = [...new Set(expectations.map((expectation) => expectation.compileKey))];
    const cacheRows = await this.db.getRepository('lightExtensionCompileCache').find({
      filter: { compileKey: { $in: compileKeys } },
      transaction,
    });
    const cacheByKey = new Map(cacheRows.map((row: Model) => [String(row.get('compileKey')), row]));
    const artifactHashes = [
      ...new Set(
        cacheRows
          .map((row: Model) => row.get('artifactHash'))
          .filter((value: unknown): value is string => typeof value === 'string' && value.length > 0),
      ),
    ];
    const artifactRows = artifactHashes.length
      ? await this.db.getRepository('lightExtensionRuntimeArtifacts').find({
          filter: { artifactHash: { $in: artifactHashes } },
          transaction,
        })
      : [];
    const artifactByHash = new Map(artifactRows.map((row: Model) => [String(row.get('artifactHash')), row]));
    const hits = new Map<string, TrustedCompileArtifact>();
    const missingKeys = new Set<string>();
    const corruptKeys = new Set<string>();

    for (const expectation of expectations) {
      const cacheRow = cacheByKey.get(expectation.compileKey);
      if (!cacheRow) {
        missingKeys.add(expectation.compileKey);
        continue;
      }
      const artifactHash = stringValue(cacheRow.get('artifactHash'));
      const artifact = validateTrustedCompileArtifact(
        expectation,
        cacheRow,
        artifactHash ? artifactByHash.get(artifactHash) : undefined,
      );
      if (!artifact) {
        corruptKeys.add(expectation.compileKey);
        continue;
      }
      hits.set(expectation.compileKey, artifact);
    }

    return { hits, missingKeys, corruptKeys };
  }
}

function assertPersistInput(input: PersistTrustedCompileArtifactInput): void {
  if (
    !input.compileKey ||
    !input.filesHash ||
    !input.artifact.code ||
    input.inputManifest.runtimeContract !== LIGHT_EXTENSION_RUNTIME_ARTIFACT_CONTRACT ||
    input.artifact.version !== input.inputManifest.runtimeVersion ||
    (input.artifact.entryPath && input.artifact.entryPath !== input.inputManifest.entryPath)
  ) {
    throw new LightExtensionError(
      'LIGHT_EXTENSION_SOURCE_ERROR',
      'Server compiler result does not match the trusted compile input manifest',
    );
  }
}

function validateTrustedCompileArtifact(
  expectation: TrustedCompileCacheExpectation,
  cacheRow: Model,
  artifactRow: Model | undefined,
): TrustedCompileArtifact | undefined {
  if (!artifactRow) {
    return undefined;
  }
  const artifactHash = stringValue(cacheRow.get('artifactHash'));
  const code = stringValue(artifactRow.get('code'));
  const sourceMap = nullableString(artifactRow.get('sourceMap')) || undefined;
  const version = stringValue(artifactRow.get('version'));
  const entryPath = stringValue(artifactRow.get('entryPath'));
  const runtimeContract = stringValue(artifactRow.get('runtimeContract'));
  const runtimeCodeHash = stringValue(artifactRow.get('runtimeCodeHash'));
  const artifactFilesHash = stringValue(cacheRow.get('artifactFilesHash'));
  const compiledAt = dateValue(cacheRow.get('compiledAt'));
  const diagnostics = normalizeDiagnostics(cacheRow.get('diagnostics'));
  if (
    cacheRow.get('compileKey') !== expectation.compileKey ||
    cacheRow.get('compilerBuildId') !== expectation.inputManifest.compilerBuildId ||
    cacheRow.get('runtimeContract') !== expectation.inputManifest.runtimeContract ||
    cacheRow.get('filesHash') !== expectation.filesHash ||
    stableSerialize(cacheRow.get('inputManifest')) !== stableSerialize(expectation.inputManifest) ||
    !artifactHash ||
    (expectation.artifactHash && expectation.artifactHash !== artifactHash) ||
    artifactRow.get('artifactHash') !== artifactHash ||
    !code ||
    !version ||
    version !== expectation.inputManifest.runtimeVersion ||
    entryPath !== expectation.inputManifest.entryPath ||
    runtimeContract !== expectation.inputManifest.runtimeContract ||
    !runtimeCodeHash ||
    runtimeCodeHash !== buildRunJSRuntimeCodeHash(code) ||
    !artifactFilesHash ||
    !compiledAt ||
    !diagnostics
  ) {
    return undefined;
  }
  const expectedArtifactHash = buildRunJSArtifactHash({
    code,
    sourceMap,
    version,
    entryPath,
    runtimeContract,
  });
  if (expectedArtifactHash !== artifactHash) {
    return undefined;
  }
  return {
    compileKey: expectation.compileKey,
    filesHash: expectation.filesHash,
    inputManifest: expectation.inputManifest,
    artifactHash,
    runtimeCodeHash,
    code,
    sourceMap,
    version,
    entryPath,
    artifactFilesHash,
    diagnostics,
    compiledAt,
  };
}

function normalizeDiagnostics(value: unknown): LightExtensionDiagnostic[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const diagnostics: LightExtensionDiagnostic[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return undefined;
    }
    const diagnostic = item as Partial<LightExtensionDiagnostic>;
    if (
      typeof diagnostic.code !== 'string' ||
      (diagnostic.severity !== 'error' && diagnostic.severity !== 'warning') ||
      typeof diagnostic.message !== 'string'
    ) {
      return undefined;
    }
    diagnostics.push({ ...diagnostic } as LightExtensionDiagnostic);
  }
  return sortDiagnostics(diagnostics);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function dateValue(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return undefined;
}
