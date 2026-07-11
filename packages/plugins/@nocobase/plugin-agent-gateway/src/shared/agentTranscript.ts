/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type AgentTranscriptJsonRecord = Record<string, unknown>;

export interface AgentTranscriptEvent {
  id: string;
  runId?: string;
  ingestId?: number | string;
  sequence?: number;
  eventType?: string;
  source?: string;
  providerEventId?: string | null;
  correlationId?: string | null;
  confidence?: number | null;
  level?: string;
  contentText?: string | null;
  contentJson?: AgentTranscriptJsonRecord;
  createdAt?: string;
  emittedAt?: string;
  message?: string | null;
  payloadJson?: AgentTranscriptJsonRecord;
}

export type AgentTranscriptParticipantType = 'user' | 'root-agent' | 'sub-agent' | 'tool' | 'system' | 'unknown';
export type AgentTranscriptMessageRole = 'user' | 'agent' | 'system';
export type AgentTranscriptToolKind = 'exec' | 'run' | 'terminal' | 'wait' | 'apply_patch' | 'tool' | 'unknown';
export type AgentTranscriptToolStatus = 'running' | 'succeeded' | 'failed' | 'unknown';

export interface AgentTranscriptParticipant {
  id: string;
  type: AgentTranscriptParticipantType;
  name: string;
  parentId?: string;
  provider?: string;
  confidence?: number | null;
  sources: string[];
  eventIds: string[];
}

interface AgentTranscriptParticipantSeed {
  id?: string;
  type: AgentTranscriptParticipantType;
  name?: string;
  parentId?: string;
  provider?: string;
  confidence?: number | null;
}

export interface AgentTranscriptToolCall {
  id: string;
  kind: AgentTranscriptToolKind;
  title: string;
  status: AgentTranscriptToolStatus;
  command?: string;
  input?: string;
  output?: string;
  details?: string;
  durationText?: string;
  durationMs?: number;
  exitCode?: number;
  source?: string;
  startedAt?: string;
  finishedAt?: string;
  eventIds: string[];
}

export interface AgentTranscriptTextPart {
  id: string;
  type: 'text';
  text: string;
  kind?: 'text' | 'reasoning' | 'progress' | 'raw';
}

export interface AgentTranscriptToolCallsPart {
  id: string;
  type: 'tool-calls';
  toolCalls: AgentTranscriptToolCall[];
}

export type AgentTranscriptMessagePart = AgentTranscriptTextPart | AgentTranscriptToolCallsPart;

export interface AgentTranscriptMessage {
  id: string;
  role: AgentTranscriptMessageRole;
  participantId: string;
  participant: AgentTranscriptParticipant;
  text: string;
  parts: AgentTranscriptMessagePart[];
  createdAt?: string;
  updatedAt?: string;
  eventIds: string[];
  sources: string[];
  toolCalls: AgentTranscriptToolCall[];
}

export interface AgentTranscriptToolKindStats {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  unknown: number;
}

export interface AgentTranscriptToolStats {
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  unknown: number;
  byKind: Partial<Record<AgentTranscriptToolKind, AgentTranscriptToolKindStats>>;
  byStatus: Record<AgentTranscriptToolStatus, number>;
}

export interface AgentTranscript {
  participants: AgentTranscriptParticipant[];
  messages: AgentTranscriptMessage[];
  toolCalls: AgentTranscriptToolCall[];
  stats: AgentTranscriptToolStats;
}

export interface AgentTranscriptBuildOptions {
  closeDanglingToolCalls?: boolean;
}

interface MutableTranscriptMessage {
  id: string;
  role: AgentTranscriptMessageRole;
  participantId: string;
  participant: AgentTranscriptParticipant;
  textParts: string[];
  parts: AgentTranscriptMessagePart[];
  createdAt?: string;
  updatedAt?: string;
  eventIds: string[];
  sources: string[];
  toolCalls: AgentTranscriptToolCall[];
}

interface ToolHeaderMatch {
  kind: AgentTranscriptToolKind;
  title: string;
}

interface MutableTerminalToolBlock {
  kind: AgentTranscriptToolKind;
  title: string;
  lines: string[];
  status: AgentTranscriptToolStatus;
  command?: string;
  durationText?: string;
  durationMs?: number;
  exitCode?: number;
  sawBlankLine: boolean;
}

interface MutableTerminalMessageSegment {
  participant: AgentTranscriptParticipantSeed;
  textParts: string[];
  parts: AgentTranscriptMessagePart[];
  toolCalls: AgentTranscriptToolCall[];
  eventIds: string[];
  sources: string[];
  startedAt?: string;
  finishedAt?: string;
}

interface CollabAgentState {
  threadId: string;
  status?: string;
  message?: string | null;
}

const ANSI_PATTERN =
  // eslint-disable-next-line no-control-regex
  /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const TOOL_COMMAND_START_PATTERN =
  /^\s*(?:\$|\/|(?:yarn|npm|pnpm|node|python|python3|bash|sh|git|rg|sed|cat|find|curl|nb|npx|tsx|docker|tmux)\b)/i;
const CODEX_PREAMBLE_LINE_PATTERN =
  /^(?:OpenAI Codex\b|-{3,}|(?:workdir|model|provider|approval|sandbox|reasoning effort|reasoning summaries|session id):)/i;
const ROOT_AGENT_PARTICIPANT_ID = 'agent:root';
const USER_PARTICIPANT_ID = 'user:requester';
const TERMINAL_PARTICIPANT_ID = 'system:terminal';
const AGENT_TEXT_EVENT_TYPES = new Set(['agent.message', 'agent.reasoning', 'agent.progress', 'agent.raw']);
const HARNESS_PROGRESS_MARKER_LINE_PATTERN = /^AGW_PROGRESS(?:\s|$)/;
const HARNESS_PROGRESS_MARKER_REFERENCE_PATTERN = /`?AGW_PROGRESS`?/g;
const HARNESS_PROGRESS_TASK_INSTRUCTION_LINE_PATTERN =
  /^-\s*Emit progress lines when possible as:\s*AGW_PROGRESS(?:\s|$)/i;
const LOW_SIGNAL_PROVIDER_LIFECYCLE_LABELS = new Set([
  'item complete',
  'item completed',
  'item start',
  'item started',
  'item update',
  'item updated',
  'response item',
  'step start',
  'step started',
  'step finish',
  'step finished',
]);
const RESERVED_SPEAKER_NAMES = new Set([
  'agent',
  'assistant',
  'codex',
  'collab',
  'command',
  'error',
  'exec',
  'info',
  'instruction',
  'note',
  'notes',
  'output',
  'progress',
  'requirements',
  'result',
  'results',
  'status',
  'stderr',
  'stdout',
  'summary',
  'system',
  'terminal',
  'tool',
  'tools',
  'user',
  'warning',
  'you',
]);

function isRecord(value: unknown): value is AgentTranscriptJsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRecord(value: unknown): AgentTranscriptJsonRecord {
  return isRecord(value) ? value : {};
}

function getNestedRecord(record: AgentTranscriptJsonRecord, key: string) {
  return getRecord(record[key]);
}

function getNestedValue(record: AgentTranscriptJsonRecord, path: readonly string[]) {
  let current: unknown = record;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function getRecordArray(value: unknown) {
  return Array.isArray(value) ? value.map(getRecord).filter((record) => Object.keys(record).length) : [];
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(getString).filter(Boolean) : [];
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return undefined;
  }
  return Number(trimmed);
}

function getInteger(value: unknown) {
  const numberValue = getNumber(value);
  return typeof numberValue === 'number' && Number.isInteger(numberValue) ? numberValue : undefined;
}

function getEventText(event: AgentTranscriptEvent) {
  return event.contentText || event.message || '';
}

function isHarnessProgressDisplayNoiseLine(line: string) {
  const trimmed = line.trim();
  return (
    HARNESS_PROGRESS_MARKER_LINE_PATTERN.test(trimmed) || HARNESS_PROGRESS_TASK_INSTRUCTION_LINE_PATTERN.test(trimmed)
  );
}

function sanitizeTranscriptDisplayText(text: string) {
  if (!text) {
    return '';
  }
  const lines = text.split(/\r?\n/);
  if (!lines.some(isHarnessProgressDisplayNoiseLine)) {
    return text.replace(HARNESS_PROGRESS_MARKER_REFERENCE_PATTERN, 'progress marker');
  }
  return lines
    .filter((line) => !isHarnessProgressDisplayNoiseLine(line))
    .join('\n')
    .replace(HARNESS_PROGRESS_MARKER_REFERENCE_PATTERN, 'progress marker');
}

function sanitizeTranscriptDisplayValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeTranscriptDisplayText(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeTranscriptDisplayValue);
  }
  if (!isRecord(value)) {
    return value;
  }
  const record: AgentTranscriptJsonRecord = {};
  for (const [key, entryValue] of Object.entries(value)) {
    record[key] = sanitizeTranscriptDisplayValue(entryValue);
  }
  return record;
}

function stringifyJson(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  const displayValue = sanitizeTranscriptDisplayValue(value);
  if (displayValue === '') {
    return '';
  }
  try {
    return JSON.stringify(displayValue, null, 2);
  } catch {
    return sanitizeTranscriptDisplayText(String(value));
  }
}

function isEmptyRawAgentMessage(value: unknown) {
  const rawEvent = getRecord(value);
  return isRawProviderAgentMessage(rawEvent) && !getRawProviderAgentMessageText(rawEvent);
}

function getRawProviderEvent(contentJson: AgentTranscriptJsonRecord) {
  return getRecord(contentJson.rawProviderEvent);
}

function getRawProviderEventItem(rawProviderEvent: AgentTranscriptJsonRecord) {
  return getRecord(rawProviderEvent.item || rawProviderEvent.payload);
}

function getRawProviderItemType(rawProviderEvent: AgentTranscriptJsonRecord) {
  return getString(getRawProviderEventItem(rawProviderEvent).type || rawProviderEvent.itemType).toLowerCase();
}

function isRawProviderAgentMessage(rawProviderEvent: AgentTranscriptJsonRecord) {
  return (
    getString(rawProviderEvent.type) === 'item.completed' &&
    getRawProviderItemType(rawProviderEvent) === 'agent_message'
  );
}

function isRawProviderAgentMessageEvent(event: AgentTranscriptEvent) {
  return isRawProviderAgentMessage(getRawProviderEvent(getEventJson(event)));
}

