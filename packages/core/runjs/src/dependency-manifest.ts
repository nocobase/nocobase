/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

export const RUNJS_ENTRY_DEPENDENCY_MANIFEST_VERSION = 1 as const;

export type RunJSTypeDependencyEdgeKind = 'runtime' | 'type' | 'reference';

export type RunJSUnresolvedDependencyKind = 'runtime' | 'type' | 'reference' | 'blocked' | 'dynamic';

export interface RunJSDependencyFile {
  path: string;
  blobHash: string;
}

export interface RunJSRuntimeDependencyEdge {
  importer: string;
  imported: string;
}

export interface RunJSTypeDependencyEdge extends RunJSRuntimeDependencyEdge {
  kind: RunJSTypeDependencyEdgeKind;
}

export interface RunJSTypeDependencyContract {
  id: string;
  version?: string;
  contentHash?: string;
}

export interface RunJSUnresolvedDependency {
  importer: string;
  specifier: string;
  candidatePaths: string[];
  kind?: RunJSUnresolvedDependencyKind;
}

export interface RunJSEntryDependencyManifestV1 {
  version: typeof RUNJS_ENTRY_DEPENDENCY_MANIFEST_VERSION;
  compilerBuildId: string;
  entryPath: string;
  runtime: {
    files: RunJSDependencyFile[];
    edges: RunJSRuntimeDependencyEdge[];
  };
  types: {
    files: RunJSDependencyFile[];
    edges: RunJSTypeDependencyEdge[];
    contracts: RunJSTypeDependencyContract[];
  };
  unresolved: RunJSUnresolvedDependency[];
}

export type RunJSEntryDependencyManifestValidationFailure =
  | 'missing'
  | 'invalid'
  | 'unsupported_version'
  | 'compiler_build_mismatch'
  | 'entry_path_mismatch'
  | 'manifest_hash_mismatch';

export type RunJSEntryDependencyManifestValidationResult =
  | { valid: true; manifest: RunJSEntryDependencyManifestV1; manifestHash: string }
  | { valid: false; reason: RunJSEntryDependencyManifestValidationFailure };

export type RunJSUnresolvedCandidateMatch = 'match' | 'no-match' | 'unknown';

export function normalizeRunJSEntryDependencyManifest(
  value: RunJSEntryDependencyManifestV1,
): RunJSEntryDependencyManifestV1 {
  if (!isRecord(value) || value.version !== RUNJS_ENTRY_DEPENDENCY_MANIFEST_VERSION) {
    throw new TypeError('Unsupported RunJS entry dependency manifest version');
  }

  return {
    version: RUNJS_ENTRY_DEPENDENCY_MANIFEST_VERSION,
    compilerBuildId: normalizeRequiredString(value.compilerBuildId, 'compilerBuildId'),
    entryPath: normalizeDependencyPath(value.entryPath, 'entryPath'),
    runtime: {
      files: normalizeDependencyFiles(value.runtime?.files, 'runtime.files'),
      edges: normalizeRuntimeEdges(value.runtime?.edges),
    },
    types: {
      files: normalizeDependencyFiles(value.types?.files, 'types.files'),
      edges: normalizeTypeEdges(value.types?.edges),
      contracts: normalizeContracts(value.types?.contracts),
    },
    unresolved: normalizeUnresolved(value.unresolved),
  };
}

export function serializeRunJSEntryDependencyManifest(value: RunJSEntryDependencyManifestV1): string {
  return stableSerializeDependencyManifest(normalizeRunJSEntryDependencyManifest(value));
}

export function hashRunJSEntryDependencyManifest(value: RunJSEntryDependencyManifestV1): string {
  return sha256HexDependencyManifest(serializeRunJSEntryDependencyManifest(value));
}

