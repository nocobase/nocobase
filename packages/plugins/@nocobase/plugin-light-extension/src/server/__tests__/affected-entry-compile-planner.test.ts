/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LightExtensionKind } from '../../constants';
import { createAffectedEntryCompilePlan, type EntryPlanSnapshot } from '../services/AffectedEntryCompilePlanner';

describe('affected entry compile planner', () => {
  it('is byte-stable across input order and duplicate changed paths or snapshots', () => {
    const sales = entry({ id: 'entry-sales', entryName: 'sales' });
    const phone = entry({ id: 'entry-phone', kind: 'js-field', entryName: 'phone' });
    const first = createAffectedEntryCompilePlan({
      changedPaths: ['./src/shared/format.ts', 'README.md', 'src/shared/format.ts'],
      previousEntries: [sales, phone, sales],
      candidateEntries: [phone, sales],
    });
    const second = createAffectedEntryCompilePlan({
      changedPaths: ['src/shared/format.ts', './README.md'],
      previousEntries: [phone, sales],
      candidateEntries: [sales, phone, phone],
    });

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.compileCandidates.map((item) => item.entryName)).toEqual(['sales', 'phone']);
    expect(first.metrics).toMatchObject({
      changedFileCount: 2,
      affectedEntryCount: 2,
      reasonCounts: { shared_conservative: 2 },
    });
  });

  it('compiles only the entry whose private file changed even when its directory differs from its key', () => {
    const sales = entry({ id: 'entry-sales', entryName: 'sales', directoryName: 'sales-folder' });
    const inventory = entry({ id: 'entry-inventory', entryName: 'inventory' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: ['src/client/js-blocks/sales-folder/helpers/format.ts'],
      previousEntries: [inventory, sales],
      candidateEntries: [sales, inventory],
    });

    expect(plan.compileCandidates).toEqual([
      expect.objectContaining({
        id: 'entry-sales',
        entryName: 'sales',
        reasons: ['entry_private'],
        changedPaths: ['src/client/js-blocks/sales-folder/helpers/format.ts'],
      }),
    ]);
    expect(plan.unchangedEntries.map((item) => item.entryName)).toEqual(['inventory']);
  });

  it('conservatively invalidates every ready entry for a shared change', () => {
    const ready = entry({ id: 'entry-ready', entryName: 'ready' });
    const alsoReady = entry({ id: 'entry-action', kind: 'js-action', entryName: 'action' });
    const missing = entry({ id: 'entry-missing', kind: 'runjs', entryName: 'missing', healthStatus: 'missing' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: ['src/shared/deleted.ts'],
      previousEntries: [ready, alsoReady, missing],
      candidateEntries: [missing, ready, alsoReady],
    });

    expect(plan.compileCandidates.map((item) => item.entryName)).toEqual(['action', 'ready']);
    expect(plan.compileCandidates.every((item) => item.reasons.includes('shared_conservative'))).toBe(true);
    expect(plan.unchangedEntries.map((item) => item.entryName)).toEqual(['missing']);
  });

  it('does not compile for documented non-runtime root files', () => {
    const sales = entry({ id: 'entry-sales', entryName: 'sales' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: ['./README.md', 'light-extension.json', 'tsconfig.json'],
      previousEntries: [sales],
      candidateEntries: [sales],
    });

    expect(plan.compileCandidates).toEqual([]);
    expect(plan.metadataOnlyEntries).toEqual([]);
    expect(plan.unchangedEntries).toEqual([expect.objectContaining({ entryName: 'sales', reasons: [] })]);
  });

  it('classifies display and settings descriptor changes as metadata-only', () => {
    const displayBefore = entry({ id: 'entry-display', entryName: 'display', metadataFingerprint: 'display-v1' });
    const displayAfter = entry({ ...displayBefore, metadataFingerprint: 'display-v2' });
    const settingsBefore = entry({
      id: 'entry-settings',
      entryName: 'settings',
      settingsSchemaHash: 'schema-v1',
      settingsDefaultsHash: 'defaults-v1',
    });
    const settingsAfter = entry({
      ...settingsBefore,
      settingsSchemaHash: 'schema-v2',
      settingsDefaultsHash: 'defaults-v2',
    });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: [displayBefore.descriptorPath, settingsBefore.descriptorPath],
      previousEntries: [settingsBefore, displayBefore],
      candidateEntries: [displayAfter, settingsAfter],
    });

    expect(plan.compileCandidates).toEqual([]);
    expect(plan.metadataOnlyEntries.map((item) => item.entryName)).toEqual(['display', 'settings']);
    expect(plan.entryChanges.displayMetadataChangedEntries.map((item) => item.identity.entryName)).toEqual(['display']);
    expect(plan.entryChanges.settingsChangedEntries.map((item) => item.identity.entryName)).toEqual(['settings']);
    expect(plan.metadataOnlyEntries.every((item) => item.reasons.includes('metadata_only'))).toBe(true);
  });

  it('treats a descriptor key change as old removed plus new compile', () => {
    const previous = entry({ id: 'entry-old', entryName: 'old-key', directoryName: 'physical-folder' });
    const candidate = entry({ id: null, entryName: 'new-key', directoryName: 'physical-folder' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: [candidate.descriptorPath],
      previousEntries: [previous],
      candidateEntries: [candidate],
    });

    expect(plan.removedEntries).toEqual([
      expect.objectContaining({ id: 'entry-old', entryName: 'old-key', reasons: ['entry_removed'] }),
    ]);
    expect(plan.compileCandidates).toEqual([
      expect.objectContaining({ id: null, entryName: 'new-key', reasons: ['entry_added'] }),
    ]);
    expect(plan.entryChanges.addedEntries).toHaveLength(1);
    expect(plan.entryChanges.removedEntries).toHaveLength(1);
  });

  it('preserves the id and compiles one entry when its physical directory moves', () => {
    const previous = entry({ id: 'entry-sales', entryName: 'stable-key', directoryName: 'old-folder' });
    const candidate = entry({ id: null, entryName: 'stable-key', directoryName: 'new-folder' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: [previous.entryPath, candidate.entryPath],
      previousEntries: [previous],
      candidateEntries: [candidate],
    });

    expect(plan.compileCandidates).toEqual([
      expect.objectContaining({
        id: 'entry-sales',
        entryName: 'stable-key',
        entryPath: 'src/client/js-blocks/new-folder/index.tsx',
        reasons: ['entry_private', 'entry_moved'],
      }),
    ]);
    expect(plan.entryChanges.movedEntries).toEqual([
      expect.objectContaining({ entryId: 'entry-sales', flags: expect.objectContaining({ moved: true }) }),
    ]);
    expect(plan.entryChanges.entrypointChangedEntries).toEqual([]);
  });

  it('compiles when the entrypoint filename or extension changes', () => {
    const previous = entry({ id: 'entry-sales', entryName: 'sales', indexFile: 'index.ts' });
    const candidate = entry({ ...previous, indexFile: 'index.tsx' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: [previous.entryPath, candidate.entryPath],
      previousEntries: [previous],
      candidateEntries: [candidate],
    });

    expect(plan.compileCandidates).toEqual([
      expect.objectContaining({ id: 'entry-sales', reasons: ['entry_private', 'entrypoint_changed'] }),
    ]);
    expect(plan.entryChanges.entrypointChangedEntries).toHaveLength(1);
  });

  it('removes an entry without invalidating unrelated entries', () => {
    const removed = entry({ id: 'entry-removed', entryName: 'removed' });
    const retained = entry({ id: 'entry-retained', entryName: 'retained' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: [removed.entryPath, removed.descriptorPath],
      previousEntries: [retained, removed],
      candidateEntries: [retained],
    });

    expect(plan.compileCandidates).toEqual([]);
    expect(plan.removedEntries).toEqual([
      expect.objectContaining({
        id: 'entry-removed',
        reasons: ['entry_removed'],
        changedPaths: [removed.descriptorPath, removed.entryPath].sort(),
      }),
    ]);
    expect(plan.unchangedEntries.map((item) => item.entryName)).toEqual(['retained']);
  });

  it('fails closed for a changed path that cannot be classified', () => {
    const sales = entry({ id: 'entry-sales', entryName: 'sales' });
    const action = entry({ id: 'entry-action', kind: 'js-action', entryName: 'action' });
    const plan = createAffectedEntryCompilePlan({
      changedPaths: ['src/generated/runtime-contract.json'],
      previousEntries: [sales, action],
      candidateEntries: [action, sales],
    });

    expect(plan.compileCandidates.map((item) => item.entryName)).toEqual(['action', 'sales']);
    expect(plan.compileCandidates.every((item) => item.reasons.includes('conservative_unknown'))).toBe(true);
    expect(plan.metrics.reasonCounts.conservative_unknown).toBe(2);
  });

  it('compiles a newly added entry even when changed paths are unavailable', () => {
    const added = entry({ id: null, kind: 'js-item', entryName: 'customer-menu' });
    const plan = createAffectedEntryCompilePlan({ changedPaths: [], previousEntries: [], candidateEntries: [added] });

    expect(plan.compileCandidates).toEqual([
      expect.objectContaining({ entryName: 'customer-menu', reasons: ['entry_added'] }),
    ]);
    expect(plan.entryChanges.addedEntries).toHaveLength(1);
  });

  it('accepts snapshots adapted from an already validated prepared candidate without runtime services', () => {
    const preparedCandidate = {
      changedPaths: ['src/client/runjs/report/index.ts'],
      validation: {
        entries: [
          {
            target: 'client' as const,
            kind: 'runjs' as const,
            entryName: 'report',
            entryPath: 'src/client/runjs/report/index.ts',
            descriptorPath: 'src/client/runjs/report/entry.json',
          },
        ],
      },
    };
    const candidateEntries = preparedCandidate.validation.entries.map<EntryPlanSnapshot>((item) => ({
      ...item,
      id: null,
      healthStatus: 'ready',
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
      metadataFingerprint: 'display-v1',
    }));

    expect(
      createAffectedEntryCompilePlan({
        changedPaths: preparedCandidate.changedPaths,
        previousEntries: [],
        candidateEntries,
      }).compileCandidates,
    ).toEqual([expect.objectContaining({ kind: 'runjs', entryName: 'report' })]);
  });

  it('rejects conflicting duplicate identities instead of depending on array order', () => {
    const first = entry({ id: 'entry-a', entryName: 'sales' });
    const conflicting = entry({ ...first, id: 'entry-b' });

    expect(() =>
      createAffectedEntryCompilePlan({ changedPaths: [], previousEntries: [first, conflicting], candidateEntries: [] }),
    ).toThrow('Conflicting previous light-extension entries for identity "client:js-block:sales"');
  });
});

function entry(
  input: Partial<EntryPlanSnapshot> & {
    entryName: string;
    directoryName?: string;
    indexFile?: string;
    kind?: LightExtensionKind;
  },
): EntryPlanSnapshot {
  const kind = input.kind || 'js-block';
  const directoryName = input.directoryName || input.entryName;
  const root = `src/client/${kindRoot(kind)}/${directoryName}`;
  return {
    id: input.id ?? null,
    target: 'client',
    kind,
    entryName: input.entryName,
    entryPath: `${root}/${input.indexFile || 'index.tsx'}`,
    descriptorPath: `${root}/entry.json`,
    healthStatus: input.healthStatus || 'ready',
    settingsSchemaHash: input.settingsSchemaHash ?? null,
    settingsDefaultsHash: input.settingsDefaultsHash ?? null,
    metadataFingerprint: input.metadataFingerprint || 'display-v1',
  };
}

function kindRoot(kind: LightExtensionKind): string {
  return {
    'js-block': 'js-blocks',
    'js-field': 'js-fields',
    'js-action': 'js-actions',
    'js-item': 'js-items',
    runjs: 'runjs',
  }[kind];
}
