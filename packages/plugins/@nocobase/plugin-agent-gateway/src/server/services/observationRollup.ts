/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  AgentTranscriptEvent,
  AgentTranscriptToolCall,
  AgentTranscriptToolKind,
  AgentTranscriptToolStatus,
  AgentTranscriptToolStats,
  buildAgentTranscript,
  getAgentTranscriptToolStats,
} from '../../shared/agentTranscript';
import { isTerminalRunStatus } from '../../shared/runState';
import { JsonRecord, ModelRecord, getModelNumber, getModelString, getModelValue, getRecord } from '../actions/utils';

const OBSERVABILITY_ROLLUP_VERSION = 1;
export const OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT = 256;

export const OBSERVABILITY_ROLLUP_EVENT_FILTER: JsonRecord = {
  $or: [
    {
      eventType: 'agent.turn.completed',
    },
    {
      eventType: {
        $like: 'agent.command.%',
      },
    },
    {
      eventType: {
        $like: 'agent.tool.%',
      },
    },
    {
      eventType: 'agent.message',
      source: 'terminal-live',
    },
  ],
};

export interface TokenUsageSummary extends JsonRecord {
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  reasoningOutputTokens?: number;
  totalTokens?: number;
}

export interface RunObservabilityRollup extends JsonRecord {
  version: 1;
  rolledUpAt: string;
  sourceEventCount: number;
  tokenUsageJson: TokenUsageSummary | null;
  toolCallCount: number;
  toolStatsJson: AgentTranscriptToolStats;
  toolLifecycleJson?: ObservabilityToolLifecycle;
  eventWatermarkJson: ObservabilityEventWatermark;
}

export interface ObservabilityToolLifecycleState extends JsonRecord {
  correlationKey: string;
  kind: AgentTranscriptToolKind;
  status: AgentTranscriptToolStatus;
}

export interface ObservabilityToolLifecycle extends JsonRecord {
  calls: ObservabilityToolLifecycleState[];
  terminalStatsJson: AgentTranscriptToolStats;
}

export interface ObservabilityEventWatermark extends JsonRecord {
  createdAt: string;
  eventId: string;
  externalImportBatchId?: string;
}

function isRecordWithValues(value: JsonRecord) {
  return Object.keys(value).length > 0;
}

function getFiniteTokenNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return null;
  }
  return numberValue;
}

function getTokenNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const numberValue = getFiniteTokenNumber(record[key]);
    if (numberValue !== null) {
      return numberValue;
    }
  }
  return null;
}

function extractTokenUsageSummary(value: unknown): TokenUsageSummary | null {
  const record = getRecord(value);
  if (!isRecordWithValues(record)) {
    return null;
  }

  const inputTokens = getTokenNumber(record, ['inputTokens', 'input_tokens', 'promptTokens', 'prompt_tokens']);
  const cachedInputTokens = getTokenNumber(record, ['cachedInputTokens', 'cached_input_tokens']);
  const outputTokens = getTokenNumber(record, [
    'outputTokens',
    'output_tokens',
    'completionTokens',
    'completion_tokens',
  ]);
  const reasoningOutputTokens = getTokenNumber(record, ['reasoningOutputTokens', 'reasoning_output_tokens']);
  const totalTokens = getTokenNumber(record, ['totalTokens', 'total_tokens']);
  const computedTotal =
    totalTokens ?? (inputTokens !== null || outputTokens !== null ? (inputTokens ?? 0) + (outputTokens ?? 0) : null);

  const summary: TokenUsageSummary = {};
  if (inputTokens !== null) {
    summary.inputTokens = inputTokens;
  }
  if (cachedInputTokens !== null) {
    summary.cachedInputTokens = cachedInputTokens;
  }
  if (outputTokens !== null) {
    summary.outputTokens = outputTokens;
  }
  if (reasoningOutputTokens !== null) {
    summary.reasoningOutputTokens = reasoningOutputTokens;
  }
  if (computedTotal !== null) {
    summary.totalTokens = computedTotal;
  }

  return isRecordWithValues(summary) ? summary : null;
}

