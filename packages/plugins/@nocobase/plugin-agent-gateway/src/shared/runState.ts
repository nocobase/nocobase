/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const CLAIMABLE_RUN_STATUS = 'queued' as const;
export const IMPORTING_RUN_STATUS = 'importing' as const;
export const STALLED_RUN_STATUS = 'stalled' as const;

export const HEARTBEAT_RUN_STATUSES = ['claimed', 'syncing_skills', 'running', 'finalizing'] as const;
export const ACTIVE_RUN_STATUSES = [...HEARTBEAT_RUN_STATUSES, 'canceling'] as const;
export const LEASE_OWNING_RUN_STATUSES = [...ACTIVE_RUN_STATUSES, STALLED_RUN_STATUS] as const;
export const TERMINAL_RUN_STATUSES = ['succeeded', 'failed', 'canceled', 'timeout', 'abandoned'] as const;
export const TERMINAL_CONTROL_RUN_STATUSES = ['claimed', 'syncing_skills', 'running'] as const;
export const RESUMABLE_RUN_STATUSES = ['succeeded', 'failed', 'canceled', 'timeout', 'abandoned'] as const;

export type ActiveRunStatus = (typeof ACTIVE_RUN_STATUSES)[number];
export type ImportingRunStatus = typeof IMPORTING_RUN_STATUS;
export type HeartbeatRunStatus = (typeof HEARTBEAT_RUN_STATUSES)[number];
export type LeaseOwningRunStatus = (typeof LEASE_OWNING_RUN_STATUSES)[number];
export type TerminalRunStatus = (typeof TERMINAL_RUN_STATUSES)[number];

function includesStatus<TStatus extends string>(statuses: readonly TStatus[], status: string): status is TStatus {
  return statuses.includes(status as TStatus);
}

export function isActiveRunStatus(status: string): status is ActiveRunStatus {
  return includesStatus(ACTIVE_RUN_STATUSES, status);
}

export function isImportingRunStatus(status: string): status is ImportingRunStatus {
  return status === IMPORTING_RUN_STATUS;
}

export function isHeartbeatRunStatus(status: string): status is HeartbeatRunStatus {
  return includesStatus(HEARTBEAT_RUN_STATUSES, status);
}

export function isLeaseOwningRunStatus(status: string): status is LeaseOwningRunStatus {
  return includesStatus(LEASE_OWNING_RUN_STATUSES, status);
}

export function isTerminalRunStatus(status: string): status is TerminalRunStatus {
  return includesStatus(TERMINAL_RUN_STATUSES, status);
}
