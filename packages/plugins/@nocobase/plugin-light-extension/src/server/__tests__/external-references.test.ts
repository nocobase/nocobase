/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { ExternalReferenceService, type ExternalReferenceBinding } from '../services/ExternalReferenceService';
import { stableJsonHash } from '../services/ReferenceOwnerRegistry';
import { createReferenceServiceFixture } from './reference-test-helpers';

const ownerKind = 'multiPortal.frontend';

describe('ExternalReferenceService', () => {
  it('atomically replaces one owner binding and protects a referenced Entry', async () => {
    const fixture = createClientAppFixture();
    const service = new ExternalReferenceService(fixture.db);
    const lockOwner = vi.fn(async () => undefined);
    service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => [],
      getBindingForUpdate: async () => null,
      lockOwner,
    });

    await expect(
      service.replaceReferences({ ownerKind, ownerId: 'portal-1', entryIds: ['entry-1', 'entry-1'] }),
    ).resolves.toEqual({ upserted: 1, removed: 0 });
    await expect(service.replaceReferences({ ownerKind, ownerId: 'portal-1', entryIds: ['entry-1'] })).resolves.toEqual(
      { upserted: 0, removed: 0 },
    );
    expect(lockOwner).toHaveBeenCalledTimes(2);
    expect(fixture.repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(fixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      repoId: 'repo-1',
      entryId: 'entry-1',
      kind: 'client-app',
      ownerKind,
      ownerLocator: { kind: ownerKind, ownerId: 'portal-1' },
      resolvedStatus: 'ready',
    });

    await expect(service.assertEntryNotReferenced('entry-1')).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
      status: 409,
      details: {
        entryId: 'entry-1',
        referenceCount: 1,
        references: [{ ownerKind, ownerId: 'portal-1' }],
        workspaces: [{ ownerKind, ownerId: 'portal-1' }],
      },
    });
    await expect(service.assertRepoNotReferenced('repo-1')).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_REFERENCE_EXISTS',
      details: {
        repoId: 'repo-1',
        referenceCount: 1,
        references: [{ ownerKind, ownerId: 'portal-1' }],
        workspaces: [{ ownerKind, ownerId: 'portal-1' }],
      },
    });

    await expect(service.deleteReferences({ ownerKind, ownerId: 'portal-1' })).resolves.toEqual({
      upserted: 0,
      removed: 1,
    });
    await expect(service.assertEntryNotReferenced('entry-1')).resolves.toBeUndefined();
  });

  it('reconciles missing and extraneous references idempotently', async () => {
    const fixture = createClientAppFixture({
      references: [
        createExternalReference('portal-stale', 'entry-1'),
        createExternalReference('portal-2', 'entry-2', { repoId: 'repo-2' }),
      ],
    });
    const service = new ExternalReferenceService(fixture.db);
    let bindings: readonly ExternalReferenceBinding[] = [
      { ownerId: 'portal-1', entryIds: ['entry-1'] },
      { ownerId: 'portal-2', entryIds: ['entry-2'] },
    ];
    service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => bindings,
      getBindingForUpdate: async (ownerId) => bindings.find((binding) => binding.ownerId === ownerId) || null,
    });

    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 2,
      upserted: 1,
      removed: 1,
    });
    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 2,
      upserted: 0,
      removed: 0,
    });
    expect(
      fixture.repositories.lightExtensionReferences.records
        .map((record) => record.get('ownerLocator'))
        .sort(compareOwner),
    ).toEqual([
      { kind: ownerKind, ownerId: 'portal-1' },
      { kind: ownerKind, ownerId: 'portal-2' },
    ]);

    bindings = [{ ownerId: 'portal-1', entryIds: ['entry-2'] }];
    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 1,
      upserted: 1,
      removed: 2,
    });
    expect(fixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      entryId: 'entry-2',
      repoId: 'repo-2',
      ownerLocator: { kind: ownerKind, ownerId: 'portal-1' },
    });
  });

  it('reports stable health states and recovers without changing the binding', async () => {
    const fixture = createClientAppFixture();
    const service = new ExternalReferenceService(fixture.db);
    const unregister = service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => [],
      getBindingForUpdate: async () => null,
    });
    await service.replaceReferences({ ownerKind, ownerId: 'portal-1', entryIds: ['entry-1'] });

    await expect(readHealth(service)).resolves.toMatchObject({ status: 'ready', repoId: 'repo-1' });
    await fixture.repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'disabled' });
    await fixture.service.refreshReferencesForRepo('repo-1');
    expect(fixture.repositories.lightExtensionReferences.records[0].get('resolvedStatus')).toBe('ready');
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'repo-disabled', repoId: 'repo-1' });
    await fixture.repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'enabled' });
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'ready', repoId: 'repo-1' });
    await fixture.repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'archived' });
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'repo-archived', repoId: 'repo-1' });
    await fixture.repositories.lightExtensionRepos.records[0].update({ lifecycleStatus: 'enabled' });

    await fixture.repositories.lightExtensionClientAppAssets.records[0].update({ state: 'retiring' });
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'assets-missing', repoId: 'repo-1' });
    await fixture.repositories.lightExtensionClientAppAssets.records[0].update({ state: 'ready' });
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'ready', repoId: 'repo-1' });

    await fixture.repositories.lightExtensionEntries.records[0].update({ healthStatus: 'missing' });
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'entry-missing', repoId: 'repo-1' });
    expect(fixture.repositories.lightExtensionReferences.records).toHaveLength(1);

    unregister();
    await expect(readHealth(service)).resolves.toMatchObject({ status: 'provider-unavailable', repoId: null });
  });

  it('re-reads owner bindings after locking so reconcile cannot restore a stale Entry', async () => {
    const fixture = createClientAppFixture({
      references: [createExternalReference('portal-1', 'entry-1')],
    });
    const service = new ExternalReferenceService(fixture.db);
    let currentBinding: ExternalReferenceBinding = { ownerId: 'portal-1', entryIds: ['entry-1'] };
    const getBindingForUpdate = vi.fn(async () => currentBinding);
    service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => {
        const staleSnapshot = [{ ...currentBinding, entryIds: [...currentBinding.entryIds] }];
        currentBinding = { ownerId: 'portal-1', entryIds: ['entry-2'] };
        return staleSnapshot;
      },
      getBindingForUpdate,
    });

    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 1,
      upserted: 1,
      removed: 1,
    });
    expect(getBindingForUpdate).toHaveBeenCalledWith('portal-1', expect.any(Object));
    expect(fixture.repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(fixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      entryId: 'entry-2',
      repoId: 'repo-2',
      ownerLocator: { kind: ownerKind, ownerId: 'portal-1' },
    });
  });

  it('re-checks stale owners before cleanup so a concurrent binding is preserved', async () => {
    const fixture = createClientAppFixture({
      references: [createExternalReference('portal-new', 'entry-1')],
    });
    const service = new ExternalReferenceService(fixture.db);
    service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => [],
      getBindingForUpdate: async (ownerId) => (ownerId === 'portal-new' ? { ownerId, entryIds: ['entry-2'] } : null),
    });

    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 1,
      upserted: 1,
      removed: 1,
    });
    expect(fixture.repositories.lightExtensionReferences.records).toHaveLength(1);
    expect(fixture.repositories.lightExtensionReferences.records[0].toJSON()).toMatchObject({
      entryId: 'entry-2',
      repoId: 'repo-2',
      ownerLocator: { kind: ownerKind, ownerId: 'portal-new' },
    });
  });

  it('keeps a historical missing Entry diagnosable without blocking reconcile', async () => {
    const fixture = createClientAppFixture();
    const service = new ExternalReferenceService(fixture.db);
    service.registerOwnerAdapter({
      ownerKind,
      listBindings: async () => [{ ownerId: 'portal-missing', entryIds: ['entry-missing'] }],
      getBindingForUpdate: async () => ({ ownerId: 'portal-missing', entryIds: ['entry-missing'] }),
    });

    await expect(service.reconcileReferences({ ownerKind })).resolves.toEqual({
      owners: 1,
      upserted: 0,
      removed: 0,
    });
    await expect(
      service.getReferenceHealth({ ownerKind, ownerId: 'portal-missing', entryId: 'entry-missing' }),
    ).resolves.toMatchObject({ status: 'entry-missing', repoId: null });
  });
});