export function validateRunJSEntryDependencyManifest(input: {
  value: unknown;
  expectedCompilerBuildId?: string;
  expectedEntryPath?: string;
  expectedManifestHash?: string;
}): RunJSEntryDependencyManifestValidationResult {
  if (input.value === null || typeof input.value === 'undefined') {
    return { valid: false, reason: 'missing' };
  }
  if (!isRecord(input.value)) {
    return { valid: false, reason: 'invalid' };
  }
  if (input.value.version !== RUNJS_ENTRY_DEPENDENCY_MANIFEST_VERSION) {
    return { valid: false, reason: 'unsupported_version' };
  }

  let manifest: RunJSEntryDependencyManifestV1;
  try {
    manifest = normalizeRunJSEntryDependencyManifest(input.value as unknown as RunJSEntryDependencyManifestV1);
  } catch (_error) {
    return { valid: false, reason: 'invalid' };
  }

  if (input.expectedCompilerBuildId && manifest.compilerBuildId !== input.expectedCompilerBuildId) {
    return { valid: false, reason: 'compiler_build_mismatch' };
  }
  if (input.expectedEntryPath) {
    let expectedEntryPath: string;
    try {
      expectedEntryPath = normalizeDependencyPath(input.expectedEntryPath, 'expectedEntryPath');
    } catch (_error) {
      return { valid: false, reason: 'entry_path_mismatch' };
    }
    if (manifest.entryPath !== expectedEntryPath) {
      return { valid: false, reason: 'entry_path_mismatch' };
    }
  }

  const manifestHash = hashRunJSEntryDependencyManifest(manifest);
  if (input.expectedManifestHash && manifestHash !== input.expectedManifestHash) {
    return { valid: false, reason: 'manifest_hash_mismatch' };
  }
  return { valid: true, manifest, manifestHash };
}

export function matchRunJSUnresolvedDependencyCandidate(
  changedPath: string,
  unresolved: Pick<RunJSUnresolvedDependency, 'candidatePaths'>,
): RunJSUnresolvedCandidateMatch {
  const normalizedChangedPath = normalizeDependencyPath(changedPath, 'changedPath');
  if (!Array.isArray(unresolved.candidatePaths) || unresolved.candidatePaths.length === 0) {
    return 'unknown';
  }
  return unresolved.candidatePaths.some(
    (candidatePath) => normalizeDependencyPath(candidatePath, 'candidatePath') === normalizedChangedPath,
  )
    ? 'match'
    : 'no-match';
}

function normalizeDependencyFiles(value: unknown, field: string): RunJSDependencyFile[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`RunJS dependency manifest ${field} must be an array`);
  }
  const files = new Map<string, RunJSDependencyFile>();
  for (const item of value) {
    if (!isRecord(item)) {
      throw new TypeError(`RunJS dependency manifest ${field} contains an invalid file`);
    }
    const path = normalizeDependencyPath(item.path, `${field}.path`);
    const blobHash = normalizeRequiredString(item.blobHash, `${field}.blobHash`);
    const existing = files.get(path);
    if (existing && existing.blobHash !== blobHash) {
      throw new TypeError(`RunJS dependency manifest contains conflicting hashes for "${path}"`);
    }
    files.set(path, { path, blobHash });
  }
  return [...files.values()].sort((left, right) => compareText(left.path, right.path));
}

function normalizeRuntimeEdges(value: unknown): RunJSRuntimeDependencyEdge[] {
  if (!Array.isArray(value)) {
    throw new TypeError('RunJS dependency manifest runtime.edges must be an array');
  }
  const edges = new Map<string, RunJSRuntimeDependencyEdge>();
  for (const item of value) {
    if (!isRecord(item)) {
      throw new TypeError('RunJS dependency manifest runtime.edges contains an invalid edge');
    }
    const edge = {
      importer: normalizeDependencyPath(item.importer, 'runtime.edges.importer'),
      imported: normalizeDependencyPath(item.imported, 'runtime.edges.imported'),
    };
    edges.set(`${edge.importer}\u0000${edge.imported}`, edge);
  }
  return [...edges.values()].sort(compareRuntimeEdges);
}

function normalizeTypeEdges(value: unknown): RunJSTypeDependencyEdge[] {
  if (!Array.isArray(value)) {
    throw new TypeError('RunJS dependency manifest types.edges must be an array');
  }
  const edges = new Map<string, RunJSTypeDependencyEdge>();
  for (const item of value) {
    if (!isRecord(item) || !isTypeEdgeKind(item.kind)) {
      throw new TypeError('RunJS dependency manifest types.edges contains an invalid edge');
    }
    const edge = {
      importer: normalizeDependencyPath(item.importer, 'types.edges.importer'),
      imported: normalizeDependencyPath(item.imported, 'types.edges.imported'),
      kind: item.kind,
    };
    edges.set(`${edge.importer}\u0000${edge.imported}\u0000${edge.kind}`, edge);
  }
  return [...edges.values()].sort(compareTypeEdges);
}