function normalizeProviderLifecycleLabel(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function isProviderLifecycleLabel(text: string) {
  return LOW_SIGNAL_PROVIDER_LIFECYCLE_LABELS.has(normalizeProviderLifecycleLabel(text));
}

function getRawProviderDirectText(rawProviderEvent: AgentTranscriptJsonRecord) {
  const item = getRawProviderEventItem(rawProviderEvent);
  return (
    getString(item.message) ||
    getString(item.text) ||
    getString(item.content) ||
    getString(item.summary) ||
    getString(rawProviderEvent.message) ||
    getString(rawProviderEvent.text) ||
    getString(rawProviderEvent.content) ||
    getString(rawProviderEvent.summary)
  );
}

function getRawProviderAgentMessageText(rawProviderEvent: AgentTranscriptJsonRecord) {
  return sanitizeTranscriptDisplayText(getRawProviderDirectText(rawProviderEvent));
}

function isRawProviderErrorEvent(event: AgentTranscriptEvent, rawProviderEvent: AgentTranscriptJsonRecord) {
  const itemType = getRawProviderItemType(rawProviderEvent);
  return itemType === 'error' || event.level === 'error';
}

function isLowSignalProviderLifecycleEvent(event: AgentTranscriptEvent, text: string) {
  const contentJson = getEventJson(event);
  const rawProviderEvent = getRawProviderEvent(contentJson);
  const providerEventType = getString(rawProviderEvent.type || contentJson.providerEventType).toLowerCase();
  const itemType = getRawProviderItemType(rawProviderEvent) || getString(contentJson.itemType).toLowerCase();
  if (!providerEventType && !itemType) {
    return false;
  }
  if (isRawProviderErrorEvent(event, rawProviderEvent)) {
    return false;
  }
  const rawProviderText = getRawProviderDirectText(rawProviderEvent);
  if (rawProviderText && !isProviderLifecycleLabel(rawProviderText)) {
    return false;
  }
  if (isProviderLifecycleLabel(text)) {
    return true;
  }
  return providerEventType.startsWith('item.') && !rawProviderText;
}

function getAgentTextEventText(event: AgentTranscriptEvent) {
  const text = sanitizeTranscriptDisplayText(getEventText(event));
  const contentJson = getEventJson(event);
  const rawProviderEvent = getRawProviderEvent(contentJson);
  const rawProviderContent = Object.keys(rawProviderEvent).length
    ? rawProviderEvent
    : contentJson.rawLine || contentJson;
  const rawProviderText = sanitizeTranscriptDisplayText(getRawProviderDirectText(rawProviderEvent));
  if (isRawProviderAgentMessage(rawProviderEvent)) {
    return rawProviderText;
  }
  if (text && isProviderLifecycleLabel(text) && rawProviderText && !isProviderLifecycleLabel(rawProviderText)) {
    return rawProviderText;
  }
  if (isLowSignalProviderLifecycleEvent(event, text)) {
    return '';
  }
  if (event.eventType === 'agent.raw') {
    const rawContent = rawProviderContent;
    return isEmptyRawAgentMessage(rawContent) ? '' : stringifyJson(rawContent) || text;
  }
  if (text) {
    return text;
  }
  return stringifyJson(rawProviderContent);
}

function getAgentTextPartKind(eventType: string | undefined): AgentTranscriptTextPart['kind'] {
  if (eventType === 'agent.reasoning') {
    return 'reasoning';
  }
  if (eventType === 'agent.progress') {
    return 'progress';
  }
  if (eventType === 'agent.raw') {
    return 'raw';
  }
  return 'text';
}

function getEventJson(event: AgentTranscriptEvent) {
  return event.contentJson || event.payloadJson || {};
}

function getEventTime(event: AgentTranscriptEvent) {
  return event.createdAt || event.emittedAt;
}

function compareIngestIds(first: number | string, second: number | string) {
  const firstValue = String(first).replace(/^0+(?=\d)/, '');
  const secondValue = String(second).replace(/^0+(?=\d)/, '');
  if (!/^\d+$/.test(firstValue) || !/^\d+$/.test(secondValue) || firstValue === secondValue) {
    return 0;
  }
  return firstValue.length - secondValue.length || firstValue.localeCompare(secondValue);
}

function compareEvents(first: AgentTranscriptEvent, second: AgentTranscriptEvent) {
  const sameRun = !first.runId || !second.runId || first.runId === second.runId;
  if (sameRun && first.ingestId !== undefined && second.ingestId !== undefined) {
    const ingestDifference = compareIngestIds(first.ingestId, second.ingestId);
    if (ingestDifference) {
      return ingestDifference;
    }
  }
  const sameSource = first.source === second.source;
  if (
    sameRun &&
    sameSource &&
    typeof first.sequence === 'number' &&
    typeof second.sequence === 'number' &&
    first.sequence !== second.sequence
  ) {
    return first.sequence - second.sequence;
  }
  const firstTime = getEventTime(first);
  const secondTime = getEventTime(second);
  if ((!sameRun || sameSource) && firstTime && secondTime && firstTime !== secondTime) {
    return firstTime.localeCompare(secondTime);
  }
  return 0;
}

function uniqueAppend(values: string[], value?: string) {
  if (value && !values.includes(value)) {
    values.push(value);
  }
}

function getParticipantType(value: unknown): AgentTranscriptParticipantType | undefined {
  const type = getString(value).toLowerCase();
  if (type === 'user' || type === 'root-agent' || type === 'sub-agent' || type === 'tool' || type === 'system') {
    return type;
  }
  if (type === 'agent' || type === 'assistant' || type === 'root_agent' || type === 'rootagent') {
    return 'root-agent';
  }
  if (
    type === 'subagent' ||
    type === 'sub_agent' ||
    type === 'child-agent' ||
    type === 'child_agent' ||
    type === 'childagent'
  ) {
    return 'sub-agent';
  }
  return undefined;
}

function slugParticipantId(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'unknown';
}

function getDefaultParticipantName(type: AgentTranscriptParticipantType) {
  if (type === 'user') {
    return 'You';
  }
  if (type === 'root-agent') {
    return 'Agent';
  }
  if (type === 'sub-agent') {
    return 'Sub-agent';
  }
  if (type === 'tool') {
    return 'Tool';
  }
  if (type === 'system') {
    return 'System';
  }
  return 'Unknown';
}

function normalizeParticipantSeed(seed: AgentTranscriptParticipantSeed): AgentTranscriptParticipantSeed {
  const type = seed.type || 'unknown';
  const name = getString(seed.name) || getDefaultParticipantName(type);
  const id =
    getString(seed.id) ||
    (type === 'user'
      ? USER_PARTICIPANT_ID
      : type === 'root-agent'
        ? ROOT_AGENT_PARTICIPANT_ID
        : type === 'system' && name === 'Terminal'
          ? TERMINAL_PARTICIPANT_ID
          : `${type}:${slugParticipantId(name)}`);
  return {
    ...seed,
    id,
    type,
    name,
  };
}

function participantSeedFromRecord(value: AgentTranscriptJsonRecord): AgentTranscriptParticipantSeed | null {
  const type =
    getParticipantType(value.type) ||
    getParticipantType(value.kind) ||
    (getString(value.parentId) ? 'sub-agent' : undefined);
  const name =
    getString(value.name) ||
    getString(value.displayName) ||
    getString(value.label) ||
    getString(value.agentName) ||
    getString(value.subAgentName);
  const id = getString(value.id) || getString(value.participantId) || getString(value.agentId);
  if (!type && !name && !id) {
    return null;
  }
  return normalizeParticipantSeed({
    id,
    type: type || 'unknown',
    name,
    parentId: getString(value.parentId) || getString(value.parentParticipantId) || undefined,
    provider: getString(value.provider) || undefined,
    confidence: getNumber(value.confidence) ?? null,
  });
}

function getEventParticipantSeed(
  event: AgentTranscriptEvent,
  defaultSeed: AgentTranscriptParticipantSeed,
): AgentTranscriptParticipantSeed {
  const contentJson = getEventJson(event);
  const participant =
    participantSeedFromRecord(getNestedRecord(contentJson, 'participant')) ||
    participantSeedFromRecord({
      id: contentJson.participantId,
      type: contentJson.participantType,
      name: contentJson.participantName,
      parentId: contentJson.parentParticipantId,
      provider: contentJson.provider,
      confidence: contentJson.participantConfidence,
    }) ||
    participantSeedFromRecord(getNestedRecord(contentJson, 'agent')) ||
    participantSeedFromRecord(getNestedRecord(contentJson, 'subAgent'));
  return normalizeParticipantSeed(participant || defaultSeed);
}

function getUserParticipantSeed(event: AgentTranscriptEvent) {
  return getEventParticipantSeed(event, {
    id: USER_PARTICIPANT_ID,
    type: 'user',
    name: 'You',
    provider: event.source,
    confidence: event.confidence,
  });
}

function getRootAgentParticipantSeed(event: AgentTranscriptEvent) {
  return getEventParticipantSeed(event, {
    id: ROOT_AGENT_PARTICIPANT_ID,
    type: 'root-agent',
    name: 'Agent',
    provider: event.source,
    confidence: event.confidence,
  });
}

function getTerminalParticipantSeed() {
  return normalizeParticipantSeed({
    id: TERMINAL_PARTICIPANT_ID,
    type: 'system',
    name: 'Terminal',
  });
}

function getMessageRole(participantType: AgentTranscriptParticipantType): AgentTranscriptMessageRole {
  if (participantType === 'user') {
    return 'user';
  }
  if (participantType === 'system' || participantType === 'tool') {
    return 'system';
  }
  return 'agent';
}

function trimTextBlock(text: string) {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function stripTerminalControlSequences(text: string) {
  return text.replace(ANSI_PATTERN, '').replace(/\r(?!\n)/g, '\n');
}

function getStatusFromText(text: string): AgentTranscriptToolStatus | undefined {
  if (/\b(failed|error|errored|exit(?:ed)?\s+(?:with\s+)?(?:code\s+)?[1-9]\d*)\b/i.test(text)) {
    return 'failed';
  }
  if (/\b(succeeded|success|completed|done|passed)\b/i.test(text)) {
    return 'succeeded';
  }
  if (/\b(running|started|waiting|queued)\b/i.test(text)) {
    return 'running';
  }
  return undefined;
}

function mergeStatus(
  current: AgentTranscriptToolStatus,
  next: AgentTranscriptToolStatus | undefined,
): AgentTranscriptToolStatus {
  if (!next) {
    return current;
  }
  if (next === 'failed') {
    return 'failed';
  }
  if (current === 'failed') {
    return current;
  }
  if (next === 'succeeded') {
    return 'succeeded';
  }
  if (current === 'succeeded') {
    return current;
  }
  if (next === 'running') {
    return 'running';
  }
  return current;
}

function parseDurationMs(durationText: string) {
  const match = durationText.match(/(\d+(?:\.\d+)?)\s*(ms|s|sec|secs|second|seconds|m|min|mins|minute|minutes)\b/i);
  if (!match) {
    return undefined;
  }
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(value)) {
    return undefined;
  }
  if (unit === 'ms') {
    return Math.round(value);
  }
  if (unit.startsWith('s')) {
    return Math.round(value * 1000);
  }
  return Math.round(value * 60 * 1000);
}

function getDurationText(line: string) {
  const match = line.match(
    /\b(?:in|after|for)\s+(\d+(?:\.\d+)?\s*(?:ms|s|sec|secs|second|seconds|m|min|mins|minute|minutes))\b/i,
  );
  return match?.[1];
}

function getExitCode(line: string) {
  const match = line.match(/\b(?:exit(?:ed)?\s+(?:with\s+)?(?:code\s+)?|exitCode[=:]\s*)(-?\d+)\b/i);
  return match ? Number(match[1]) : undefined;
}

function truncateInline(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function detectToolHeader(line: string): ToolHeaderMatch | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  const withoutBullet = trimmed.replace(/^(?:[•●▪*-]\s*)+/, '');
  const lower = withoutBullet.toLowerCase();
  if (/^(?:waited for background|waiting for background)\b/.test(lower)) {
    return {
      kind: 'wait',
      title: truncateInline(withoutBullet),
    };
  }
  if (/^(?:terminal|terminal output|live cli output)\b/.test(lower)) {
    return {
      kind: 'terminal',
      title: truncateInline(withoutBullet),
    };
  }
  if (/^(?:exec|exec_command|command|ran|running command)\b/.test(lower) || /^\$\s+/.test(withoutBullet)) {
    return {
      kind: 'exec',
      title: truncateInline(withoutBullet.replace(/^\$\s+/, '')),
    };
  }
  if (
    /^(?:run|running)$/.test(lower) ||
    /^(?:run|running)\s+(?:command|tool|shell|script|test|task)\b/.test(lower) ||
    /^(?:run|running)\s+(?:yarn|npm|pnpm|node|python|python3|bash|sh|git|rg|sed|cat|find|curl|nb|npx|tsx|docker|tmux)\b/.test(
      lower,
    )
  ) {
    return {
      kind: 'run',
      title: truncateInline(withoutBullet),
    };
  }
  if (/^(?:apply_patch|patch)\b/.test(lower)) {
    return {
      kind: 'apply_patch',
      title: truncateInline(withoutBullet),
    };
  }
  if (
    /^(?:tool|tool call|tool calls)\s*:?\s*$/.test(lower) ||
    /^(?:write_stdin|view_image|read_mcp_resource|open|click|find|screenshot)\s*(?:$|[:(])/.test(lower)
  ) {
    return {
      kind: 'tool',
      title: truncateInline(withoutBullet),
    };
  }
  return null;
}

function looksLikeToolCommand(line: string) {
  return TOOL_COMMAND_START_PATTERN.test(line.trim());
}

function looksLikeAssistantNarration(line: string) {
  const trimmed = line.trim();
  if (
    !trimmed ||
    looksLikeToolCommand(trimmed) ||
    /^(?:succeeded|failed|completed|running|started|waiting|queued)\b/i.test(trimmed)
  ) {
    return false;
  }
  return true;
}

function isAssistantActivityStart(line: string) {
  const trimmed = line.trim();
  return (
    /^\*\*.+\*\*$/.test(trimmed) ||
    /^(?:thinking|considering|inspecting|checking|planning|running|executing)\b/i.test(trimmed)
  );
}

function stripCodexTerminalPreamble(text: string) {
  const lines = text.split(/\r?\n/);
  const keptLines: string[] = [];
  let skippingUserEcho = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && !skippingUserEcho) {
      keptLines.push(line);
      continue;
    }
    if (skippingUserEcho) {
      if (isAssistantActivityStart(trimmed)) {
        skippingUserEcho = false;
        keptLines.push(line);
      }
      if (
        /^Read and follow the relevant SKILL\.md\b/i.test(trimmed) ||
        /^deprecated:/i.test(trimmed) ||
        /^Enable it with\b/i.test(trimmed)
      ) {
        skippingUserEcho = false;
      }
      continue;
    }
    if (CODEX_PREAMBLE_LINE_PATTERN.test(trimmed)) {
      continue;
    }
    if (trimmed === 'user') {
      skippingUserEcho = true;
      continue;
    }
    if (/^deprecated:/i.test(trimmed) || /^Enable it with\b/i.test(trimmed)) {
      continue;
    }
    keptLines.push(line);
  }
  return keptLines.join('\n');
}