function createClientAppFixture(input: { references?: Record<string, unknown>[] } = {}) {
  return createReferenceServiceFixture({
    repos: [
      { id: 'repo-1', lifecycleStatus: 'enabled' },
      { id: 'repo-2', lifecycleStatus: 'enabled' },
    ],
    entries: [
      { id: 'entry-1', repoId: 'repo-1', kind: 'client-app', healthStatus: 'ready' },
      { id: 'entry-2', repoId: 'repo-2', kind: 'client-app', healthStatus: 'ready' },
    ],
    clientApps: [
      { entryId: 'entry-1', assetSetId: 'assets-1', fileCount: 1 },
      { entryId: 'entry-2', assetSetId: 'assets-2', fileCount: 1 },
    ],
    clientAppAssets: [
      { id: 'asset-1', repoId: 'repo-1', entryId: 'entry-1', assetSetId: 'assets-1', state: 'ready' },
      { id: 'asset-2', repoId: 'repo-2', entryId: 'entry-2', assetSetId: 'assets-2', state: 'ready' },
    ],
    references: input.references,
  });
}

function createExternalReference(
  ownerId: string,
  entryId: string,
  input: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: `reference-${ownerId}`,
    repoId: 'repo-1',
    entryId,
    kind: 'client-app',
    ownerKind,
    ownerLocator: { kind: ownerKind, ownerId },
    ownerLocatorHash: hashOwner(ownerId),
    settingsHash: 'settings-hash',
    resolvedStatus: 'ready',
    ...input,
  };
}

function hashOwner(ownerId: string): string {
  return stableJsonHash({ kind: ownerKind, ownerId });
}

function readHealth(service: ExternalReferenceService) {
  return service.getReferenceHealth({ ownerKind, ownerId: 'portal-1', entryId: 'entry-1' });
}

function compareOwner(left: unknown, right: unknown): number {
  return JSON.stringify(left).localeCompare(JSON.stringify(right));
}