function normalizeContracts(value: unknown): RunJSTypeDependencyContract[] {
  if (!Array.isArray(value)) {
    throw new TypeError('RunJS dependency manifest types.contracts must be an array');
  }
  const contracts = new Map<string, RunJSTypeDependencyContract>();
  for (const item of value) {
    if (!isRecord(item)) {
      throw new TypeError('RunJS dependency manifest types.contracts contains an invalid contract');
    }
    const contract = {
      id: normalizeRequiredString(item.id, 'types.contracts.id'),
      ...(typeof item.version === 'string' && item.version ? { version: item.version } : {}),
      ...(typeof item.contentHash === 'string' && item.contentHash ? { contentHash: item.contentHash } : {}),
    };
    const key = stableSerializeDependencyManifest(contract);
    contracts.set(key, contract);
  }
  return [...contracts.values()].sort(
    (left, right) =>
      compareText(left.id, right.id) ||
      compareText(left.version || '', right.version || '') ||
      compareText(left.contentHash || '', right.contentHash || ''),
  );
}

function normalizeUnresolved(value: unknown): RunJSUnresolvedDependency[] {
  if (!Array.isArray(value)) {
    throw new TypeError('RunJS dependency manifest unresolved must be an array');
  }
  const unresolved = new Map<string, RunJSUnresolvedDependency>();
  for (const item of value) {
    if (!isRecord(item) || (typeof item.kind !== 'undefined' && !isUnresolvedKind(item.kind))) {
      throw new TypeError('RunJS dependency manifest unresolved contains an invalid dependency');
    }
    if (!Array.isArray(item.candidatePaths)) {
      throw new TypeError('RunJS dependency manifest unresolved.candidatePaths must be an array');
    }
    const dependency: RunJSUnresolvedDependency = {
      importer: normalizeDependencyPath(item.importer, 'unresolved.importer'),
      specifier: normalizeRequiredString(item.specifier, 'unresolved.specifier'),
      candidatePaths: [
        ...new Set(item.candidatePaths.map((path) => normalizeDependencyPath(path, 'candidatePath'))),
      ].sort(compareText),
      ...(item.kind ? { kind: item.kind } : {}),
    };
    unresolved.set(stableSerializeDependencyManifest(dependency), dependency);
  }
  return [...unresolved.values()].sort((left, right) =>
    compareText(stableSerializeDependencyManifest(left), stableSerializeDependencyManifest(right)),
  );
}

function normalizeDependencyPath(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`RunJS dependency manifest ${field} must be a string`);
  }
  const normalized = value
    .replace(/\\/gu, '/')
    .replace(/^\.\//u, '')
    .replace(/\/{2,}/gu, '/');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized.endsWith('/') ||
    normalized.includes('\0') ||
    normalized.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new TypeError(`RunJS dependency manifest ${field} must be a normalized relative path`);
  }
  return normalized;
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError(`RunJS dependency manifest ${field} must be a non-empty string`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isTypeEdgeKind(value: unknown): value is RunJSTypeDependencyEdgeKind {
  return value === 'runtime' || value === 'type' || value === 'reference';
}

function isUnresolvedKind(value: unknown): value is RunJSUnresolvedDependencyKind {
  return value === 'runtime' || value === 'type' || value === 'reference' || value === 'blocked' || value === 'dynamic';
}

function compareRuntimeEdges(left: RunJSRuntimeDependencyEdge, right: RunJSRuntimeDependencyEdge): number {
  return compareText(left.importer, right.importer) || compareText(left.imported, right.imported);
}

function compareTypeEdges(left: RunJSTypeDependencyEdge, right: RunJSTypeDependencyEdge): number {
  return compareRuntimeEdges(left, right) || compareText(left.kind, right.kind);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stableSerializeDependencyManifest(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerializeDependencyManifest(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerializeDependencyManifest(record[key])}`)
      .join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function sha256HexDependencyManifest(value: string): string {
  // Keep this contract dependency-light so it remains safe to export from the root RunJS entry.
  return createHash('sha256').update(value).digest('hex');
}