function isCodexJsonTerminalOutput(text: string) {
  const lines = stripTerminalControlSequences(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^Reading additional input from stdin/i.test(line))
    .filter((line) => !/^\[agent-gateway\] process exited with code \d+\b/i.test(line));
  if (!lines.length) {
    return true;
  }
  let jsonLineCount = 0;
  for (const line of lines) {
    if (!line.startsWith('{') || !line.endsWith('}')) {
      return false;
    }
    try {
      const parsed = JSON.parse(line) as unknown;
      if (!isRecord(parsed) || !getString(parsed.type)) {
        return false;
      }
      jsonLineCount += 1;
    } catch {
      if (!/"type"\s*:/.test(line)) {
        return false;
      }
      jsonLineCount += 1;
    }
  }
  return jsonLineCount > 0;
}

function extractCommandFromLine(line: string) {
  const trimmed = line.trim();
  const backtickMatch = trimmed.match(/`([^`]+)`/);
  if (backtickMatch) {
    return backtickMatch[1].trim();
  }
  if (/^\$\s+/.test(trimmed)) {
    return trimmed.replace(/^\$\s+/, '').trim();
  }
  if (/^(?:write_stdin|view_image|read_mcp_resource|open|click|find|screenshot)\s*\(/i.test(trimmed)) {
    return trimmed;
  }
  if (looksLikeToolCommand(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function buildTerminalToolCall(
  block: MutableTerminalToolBlock,
  index: number,
  eventIds: string[],
  source: string | undefined,
  startedAt: string | undefined,
  finishedAt: string | undefined,
): AgentTranscriptToolCall {
  const displayLinesText = sanitizeTranscriptDisplayText(block.lines.join('\n'));
  const displayLines = displayLinesText.split(/\r?\n/);
  const output = trimTextBlock(displayLinesText);
  const command =
    block.command || displayLines.map(extractCommandFromLine).find((value): value is string => Boolean(value));
  return {
    id: `terminal-tool-${eventIds[0] || 'event'}-${index}`,
    kind: block.kind,
    title: block.title || command || block.kind,
    status: block.status,
    command,
    output: output || undefined,
    durationText: block.durationText,
    durationMs: block.durationMs,
    exitCode: block.exitCode,
    source,
    startedAt,
    finishedAt,
    eventIds,
  };
}

function buildInlineTerminalToolCall(options: {
  id: string;
  title: string;
  kind?: AgentTranscriptToolKind;
  source?: string;
  eventIds: string[];
  startedAt?: string;
  finishedAt?: string;
}): AgentTranscriptToolCall {
  return {
    id: options.id,
    kind: options.kind || 'tool',
    title: options.title,
    status: 'unknown',
    command: options.title,
    source: options.source,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
    eventIds: options.eventIds,
  };
}

function detectInlineTerminalToolCall(line: string) {
  const match = line.trim().match(/^collab:\s*(.+)$/i);
  if (!match) {
    return null;
  }
  const title = truncateInline(match[1]);
  return {
    kind: /^wait\b/i.test(title) ? ('wait' as const) : ('tool' as const),
    title,
  };
}

function detectSubAgentSpeakerLine(line: string): { name: string; text: string } | null {
  const match = line.trim().match(/^([\p{L}\p{N}][\p{L}\p{N} ._-]{1,60}):\s+(.+)$/u);
  if (!match) {
    return null;
  }
  const name = match[1].trim();
  const normalizedName = name.toLowerCase().replace(/\s+/g, ' ');
  if (RESERVED_SPEAKER_NAMES.has(normalizedName)) {
    return null;
  }
  const text = match[2].trim();
  return text ? { name, text } : null;
}

function updateToolBlockFromLine(block: MutableTerminalToolBlock, line: string) {
  block.status = mergeStatus(block.status, getStatusFromText(line));
  const durationText = getDurationText(line);
  if (durationText) {
    block.durationText = durationText;
    block.durationMs = parseDurationMs(durationText);
  }
  const exitCode = getExitCode(line);
  if (typeof exitCode === 'number') {
    block.exitCode = exitCode;
    if (exitCode !== 0) {
      block.status = 'failed';
    }
  }
  if (!block.command) {
    block.command = extractCommandFromLine(line);
  }
}

function createTerminalRootSegment(options: {
  eventIds: string[];
  sources: string[];
  startedAt?: string;
  finishedAt?: string;
}): MutableTerminalMessageSegment {
  return {
    participant: {
      id: ROOT_AGENT_PARTICIPANT_ID,
      type: 'root-agent',
      name: 'Agent',
      provider: options.sources.includes('terminal-live') ? 'terminal-live' : options.sources[0],
    },
    textParts: [],
    parts: [],
    toolCalls: [],
    eventIds: options.eventIds,
    sources: options.sources,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
  };
}

function createSubAgentSegment(options: {
  name: string;
  text: string;
  eventIds: string[];
  sources: string[];
  startedAt?: string;
  finishedAt?: string;
}): MutableTerminalMessageSegment {
  const participant = normalizeParticipantSeed({
    type: 'sub-agent',
    name: options.name,
    parentId: ROOT_AGENT_PARTICIPANT_ID,
    provider: options.sources.includes('terminal-live') ? 'terminal-live' : options.sources[0],
    confidence: 0.6,
  });
  return {
    participant,
    textParts: [options.text],
    parts: [
      {
        id: `terminal-sub-agent-text-${options.eventIds[0] || 'event'}-${slugParticipantId(options.name)}`,
        type: 'text',
        text: options.text,
      },
    ],
    toolCalls: [],
    eventIds: options.eventIds,
    sources: options.sources,
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
  };
}

function finalizeTerminalSegment(segment: MutableTerminalMessageSegment) {
  const text = trimTextBlock(segment.textParts.join('\n\n'));
  if (!text && !segment.toolCalls.length) {
    return null;
  }
  return {
    participant: normalizeParticipantSeed(segment.participant),
    text,
    parts: segment.parts,
    toolCalls: segment.toolCalls,
    eventIds: segment.eventIds,
    sources: segment.sources,
    startedAt: segment.startedAt,
    finishedAt: segment.finishedAt,
  };
}

function parseTerminalText(options: {
  text: string;
  eventIds: string[];
  source?: string;
  startedAt?: string;
  finishedAt?: string;
}) {
  const displayText = sanitizeTranscriptDisplayText(stripTerminalControlSequences(options.text));
  if (!displayText.trim() || isCodexJsonTerminalOutput(displayText)) {
    return {
      text: '',
      parts: [],
      toolCalls: [],
      segments: [],
    };
  }

  const segments: Array<
    ReturnType<typeof finalizeTerminalSegment> extends infer Segment ? NonNullable<Segment> : never
  > = [];
  let rootSegment = createTerminalRootSegment({
    eventIds: options.eventIds,
    sources: [options.source].filter(Boolean) as string[],
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
  });
  let pendingTextLines: string[] = [];
  let currentTool: MutableTerminalToolBlock | null = null;

  const getPartId = (type: string) => `${type}-${options.eventIds[0] || 'event'}-${rootSegment.parts.length + 1}`;

  const flushText = () => {
    const text = trimTextBlock(pendingTextLines.join('\n'));
    pendingTextLines = [];
    if (!text) {
      return;
    }
    rootSegment.textParts.push(text);
    rootSegment.parts.push({
      id: getPartId('terminal-text'),
      type: 'text',
      text,
    });
  };

  const appendToolCallPart = (toolCall: AgentTranscriptToolCall) => {
    rootSegment.toolCalls.push(toolCall);
    const lastPart = rootSegment.parts[rootSegment.parts.length - 1];
    if (lastPart?.type === 'tool-calls') {
      lastPart.toolCalls.push(toolCall);
      return;
    }
    rootSegment.parts.push({
      id: getPartId('terminal-tool-calls'),
      type: 'tool-calls',
      toolCalls: [toolCall],
    });
  };

  const flushTool = () => {
    if (!currentTool) {
      return;
    }
    const toolCall = buildTerminalToolCall(
      currentTool,
      rootSegment.toolCalls.length + 1,
      options.eventIds,
      options.source,
      options.startedAt,
      options.finishedAt,
    );
    appendToolCallPart(toolCall);
    currentTool = null;
  };

  const flushRootSegment = () => {
    const segment = finalizeTerminalSegment(rootSegment);
    if (segment) {
      segments.push(segment);
    }
    rootSegment = createTerminalRootSegment({
      eventIds: options.eventIds,
      sources: [options.source].filter(Boolean) as string[],
      startedAt: options.startedAt,
      finishedAt: options.finishedAt,
    });
  };

  const lines = stripCodexTerminalPreamble(displayText).split(/\r?\n/);
  for (const line of lines) {
    if (!currentTool) {
      const inlineToolCall = detectInlineTerminalToolCall(line);
      if (inlineToolCall) {
        flushText();
        appendToolCallPart(
          buildInlineTerminalToolCall({
            id: `terminal-inline-tool-${options.eventIds[0] || 'event'}-${rootSegment.toolCalls.length + 1}`,
            kind: inlineToolCall.kind,
            title: inlineToolCall.title,
            source: options.source,
            eventIds: options.eventIds,
            startedAt: options.startedAt,
            finishedAt: options.finishedAt,
          }),
        );
        continue;
      }

      const subAgentLine = detectSubAgentSpeakerLine(line);
      if (subAgentLine) {
        flushText();
        flushRootSegment();
        const subAgentSegment = finalizeTerminalSegment(
          createSubAgentSegment({
            name: subAgentLine.name,
            text: subAgentLine.text,
            eventIds: options.eventIds,
            sources: [options.source].filter(Boolean) as string[],
            startedAt: options.startedAt,
            finishedAt: options.finishedAt,
          }),
        );
        if (subAgentSegment) {
          segments.push(subAgentSegment);
        }
        continue;
      }
    }

    const header = detectToolHeader(line);
    if (header) {
      if (currentTool?.kind === 'tool' && header.kind === 'tool' && !currentTool.command && !currentTool.sawBlankLine) {
        currentTool.lines.push(line);
        updateToolBlockFromLine(currentTool, line);
        continue;
      }
      flushTool();
      flushText();
      currentTool = {
        kind: header.kind,
        title: header.title,
        lines: [line.trim()],
        status: getStatusFromText(line) || 'unknown',
        sawBlankLine: false,
      };
      updateToolBlockFromLine(currentTool, line);
      continue;
    }

    if (!currentTool) {
      pendingTextLines.push(line);
      continue;
    }

    if (!line.trim()) {
      currentTool.sawBlankLine = true;
      currentTool.lines.push(line);
      continue;
    }

    if (currentTool.sawBlankLine && looksLikeAssistantNarration(line)) {
      flushTool();
      pendingTextLines.push(line);
      continue;
    }

    currentTool.sawBlankLine = false;
    currentTool.lines.push(line);
    updateToolBlockFromLine(currentTool, line);
  }

  flushTool();
  flushText();
  flushRootSegment();

  return {
    text: trimTextBlock(segments.map((segment) => segment.text).join('\n\n')),
    parts: segments.flatMap((segment) => segment.parts),
    toolCalls: segments.flatMap((segment) => segment.toolCalls),
    segments,
  };
}

function createMutableMessage(
  event: AgentTranscriptEvent,
  participant: AgentTranscriptParticipant,
): MutableTranscriptMessage {
  const eventTime = getEventTime(event);
  return {
    id: `${participant.id}-${event.id}`,
    role: getMessageRole(participant.type),
    participantId: participant.id,
    participant,
    textParts: [],
    parts: [],
    createdAt: eventTime,
    updatedAt: eventTime,
    eventIds: [],
    sources: [],
    toolCalls: [],
  };
}

function appendTextPart(
  message: MutableTranscriptMessage,
  text: string,
  id: string,
  kind: AgentTranscriptTextPart['kind'] = 'text',
) {
  const normalizedText = trimTextBlock(sanitizeTranscriptDisplayText(text));
  if (!normalizedText) {
    return;
  }
  message.textParts.push(normalizedText);
  message.parts.push({
    id,
    type: 'text',
    text: normalizedText,
    kind,
  });
}

function appendToolCallPart(message: MutableTranscriptMessage, toolCall: AgentTranscriptToolCall) {
  message.toolCalls.push(toolCall);
  const lastPart = message.parts[message.parts.length - 1];
  if (lastPart?.type === 'tool-calls') {
    lastPart.toolCalls.push(toolCall);
    return;
  }
  message.parts.push({
    id: `tool-calls-${toolCall.id}`,
    type: 'tool-calls',
    toolCalls: [toolCall],
  });
}

function isTerminalToolStatus(status: AgentTranscriptToolStatus) {
  return status === 'succeeded' || status === 'failed';
}

function mergeToolStatus(
  currentStatus: AgentTranscriptToolStatus,
  nextStatus: AgentTranscriptToolStatus,
): AgentTranscriptToolStatus {
  if (nextStatus === 'unknown') {
    return currentStatus;
  }
  if (nextStatus === 'failed') {
    return 'failed';
  }
  if (currentStatus === 'unknown' || currentStatus === 'running') {
    return nextStatus;
  }
  if (!isTerminalToolStatus(currentStatus)) {
    return nextStatus;
  }
  return currentStatus;
}

function mergeToolCallIntoMessage(message: MutableTranscriptMessage, toolCall: AgentTranscriptToolCall) {
  const existing = message.toolCalls.find((item) => item.id === toolCall.id);
  if (!existing) {
    appendToolCallPart(message, toolCall);
    return;
  }

  existing.status = mergeToolStatus(existing.status, toolCall.status);
  existing.command = existing.command || toolCall.command;
  existing.input = existing.input || toolCall.input;
  existing.output = toolCall.output || existing.output;
  existing.details = existing.details || toolCall.details;
  existing.title =
    existing.title === 'Command' || existing.title === 'Tool call' ? toolCall.title || existing.title : existing.title;
  existing.durationMs = toolCall.durationMs ?? existing.durationMs;
  existing.durationText = toolCall.durationText || existing.durationText;
  existing.exitCode = toolCall.exitCode ?? existing.exitCode;
  existing.source = existing.source || toolCall.source;
  existing.startedAt = existing.startedAt || toolCall.startedAt;
  existing.finishedAt = toolCall.finishedAt || existing.finishedAt;
  for (const eventId of toolCall.eventIds) {
    uniqueAppend(existing.eventIds, eventId);
  }
}

function closeRunningToolCalls(message: { toolCalls: AgentTranscriptToolCall[] }, finishedAt?: string) {
  for (const toolCall of message.toolCalls) {
    if (toolCall.status !== 'running') {
      continue;
    }
    toolCall.status = 'unknown';
    toolCall.finishedAt = toolCall.finishedAt || finishedAt;
  }
}

function appendEventMetadata(message: MutableTranscriptMessage, event: AgentTranscriptEvent) {
  message.eventIds.push(event.id);
  uniqueAppend(message.sources, event.source);
  uniqueAppend(message.participant.sources, event.source);
  uniqueAppend(message.participant.eventIds, event.id);
  const eventTime = getEventTime(event);
  if (!message.createdAt || (eventTime && eventTime < message.createdAt)) {
    message.createdAt = eventTime;
  }
  if (!message.updatedAt || (eventTime && eventTime > message.updatedAt)) {
    message.updatedAt = eventTime;
  }
}

function finalizeMutableMessage(message: MutableTranscriptMessage): AgentTranscriptMessage | null {
  const text = trimTextBlock(message.textParts.join('\n\n'));
  if (!text && !message.toolCalls.length) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    participantId: message.participantId,
    participant: message.participant,
    text,
    parts: message.parts,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    eventIds: message.eventIds,
    sources: message.sources,
    toolCalls: message.toolCalls,
  };
}

function getExplicitToolStatus(eventType: string | undefined, contentJson: AgentTranscriptJsonRecord) {
  const rawProviderItem = getRawProviderEventItem(getRawProviderEvent(contentJson));
  const exitCode = getInteger(contentJson.exitCode ?? contentJson.exit_code ?? rawProviderItem.exit_code);
  const rawStatus = getString(contentJson.status || rawProviderItem.status).toLowerCase();
  if (eventType?.includes('failed') || rawStatus === 'failed' || (typeof exitCode === 'number' && exitCode !== 0)) {
    return 'failed' as const;
  }
  if (eventType?.includes('completed') || rawStatus === 'succeeded' || rawStatus === 'success') {
    return 'succeeded' as const;
  }
  if (eventType?.includes('started') || rawStatus === 'running') {
    return 'running' as const;
  }
  return 'unknown' as const;
}

function getExplicitToolKind(event: AgentTranscriptEvent): AgentTranscriptToolKind {
  if (event.eventType?.startsWith('agent.command.')) {
    return 'exec';
  }
  const contentJson = getEventJson(event);
  const rawProviderItemType = getRawProviderItemType(getRawProviderEvent(contentJson));
  const toolName = getNormalizedToolName(getExplicitToolName(contentJson));
  if (toolName === 'apply_patch') {
    return 'apply_patch';
  }
  if (toolName === 'terminal' || toolName === 'write_stdin' || toolName === 'terminal_stream') {
    return 'terminal';
  }
  if (
    toolName === 'exec' ||
    toolName === 'exec_command' ||
    toolName === 'bash' ||
    toolName === 'shell' ||
    rawProviderItemType === 'command_execution'
  ) {
    return 'exec';
  }
  if (toolName === 'wait' || toolName === 'wait_agent') {
    return 'wait';
  }
  return event.eventType?.startsWith('agent.tool.') ? 'tool' : 'unknown';
}

function stringifyToolValue(value: unknown) {
  if (typeof value === 'string') {
    const displayValue = sanitizeTranscriptDisplayText(value);
    return displayValue.trim() ? displayValue : '';
  }
  if (value === undefined || value === null) {
    return '';
  }
  const displayValue = sanitizeTranscriptDisplayValue(value);
  if (displayValue === '') {
    return '';
  }
  try {
    return JSON.stringify(displayValue, null, 2);
  } catch {
    return sanitizeTranscriptDisplayText(String(value));
  }
}

function getFirstToolTextByPath(contentJson: AgentTranscriptJsonRecord, paths: readonly (readonly string[])[]) {
  for (const path of paths) {
    const value = stringifyToolValue(getNestedValue(contentJson, path));
    if (value) {
      return value;
    }
  }
  return '';
}

function parseJsonRecordString(value: unknown) {
  if (typeof value !== 'string') {
    return {};
  }
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('{')) {
    return {};
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return getRecord(parsed);
  } catch {
    return {};
  }
}

function getToolArgumentsRecord(contentJson: AgentTranscriptJsonRecord) {
  const directArguments = getRecord(contentJson.arguments);
  if (Object.keys(directArguments).length) {
    return directArguments;
  }
  return parseJsonRecordString(contentJson.arguments);
}

function getNormalizedToolName(value: unknown) {
  const toolName = getString(value).toLowerCase();
  return toolName.split(/[./]/).filter(Boolean).pop() || toolName;
}

function getExplicitToolName(contentJson: AgentTranscriptJsonRecord) {
  const directName = getString(contentJson.toolName || contentJson.name);
  if (directName) {
    return directName;
  }
  const rawProviderItem = getRawProviderEventItem(getRawProviderEvent(contentJson));
  return (
    getString(rawProviderItem.toolName || rawProviderItem.tool_name || rawProviderItem.name || rawProviderItem.tool) ||
    getString(rawProviderItem.type)
  );
}

function getCommandFromRecord(record: AgentTranscriptJsonRecord) {
  const command = getString(record.command || record.commandLine || record.command_line || record.cmd);
  if (command) {
    return command;
  }
  const argv = getStringArray(record.argv || record.args);
  return argv.join(' ');
}

function getCommandFromToolUses(value: unknown) {
  for (const toolUse of getRecordArray(value)) {
    const directCommand = getCommandFromRecord(toolUse);
    if (directCommand) {
      return directCommand;
    }
    const parameters = getRecord(toolUse.parameters || toolUse.input || toolUse.arguments);
    const parameterCommand = getCommandFromRecord(parameters);
    if (parameterCommand) {
      return parameterCommand;
    }
  }
  return '';
}

function getExplicitToolCommand(contentJson: AgentTranscriptJsonRecord) {
  const command = getCommandFromRecord(contentJson);
  if (command) {
    return command;
  }
  const rawProviderItem = getRawProviderEventItem(getRawProviderEvent(contentJson));
  const nestedRecords = [
    getRecord(contentJson.input),
    getRecord(contentJson.parameters),
    getRecord(contentJson.payload),
    getRecord(contentJson.state),
    getRecord(getNestedRecord(contentJson, 'state').input),
    getToolArgumentsRecord(contentJson),
    rawProviderItem,
    getRecord(rawProviderItem.input),
    getRecord(rawProviderItem.parameters),
    getRecord(rawProviderItem.arguments),
  ];
  for (const record of nestedRecords) {
    const nestedCommand = getCommandFromRecord(record);
    if (nestedCommand) {
      return nestedCommand;
    }
    const toolUseCommand = getCommandFromToolUses(record.tool_uses || record.toolUses);
    if (toolUseCommand) {
      return toolUseCommand;
    }
  }
  return '';
}

function getExplicitToolInput(contentJson: AgentTranscriptJsonRecord) {
  return getFirstToolTextByPath(contentJson, [
    ['input'],
    ['arguments'],
    ['parameters'],
    ['payload'],
    ['prompt'],
    ['rawProviderEvent', 'item', 'input'],
    ['rawProviderEvent', 'item', 'arguments'],
    ['rawProviderEvent', 'item', 'parameters'],
    ['rawProviderEvent', 'item', 'prompt'],
    ['collab', 'prompt'],
    ['collab', 'receiverThreadIds'],
    ['collab', 'receiver_thread_ids'],
    ['state', 'input'],
    ['metadata', 'input'],
  ]);
}

function getExplicitToolOutput(contentJson: AgentTranscriptJsonRecord) {
  return getFirstToolTextByPath(contentJson, [
    ['output'],
    ['aggregated_output'],
    ['aggregatedOutput'],
    ['stdout'],
    ['stderr'],
    ['result'],
    ['error'],
    ['response'],
    ['data'],
    ['result', 'output'],
    ['result', 'stdout'],
    ['result', 'stderr'],
    ['rawProviderEvent', 'item', 'output'],
    ['rawProviderEvent', 'item', 'aggregated_output'],
    ['rawProviderEvent', 'item', 'aggregatedOutput'],
    ['rawProviderEvent', 'item', 'stdout'],
    ['rawProviderEvent', 'item', 'stderr'],
    ['rawProviderEvent', 'item', 'result'],
    ['rawProviderEvent', 'item', 'error'],
    ['state', 'output'],
    ['state', 'result'],
    ['metadata', 'output'],
    ['collab', 'agents'],
  ]);
}

const DISPLAYED_TOOL_OUTPUT_KEYS = new Set([
  'output',
  'aggregated_output',
  'aggregatedOutput',
  'stdout',
  'stderr',
  'result',
  'error',
  'response',
  'data',
]);

function shouldOmitDisplayedToolDetail(key: string, value: unknown, displayedOutput: string) {
  return Boolean(
    displayedOutput && DISPLAYED_TOOL_OUTPUT_KEYS.has(key) && stringifyToolValue(value) === displayedOutput,
  );
}

function omitDisplayedToolOutput(value: unknown, displayedOutput: string): unknown {
  if (!displayedOutput) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => omitDisplayedToolOutput(item, displayedOutput));
  }
  if (!isRecord(value)) {
    return value;
  }
  const record: AgentTranscriptJsonRecord = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (shouldOmitDisplayedToolDetail(key, entryValue, displayedOutput)) {
      record[`${key}ShownSeparately`] = true;
      continue;
    }
    record[key] = omitDisplayedToolOutput(entryValue, displayedOutput);
  }
  return record;
}

function getToolEventMetadataDetails(
  event: AgentTranscriptEvent,
  contentJson: AgentTranscriptJsonRecord,
  displayedOutput: string,
) {
  const details: AgentTranscriptJsonRecord = {};
  const eventType = getString(event.eventType);
  const source = getString(event.source);
  const providerEventId = getString(event.providerEventId);
  const correlationId = getString(event.correlationId);
  const contentText = sanitizeTranscriptDisplayText(getEventText(event));
  const detailContentJson = getRecord(
    sanitizeTranscriptDisplayValue(omitDisplayedToolOutput(contentJson, displayedOutput)),
  );
  if (eventType) {
    details.eventType = eventType;
  }
  if (source) {
    details.source = source;
  }
  if (providerEventId) {
    details.providerEventId = providerEventId;
  }
  if (correlationId) {
    details.correlationId = correlationId;
  }
  if (contentText && !isProviderLifecycleLabel(contentText)) {
    details.contentText = contentText;
  }
  if (Object.keys(detailContentJson).length) {
    details.contentJson = detailContentJson;
  }
  return details;
}

function getExplicitToolDetails(
  event: AgentTranscriptEvent,
  contentJson: AgentTranscriptJsonRecord,
  command: string,
  input: string,
  output: string,
) {
  return stringifyToolValue(getToolEventMetadataDetails(event, contentJson, output));
}

function getExplicitToolCorrelationKey(event: AgentTranscriptEvent) {
  const correlationId = getString(event.correlationId);
  if (correlationId) {
    return correlationId;
  }
  const contentJson = getEventJson(event);
  const payloadCorrelationId = getString(contentJson.callId || contentJson.call_id || contentJson.itemId);
  if (payloadCorrelationId) {
    return payloadCorrelationId;
  }
  const providerEventId = getString(event.providerEventId);
  const providerParts = providerEventId.split(':');
  if (providerParts.length > 1 && providerParts[providerParts.length - 1]) {
    return providerParts[providerParts.length - 1];
  }
  return event.id;
}

function buildExplicitToolCall(event: AgentTranscriptEvent): AgentTranscriptToolCall {
  const contentJson = getEventJson(event);
  const command = sanitizeTranscriptDisplayText(getExplicitToolCommand(contentJson));
  const input = getExplicitToolInput(contentJson);
  const toolName = getExplicitToolName(contentJson);
  const output = getExplicitToolOutput(contentJson);
  const details = getExplicitToolDetails(event, contentJson, command, input, output);
  const rawProviderItem = getRawProviderEventItem(getRawProviderEvent(contentJson));
  const exitCode = getInteger(contentJson.exitCode ?? contentJson.exit_code ?? rawProviderItem.exit_code);
  const durationMs = getInteger(contentJson.durationMs ?? contentJson.duration_ms);
  const status = getExplicitToolStatus(event.eventType, contentJson);
  const title =
    command ||
    toolName ||
    (event.eventType?.startsWith('agent.command.')
      ? 'Command'
      : isProviderLifecycleLabel(getEventText(event))
        ? ''
        : sanitizeTranscriptDisplayText(getEventText(event))) ||
    'Tool call';
  return {
    id: `event-tool-${getExplicitToolCorrelationKey(event)}`,
    kind: getExplicitToolKind(event),
    title: truncateInline(title),
    status,
    command: command || undefined,
    input: input || undefined,
    output: output || undefined,
    details: details || undefined,
    durationMs,
    exitCode,
    source: event.source,
    startedAt: getEventTime(event),
    finishedAt: status === 'running' ? undefined : getEventTime(event),
    eventIds: [event.id],
  };
}

function getCollabRecord(event: AgentTranscriptEvent) {
  return getNestedRecord(getEventJson(event), 'collab');
}

function getCollabTool(event: AgentTranscriptEvent) {
  return getString(getCollabRecord(event).tool).toLowerCase();
}

function getCollabReceiverThreadIds(event: AgentTranscriptEvent) {
  const collab = getCollabRecord(event);
  return getStringArray(collab.receiverThreadIds || collab.receiver_thread_ids);
}

function getCollabAgentStates(event: AgentTranscriptEvent): CollabAgentState[] {
  const collab = getCollabRecord(event);
  const agents: CollabAgentState[] = [];
  for (const agent of getRecordArray(collab.agents || collab.agentsStates || collab.agents_states)) {
    const threadId = getString(agent.threadId || agent.thread_id || agent.id);
    if (!threadId) {
      continue;
    }
    agents.push({
      threadId,
      status: getString(agent.status) || undefined,
      message: typeof agent.message === 'string' ? agent.message : null,
    });
  }
  return agents;
}

function rememberCollabParticipants(
  event: AgentTranscriptEvent,
  subAgentSeedsByThreadId: Map<string, AgentTranscriptParticipantSeed>,
) {
  if (getCollabTool(event) !== 'spawn_agent') {
    return;
  }
  const collab = getCollabRecord(event);
  const spawnedAgentName = getString(collab.spawnedAgentName || collab.spawned_agent_name);
  const receiverThreadIds = getCollabReceiverThreadIds(event);
  for (const threadId of receiverThreadIds) {
    const name = spawnedAgentName || threadId;
    subAgentSeedsByThreadId.set(threadId, {
      id: spawnedAgentName
        ? `sub-agent:${slugParticipantId(spawnedAgentName)}`
        : `sub-agent:${slugParticipantId(threadId)}`,
      type: 'sub-agent',
      name,
      parentId: ROOT_AGENT_PARTICIPANT_ID,
      provider: event.source,
      confidence: spawnedAgentName ? 0.95 : 0.7,
    });
  }
}

function getCollabSubAgentMessages(
  event: AgentTranscriptEvent,
  subAgentSeedsByThreadId: Map<string, AgentTranscriptParticipantSeed>,
) {
  if (getCollabTool(event) !== 'wait') {
    return [];
  }
  return getCollabAgentStates(event)
    .filter((agent) => agent.status === 'completed' && typeof agent.message === 'string' && agent.message.trim())
    .map((agent) => ({
      participant:
        subAgentSeedsByThreadId.get(agent.threadId) ||
        normalizeParticipantSeed({
          id: `sub-agent:${slugParticipantId(agent.threadId)}`,
          type: 'sub-agent',
          name: agent.threadId,
          parentId: ROOT_AGENT_PARTICIPANT_ID,
          provider: event.source,
          confidence: 0.7,
        }),
      text: agent.message || '',
    }));
}

function createEmptyStats(): AgentTranscriptToolStats {
  return {
    total: 0,
    succeeded: 0,
    failed: 0,
    running: 0,
    unknown: 0,
    byKind: {},
    byStatus: {
      running: 0,
      succeeded: 0,
      failed: 0,
      unknown: 0,
    },
  };
}

function incrementKindStats(stats: AgentTranscriptToolStats, toolCall: AgentTranscriptToolCall) {
  const current = stats.byKind[toolCall.kind] || {
    total: 0,
    succeeded: 0,
    failed: 0,
    running: 0,
    unknown: 0,
  };
  current.total += 1;
  current[toolCall.status] += 1;
  stats.byKind[toolCall.kind] = current;
}

export function getAgentTranscriptToolStats(toolCalls: AgentTranscriptToolCall[]): AgentTranscriptToolStats {
  const stats = createEmptyStats();
  for (const toolCall of toolCalls) {
    stats.total += 1;
    stats[toolCall.status] += 1;
    stats.byStatus[toolCall.status] += 1;
    incrementKindStats(stats, toolCall);
  }
  return stats;
}

function ensureToolCallHasDetails(toolCall: AgentTranscriptToolCall) {
  if (toolCall.command || toolCall.input || toolCall.output || toolCall.details) {
    return;
  }
  const details: AgentTranscriptJsonRecord = {
    title: toolCall.title,
    kind: toolCall.kind,
    status: toolCall.status,
  };
  if (toolCall.source) {
    details.source = toolCall.source;
  }
  if (toolCall.startedAt) {
    details.startedAt = toolCall.startedAt;
  }
  if (toolCall.finishedAt) {
    details.finishedAt = toolCall.finishedAt;
  }
  if (typeof toolCall.durationMs === 'number') {
    details.durationMs = toolCall.durationMs;
  }
  if (typeof toolCall.exitCode === 'number') {
    details.exitCode = toolCall.exitCode;
  }
  if (toolCall.eventIds.length) {
    details.eventIds = toolCall.eventIds;
  }
  toolCall.details = stringifyToolValue(details);
}

function upsertParticipant(
  participants: Map<string, AgentTranscriptParticipant>,
  seed: AgentTranscriptParticipantSeed,
  event?: AgentTranscriptEvent,
): AgentTranscriptParticipant {
  const normalized = normalizeParticipantSeed(seed);
  const existing = participants.get(normalized.id);
  if (existing) {
    if (normalized.name && existing.name === getDefaultParticipantName(existing.type)) {
      existing.name = normalized.name;
    }
    if (normalized.parentId && !existing.parentId) {
      existing.parentId = normalized.parentId;
    }
    if (normalized.provider && !existing.provider) {
      existing.provider = normalized.provider;
    }
    if (normalized.confidence !== undefined) {
      existing.confidence = normalized.confidence;
    }
    if (event) {
      uniqueAppend(existing.sources, event.source);
      uniqueAppend(existing.eventIds, event.id);
    }
    return existing;
  }

  const participant: AgentTranscriptParticipant = {
    id: normalized.id || `${normalized.type}:unknown`,
    type: normalized.type,
    name: normalized.name || getDefaultParticipantName(normalized.type),
    parentId: normalized.parentId,
    provider: normalized.provider,
    confidence: normalized.confidence,
    sources: [],
    eventIds: [],
  };
  if (event) {
    uniqueAppend(participant.sources, event.source);
    uniqueAppend(participant.eventIds, event.id);
  }
  participants.set(participant.id, participant);
  return participant;
}

export function buildAgentTranscript(
  events: AgentTranscriptEvent[],
  options: AgentTranscriptBuildOptions = {},
): AgentTranscript {
  const participants = new Map<string, AgentTranscriptParticipant>();
  const subAgentSeedsByThreadId = new Map<string, AgentTranscriptParticipantSeed>();
  const toolCallMessages = new Map<string, MutableTranscriptMessage>();
  const messages: AgentTranscriptMessage[] = [];
  let currentAgentMessage: MutableTranscriptMessage | null = null;
  let pendingTerminalEvents: AgentTranscriptEvent[] = [];

  const flushAgentMessage = () => {
    if (!currentAgentMessage) {
      return;
    }
    const message = finalizeMutableMessage(currentAgentMessage);
    if (message) {
      messages.push(message);
    }
    currentAgentMessage = null;
  };

  const closeDanglingToolCalls = (event?: AgentTranscriptEvent) => {
    const finishedAt = event ? getEventTime(event) : undefined;
    for (const message of toolCallMessages.values()) {
      closeRunningToolCalls(message, finishedAt);
    }
    if (currentAgentMessage) {
      closeRunningToolCalls(currentAgentMessage, finishedAt);
    }
    for (const message of messages) {
      closeRunningToolCalls(message, finishedAt);
    }
  };

  const ensureMessage = (event: AgentTranscriptEvent, participantSeed: AgentTranscriptParticipantSeed) => {
    const participant = upsertParticipant(participants, participantSeed, event);
    if (currentAgentMessage && currentAgentMessage.participantId !== participant.id) {
      flushAgentMessage();
    }
    if (!currentAgentMessage) {
      currentAgentMessage = createMutableMessage(event, participant);
    }
    appendEventMetadata(currentAgentMessage, event);
    return currentAgentMessage;
  };

  const appendStandaloneAgentMessage = (
    event: AgentTranscriptEvent,
    participantSeed: AgentTranscriptParticipantSeed,
    text: string,
  ) => {
    const participant = upsertParticipant(participants, participantSeed, event);
    const message = createMutableMessage(event, participant);
    appendEventMetadata(message, event);
    appendTextPart(message, text, `text-${event.id}-${messages.length + 1}`);
    const finalized = finalizeMutableMessage(message);
    if (finalized) {
      messages.push(finalized);
    }
  };

  const flushTerminalEvents = () => {
    if (!pendingTerminalEvents.length) {
      return;
    }
    flushAgentMessage();
    const sortedTerminalEvents = [...pendingTerminalEvents].sort(compareEvents);
    const firstEvent = sortedTerminalEvents[0];
    const terminal = parseTerminalText({
      text: sortedTerminalEvents.map(getEventText).join(''),
      eventIds: sortedTerminalEvents.map((event) => event.id),
      source: sortedTerminalEvents.some((event) => event.source === 'terminal-live')
        ? 'terminal-live'
        : sortedTerminalEvents[0]?.source,
      startedAt: getEventTime(firstEvent),
      finishedAt: getEventTime(sortedTerminalEvents[sortedTerminalEvents.length - 1]),
    });
    for (const segment of terminal.segments) {
      const participant = upsertParticipant(participants, segment.participant);
      for (const event of sortedTerminalEvents) {
        uniqueAppend(participant.sources, event.source);
        uniqueAppend(participant.eventIds, event.id);
      }
      messages.push({
        id: `${participant.id}-${segment.eventIds[0] || firstEvent.id}-${messages.length + 1}`,
        role: getMessageRole(participant.type),
        participantId: participant.id,
        participant,
        text: segment.text,
        parts: segment.parts,
        createdAt: segment.startedAt,
        updatedAt: segment.finishedAt,
        eventIds: segment.eventIds,
        sources: segment.sources,
        toolCalls: segment.toolCalls,
      });
    }
    pendingTerminalEvents = [];
  };

  for (const event of [...events].sort(compareEvents)) {
    if (event.eventType === 'agent.user.message') {
      flushTerminalEvents();
      flushAgentMessage();
      const userParticipant = upsertParticipant(participants, getUserParticipantSeed(event), event);
      const userMessage = createMutableMessage(event, userParticipant);
      appendEventMetadata(userMessage, event);
      appendTextPart(userMessage, getEventText(event), `text-${event.id}`);
      const finalized = finalizeMutableMessage(userMessage);
      if (finalized) {
        messages.push(finalized);
      }
      continue;
    }

    if (event.eventType === 'agent.message' && event.source === 'terminal-live') {
      pendingTerminalEvents.push(event);
      continue;
    }

    if (event.eventType?.startsWith('agent.command.') || event.eventType?.startsWith('agent.tool.')) {
      flushTerminalEvents();
      if (isRawProviderAgentMessageEvent(event)) {
        const text = getAgentTextEventText(event);
        if (text) {
          const agentMessage = ensureMessage(event, getRootAgentParticipantSeed(event));
          appendTextPart(agentMessage, text, `text-${event.id}`, 'text');
        }
        continue;
      }
      const toolCall = buildExplicitToolCall(event);
      const existingToolCallMessage = toolCallMessages.get(toolCall.id);
      if (existingToolCallMessage) {
        appendEventMetadata(existingToolCallMessage, event);
        mergeToolCallIntoMessage(existingToolCallMessage, toolCall);
      } else {
        const message = ensureMessage(event, getRootAgentParticipantSeed(event));
        mergeToolCallIntoMessage(message, toolCall);
        toolCallMessages.set(toolCall.id, message);
      }
      rememberCollabParticipants(event, subAgentSeedsByThreadId);
      const subAgentMessages = getCollabSubAgentMessages(event, subAgentSeedsByThreadId);
      if (subAgentMessages.length) {
        flushAgentMessage();
        for (const subAgentMessage of subAgentMessages) {
          appendStandaloneAgentMessage(event, subAgentMessage.participant, subAgentMessage.text);
        }
      }
      continue;
    }

    if (event.eventType === 'agent.turn.completed') {
      flushTerminalEvents();
      closeDanglingToolCalls(event);
      flushAgentMessage();
      continue;
    }

    if (!AGENT_TEXT_EVENT_TYPES.has(event.eventType || '')) {
      continue;
    }

    flushTerminalEvents();
    const agentMessage = ensureMessage(event, getRootAgentParticipantSeed(event));
    appendTextPart(
      agentMessage,
      getAgentTextEventText(event),
      `text-${event.id}`,
      getAgentTextPartKind(event.eventType),
    );
  }

  flushTerminalEvents();
  flushAgentMessage();
  if (options.closeDanglingToolCalls) {
    closeDanglingToolCalls();
  }

  const toolCalls = messages.flatMap((message) => message.toolCalls);
  for (const toolCall of toolCalls) {
    ensureToolCallHasDetails(toolCall);
  }
  return {
    participants: [...participants.values()],
    messages,
    toolCalls,
    stats: getAgentTranscriptToolStats(toolCalls),
  };
}
