/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { RemoteSyncError } from '../remotes/RemoteSyncAdapter';
import { DeterministicRemoteAdapter } from '../remotes/testing/DeterministicRemoteAdapter';
import { VscRemotePushService } from '../remotes/VscRemotePushService';
import { createRemoteSyncAcceptanceFixture, type RemoteSyncAcceptanceFixture } from './helpers/remoteSyncAcceptance';

describe('remote sync server integration', () => {
  let fixture: RemoteSyncAcceptanceFixture;

  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.close();
  });

  it('fast-forwards a local snapshot and maps the immutable commit that was actually published', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('integration-fast-forward');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const publish = fixture.adapter.publishSnapshot.bind(fixture.adapter);
    let advancedCommitId: string | null = null;
    vi.spyOn(fixture.adapter, 'publishSnapshot').mockImplementationOnce(async (target, snapshot, expectedRevision) => {
      const advanced = await fixture.vsc.push({
        repoId: setup.repoId,
        baseCommitId: setup.commitId,
        message: 'advance local head during remote publication',
        files: [{ path: 'later.ts', content: 'export const later = true;\n' }],
      });
      advancedCommitId = advanced.commit.id;
      return publish(target, snapshot, expectedRevision);
    });

    const result = await new VscRemotePushService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
    }).push(input);

    expect(result).toMatchObject({ published: true, job: { status: 'succeeded', phase: 'finalized' } });
    expect(advancedCommitId).not.toBe(setup.commitId);
    await expect(fixture.mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
      remoteRevision: result.job.resultRemoteRevision,
    });
    await expect(fixture.vsc.getRepository({ repoId: setup.repoId })).resolves.toMatchObject({
      headCommitId: advancedCommitId,
    });
  });

  it('uses provider CAS when the remote advances after probe and leaves no mapping', async () => {
    fixture = await createRemoteSyncAcceptanceFixture();
    const setup = await fixture.createLocalRemote('integration-cas');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);
    const publish = fixture.adapter.publishSnapshot.bind(fixture.adapter);
    vi.spyOn(fixture.adapter, 'publishSnapshot').mockImplementationOnce(async (target, snapshot, expectedRevision) => {
      fixture.adapter.advanceRemote([{ path: 'third-party.ts', content: 'export const remote = true;\n' }]);
      return publish(target, snapshot, expectedRevision);
    });

    await expect(
      new VscRemotePushService(fixture.db, { adapterRegistry: fixture.adapterRegistry }).push(input),
    ).rejects.toMatchObject<RemoteSyncError>({ code: 'REMOTE_CHANGED' });
    expect(fixture.adapter.getPublishCount()).toBe(0);
    await expect(fixture.mapStore.findLatest(setup.remote.id)).resolves.toBeNull();
    await expect(fixture.db.getRepository('vscFileSyncJobs').findOne()).resolves.toMatchObject({
      status: 'failed',
      lastErrorCode: 'REMOTE_CHANGED',
    });
  });

  it('establishes a mapping for identical content without creating an empty remote commit', async () => {
    const adapter = new DeterministicRemoteAdapter({
      initialRevision: 'remote-existing',
      initialFiles: [{ path: 'README.md', content: '# integration-noop\n' }],
    });
    fixture = await createRemoteSyncAcceptanceFixture(adapter);
    const setup = await fixture.createLocalRemote('integration-noop');
    const input = await fixture.createPushInput(setup.remote, setup.commitId);

    const result = await new VscRemotePushService(fixture.db, {
      adapterRegistry: fixture.adapterRegistry,
    }).push(input);

    expect(result).toMatchObject({ published: false, plan: { action: 'establish-mapping' } });
    expect(adapter.getPublishCount()).toBe(0);
    await expect(fixture.mapStore.findLatest(setup.remote.id)).resolves.toMatchObject({
      localCommitId: setup.commitId,
      remoteRevision: 'remote-existing',
    });
  });
});
