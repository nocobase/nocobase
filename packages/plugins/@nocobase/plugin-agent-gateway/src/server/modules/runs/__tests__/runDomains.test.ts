/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { describe, expect, it } from 'vitest';

import { getRunListFilter, getRunListPagination, getRunListSort } from '../../../services/runListQuery';
import { getRunLeaseFenceFailure, RunLeaseFenceInput } from '../claimLease';
import { getHeartbeatStatus } from '../heartbeatLease';
import { getTerminalTransitionFailure } from '../terminalizeRun';

const NOW = new Date('2026-07-13T00:00:00.000Z');

function createLeaseInput(overrides: Partial<RunLeaseFenceInput> = {}): RunLeaseFenceInput {
  return {
    nodeId: 'node-1',
    leasedNodeId: 'node-1',
    claimAttempt: 2,
    currentClaimAttempt: 2,
    requestedLeaseVersion: 4,
    currentLeaseVersion: 4,
    claimTokenMatches: true,
    status: 'running',
    claimExpiresAt: new Date(NOW.getTime() + 60_000),
    now: NOW,
    ...overrides,
  };
}

function createContext(query: Record<string, unknown> = {}) {
  return {
    query,
    throw(status: number, message: string) {
      throw new Error(`${status}: ${message}`);
    },
  } as unknown as Context;
}

describe('agent gateway run domains', () => {
  it('centralizes claim attempt, lease version, token, node, status, and expiry fences', () => {
    expect(getRunLeaseFenceFailure(createLeaseInput())).toBeNull();
    expect(getRunLeaseFenceFailure(createLeaseInput({ leasedNodeId: 'node-2' }))).toBe(
      'Run is not leased by this node',
    );
    expect(getRunLeaseFenceFailure(createLeaseInput({ currentClaimAttempt: 3 }))).toBe('Claim attempt is stale');
    expect(getRunLeaseFenceFailure(createLeaseInput({ requestedLeaseVersion: 3 }))).toBe('Lease version is stale');
    expect(getRunLeaseFenceFailure(createLeaseInput({ claimTokenMatches: false }))).toBe('Claim token is stale');
    expect(getRunLeaseFenceFailure(createLeaseInput({ status: 'succeeded' }))).toBe('Run is no longer active');
    expect(getRunLeaseFenceFailure(createLeaseInput({ claimExpiresAt: NOW }))).toBe('Run lease has expired');
  });

  it('distinguishes previous-version retries from arbitrary stale lease writers', () => {
    const previousVersion = createLeaseInput({ requestedLeaseVersion: 3 });
    expect(getRunLeaseFenceFailure(previousVersion, { allowPreviousLeaseVersion: true })).toBeNull();
    expect(
      getRunLeaseFenceFailure(createLeaseInput({ requestedLeaseVersion: 2 }), {
        allowPreviousLeaseVersion: true,
      }),
    ).toBe('Lease version is stale');
    expect(
      getRunLeaseFenceFailure(createLeaseInput({ requestedLeaseVersion: 2 }), {
        allowStaleLeaseVersion: true,
      }),
    ).toBeNull();
  });

  it('uses one explicit terminal transition table for completion, failure, timeout, and cancellation', () => {
    expect(getTerminalTransitionFailure('running', 'succeeded')).toBeNull();
    expect(getTerminalTransitionFailure('claimed', 'failed')).toBeNull();
    expect(getTerminalTransitionFailure('finalizing', 'timeout')).toBeNull();
    expect(getTerminalTransitionFailure('canceling', 'canceled')).toBeNull();
    expect(getTerminalTransitionFailure('claimed', 'succeeded')).toBe('Run cannot become succeeded from claimed');
    expect(getTerminalTransitionFailure('canceling', 'failed')).toBe('Run is canceling');
    expect(getTerminalTransitionFailure('succeeded', 'failed')).toBe('Run is already succeeded');
  });

  it('keeps heartbeat transitions monotonic and makes the previous lease retry state-preserving', () => {
    const ctx = createContext();
    expect(getHeartbeatStatus(ctx, 'claimed', 'running')).toBe('running');
    expect(getHeartbeatStatus(ctx, 'running', 'syncing_skills')).toBe('running');
    expect(getHeartbeatStatus(ctx, 'canceling', 'finalizing')).toBe('canceling');
    expect(getHeartbeatStatus(ctx, 'stalled', '')).toBe('running');
    expect(() => getHeartbeatStatus(ctx, 'running', 'succeeded')).toThrow('400: Unsupported heartbeat status');
  });

  it('keeps visible query inputs, pagination, and stable sorting as separate query concerns', () => {
    const ctx = createContext({
      page: '3',
      pageSize: '20',
      status: 'running,finalizing',
      taskTemplateId: 'template-1',
      sort: '-requestedAt',
    });
    expect(getRunListPagination(ctx)).toEqual({ page: 3, pageSize: 20, offset: 40 });
    expect(getRunListFilter(ctx)).toEqual({
      status: { $in: ['running', 'finalizing'] },
      taskTemplateId: 'template-1',
    });
    expect(getRunListSort(ctx)).toEqual(['-requestedAt', '-createdAt']);
  });
});
