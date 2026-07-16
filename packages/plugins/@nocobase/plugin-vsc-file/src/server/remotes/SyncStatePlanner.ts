/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'crypto';

import type {
  VscRemotePlannerAction,
  VscRemotePlannerInput,
  VscRemotePlannerState,
  VscRemoteSyncBaseline,
  VscRemoteSyncPlan,
} from '../../shared/remote-sync-types';

interface PlanDecision {
  state: VscRemotePlannerState;
  action: VscRemotePlannerAction;
  reasonCode: string | null;
}

function directionAllowsPull(input: VscRemotePlannerInput): boolean {
  return input.direction === 'pull' || input.direction === 'bidirectional';
}

function directionAllowsPush(input: VscRemotePlannerInput): boolean {
  return input.direction === 'push' || input.direction === 'bidirectional';
}

function selectCurrentBaseline(input: VscRemotePlannerInput): VscRemoteSyncBaseline | null {
  if (input.remoteTargetVersion === null || input.baseline?.remoteTargetVersion !== input.remoteTargetVersion) {
    return null;
  }
  return input.baseline;
}

function createFingerprint(input: VscRemotePlannerInput, baseline: VscRemoteSyncBaseline | null): string {
  const payload = [
    ['remoteId', input.remoteId],
    ['provider', input.provider],
    ['remoteTargetVersion', input.remoteTargetVersion],
    ['localHeadCommitId', input.local.headCommitId],
    ['localContentHash', input.local.contentHash],
    ['remoteRevision', input.remote.revision],
    ['remoteContentHash', input.remote.contentHash],
    ['remoteContentHashKnown', input.remote.contentHashKnown],
    ['baselineTargetVersion', baseline?.remoteTargetVersion ?? null],
    ['baselineLocalCommitId', baseline?.lastLocalCommitId ?? null],
    ['baselineRemoteRevision', baseline?.lastRemoteRevision ?? null],
    ['baselineContentHash', baseline?.lastSyncedContentHash ?? null],
  ];
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

function decideWithoutBaseline(input: VscRemotePlannerInput): PlanDecision {
  const localExists = input.local.headCommitId !== null;
  const remoteExists = input.remote.revision !== null;

  if (!localExists && !remoteExists) {
    return { state: 'in-sync', action: 'noop', reasonCode: 'both-empty' };
  }
  if (
    input.local.contentHash !== null &&
    input.remote.contentHash !== null &&
    input.local.contentHash === input.remote.contentHash
  ) {
    return { state: 'in-sync', action: 'establish-mapping', reasonCode: 'initial-content-matches' };
  }
  if (localExists && !remoteExists) {
    return { state: 'local-ahead', action: 'push', reasonCode: 'initial-remote-empty' };
  }
  if (!localExists && remoteExists) {
    return { state: 'remote-ahead', action: 'pull', reasonCode: 'initial-local-empty' };
  }
  return { state: 'diverged', action: 'conflict', reasonCode: 'initial-ambiguous' };
}

function decideWithBaseline(input: VscRemotePlannerInput, baseline: VscRemoteSyncBaseline): PlanDecision {
  const localContentChanged = input.local.contentHash !== baseline.lastSyncedContentHash;
  const remoteContentChanged = input.remote.contentHash !== baseline.lastSyncedContentHash;
  const localIdentityChanged = input.local.headCommitId !== baseline.lastLocalCommitId;
  const remoteIdentityChanged = input.remote.revision !== baseline.lastRemoteRevision;

  if (!localContentChanged && !remoteContentChanged) {
    if (localIdentityChanged || remoteIdentityChanged) {
      return { state: 'in-sync', action: 'repair-mapping', reasonCode: 'metadata-only-change' };
    }
    return { state: 'in-sync', action: 'noop', reasonCode: null };
  }
  if (localContentChanged && !remoteContentChanged) {
    return { state: 'local-ahead', action: 'push', reasonCode: 'local-content-changed' };
  }
  if (!localContentChanged && remoteContentChanged) {
    return { state: 'remote-ahead', action: 'pull', reasonCode: 'remote-content-changed' };
  }
  if (input.local.contentHash === input.remote.contentHash) {
    return { state: 'in-sync', action: 'repair-mapping', reasonCode: 'changed-content-matches' };
  }
  return { state: 'diverged', action: 'conflict', reasonCode: 'both-content-changed' };
}

export function createSyncStatePlan(input: VscRemotePlannerInput): VscRemoteSyncPlan {
  const baseline = selectCurrentBaseline(input);
  let decision: PlanDecision;

  if (!input.configured || input.remoteId === null || input.provider === null || input.remoteTargetVersion === null) {
    decision = { state: 'unconfigured', action: 'noop', reasonCode: 'remote-unconfigured' };
  } else if (!input.remote.contentHashKnown) {
    decision = { state: 'error', action: 'fetch-required', reasonCode: 'remote-content-unknown' };
  } else {
    decision = baseline ? decideWithBaseline(input, baseline) : decideWithoutBaseline(input);
  }

  const pullAvailable = input.capabilities.canPull && directionAllowsPull(input);
  const pushAvailable = input.capabilities.canPush && directionAllowsPush(input);
  let reasonCode = decision.reasonCode;
  if (decision.action === 'pull' && !pullAvailable) {
    reasonCode = 'pull-not-available';
  } else if (decision.action === 'push' && !pushAvailable) {
    reasonCode = 'push-not-available';
  }

  return {
    state: decision.state,
    action: decision.action,
    reasonCode,
    canPull: decision.action === 'pull' && pullAvailable,
    canPush: decision.action === 'push' && pushAvailable,
    fingerprint: createFingerprint(input, baseline),
    remoteTargetVersion: input.remoteTargetVersion,
    local: { ...input.local },
    remote: { ...input.remote },
    baseline: baseline ? { ...baseline } : null,
  };
}

export class SyncStatePlanner {
  plan(input: VscRemotePlannerInput): VscRemoteSyncPlan {
    return createSyncStatePlan(input);
  }
}
