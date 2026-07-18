/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { posix as pathPosix } from 'path';

import {
  matchRunJSUnresolvedDependencyCandidate,
  stableSerialize,
  validateRunJSEntryDependencyManifest,
  type RunJSEntryDependencyManifestV1,
  type RunJSEntryDependencyManifestValidationFailure,
} from '@nocobase/runjs';

import { LIGHT_EXTENSION_SUPPORTED_KINDS, type LightExtensionKind } from '../../constants';
import { classifySourcePath, getEntryRootPath, normalizeSourcePath } from './light-extension-validator/workspacePolicy';

export const AFFECTED_ENTRY_PLAN_REASONS = [
  'entry_private',
  'shared_conservative',
  'runtime_dependency',
  'type_dependency',
  'unresolved_candidate',
  'conservative_manifest_missing',
  'conservative_manifest_invalid',
  'conservative_manifest_version',
  'conservative_build_mismatch',
  'conservative_unresolved',
  'entry_added',
  'entry_removed',
  'entry_moved',
  'entrypoint_changed',
  'metadata_only',
  'entry_health_changed',
  'conservative_unknown',
] as const;

export type AffectedEntryPlanReason = (typeof AFFECTED_ENTRY_PLAN_REASONS)[number];

export type EntryPlanClassification = 'compile' | 'metadata-only' | 'unchanged' | 'removed';

export interface EntryPlanSnapshot {
  id: string | null;
  target: 'client';
  kind: LightExtensionKind;
  entryName: string;
  entryPath: string;
  descriptorPath: string;
  healthStatus: 'ready' | 'missing';
  settingsSchemaHash: string | null;
  settingsDefaultsHash: string | null;
  metadataFingerprint: string;
  compilerBuildId?: string | null;
  dependencyManifest?: unknown;
  dependencyManifestHash?: string | null;
}

export interface AffectedEntryPathChange {
  path: string;
  operation: 'added' | 'modified' | 'deleted' | 'unknown';
}

export interface AffectedEntryPlanInput {
  changedPaths: readonly string[];
  pathChanges?: readonly AffectedEntryPathChange[];
  previousEntries: readonly EntryPlanSnapshot[];
  candidateEntries: readonly EntryPlanSnapshot[];
  compilerBuildId?: string;
}

export interface EntryPlanIdentity {
  target: 'client';
  kind: LightExtensionKind;
  entryName: string;
}

export interface PlannedEntry extends EntryPlanSnapshot {
  reasons: AffectedEntryPlanReason[];
  changedPaths: string[];
}

export interface EntryChangeFlags {
  added: boolean;
  removed: boolean;
  moved: boolean;
  entrypointChanged: boolean;
  settingsChanged: boolean;
  displayMetadataChanged: boolean;
  healthStatusChanged: boolean;
}

export interface EntryPlanChange {
  classification: EntryPlanClassification;
  identity: EntryPlanIdentity;
  entryId: string | null;
  previousEntry: EntryPlanSnapshot | null;
  candidateEntry: EntryPlanSnapshot | null;
  reasons: AffectedEntryPlanReason[];
  changedPaths: string[];
  flags: EntryChangeFlags;
}

export interface EntryChangeSet {
  changes: EntryPlanChange[];
  addedEntries: EntryPlanChange[];
  removedEntries: EntryPlanChange[];
  movedEntries: EntryPlanChange[];
  entrypointChangedEntries: EntryPlanChange[];
  settingsChangedEntries: EntryPlanChange[];
  displayMetadataChangedEntries: EntryPlanChange[];
  healthStatusChangedEntries: EntryPlanChange[];
  affectedEntryIds: string[];
}

export interface CompilePlanMetrics {
  changedFileCount: number;
  affectedEntryCount: number;
  preciseHitEntryCount: number;
  conservativeFallbackEntryCount: number;
  manifestVersionMismatchEntryCount: number;
  reasonCounts: Record<AffectedEntryPlanReason, number>;
}

