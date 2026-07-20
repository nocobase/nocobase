/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import type { VscRemotePlannerInput } from '../../../../shared/vsc-file/remote-sync-types';
import { createSyncStatePlan, SyncStatePlanner } from '../SyncStatePlanner';

interface PlannerOverrides extends Partial<Omit<VscRemotePlannerInput, 'capabilities' | 'local' | 'remote'>> {
  capabilities?: Partial<VscRemotePlannerInput['capabilities']>;
  local?: Partial<VscRemotePlannerInput['local']>;
  remote?: Partial<VscRemotePlannerInput['remote']>;
}

function createInput(overrides: PlannerOverrides = {}): VscRemotePlannerInput {
  const input: VscRemotePlannerInput = {
    configured: true,
    remoteId: 'remote_origin',
    provider: 'github',
    remoteTargetVersion: 1,
    direction: 'bidirectional',
    capabilities: { canPull: true, canPush: true },
    local: { headCommitId: 'local_base', contentHash: 'sha256:base' },
    remote: { revision: 'remote_base', contentHash: 'sha256:base', contentHashKnown: true },
    baseline: {
      remoteTargetVersion: 1,
      lastLocalCommitId: 'local_base',
      lastRemoteRevision: 'remote_base',
      lastSyncedContentHash: 'sha256:base',
    },
  };

  return {
    ...input,
    ...overrides,
    capabilities: { ...input.capabilities, ...overrides.capabilities },
    local: { ...input.local, ...overrides.local },
    remote: { ...input.remote, ...overrides.remote },
  };
}

