/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { performance } from 'perf_hooks';

import { RunLease } from './types';

const DEFAULT_RUN_LEASE_TTL_MS = 60_000;

function getRunLeaseTtlMs(lease: RunLease) {
  if (typeof lease.leaseTtlMs === 'number' && Number.isFinite(lease.leaseTtlMs) && lease.leaseTtlMs > 0) {
    return lease.leaseTtlMs;
  }

  const expiresAt = lease.claimExpiresAt ? Date.parse(lease.claimExpiresAt) : Number.NaN;
  const serverTime = lease.serverTime ? Date.parse(lease.serverTime) : Number.NaN;
  if (Number.isFinite(expiresAt) && Number.isFinite(serverTime)) {
    return Math.max(0, expiresAt - serverTime);
  }
  if (Number.isFinite(expiresAt)) {
    return Math.max(0, expiresAt - Date.now());
  }
  return DEFAULT_RUN_LEASE_TTL_MS;
}

export function getMonotonicTimeMs() {
  return performance.now();
}

export function attachLocalRunLeaseDeadline(lease: RunLease): RunLease {
  return {
    ...lease,
    localLeaseDeadlineMonotonicMs: getMonotonicTimeMs() + getRunLeaseTtlMs(lease),
  };
}

export function getLocalRunLeaseDeadlineMonotonicMs(lease: RunLease, fallbackFrom = getMonotonicTimeMs()) {
  if (typeof lease.localLeaseDeadlineMonotonicMs === 'number' && Number.isFinite(lease.localLeaseDeadlineMonotonicMs)) {
    return lease.localLeaseDeadlineMonotonicMs;
  }
  return fallbackFrom + getRunLeaseTtlMs(lease);
}