export interface CompilePlan {
  compileCandidates: PlannedEntry[];
  metadataOnlyEntries: PlannedEntry[];
  unchangedEntries: PlannedEntry[];
  removedEntries: PlannedEntry[];
  entryChanges: EntryChangeSet;
  metrics: CompilePlanMetrics;
}

interface MutableEntryChange {
  previousEntry: EntryPlanSnapshot | null;
  candidateEntry: EntryPlanSnapshot | null;
  reasons: Set<AffectedEntryPlanReason>;
  changedPaths: Set<string>;
}

const compileReasons = new Set<AffectedEntryPlanReason>([
  'entry_private',
  'shared_conservative',
  'runtime_dependency',
  'type_dependency',
  'unresolved_candidate',
  'conservative_manifest_missing',
  'conservative_manifest_invalid',
  'conservative_manifest_version',
  'conservative_build_mismatch',
  'conservative_unresolved',
  'entry_added',
  'entry_moved',
  'entrypoint_changed',
  'entry_health_changed',
  'conservative_unknown',
]);

const preciseDependencyReasons = new Set<AffectedEntryPlanReason>([
  'runtime_dependency',
  'type_dependency',
  'unresolved_candidate',
]);

const conservativeFallbackReasons = new Set<AffectedEntryPlanReason>([
  'shared_conservative',
  'conservative_manifest_missing',
  'conservative_manifest_invalid',
  'conservative_manifest_version',
  'conservative_build_mismatch',
  'conservative_unresolved',
  'conservative_unknown',
]);

const manifestVersionMismatchReasons = new Set<AffectedEntryPlanReason>(['conservative_manifest_version']);

const supportedKinds = new Set<string>(LIGHT_EXTENSION_SUPPORTED_KINDS);

export function createAffectedEntryCompilePlan(input: AffectedEntryPlanInput): CompilePlan {
  const pathChanges = normalizePathChanges(input.changedPaths, input.pathChanges);
  const changedPaths = [...pathChanges.keys()];
  const previousEntries = createEntryMap(input.previousEntries, 'previous');
  const candidateEntries = createEntryMap(input.candidateEntries, 'candidate');
  const changes = createMutableChanges(previousEntries, candidateEntries);

  classifySnapshotChanges(changes);
  classifyChangedPaths(pathChanges, changes, input.compilerBuildId);

  const finalizedChanges = [...changes.values()].map(finalizeChange).sort(compareEntryChanges);
  const compileCandidates = toPlannedEntries(finalizedChanges, 'compile');
  const metadataOnlyEntries = toPlannedEntries(finalizedChanges, 'metadata-only');
  const unchangedEntries = toPlannedEntries(finalizedChanges, 'unchanged');
  const removedEntries = toPlannedEntries(finalizedChanges, 'removed');

  return {
    compileCandidates,
    metadataOnlyEntries,
    unchangedEntries,
    removedEntries,
    entryChanges: createEntryChangeSet(finalizedChanges),
    metrics: {
      changedFileCount: changedPaths.length,
      affectedEntryCount: compileCandidates.length,
      preciseHitEntryCount: countEntriesWithReasons(compileCandidates, preciseDependencyReasons),
      conservativeFallbackEntryCount: countEntriesWithReasons(compileCandidates, conservativeFallbackReasons),
      manifestVersionMismatchEntryCount: countEntriesWithReasons(compileCandidates, manifestVersionMismatchReasons),
      reasonCounts: countReasons(finalizedChanges),
    },
  };
}

function countEntriesWithReasons(
  entries: readonly PlannedEntry[],
  reasons: ReadonlySet<AffectedEntryPlanReason>,
): number {
  return entries.filter((entry) => entry.reasons.some((reason) => reasons.has(reason))).length;
}

export function getEntryPlanIdentity(entry: EntryPlanIdentity): string {
  return [entry.target, entry.kind, entry.entryName].join('\u0000');
}

function normalizeChangedPaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizeSourcePath))].sort(compareText);
}