describe('SyncStatePlanner', () => {
  it('returns a stable clean plan and fingerprint for identical input', () => {
    const planner = new SyncStatePlanner();
    const input = createInput();
    const first = planner.plan(input);
    const second = createSyncStatePlan(createInput());

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      state: 'in-sync',
      action: 'noop',
      reasonCode: null,
      canPull: false,
      canPush: false,
      fingerprint: expect.stringMatching(/^sha256:[a-f0-9]{64}$/u),
    });
  });

  it('returns unconfigured without exposing operations', () => {
    const plan = createSyncStatePlan(
      createInput({ configured: false, remoteId: null, provider: null, remoteTargetVersion: null, baseline: null }),
    );

    expect(plan).toMatchObject({
      state: 'unconfigured',
      action: 'noop',
      reasonCode: 'remote-unconfigured',
      canPull: false,
      canPush: false,
      remoteTargetVersion: null,
      baseline: null,
    });
  });

  it('detects local-ahead and remote-ahead changes from the baseline', () => {
    const localAhead = createSyncStatePlan(
      createInput({ local: { headCommitId: 'local_next', contentHash: 'sha256:local-next' } }),
    );
    const remoteAhead = createSyncStatePlan(
      createInput({ remote: { revision: 'remote_next', contentHash: 'sha256:remote-next' } }),
    );

    expect(localAhead).toMatchObject({ state: 'local-ahead', action: 'push', canPush: true, canPull: false });
    expect(remoteAhead).toMatchObject({ state: 'remote-ahead', action: 'pull', canPull: true, canPush: false });
  });

  it('never auto-overwrites when both sides changed to different content', () => {
    const plan = createSyncStatePlan(
      createInput({
        local: { headCommitId: 'local_next', contentHash: 'sha256:local-next' },
        remote: { revision: 'remote_next', contentHash: 'sha256:remote-next' },
      }),
    );

    expect(plan).toMatchObject({
      state: 'diverged',
      action: 'conflict',
      reasonCode: 'both-content-changed',
      canPull: false,
      canPush: false,
    });
  });

  it('repairs mapping when both revisions changed to the same content', () => {
    const plan = createSyncStatePlan(
      createInput({
        local: { headCommitId: 'local_next', contentHash: 'sha256:shared-next' },
        remote: { revision: 'remote_next', contentHash: 'sha256:shared-next' },
      }),
    );

    expect(plan).toMatchObject({
      state: 'in-sync',
      action: 'repair-mapping',
      reasonCode: 'changed-content-matches',
      canPull: false,
      canPush: false,
    });
  });

  it('repairs metadata-only local or remote revision changes', () => {
    const localMetadata = createSyncStatePlan(createInput({ local: { headCommitId: 'local_metadata' } }));
    const remoteMetadata = createSyncStatePlan(createInput({ remote: { revision: 'remote_metadata' } }));

    expect(localMetadata).toMatchObject({ state: 'in-sync', action: 'repair-mapping' });
    expect(remoteMetadata).toMatchObject({ state: 'in-sync', action: 'repair-mapping' });
  });

  it('requires fetch when remote content is unknown instead of guessing in-sync', () => {
    const plan = createSyncStatePlan(createInput({ remote: { contentHash: null, contentHashKnown: false } }));

    expect(plan).toMatchObject({
      state: 'error',
      action: 'fetch-required',
      reasonCode: 'remote-content-unknown',
      canPull: false,
      canPush: false,
    });
  });

  it('handles all first binding rules without silently overwriting existing content', () => {
    const remoteEmpty = createSyncStatePlan(
      createInput({ baseline: null, remote: { revision: null, contentHash: 'sha256:empty-tree' } }),
    );
    const localEmpty = createSyncStatePlan(
      createInput({ baseline: null, local: { headCommitId: null, contentHash: 'sha256:empty-tree' } }),
    );
    const matching = createSyncStatePlan(createInput({ baseline: null }));
    const ambiguous = createSyncStatePlan(
      createInput({ baseline: null, remote: { revision: 'remote_other', contentHash: 'sha256:other' } }),
    );

    expect(remoteEmpty).toMatchObject({ state: 'local-ahead', action: 'push', canPush: true });
    expect(localEmpty).toMatchObject({ state: 'remote-ahead', action: 'pull', canPull: true });
    expect(matching).toMatchObject({ state: 'in-sync', action: 'establish-mapping' });
    expect(ambiguous).toMatchObject({
      state: 'diverged',
      action: 'conflict',
      reasonCode: 'initial-ambiguous',
      canPull: false,
      canPush: false,
    });
  });

  it('disables unavailable direction or provider capability without changing the detected state', () => {
    const pushDisabled = createSyncStatePlan(
      createInput({
        direction: 'pull',
        local: { headCommitId: 'local_next', contentHash: 'sha256:local-next' },
      }),
    );
    const pullDisabled = createSyncStatePlan(
      createInput({
        capabilities: { canPull: false },
        remote: { revision: 'remote_next', contentHash: 'sha256:remote-next' },
      }),
    );

    expect(pushDisabled).toMatchObject({
      state: 'local-ahead',
      action: 'push',
      reasonCode: 'push-not-available',
      canPush: false,
    });
    expect(pullDisabled).toMatchObject({
      state: 'remote-ahead',
      action: 'pull',
      reasonCode: 'pull-not-available',
      canPull: false,
    });
  });

  it('ignores a baseline from an older remote target version', () => {
    const staleBaseline = createInput({
      remoteTargetVersion: 2,
      baseline: {
        remoteTargetVersion: 1,
        lastLocalCommitId: 'unrelated_local',
        lastRemoteRevision: 'unrelated_remote',
        lastSyncedContentHash: 'sha256:unrelated',
      },
    });
    const withoutBaseline = createInput({ remoteTargetVersion: 2, baseline: null });
    const stalePlan = createSyncStatePlan(staleBaseline);
    const cleanPlan = createSyncStatePlan(withoutBaseline);

    expect(stalePlan.baseline).toBeNull();
    expect(stalePlan).toMatchObject({ state: 'in-sync', action: 'establish-mapping' });
    expect(stalePlan.fingerprint).toBe(cleanPlan.fingerprint);
  });

  it('does not let authRef rotation affect state or fingerprint', () => {
    const firstInput = { ...createInput(), authRef: '{{ $env.FIRST_SECRET }}' };
    const secondInput = { ...createInput(), authRef: '{{ $env.ROTATED_SECRET }}' };
    const first = createSyncStatePlan(firstInput);
    const second = createSyncStatePlan(secondInput);

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).not.toMatch(/FIRST_SECRET|ROTATED_SECRET|authRef/u);
  });
});
