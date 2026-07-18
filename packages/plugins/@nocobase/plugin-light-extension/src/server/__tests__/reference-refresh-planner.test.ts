/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { createAffectedEntryCompilePlan, type EntryPlanSnapshot } from '../services/AffectedEntryCompilePlanner';
import type {
  EntryReconcileChange,
  EntryReconcileResult,
  EntryReferenceFingerprint,
} from '../services/LightExtensionEntryService';
import { createReferenceRefreshPlan } from '../services/ReferenceRefreshPlanner';

describe('reference refresh planner', () => {
  it('skips a pure code change when runtime remains usable', () => {
    const entry = createPlanEntry('lee_a', 'entry-a');
    const compilePlan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/entry-a/index.tsx'],
      previousEntries: [entry],
      candidateEntries: [entry],
    });

    expect(
      createReferenceRefreshPlan({
        compilePlan,
        reconcileResult: emptyReconcileResult(),
        runtimeAvailability: [{ entryId: 'lee_a', beforeUsable: true, afterUsable: true }],
      }),
    ).toEqual({
      mode: 'skip',
      reason: 'reference_fingerprint_unchanged',
    });
  });

  it('targets only entries with settings or runtime availability changes', () => {
    const first = createPlanEntry('lee_a', 'entry-a');
    const second = createPlanEntry('lee_b', 'entry-b');
    const compilePlan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/entry-b/index.tsx'],
      previousEntries: [first, second],
      candidateEntries: [first, second],
    });
    const settingsChange = createReconcileChange('lee_a', { settingsChanged: true });

    expect(
      createReferenceRefreshPlan({
        compilePlan,
        reconcileResult: reconcileResult([settingsChange]),
        runtimeAvailability: [{ entryId: 'lee_b', beforeUsable: true, afterUsable: false }],
      }),
    ).toEqual({
      mode: 'entries',
      entryIds: ['lee_a', 'lee_b'],
      reason: 'entry_reference_fingerprint_changed',
    });
  });

  it('skips display metadata-only changes', () => {
    const previous = createPlanEntry('lee_a', 'entry-a', { metadataFingerprint: 'old' });
    const candidate = createPlanEntry('lee_a', 'entry-a', { metadataFingerprint: 'new' });
    const compilePlan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/entry-a/entry.json'],
      previousEntries: [previous],
      candidateEntries: [candidate],
    });

    expect(
      createReferenceRefreshPlan({
        compilePlan,
        reconcileResult: reconcileResult([createReconcileChange('lee_a', { metadataChanged: true })]),
        runtimeAvailability: [],
      }),
    ).toEqual({
      mode: 'skip',
      reason: 'reference_fingerprint_unchanged',
    });
  });

  it('uses the reconciled stable id for a newly created entry', () => {
    const candidate = createPlanEntry(null, 'entry-new');
    const compilePlan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/entry-new/index.tsx'],
      previousEntries: [],
      candidateEntries: [candidate],
    });
    const created = createReconcileChange('lee_new', { created: true });
    created.entry.entryName = 'entry-new';

    expect(
      createReferenceRefreshPlan({
        compilePlan,
        reconcileResult: reconcileResult([created]),
        runtimeAvailability: [],
      }),
    ).toEqual({
      mode: 'entries',
      entryIds: ['lee_new'],
      reason: 'entry_reference_fingerprint_changed',
    });
  });

  it('falls back to repo refresh for unknown impact or incomplete runtime information', () => {
    const entry = createPlanEntry('lee_a', 'entry-a');
    const unknownPlan = createAffectedEntryCompilePlan({
      changedPaths: ['unexpected/source.ts'],
      previousEntries: [entry],
      candidateEntries: [entry],
    });
    expect(
      createReferenceRefreshPlan({
        compilePlan: unknownPlan,
        reconcileResult: emptyReconcileResult(),
        runtimeAvailability: [{ entryId: 'lee_a', beforeUsable: true, afterUsable: true }],
      }),
    ).toEqual({
      mode: 'repo',
      reason: 'affected_entry_scope_unknown',
    });

    const knownPlan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/entry-a/index.tsx'],
      previousEntries: [entry],
      candidateEntries: [entry],
    });
    expect(
      createReferenceRefreshPlan({
        compilePlan: knownPlan,
        reconcileResult: emptyReconcileResult(),
        runtimeAvailability: [],
      }),
    ).toEqual({
      mode: 'repo',
      reason: 'runtime_availability_incomplete',
    });
  });
});

function createPlanEntry(
  id: string | null,
  entryName: string,
  overrides: Partial<EntryPlanSnapshot> = {},
): EntryPlanSnapshot {
  const root = `src/client/js-blocks/${entryName}`;
  return {
    id,
    target: 'client',
    kind: 'js-block',
    entryName,
    entryPath: `${root}/index.tsx`,
    descriptorPath: `${root}/entry.json`,
    healthStatus: 'ready',
    settingsSchemaHash: 'schema_hash',
    settingsDefaultsHash: 'defaults_hash',
    metadataFingerprint: 'metadata_hash',
    ...overrides,
  };
}

function createReconcileChange(entryId: string, overrides: Partial<EntryReconcileChange> = {}): EntryReconcileChange {
  const fingerprint = createFingerprint(entryId);
  return {
    entry: {
      id: entryId,
      repoId: 'ler_sales',
      target: 'client',
      kind: 'js-block',
      entryName: entryId,
      entryPath: `src/client/js-blocks/${entryId}/index.tsx`,
      descriptorPath: `src/client/js-blocks/${entryId}/entry.json`,
      title: entryId,
      description: null,
      category: null,
      icon: null,
      tags: null,
      sort: null,
      settingsSchema: null,
      settingsSchemaHash: fingerprint.settingsSchemaHash,
      compiledCommitId: 'commit_1',
      compiledInputKey: 'compile_key',
      compilerBuildId: 'compiler_build',
      runtimeArtifact: null,
      runtimeVersion: 'v2',
      surfaceStyle: 'render',
      runtimeCodeHash: 'runtime_hash',
      artifactHash: 'artifact_hash',
      filesHash: 'files_hash',
      settingsDefaultsHash: fingerprint.settingsDefaultsHash,
      compiledAt: '2026-07-17T00:00:00.000Z',
      healthStatus: 'ready',
      diagnostics: [],
    },
    before: fingerprint,
    after: fingerprint,
    created: false,
    restored: false,
    missing: false,
    settingsChanged: false,
    metadataChanged: false,
    unchanged: false,
    ...overrides,
  };
}

function createFingerprint(entryId: string): EntryReferenceFingerprint {
  return {
    entryId,
    repoId: 'ler_sales',
    kind: 'js-block',
    healthStatus: 'ready',
    settingsSchemaHash: 'schema_hash',
    settingsDefaultsHash: 'defaults_hash',
    runtimeUsable: true,
  };
}

function emptyReconcileResult(): EntryReconcileResult {
  return reconcileResult([]);
}

function reconcileResult(changes: EntryReconcileChange[]): EntryReconcileResult {
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