function normalizePathChanges(
  changedPaths: readonly string[],
  changes: readonly AffectedEntryPathChange[] = [],
): Map<string, AffectedEntryPathChange['operation']> {
  const operations = new Map<string, AffectedEntryPathChange['operation']>();
  for (const path of normalizeChangedPaths(changedPaths)) {
    operations.set(path, 'unknown');
  }
  for (const change of changes) {
    const path = normalizeSourcePath(change.path);
    const existing = operations.get(path);
    operations.set(path, mergePathOperations(existing, change.operation));
  }
  return new Map([...operations].sort(([left], [right]) => compareText(left, right)));
}

function mergePathOperations(
  left: AffectedEntryPathChange['operation'] | undefined,
  right: AffectedEntryPathChange['operation'],
): AffectedEntryPathChange['operation'] {
  if (!left || left === 'unknown') {
    return right;
  }
  return left === right ? left : 'unknown';
}

function createEntryMap(entries: readonly EntryPlanSnapshot[], source: 'previous' | 'candidate') {
  const result = new Map<string, EntryPlanSnapshot>();
  for (const rawEntry of entries) {
    const entry = normalizeEntry(rawEntry);
    const identity = getEntryPlanIdentity(entry);
    const existing = result.get(identity);
    if (!existing) {
      result.set(identity, entry);
      continue;
    }
    if (serializeEntry(existing) !== serializeEntry(entry)) {
      throw new TypeError(`Conflicting ${source} light-extension entries for identity "${formatIdentity(entry)}"`);
    }
  }
  return result;
}

function normalizeEntry(entry: EntryPlanSnapshot): EntryPlanSnapshot {
  return {
    id: entry.id,
    target: entry.target,
    kind: entry.kind,
    entryName: entry.entryName,
    entryPath: normalizeSourcePath(entry.entryPath),
    descriptorPath: normalizeSourcePath(entry.descriptorPath),
    healthStatus: entry.healthStatus,
    settingsSchemaHash: entry.settingsSchemaHash,
    settingsDefaultsHash: entry.settingsDefaultsHash,
    metadataFingerprint: entry.metadataFingerprint,
    compilerBuildId: entry.compilerBuildId ?? null,
    dependencyManifest: entry.dependencyManifest ?? null,
    dependencyManifestHash: entry.dependencyManifestHash ?? null,
  };
}

function serializeEntry(entry: EntryPlanSnapshot): string {
  return JSON.stringify([
    entry.id,
    entry.target,
    entry.kind,
    entry.entryName,
    entry.entryPath,
    entry.descriptorPath,
    entry.healthStatus,
    entry.settingsSchemaHash,
    entry.settingsDefaultsHash,
    entry.metadataFingerprint,
    entry.compilerBuildId,
    entry.dependencyManifestHash,
    stableSerialize(entry.dependencyManifest),
  ]);
}

function createMutableChanges(
  previousEntries: ReadonlyMap<string, EntryPlanSnapshot>,
  candidateEntries: ReadonlyMap<string, EntryPlanSnapshot>,
): Map<string, MutableEntryChange> {
  const identities = [...new Set([...previousEntries.keys(), ...candidateEntries.keys()])].sort(compareText);
  return new Map(
    identities.map((identity) => {
      const previousEntry = previousEntries.get(identity) || null;
      const rawCandidate = candidateEntries.get(identity) || null;
      const candidateEntry = rawCandidate ? preserveEntryId(rawCandidate, previousEntry) : null;
      return [
        identity,
        {
          previousEntry,
          candidateEntry,
          reasons: new Set<AffectedEntryPlanReason>(),
          changedPaths: new Set<string>(),
        },
      ];
    }),
  );
}

function preserveEntryId(candidate: EntryPlanSnapshot, previous: EntryPlanSnapshot | null): EntryPlanSnapshot {
  if (!previous?.id || candidate.id === previous.id) {
    return candidate;
  }
  return {
    ...candidate,
    id: previous.id,
  };
}