export function getTokenUsageSummaryFromRecord(record: JsonRecord) {
  const candidates = [record.tokenUsageJson, record.tokenUsage, record.usage, record.tokens, record];
  for (const candidate of candidates) {
    const summary = extractTokenUsageSummary(candidate);
    if (summary) {
      return summary;
    }
  }
  return null;
}

function getResultSummaryTokenUsage(
  run: ModelRecord,
  options: {
    resultSummaryJson?: unknown;
  },
) {
  const resultSummaryJson = Object.prototype.hasOwnProperty.call(options, 'resultSummaryJson')
    ? options.resultSummaryJson
    : getModelValue(run, 'resultSummaryJson');
  return getTokenUsageSummaryFromRecord(getRecord(resultSummaryJson));
}

function mergeTokenUsageSummary(total: TokenUsageSummary, next: TokenUsageSummary) {
  for (const key of [
    'inputTokens',
    'cachedInputTokens',
    'outputTokens',
    'reasoningOutputTokens',
    'totalTokens',
  ] as const) {
    const value = next[key];
    if (typeof value === 'number') {
      const currentValue = typeof total[key] === 'number' ? total[key] : 0;
      total[key] = currentValue + value;
    }
  }
}

function mergeTokenUsageSummaries(
  current: TokenUsageSummary | null,
  next: TokenUsageSummary | null,
): TokenUsageSummary | null {
  const total: TokenUsageSummary = {};
  if (current) {
    mergeTokenUsageSummary(total, current);
  }
  if (next) {
    mergeTokenUsageSummary(total, next);
  }
  return isRecordWithValues(total) ? total : null;
}

function stripAnsiControlSequences(value: string) {
  const escapeCharacter = String.fromCharCode(27);
  return value.replace(new RegExp(`${escapeCharacter}\\[[0-?]*[ -/]*[@-~]`, 'g'), '');
}

function extractCodexTerminalTokenUsageSummary(value: string): TokenUsageSummary | null {
  const normalizedText = stripAnsiControlSequences(value).replace(/\r/g, '\n');
  const matches = Array.from(normalizedText.matchAll(/tokens\s+used\s*\n+\s*([0-9][0-9,\s]*)/gi));
  if (!matches.length) {
    return null;
  }

  const tokenText = matches[matches.length - 1]?.[1]?.replace(/[,\s]/g, '') || '';
  const totalTokens = getFiniteTokenNumber(tokenText);
  return totalTokens === null ? null : { totalTokens };
}

function getRunTerminalTokenUsageSummary(events: ModelRecord[]) {
  const terminalText = events.map((event) => getModelString(event, 'contentText')).join('\n');
  return extractCodexTerminalTokenUsageSummary(terminalText);
}

export function getRunObservabilityRollup(run: ModelRecord): RunObservabilityRollup | null {
  const value = getRecord(getModelValue(run, 'observabilityRollupJson'));
  if (value.version !== OBSERVABILITY_ROLLUP_VERSION) {
    return null;
  }
  const toolStatsJson = getPersistedToolStats(value.toolStatsJson);
  const toolLifecycleJson = getToolLifecycle(value.toolLifecycleJson);
  const rolledUpAt = typeof value.rolledUpAt === 'string' ? value.rolledUpAt : '';
  const watermarkValue = getRecord(value.eventWatermarkJson);
  return {
    ...value,
    version: OBSERVABILITY_ROLLUP_VERSION,
    rolledUpAt,
    sourceEventCount: getFiniteTokenNumber(value.sourceEventCount) ?? 0,
    tokenUsageJson: extractTokenUsageSummary(value.tokenUsageJson),
    toolCallCount: getFiniteTokenNumber(value.toolCallCount) ?? 0,
    toolStatsJson,
    ...(toolLifecycleJson ? { toolLifecycleJson } : {}),
    eventWatermarkJson: {
      createdAt: getIsoDate(watermarkValue.createdAt) || rolledUpAt,
      eventId: getModelStringValue(watermarkValue.eventId),
      ...(getModelStringValue(watermarkValue.externalImportBatchId)
        ? { externalImportBatchId: getModelStringValue(watermarkValue.externalImportBatchId) }
        : {}),
    },
  };
}

