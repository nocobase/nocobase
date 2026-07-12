/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CLAIMABLE_RUN_STATUS, IMPORTING_RUN_STATUS, LEASE_OWNING_RUN_STATUSES } from '../../../shared/runState';
import type { RunRecord, TFunction, TokenUsageRecord } from './types';

const LIVE_RUN_STATUSES = new Set<string>([CLAIMABLE_RUN_STATUS, IMPORTING_RUN_STATUS, ...LEASE_OWNING_RUN_STATUSES]);

export function isLiveRunStatus(status?: string) {
  return Boolean(status && LIVE_RUN_STATUSES.has(status));
}

function getTimestampMs(value?: string | null) {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getRunDurationStart(run: RunRecord) {
  return getTimestampMs(run.startedAt || run.claimedAt || run.queuedAt || run.requestedAt || run.createdAt);
}

function formatCompactDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export function formatRunDuration(run: RunRecord, nowMs = Date.now()) {
  const start = getRunDurationStart(run);
  if (start === null) {
    return '-';
  }
  const end = getTimestampMs(run.finishedAt) ?? (isLiveRunStatus(run.status) ? nowMs : null);
  return end === null ? '-' : formatCompactDuration(end - start);
}

export function getTokenUsageNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

export function formatTokenCount(value: unknown) {
  const numberValue = getTokenUsageNumber(value);
  if (numberValue === null) {
    return '-';
  }
  if (numberValue >= 1_000_000) {
    return `${(numberValue / 1_000_000).toFixed(1)}M`;
  }
  if (numberValue >= 1_000) {
    return `${(numberValue / 1_000).toFixed(1)}K`;
  }
  return String(Math.round(numberValue));
}

export function getTokenUsageTotal(usage?: TokenUsageRecord | null) {
  if (!usage) {
    return null;
  }
  const totalTokens = getTokenUsageNumber(usage.totalTokens);
  if (totalTokens !== null) {
    return totalTokens;
  }
  const inputTokens = getTokenUsageNumber(usage.inputTokens);
  const outputTokens = getTokenUsageNumber(usage.outputTokens);
  return inputTokens !== null || outputTokens !== null ? (inputTokens || 0) + (outputTokens || 0) : null;
}

export function hasTokenUsage(usage?: TokenUsageRecord | null) {
  return getTokenUsageTotal(usage) !== null || getTokenUsageNumber(usage?.cachedInputTokens) !== null;
}

export function getRunnerReasonMessage(t: TFunction, reason?: string) {
  if (!reason) {
    return '';
  }
  const messages: Record<string, string> = {
    ready: t('Runner is ready'),
    'missing-node': t('Runner node is not selected or no longer exists'),
    'node-inactive': t('Runner node is disabled'),
    'missing-profile': t('Runner profile is not selected or no longer exists'),
    'profile-inactive': t('Runner profile is disabled'),
    'heartbeat-stale': t('Runner heartbeat is stale; start or reconnect the daemon'),
  };
  return messages[reason] || t('Waiting for runner');
}

export function getRunTaskTitle(run: RunRecord, t: TFunction) {
  const taskTitle = typeof run.taskTitle === 'string' ? run.taskTitle.trim() : '';
  const resultTitle = typeof run.resultSummaryJson?.title === 'string' ? run.resultSummaryJson.title.trim() : '';
  return taskTitle || resultTitle || run.runCode || t('Untitled task');
}
