/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, type Database } from '@nocobase/database';
import path from 'path';

import type { VscFileRemoteRecord, VscRemoteSnapshot, VscRemoteSyncPlan } from '../../../shared/remote-sync-types';
import { CommitService } from '../../services/CommitService';
import { TreeService } from '../../services/TreeService';
import { VscFileService } from '../../services/VscFileService';
import { ExternalCommitMapStore } from '../../remotes/ExternalCommitMapStore';
import { RemoteSyncAdapterRegistry } from '../../remotes/RemoteSyncAdapterRegistry';
import { RemoteStore } from '../../remotes/RemoteStore';
import { SyncStatePlanner } from '../../remotes/SyncStatePlanner';
import { validateVscRemoteAuthRef } from '../../remotes/credentialRef';
import { DeterministicRemoteAdapter } from '../../remotes/testing/DeterministicRemoteAdapter';
import { loadVscSnapshot } from '../../remotes/VscRemotePushService';

export const acceptanceRemoteConfig = {
  owner: 'nocobase',
  repository: 'extensions',
  branch: 'main',
  subdirectory: null,
};

export interface RemoteSyncAcceptanceFixture {
  db: Database;
  vsc: VscFileService;
  adapter: DeterministicRemoteAdapter;
  adapterRegistry: RemoteSyncAdapterRegistry;
  remoteStore: RemoteStore;
  mapStore: ExternalCommitMapStore;
  close(): Promise<void>;
  createLocalRemote(
    name: string,
    authRef?: string | null,
  ): Promise<{
    repoId: string;
    commitId: string;
    remote: VscFileRemoteRecord;
  }>;
  createPushInput(
    remote: VscFileRemoteRecord,
    commitId: string,
  ): Promise<{
    remoteId: string;
    expectedLocalCommitId: string;
    expectedRemoteRevision: string | null;
    expectedRemoteTargetVersion: number;
    planFingerprint: string;
  }>;
}

export async function createRemoteSyncAcceptanceFixture(
  adapter = new DeterministicRemoteAdapter({ initialRevision: null }),
): Promise<RemoteSyncAcceptanceFixture> {
  const db = await createMockDatabase();
  await db.clean({ drop: true });
  await db.import({ directory: path.resolve(__dirname, '../../collections') });
  await db.sync();
  const vsc = new VscFileService(db);
  const adapterRegistry = new RemoteSyncAdapterRegistry();
  adapterRegistry.register(adapter);
  const remoteStore = new RemoteStore(db);
  const mapStore = new ExternalCommitMapStore(db);

  return {
    db,
    vsc,
    adapter,
    adapterRegistry,
    remoteStore,
    mapStore,
    close: () => db.close(),
    async createLocalRemote(name, authRef = null) {
      const created = await vsc.createRepository({
        ownerType: 'plugin',
        ownerId: name,
        name: 'main',
        initialFiles: [{ path: 'README.md', content: `# ${name}\n` }],
      });
      if (!created.initialCommit) {
        throw new Error('Expected an initial VSC commit');
      }
      const validatedAuthRef =
        authRef === null
          ? null
          : await validateVscRemoteAuthRef(authRef, async (variableName) => ({
              name: variableName,
              type: 'secret',
            }));
      const remote = await remoteStore.create({
        repoId: created.repository.id,
        name: 'origin',
        provider: 'github',
        config: acceptanceRemoteConfig,
        authRef: validatedAuthRef,
      });
      return { repoId: created.repository.id, commitId: created.initialCommit.id, remote };
    },
    async createPushInput(remote, commitId) {
      const localSnapshot = await loadVscSnapshot(
        db,
        new CommitService(db),
        new TreeService(db),
        remote.repoId,
        commitId,
      );
      const remoteSnapshot = adapter.getSnapshot();
      const baseline = await mapStore.findLatest(remote.id);
      const plan = createPlan(remote, commitId, localSnapshot, remoteSnapshot, baseline);
      return {
        remoteId: remote.id,
        expectedLocalCommitId: commitId,
        expectedRemoteRevision: remoteSnapshot.revision,
        expectedRemoteTargetVersion: remote.version,
        planFingerprint: plan.fingerprint,
      };
    },
  };
}

function createPlan(
  remote: VscFileRemoteRecord,
  commitId: string,
  localSnapshot: VscRemoteSnapshot,
  remoteSnapshot: VscRemoteSnapshot,
  baseline: Awaited<ReturnType<ExternalCommitMapStore['findLatest']>>,
): VscRemoteSyncPlan {
  return new SyncStatePlanner().plan({
    configured: true,
    remoteId: remote.id,
    provider: remote.provider,
    remoteTargetVersion: remote.version,
    direction: 'push',
    capabilities: { canPull: true, canPush: true },
    local: { headCommitId: commitId, contentHash: localSnapshot.contentHash },
    remote: {
      revision: remoteSnapshot.revision,
      contentHash: remoteSnapshot.contentHash,
      contentHashKnown: true,
    },
    baseline: baseline
      ? {
          remoteTargetVersion: baseline.remoteTargetVersion,
          lastLocalCommitId: baseline.localCommitId,
          lastRemoteRevision: baseline.remoteRevision,
          lastSyncedContentHash: baseline.contentHash,
        }
      : null,
  });
}