function classifySnapshotChanges(changes: ReadonlyMap<string, MutableEntryChange>): void {
  for (const change of changes.values()) {
    const previous = change.previousEntry;
    const candidate = change.candidateEntry;
    if (!previous && candidate) {
      change.reasons.add('entry_added');
      continue;
    }
    if (previous && !candidate) {
      change.reasons.add('entry_removed');
      continue;
    }
    if (!previous || !candidate) {
      continue;
    }

    const previousRoot = getPhysicalEntryRoot(previous);
    const candidateRoot = getPhysicalEntryRoot(candidate);
    if (previousRoot !== candidateRoot) {
      change.reasons.add('entry_moved');
    }
    if (
      previous.entryPath !== candidate.entryPath &&
      (previousRoot === candidateRoot ||
        pathPosix.basename(previous.entryPath) !== pathPosix.basename(candidate.entryPath))
    ) {
      change.reasons.add('entrypoint_changed');
    }
    if (
      previous.settingsSchemaHash !== candidate.settingsSchemaHash ||
      previous.settingsDefaultsHash !== candidate.settingsDefaultsHash ||
      previous.metadataFingerprint !== candidate.metadataFingerprint
    ) {
      change.reasons.add('metadata_only');
    }
    if (previous.healthStatus !== candidate.healthStatus) {
      change.reasons.add('entry_health_changed');
    }
  }
}

function classifyChangedPaths(
  paths: ReadonlyMap<string, AffectedEntryPathChange['operation']>,
  changes: ReadonlyMap<string, MutableEntryChange>,
  compilerBuildId?: string,
): void {
  const previousRoots = indexPhysicalRoots(changes, 'previousEntry');
  const candidateRoots = indexPhysicalRoots(changes, 'candidateEntry');
  const unknownPaths: string[] = [];

  for (const [path, operation] of paths) {
    const pathKind = classifySourcePath(path);
    if (pathKind.status === 'ignored') {
      continue;
    }
    if (pathKind.status === 'shared') {
      classifySharedPath(path, operation, changes, compilerBuildId);
      continue;
    }
    if (pathKind.status !== 'enabled') {
      unknownPaths.push(path);
      continue;
    }

    const physicalRoot = pathPosix.dirname(path) === '.' ? path : getClassifiedPhysicalRoot(path);
    const identities = new Set([
      ...(previousRoots.get(physicalRoot) || []),
      ...(candidateRoots.get(physicalRoot) || []),
    ]);
    if (identities.size === 0) {
      unknownPaths.push(path);
      continue;
    }

    for (const identity of identities) {
      const change = changes.get(identity);
      if (!change) {
        continue;
      }
      change.changedPaths.add(path);
      if (isDescriptorPath(path, change)) {
        continue;
      }
      if (change.candidateEntry?.healthStatus === 'ready') {
        change.reasons.add('entry_private');
      }
    }
  }

  for (const path of unknownPaths) {
    addReasonToReadyCandidates(changes, 'conservative_unknown', path);
  }
}

function classifySharedPath(
  path: string,
  operation: AffectedEntryPathChange['operation'],
  changes: ReadonlyMap<string, MutableEntryChange>,
  compilerBuildId?: string,
): void {
  if (!compilerBuildId) {
    addReasonToReadyCandidates(changes, 'shared_conservative', path);
    return;
  }

  const manifests = new Map<MutableEntryChange, RunJSEntryDependencyManifestV1>();
  for (const change of changes.values()) {
    const previous = change.previousEntry;
    const candidate = change.candidateEntry;
    if (!previous || !candidate || candidate.healthStatus !== 'ready' || !supportedKinds.has(candidate.kind)) {
      continue;
    }
    if (change.reasons.has('entry_moved') || change.reasons.has('entrypoint_changed')) {
      continue;
    }
    const validation = validateRunJSEntryDependencyManifest({
      value: previous.dependencyManifest,
      expectedCompilerBuildId: compilerBuildId,
      expectedEntryPath: previous.entryPath,
      expectedManifestHash: previous.dependencyManifestHash || undefined,
    });
    if (!validation.valid) {
      addReasonToReadyCandidates(changes, fallbackReasonForManifest(validation.reason), path);
      return;
    }
    manifests.set(change, validation.manifest);
  }

  if (operation === 'added' || operation === 'unknown') {
    for (const manifest of manifests.values()) {
      if (
        manifest.unresolved.some(
          (dependency) => matchRunJSUnresolvedDependencyCandidate(path, dependency) === 'unknown',
        )
      ) {
        addReasonToReadyCandidates(changes, 'conservative_unresolved', path);
        return;
      }
    }
  }

  for (const [change, manifest] of manifests) {
    const runtimeDependency = manifest.runtime.files.some((file) => file.path === path);
    const typeDependency = !runtimeDependency && manifest.types.files.some((file) => file.path === path);
    const unresolvedCandidate =
      (operation === 'added' || operation === 'unknown') &&
      manifest.unresolved.some((dependency) => matchRunJSUnresolvedDependencyCandidate(path, dependency) === 'match');
    const reason = runtimeDependency
      ? 'runtime_dependency'
      : typeDependency
        ? 'type_dependency'
        : unresolvedCandidate
          ? 'unresolved_candidate'
          : undefined;
    if (!reason) {
      continue;
    }
    change.reasons.add(reason);
    change.changedPaths.add(path);
  }
}