const TOOL_KINDS = new Set<AgentTranscriptToolKind>([
  'exec',
  'run',
  'terminal',
  'wait',
  'apply_patch',
  'tool',
  'unknown',
]);
const TOOL_STATUSES = new Set<AgentTranscriptToolStatus>(['running', 'succeeded', 'failed', 'unknown']);

function getStatsCount(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numberValue) && numberValue >= 0 ? numberValue : 0;
}

function getPersistedToolStats(value: unknown) {
  const record = getRecord(value);
  const stats = createEmptyToolStats();
  stats.total = getStatsCount(record.total);
  for (const status of TOOL_STATUSES) {
    stats[status] = getStatsCount(record[status]);
    stats.byStatus[status] = stats[status];
  }
  const byKind = getRecord(record.byKind);
  for (const kind of TOOL_KINDS) {
    const kindRecord = getRecord(byKind[kind]);
    const kindStats = {
      total: getStatsCount(kindRecord.total),
      succeeded: getStatsCount(kindRecord.succeeded),
      failed: getStatsCount(kindRecord.failed),
      running: getStatsCount(kindRecord.running),
      unknown: getStatsCount(kindRecord.unknown),
    };
    if (kindStats.total) {
      stats.byKind[kind] = kindStats;
    }
  }
  return stats;
}

function isTerminalToolStatus(status: AgentTranscriptToolStatus) {
  return status === 'succeeded' || status === 'failed';
}

function getToolLifecycle(value: unknown): ObservabilityToolLifecycle | null {
  const record = getRecord(value);
  if (!Array.isArray(record.calls)) {
    return null;
  }
  const calls = record.calls.flatMap((entry) => {
    const call = getRecord(entry);
    const correlationKey = getModelStringValue(call.correlationKey);
    const kind = getModelStringValue(call.kind) as AgentTranscriptToolKind;
    const status = getModelStringValue(call.status) as AgentTranscriptToolStatus;
    return correlationKey && TOOL_KINDS.has(kind) && TOOL_STATUSES.has(status)
      ? [{ correlationKey, kind, status } satisfies ObservabilityToolLifecycleState]
      : [];
  });
  const terminalCalls = calls.filter((call) => isTerminalToolStatus(call.status));
  const terminalStatsJson = Object.prototype.hasOwnProperty.call(record, 'terminalStatsJson')
    ? getPersistedToolStats(record.terminalStatsJson)
    : getToolLifecycleStats(terminalCalls);
  const pendingCalls = calls.filter((call) => !isTerminalToolStatus(call.status));
  return {
    calls: [...pendingCalls, ...terminalCalls.slice(-OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT)],
    terminalStatsJson,
  };
}

