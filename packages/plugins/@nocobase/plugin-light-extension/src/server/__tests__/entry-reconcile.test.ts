/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model, Transaction } from '@nocobase/database';
import { describe, expect, it, vi } from 'vitest';

import { buildLightExtensionSettingsHashes, LightExtensionEntryService } from '../services/LightExtensionEntryService';
import type { LightExtensionEntryValidationResult } from '../services/LightExtensionValidator';
import { createMutableModel } from './reference-test-helpers';

describe('LightExtensionEntryService reconcile', () => {
  it('reads the repo entry set once and performs no writes for 20 unchanged entries', async () => {
    const sourceEntries = Array.from({ length: 20 }, (_, index) => createSourceEntry(`entry-${index + 1}`));
    const fixture = createReconcileFixture(sourceEntries.map(createStoredEntry));

    const result = await fixture.service.reconcileEntries('ler_sales', sourceEntries, 'commit_1', fixture.transaction);

    expect(fixture.repository.find).toHaveBeenCalledTimes(1);
    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(fixture.repository.records.every((record) => record.update.mock.calls.length === 0)).toBe(true);
    expect(result.unchangedEntries).toHaveLength(20);
    expect(result.entries.map((entry) => entry.entryName)).toEqual(
      [...result.entries]
        .sort((left, right) =>
          [left.target, left.kind, left.entryName, left.id]
            .join('\u0000')
            .localeCompare([right.target, right.kind, right.entryName, right.id].join('\u0000')),
        )
        .map((entry) => entry.entryName),
    );
  });

  it('marks a removed entry missing, clears runtime fields, and restores the same entry id', async () => {
    const sourceEntry = createSourceEntry('sales-kpi');
    const fixture = createReconcileFixture([createStoredEntry(sourceEntry)]);

    const removed = await fixture.service.reconcileEntries('ler_sales', [], 'commit_2', fixture.transaction);

    expect(removed.missingEntries).toHaveLength(1);
    expect(removed.entries[0]).toMatchObject({
      id: 'lee_sales-kpi',
      healthStatus: 'missing',
      compiledCommitId: null,
      runtimeArtifact: null,
      runtimeCodeHash: null,
      artifactHash: null,
    });

    const restored = await fixture.service.reconcileEntries(
      'ler_sales',
      [sourceEntry],
      'commit_2',
      fixture.transaction,
    );

    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(restored.restoredEntries).toHaveLength(1);
    expect(restored.entries[0]).toMatchObject({
      id: 'lee_sales-kpi',
      healthStatus: 'ready',
    });
  });

  it('classifies settings and display metadata changes while writing only changed fields', async () => {
    const sourceEntry = createSourceEntry('sales-kpi');
    const fixture = createReconcileFixture([createStoredEntry(sourceEntry)]);
    const changedSource = createSourceEntry('sales-kpi', {
      title: 'Sales KPI Updated',
      settingsSchema: {
        type: 'object',
        properties: {
          threshold: {
            type: 'number',
            default: 10,
          },
        },
      },
    });

    const result = await fixture.service.reconcileEntries(
      'ler_sales',
      [changedSource],
      'commit_1',
      fixture.transaction,
    );

    expect(result.settingsChangedEntries).toHaveLength(1);
    expect(result.metadataChangedEntries).toHaveLength(1);
    expect(fixture.repository.records[0].update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Sales KPI Updated',
        settingsSchema: changedSource.settingsSchema,
      }),
      expect.objectContaining({ transaction: fixture.transaction }),
    );
    expect(fixture.repository.records[0].update.mock.calls[0][0]).not.toHaveProperty('entryPath');
  });

  it('rejects duplicate persisted entry identities before writing', async () => {
    const sourceEntry = createSourceEntry('sales-kpi');
    const fixture = createReconcileFixture([
      createStoredEntry(sourceEntry),
      createStoredEntry(sourceEntry, { id: 'lee_duplicate' }),
    ]);

    await expect(
      fixture.service.reconcileEntries('ler_sales', [sourceEntry], 'commit_1', fixture.transaction),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_ENTRY_CONFLICT',
    });
    expect(fixture.repository.createMany).not.toHaveBeenCalled();
    expect(fixture.repository.records.every((record) => record.update.mock.calls.length === 0)).toBe(true);
  });
});

function createSourceEntry(
  entryName: string,
  overrides: Partial<LightExtensionEntryValidationResult> = {},
): LightExtensionEntryValidationResult {
  const root = `src/client/js-blocks/${entryName}`;
  return {
    target: 'client',
    kind: 'js-block',
    entryName,
    entryPath: `${root}/index.tsx`,
    descriptorPath: `${root}/entry.json`,
    title: entryName,
    description: null,
    category: null,
    icon: null,
    tags: null,
    sort: null,
    settingsSchema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          default: 5,
        },
      },
    },
    problems: [],
    ...overrides,
  };
}

function createStoredEntry(
  sourceEntry: LightExtensionEntryValidationResult,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const settingsHashes = buildLightExtensionSettingsHashes(sourceEntry.settingsSchema);
  return {
    id: `lee_${sourceEntry.entryName}`,
    repoId: 'ler_sales',
    ...sourceEntry,
    ...settingsHashes,
    compiledCommitId: 'commit_1',
    runtimeArtifact: {
      code: 'ctx.render("ok");',
      version: 'v2',
      entryPath: sourceEntry.entryPath,
    },
    runtimeVersion: 'v2',
    surfaceStyle: 'render',
    runtimeCodeHash: 'runtime_hash',
    artifactHash: 'artifact_hash',
    filesHash: 'files_hash',
    compiledAt: '2026-07-17T00:00:00.000Z',
    healthStatus: 'ready',
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
    ...overrides,
  };
}

function createReconcileFixture(records: Record<string, unknown>[]) {
  const models = records.map(createMutableModel);
  const repository = {
    records: models,
    find: vi.fn(async () => models as Model[]),
    createMany: vi.fn(async ({ records: newRecords }: { records: Record<string, unknown>[] }) => {
      const created = newRecords.map((record, index) =>
        createMutableModel({
          id: `lee_created_${index + 1}`,
          ...record,
        }),
      );
      models.push(...created);
      return created as Model[];
    }),
  };
  const db = {
    getRepository: (name: string) => {
      if (name !== 'lightExtensionEntries') {
        throw new Error(`Unexpected repository: ${name}`);
      }
      return repository;
    },
  } as unknown as Database;
  const service = new LightExtensionEntryService(db, {} as never, {} as never);
  return {
    service,
    repository,
    transaction: { id: 'tx_reconcile' } as unknown as Transaction,
  };
}