function fallbackReasonForManifest(reason: RunJSEntryDependencyManifestValidationFailure): AffectedEntryPlanReason {
  if (reason === 'missing') {
    return 'conservative_manifest_missing';
  }
  if (reason === 'unsupported_version') {
    return 'conservative_manifest_version';
  }
  if (reason === 'compiler_build_mismatch') {
    return 'conservative_build_mismatch';
  }
  return 'conservative_manifest_invalid';
}

function getClassifiedPhysicalRoot(path: string): string {
  const pathKind = classifySourcePath(path);
  if (pathKind.status !== 'enabled') {
    return path;
  }
  return getEntryRootPath(pathKind.kind, pathKind.entryName);
}

function indexPhysicalRoots(
  changes: ReadonlyMap<string, MutableEntryChange>,
  field: 'previousEntry' | 'candidateEntry',
): Map<string, string[]> {
  const roots = new Map<string, string[]>();
  for (const [identity, change] of changes) {
    const entry = change[field];
    if (!entry) {
      continue;
    }
    const root = getPhysicalEntryRoot(entry);
    roots.set(root, [...(roots.get(root) || []), identity].sort(compareText));
  }
  return roots;
}

function getPhysicalEntryRoot(entry: EntryPlanSnapshot): string {
  return pathPosix.dirname(entry.entryPath);
}

function isDescriptorPath(path: string, change: MutableEntryChange): boolean {
  return path === change.previousEntry?.descriptorPath || path === change.candidateEntry?.descriptorPath;
}

function addReasonToReadyCandidates(
  changes: ReadonlyMap<string, MutableEntryChange>,
  reason: AffectedEntryPlanReason,
  path: string,
): void {
  for (const change of changes.values()) {
    if (change.candidateEntry?.healthStatus !== 'ready' || !supportedKinds.has(change.candidateEntry.kind)) {
      continue;
    }
    change.reasons.add(reason);
    change.changedPaths.add(path);
  }
}

function finalizeChange(change: MutableEntryChange): EntryPlanChange {
  const previous = change.previousEntry;
  const candidate = change.candidateEntry;
  const flags: EntryChangeFlags = {
    added: !previous && Boolean(candidate),
    removed: Boolean(previous) && !candidate,
    moved: Boolean(previous && candidate && getPhysicalEntryRoot(previous) !== getPhysicalEntryRoot(candidate)),
    entrypointChanged: Boolean(
      previous &&
        candidate &&
        previous.entryPath !== candidate.entryPath &&
        (getPhysicalEntryRoot(previous) === getPhysicalEntryRoot(candidate) ||
          pathPosix.basename(previous.entryPath) !== pathPosix.basename(candidate.entryPath)),
    ),
    settingsChanged: Boolean(
      previous &&
        candidate &&
        (previous.settingsSchemaHash !== candidate.settingsSchemaHash ||
          previous.settingsDefaultsHash !== candidate.settingsDefaultsHash),
    ),
    displayMetadataChanged: Boolean(
      previous && candidate && previous.metadataFingerprint !== candidate.metadataFingerprint,
    ),
    healthStatusChanged: Boolean(previous && candidate && previous.healthStatus !== candidate.healthStatus),
  };
  const reasons = [...change.reasons].sort(compareReasons);
  const classification = classifyEntryChange(previous, candidate, reasons, flags);
  const plannedEntry = candidate || previous;
  if (!plannedEntry) {
    throw new TypeError('Affected entry plan change must contain a previous or candidate entry');
  }

  return {
    classification,
    identity: {
      target: plannedEntry.target,
      kind: plannedEntry.kind,
      entryName: plannedEntry.entryName,
    },
    entryId: plannedEntry.id,
    previousEntry: previous,
    candidateEntry: candidate,
    reasons,
    changedPaths: [...change.changedPaths].sort(compareText),
    flags,
  };
}