function getModelStringValue(value: unknown) {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

function getEventTokenUsageSummary(events: ModelRecord[]) {
  const total: TokenUsageSummary = {};
  for (const event of events.filter((entry) => getModelString(entry, 'eventType') === 'agent.turn.completed')) {
    const summary = getTokenUsageSummaryFromRecord(getRecord(getModelValue(event, 'contentJson')));
    if (summary) {
      mergeTokenUsageSummary(total, summary);
    }
  }

  if (isRecordWithValues(total)) {
    return total;
  }
  return getRunTerminalTokenUsageSummary(
    events.filter(
      (event) =>
        getModelString(event, 'eventType') === 'agent.message' && getModelString(event, 'source') === 'terminal-live',
    ),
  );
}

export function getRunTokenUsageSummary(run: ModelRecord, events: ModelRecord[]) {
  const rollup = getRunObservabilityRollup(run);
  if (rollup?.tokenUsageJson) {
    return rollup.tokenUsageJson;
  }
  const resultSummary = getTokenUsageSummaryFromRecord(getRecord(getModelValue(run, 'resultSummaryJson')));
  if (resultSummary) {
    return resultSummary;
  }
  return getEventTokenUsageSummary(events);
}

function getIsoDate(value: unknown) {
  const date = value instanceof Date ? value : value ? new Date(String(value)) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

function toTranscriptEvent(event: ModelRecord): AgentTranscriptEvent {
  return {
    id: getModelString(event, 'id'),
    runId: getModelString(event, 'runId') || undefined,
    ingestId: getModelString(event, 'ingestId') || undefined,
    source: getModelString(event, 'source') || undefined,
    sequence: getModelNumber(event, 'sequence'),
    eventType: getModelString(event, 'eventType') || undefined,
    providerEventId: getModelString(event, 'providerEventId') || null,
    correlationId: getModelString(event, 'correlationId') || null,
    contentText: getModelString(event, 'contentText') || null,
    contentJson: getRecord(getModelValue(event, 'contentJson')),
    createdAt: getIsoDate(getModelValue(event, 'createdAt')),
  };
}

function compareEventWatermarks(left: ObservabilityEventWatermark, right: ObservabilityEventWatermark) {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt.localeCompare(right.createdAt);
  }
  return left.eventId.localeCompare(right.eventId);
}

function getLatestEventWatermark(
  events: ModelRecord[],
  fallback: ObservabilityEventWatermark,
  externalImportBatchId?: string,
) {
  const latest = events.reduce<ObservabilityEventWatermark>((current, event) => {
    const next = {
      createdAt: getIsoDate(getModelValue(event, 'createdAt')) || current.createdAt,
      eventId: getModelString(event, 'id'),
    };
    return compareEventWatermarks(next, current) > 0 ? next : current;
  }, fallback);
  return {
    ...latest,
    ...(externalImportBatchId ? { externalImportBatchId } : {}),
  };
}

function getToolCorrelationKey(toolCall: AgentTranscriptToolCall) {
  return toolCall.id.startsWith('event-tool-') ? toolCall.id.slice('event-tool-'.length) : toolCall.id;
}

function mergeToolStatus(current: AgentTranscriptToolStatus, next: AgentTranscriptToolStatus) {
  if (next === 'unknown') {
    return current;
  }
  if (next === 'failed') {
    return 'failed';
  }
  if (current === 'unknown' || current === 'running') {
    return next;
  }
  return current;
}

function closeRunningToolLifecycle(calls: Map<string, ObservabilityToolLifecycleState>) {
  for (const call of calls.values()) {
    if (call.status === 'running') {
      call.status = 'unknown';
    }
  }
}

function adjustToolStats(
  stats: AgentTranscriptToolStats,
  call: Pick<ObservabilityToolLifecycleState, 'kind' | 'status'>,
  delta: 1 | -1,
) {
  stats.total += delta;
  stats[call.status] += delta;
  stats.byStatus[call.status] += delta;
  const kindStats = stats.byKind[call.kind] || {
    total: 0,
    succeeded: 0,
    failed: 0,
    running: 0,
    unknown: 0,
  };
  kindStats.total += delta;
  kindStats[call.status] += delta;
  if (kindStats.total) {
    stats.byKind[call.kind] = kindStats;
  } else {
    delete stats.byKind[call.kind];
  }
}

function getPreferredToolKind(current: AgentTranscriptToolKind, next: AgentTranscriptToolKind) {
  return current === 'unknown' && next !== 'unknown' ? next : current;
}

function mergeToolLifecycle(
  current: ObservabilityToolLifecycle,
  transcriptToolCalls: AgentTranscriptToolCall[],
  events: ModelRecord[],
  closeDanglingToolCalls: boolean,
) {
  const pendingCalls = new Map<string, ObservabilityToolLifecycleState>();
  const recentTerminalCalls = new Map<string, ObservabilityToolLifecycleState>();
  const recentTerminalOrder: string[] = [];
  for (const call of current.calls) {
    if (isTerminalToolStatus(call.status)) {
      recentTerminalCalls.set(call.correlationKey, { ...call });
      recentTerminalOrder.push(call.correlationKey);
    } else {
      pendingCalls.set(call.correlationKey, { ...call });
    }
  }
  const terminalStatsJson = mergeToolStats(createEmptyToolStats(), current.terminalStatsJson);
  const rememberRecentTerminal = (call: ObservabilityToolLifecycleState) => {
    const existingIndex = recentTerminalOrder.indexOf(call.correlationKey);
    if (existingIndex >= 0) {
      recentTerminalOrder.splice(existingIndex, 1);
    }
    recentTerminalCalls.set(call.correlationKey, call);
    recentTerminalOrder.push(call.correlationKey);
    while (recentTerminalOrder.length > OBSERVABILITY_RECENT_TERMINAL_TOOL_CALL_LIMIT) {
      const evictedCorrelationKey = recentTerminalOrder.shift();
      if (evictedCorrelationKey) {
        recentTerminalCalls.delete(evictedCorrelationKey);
      }
    }
  };
  if (events.some((event) => getModelString(event, 'eventType') === 'agent.turn.completed')) {
    closeRunningToolLifecycle(pendingCalls);
  }
  for (const toolCall of transcriptToolCalls) {
    const correlationKey = getToolCorrelationKey(toolCall);
    const recentTerminalCall = recentTerminalCalls.get(correlationKey);
    if (recentTerminalCall) {
      const nextStatus = mergeToolStatus(recentTerminalCall.status, toolCall.status);
      const nextKind = getPreferredToolKind(recentTerminalCall.kind, toolCall.kind);
      if (nextStatus !== recentTerminalCall.status || nextKind !== recentTerminalCall.kind) {
        adjustToolStats(terminalStatsJson, recentTerminalCall, -1);
        recentTerminalCall.status = nextStatus;
        recentTerminalCall.kind = nextKind;
        adjustToolStats(terminalStatsJson, recentTerminalCall, 1);
      }
      rememberRecentTerminal(recentTerminalCall);
      continue;
    }
    const pendingCall = pendingCalls.get(correlationKey);
    const nextCall = {
      correlationKey,
      kind: pendingCall ? getPreferredToolKind(pendingCall.kind, toolCall.kind) : toolCall.kind,
      status: pendingCall ? mergeToolStatus(pendingCall.status, toolCall.status) : toolCall.status,
    } satisfies ObservabilityToolLifecycleState;
    if (isTerminalToolStatus(nextCall.status)) {
      pendingCalls.delete(correlationKey);
      adjustToolStats(terminalStatsJson, nextCall, 1);
      rememberRecentTerminal(nextCall);
    } else {
      pendingCalls.set(correlationKey, nextCall);
    }
  }
  if (closeDanglingToolCalls) {
    closeRunningToolLifecycle(pendingCalls);
  }
  return {
    calls: [
      ...[...pendingCalls.values()].sort((left, right) => left.correlationKey.localeCompare(right.correlationKey)),
      ...recentTerminalOrder.flatMap((correlationKey) => {
        const call = recentTerminalCalls.get(correlationKey);
        return call ? [call] : [];
      }),
    ],
    terminalStatsJson,
  } satisfies ObservabilityToolLifecycle;
}

function getToolLifecycleStats(calls: ObservabilityToolLifecycleState[]) {
  return getAgentTranscriptToolStats(
    calls.map((call) => ({
      id: call.correlationKey,
      kind: call.kind,
      status: call.status,
      title: '',
      eventIds: [],
    })),
  );
}

function getToolLifecycleAggregateStats(lifecycle: ObservabilityToolLifecycle) {
  const pendingStats = getToolLifecycleStats(lifecycle.calls.filter((call) => !isTerminalToolStatus(call.status)));
  return mergeToolStats(mergeToolStats(createEmptyToolStats(), lifecycle.terminalStatsJson), pendingStats);
}

function buildEventObservabilitySummary(events: ModelRecord[], closeDanglingToolCalls: boolean) {
  const transcript = buildAgentTranscript(events.map(toTranscriptEvent), {
    closeDanglingToolCalls: false,
  });
  const toolLifecycleJson = mergeToolLifecycle(
    {
      calls: [],
      terminalStatsJson: createEmptyToolStats(),
    },
    transcript.toolCalls,
    events,
    closeDanglingToolCalls,
  );
  return {
    tokenUsageJson: getEventTokenUsageSummary(events),
    toolStatsJson: getToolLifecycleAggregateStats(toolLifecycleJson),
    toolLifecycleJson,
  };
}

export function buildRunObservabilityRollup(
  run: ModelRecord,
  events: ModelRecord[],
  now: Date,
  options: { closeDanglingToolCalls?: boolean; resultSummaryJson?: unknown } = {},
): RunObservabilityRollup {
  const closeDanglingToolCalls = options.closeDanglingToolCalls ?? isTerminalRunStatus(getModelString(run, 'status'));
  const eventSummary = buildEventObservabilitySummary(events, closeDanglingToolCalls);
  const resultSummary = getResultSummaryTokenUsage(run, options);
  const fallbackWatermark = {
    createdAt: now.toISOString(),
    eventId: '',
  };
  return {
    version: OBSERVABILITY_ROLLUP_VERSION,
    rolledUpAt: now.toISOString(),
    sourceEventCount: events.length,
    tokenUsageJson: resultSummary || eventSummary.tokenUsageJson,
    toolCallCount: eventSummary.toolStatsJson.total,
    toolStatsJson: eventSummary.toolStatsJson,
    toolLifecycleJson: eventSummary.toolLifecycleJson,
    eventWatermarkJson: getLatestEventWatermark(events, fallbackWatermark),
  };
}

export function mergeRunObservabilityRollup(
  run: ModelRecord,
  events: ModelRecord[],
  now: Date,
  options: {
    externalImportBatchId?: string;
    closeDanglingToolCalls?: boolean;
    resultSummaryJson?: unknown;
  } = {},
) {
  const current = getRunObservabilityRollup(run);
  if (!current) {
    return null;
  }
  const closeDanglingToolCalls = options.closeDanglingToolCalls ?? isTerminalRunStatus(getModelString(run, 'status'));
  const transcript = buildAgentTranscript(events.map(toTranscriptEvent), {
    closeDanglingToolCalls: false,
  });
  const toolLifecycleJson = current.toolLifecycleJson
    ? mergeToolLifecycle(current.toolLifecycleJson, transcript.toolCalls, events, closeDanglingToolCalls)
    : null;
  const eventSummary = buildEventObservabilitySummary(events, closeDanglingToolCalls);
  const toolStatsJson = toolLifecycleJson
    ? getToolLifecycleAggregateStats(toolLifecycleJson)
    : mergeToolStats(mergeToolStats(createEmptyToolStats(), current.toolStatsJson), eventSummary.toolStatsJson);
  const resultSummary = getResultSummaryTokenUsage(run, options);
  return {
    version: OBSERVABILITY_ROLLUP_VERSION,
    rolledUpAt: now.toISOString(),
    sourceEventCount: current.sourceEventCount + events.length,
    tokenUsageJson: resultSummary || mergeTokenUsageSummaries(current.tokenUsageJson, eventSummary.tokenUsageJson),
    toolCallCount: toolStatsJson.total,
    toolStatsJson,
    ...(toolLifecycleJson
      ? {
          toolLifecycleJson,
        }
      : {}),
    eventWatermarkJson: getLatestEventWatermark(events, current.eventWatermarkJson, options.externalImportBatchId),
  } satisfies RunObservabilityRollup;
}

export function createEmptyToolStats() {
  return getAgentTranscriptToolStats([]);
}

export function mergeToolStats(target: AgentTranscriptToolStats, next: AgentTranscriptToolStats) {
  target.total += next.total;
  target.succeeded += next.succeeded;
  target.failed += next.failed;
  target.running += next.running;
  target.unknown += next.unknown;
  for (const status of ['running', 'succeeded', 'failed', 'unknown'] as const) {
    target.byStatus[status] += next.byStatus[status];
  }
  for (const kind of Object.keys(next.byKind) as AgentTranscriptToolKind[]) {
    const nextKindStats = next.byKind[kind];
    if (!nextKindStats) {
      continue;
    }
    const currentKindStats = target.byKind[kind] || {
      total: 0,
      succeeded: 0,
      failed: 0,
      running: 0,
      unknown: 0,
    };
    currentKindStats.total += nextKindStats.total;
    currentKindStats.succeeded += nextKindStats.succeeded;
    currentKindStats.failed += nextKindStats.failed;
    currentKindStats.running += nextKindStats.running;
    currentKindStats.unknown += nextKindStats.unknown;
    target.byKind[kind] = currentKindStats;
  }
  return target;
}
