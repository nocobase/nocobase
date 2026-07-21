/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import {
  advanceLightExtensionAgentLoop,
  canSaveLightExtensionAgentLoop,
  createLightExtensionAgentLoopState,
  decodeLightExtensionPreviewSessionDescriptor,
  encodeLightExtensionPreviewSessionDescriptor,
  updateLightExtensionAgentLoopBudget,
  type LightExtensionAgentProblem,
} from '../agent-loop';

const startedAt = '2026-07-21T00:00:00.000Z';
const snapshotId = 'snapshot_1';
const contextHash = 'context_1';

describe('Light Extension agent loop', () => {
  it('runs the finite check, manual preview, problem, re-check, and save state flow', () => {
    let state = createState();
    state = advanceLightExtensionAgentLoop(state, { type: 'local_changed', snapshotId: 'snapshot_2' }, startedAt);
    expect(state.status).toBe('dirty');
    state = advanceLightExtensionAgentLoop(state, { type: 'check_started' }, '2026-07-21T00:00:01.000Z');
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'check_completed',
        accepted: false,
        snapshotId: 'snapshot_2',
        contextHash,
        problems: [problem('static_error')],
      },
      '2026-07-21T00:00:02.000Z',
    );
    expect(state.status).toBe('check_failed');
    state = advanceLightExtensionAgentLoop(
      state,
      { type: 'local_changed', snapshotId: 'snapshot_3' },
      '2026-07-21T00:00:03.000Z',
    );
    state = advanceLightExtensionAgentLoop(state, { type: 'check_started' }, '2026-07-21T00:00:04.000Z');
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'check_completed',
        accepted: true,
        snapshotId: 'snapshot_3',
        contextHash,
        problems: [],
      },
      '2026-07-21T00:00:05.000Z',
    );
    expect(state.status).toBe('ready_for_preview');
    state = advanceLightExtensionAgentLoop(
      state,
      { type: 'preview_opened', sessionId: 'preview_1', snapshotId: 'snapshot_3', contextHash },
      '2026-07-21T00:00:06.000Z',
    );
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'preview_polled',
        sessionId: 'preview_1',
        cursor: 1,
        state: 'completed',
        snapshotId: 'snapshot_3',
        contextHash,
        problems: [],
      },
      '2026-07-21T00:00:07.000Z',
    );
    expect(state.status).toBe('ready_to_save');
    expect(canSaveLightExtensionAgentLoop(state, { snapshotId: 'snapshot_3', contextHash })).toBe(true);
    state = advanceLightExtensionAgentLoop(state, { type: 'save_started' }, '2026-07-21T00:00:08.000Z');
    state = advanceLightExtensionAgentLoop(
      state,
      { type: 'save_completed', headCommitId: 'commit_2' },
      '2026-07-21T00:00:09.000Z',
    );
    expect(state).toMatchObject({ status: 'complete', completedHeadCommitId: 'commit_2' });
  });

  it('stops on repeated fingerprints, round budget, or elapsed time', () => {
    let repeated = createState({ repeatedFingerprintThreshold: 2 });
    for (let round = 0; round < 2; round += 1) {
      if (round > 0) {
        repeated = advanceLightExtensionAgentLoop(repeated, {
          type: 'local_changed',
          snapshotId: `snapshot_${round + 1}`,
        });
      }
      repeated = advanceLightExtensionAgentLoop(repeated, { type: 'check_started' }, startedAt);
      repeated = advanceLightExtensionAgentLoop(
        repeated,
        {
          type: 'check_completed',
          accepted: false,
          snapshotId: repeated.snapshotId,
          contextHash,
          problems: [problem('same_error')],
        },
        startedAt,
      );
    }
    expect(repeated).toMatchObject({ status: 'needs_attention', needsAttentionReason: 'repeated_fingerprints' });

    let rounds = createState({ maxCheckRounds: 1 });
    rounds = advanceLightExtensionAgentLoop(rounds, { type: 'check_started' }, startedAt);
    rounds = advanceLightExtensionAgentLoop(rounds, { type: 'check_started' }, startedAt);
    expect(rounds).toMatchObject({ status: 'needs_attention', needsAttentionReason: 'max_check_rounds' });

    let elapsed = advanceLightExtensionAgentLoop(
      createState({ maxDurationMs: 1000 }),
      { type: 'check_started' },
      startedAt,
    );
    elapsed = advanceLightExtensionAgentLoop(elapsed, { type: 'budget_checked' }, '2026-07-21T00:00:01.000Z');
    expect(elapsed).toMatchObject({ status: 'needs_attention', needsAttentionReason: 'max_duration' });

    const updated = updateLightExtensionAgentLoopBudget(createState(), { maxCheckRounds: 4 });
    expect(updated.budget).toMatchObject({ maxCheckRounds: 4, repeatedFingerprintThreshold: 3 });
  });

  it('starts the duration budget with the first check instead of the earlier pull', () => {
    let state = createState({ maxDurationMs: 1000 });
    state = advanceLightExtensionAgentLoop(state, { type: 'check_started' }, '2026-07-21T01:00:00.000Z');

    expect(state).toMatchObject({
      status: 'checking',
      startedAt: '2026-07-21T01:00:00.000Z',
      checkRounds: 1,
    });
    state = advanceLightExtensionAgentLoop(state, { type: 'budget_checked' }, '2026-07-21T01:00:00.999Z');
    expect(state.status).toBe('checking');
    state = advanceLightExtensionAgentLoop(state, { type: 'budget_checked' }, '2026-07-21T01:00:01.000Z');
    expect(state).toMatchObject({ status: 'needs_attention', needsAttentionReason: 'max_duration' });
  });

  it('keeps runtime failures scoped and clears them when source changes', () => {
    let state = readyForPreviewState();
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'preview_opened',
        sessionId: 'preview_1',
        snapshotId,
        contextHash,
      },
      startedAt,
    );
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'preview_polled',
        sessionId: 'preview_1',
        cursor: 2,
        state: 'active',
        snapshotId,
        contextHash,
        problems: [problem('runtime_error')],
      },
      startedAt,
    );
    expect(state.status).toBe('runtime_failed');
    expect(canSaveLightExtensionAgentLoop(state, { snapshotId, contextHash })).toBe(false);
    state = advanceLightExtensionAgentLoop(
      state,
      {
        type: 'preview_polled',
        sessionId: 'preview_1',
        cursor: 3,
        state: 'completed',
        snapshotId,
        contextHash,
        problems: [],
      },
      startedAt,
    );
    expect(state.status).toBe('runtime_failed');
    expect(state.problems).toEqual([expect.objectContaining({ fingerprint: 'runtime_error' })]);
    state = advanceLightExtensionAgentLoop(state, { type: 'local_changed', snapshotId: 'snapshot_2' }, startedAt);
    expect(state).toMatchObject({ status: 'dirty', snapshotId: 'snapshot_2', problems: [] });
    expect(state.preview).toBeUndefined();
  });

  it('round-trips a browser-to-CLI preview session descriptor', () => {
    const descriptor = {
      schemaVersion: 1 as const,
      sessionId: 'preview:1',
      repoId: 'repo_1',
      entryId: 'entry_1',
      ownerLocator: { kind: 'flowModel.step', modelUid: 'block_1', stepPath: ['render'] },
      snapshotId,
      contextHash,
      artifactHash: 'a'.repeat(64),
      executionId: 'execution:1',
    };
    expect(
      decodeLightExtensionPreviewSessionDescriptor(encodeLightExtensionPreviewSessionDescriptor(descriptor)),
    ).toEqual(descriptor);
  });
});

function createState(
  budget: { maxCheckRounds?: number; maxDurationMs?: number; repeatedFingerprintThreshold?: number } = {},
) {
  return createLightExtensionAgentLoopState({
    snapshotId,
    contextHash,
    baseHeadCommitId: 'commit_1',
    budget,
    now: startedAt,
  });
}

function readyForPreviewState() {
  let state = createState();
  state = advanceLightExtensionAgentLoop(state, { type: 'check_started' }, startedAt);
  return advanceLightExtensionAgentLoop(
    state,
    {
      type: 'check_completed',
      accepted: true,
      snapshotId,
      contextHash,
      problems: [],
    },
    startedAt,
  );
}

function problem(fingerprint: string): LightExtensionAgentProblem {
  return { fingerprint, severity: 'error', code: fingerprint, message: fingerprint };
}