function classifyEntryChange(
  previous: EntryPlanSnapshot | null,
  candidate: EntryPlanSnapshot | null,
  reasons: readonly AffectedEntryPlanReason[],
  flags: EntryChangeFlags,
): EntryPlanClassification {
  if (previous && !candidate) {
    return 'removed';
  }
  if (candidate?.healthStatus === 'ready' && reasons.some((reason) => compileReasons.has(reason))) {
    return 'compile';
  }
  if (flags.settingsChanged || flags.displayMetadataChanged || flags.healthStatusChanged) {
    return 'metadata-only';
  }
  return 'unchanged';
}

function toPlannedEntries(
  changes: readonly EntryPlanChange[],
  classification: EntryPlanClassification,
): PlannedEntry[] {
  return changes
    .filter((change) => change.classification === classification)
    .map((change) => {
      const entry = classification === 'removed' ? change.previousEntry : change.candidateEntry;
      if (!entry) {
        throw new TypeError(`Affected entry plan classification "${classification}" has no entry snapshot`);
      }
      return {
        ...entry,
        reasons: [...change.reasons],
        changedPaths: [...change.changedPaths],
      };
    });
}

function createEntryChangeSet(changes: EntryPlanChange[]): EntryChangeSet {
  return {
    changes,
    addedEntries: changes.filter((change) => change.flags.added),
    removedEntries: changes.filter((change) => change.flags.removed),
    movedEntries: changes.filter((change) => change.flags.moved),
    entrypointChangedEntries: changes.filter((change) => change.flags.entrypointChanged),
    settingsChangedEntries: changes.filter((change) => change.flags.settingsChanged),
    displayMetadataChangedEntries: changes.filter((change) => change.flags.displayMetadataChanged),
    healthStatusChangedEntries: changes.filter((change) => change.flags.healthStatusChanged),
    affectedEntryIds: [
      ...new Set(
        changes
          .filter((change) => change.classification !== 'unchanged' && change.entryId)
          .map((change) => change.entryId as string),
      ),
    ].sort(compareText),
  };
}

function countReasons(changes: readonly EntryPlanChange[]): Record<AffectedEntryPlanReason, number> {
  return Object.fromEntries(
    AFFECTED_ENTRY_PLAN_REASONS.map((reason) => [
      reason,
      changes.reduce((count, change) => count + Number(change.reasons.includes(reason)), 0),
    ]),
  ) as Record<AffectedEntryPlanReason, number>;
}

function compareEntryChanges(left: EntryPlanChange, right: EntryPlanChange): number {
  return compareEntryIdentity(left.identity, right.identity) || compareText(left.entryId || '', right.entryId || '');
}

function compareEntryIdentity(left: EntryPlanIdentity, right: EntryPlanIdentity): number {
  return (
    compareText(left.target, right.target) ||
    compareText(left.kind, right.kind) ||
    compareText(left.entryName, right.entryName)
  );
}

function compareReasons(left: AffectedEntryPlanReason, right: AffectedEntryPlanReason): number {
  return AFFECTED_ENTRY_PLAN_REASONS.indexOf(left) - AFFECTED_ENTRY_PLAN_REASONS.indexOf(right);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function formatIdentity(entry: EntryPlanIdentity): string {
  return `${entry.target}:${entry.kind}:${entry.entryName}`;
}
