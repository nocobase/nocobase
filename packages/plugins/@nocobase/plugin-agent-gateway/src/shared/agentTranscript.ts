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

export type AgentTranscriptMessageRole = 'user' | 'agent';
export type AgentTranscriptToolKind = 'exec' | 'run' | 'terminal' | 'wait' | 'apply_patch' | 'tool' | 'unknown';
export type AgentTranscriptToolStatus = 'running' | 'succeeded' | 'failed' | 'unknown';

export interface AgentTranscriptToolCall {
  id: string;
  kind: AgentTranscriptToolKind;
  title: string;
  status: AgentTranscriptToolStatus;
  command?: string;
  output?: string;
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
  messages: AgentTranscriptMessage[];
  toolCalls: AgentTranscriptToolCall[];
  stats: AgentTranscriptToolStats;
}

interface MutableTranscriptMessage {
  id: string;
  role: AgentTranscriptMessageRole;
  textParts: string[];
  parts: AgentTranscriptMessagePart[];
  terminalTextParts: string[];
  terminalEventIds: string[];
  terminalSources: string[];
  terminalStartedAt?: string;
  terminalFinishedAt?: string;
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

const ANSI_PATTERN =
  // eslint-disable-next-line no-control-regex
  /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const TOOL_COMMAND_START_PATTERN =
  /^\s*(?:\$|\/|(?:yarn|npm|pnpm|node|python|python3|bash|sh|git|rg|sed|cat|find|curl|nb|npx|tsx|docker|tmux)\b)/i;
const CODEX_PREAMBLE_LINE_PATTERN =
  /^(?:OpenAI Codex\b|-{3,}|(?:workdir|model|provider|approval|sandbox|reasoning effort|reasoning summaries|session id):)/i;

function isRecord(value: unknown): value is AgentTranscriptJsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getRecord(value: unknown): AgentTranscriptJsonRecord {
  return isRecord(value) ? value : {};
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

function getEventJson(event: AgentTranscriptEvent) {
  return event.contentJson || event.payloadJson || {};
}

function getEventTime(event: AgentTranscriptEvent) {
  return event.createdAt || event.emittedAt;
}

function compareEvents(first: AgentTranscriptEvent, second: AgentTranscriptEvent) {
  if (typeof first.sequence === 'number' && typeof second.sequence === 'number' && first.sequence !== second.sequence) {
    return first.sequence - second.sequence;
  }
  const firstTime = getEventTime(first);
  const secondTime = getEventTime(second);
  if (firstTime && secondTime && firstTime !== secondTime) {
    return firstTime.localeCompare(secondTime);
  }
  return (first.sequence ?? 0) - (second.sequence ?? 0);
}

function uniqueAppend(values: string[], value?: string) {
  if (value && !values.includes(value)) {
    values.push(value);
  }
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
  const output = trimTextBlock(block.lines.join('\n'));
  const command =
    block.command || block.lines.map(extractCommandFromLine).find((value): value is string => Boolean(value));
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

function parseTerminalText(options: {
  text: string;
  eventIds: string[];
  source?: string;
  startedAt?: string;
  finishedAt?: string;
}) {
  const textParts: string[] = [];
  const parts: AgentTranscriptMessagePart[] = [];
  const toolCalls: AgentTranscriptToolCall[] = [];
  let pendingTextLines: string[] = [];
  let currentTool: MutableTerminalToolBlock | null = null;

  const getPartId = (type: string) => `${type}-${options.eventIds[0] || 'event'}-${parts.length + 1}`;

  const flushText = () => {
    const text = trimTextBlock(pendingTextLines.join('\n'));
    pendingTextLines = [];
    if (!text) {
      return;
    }
    textParts.push(text);
    parts.push({
      id: getPartId('terminal-text'),
      type: 'text',
      text,
    });
  };

  const appendToolCallPart = (toolCall: AgentTranscriptToolCall) => {
    const lastPart = parts[parts.length - 1];
    if (lastPart?.type === 'tool-calls') {
      lastPart.toolCalls.push(toolCall);
      return;
    }
    parts.push({
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
      toolCalls.length + 1,
      options.eventIds,
      options.source,
      options.startedAt,
      options.finishedAt,
    );
    toolCalls.push(toolCall);
    appendToolCallPart(toolCall);
    currentTool = null;
  };

  const lines = stripCodexTerminalPreamble(stripTerminalControlSequences(options.text)).split(/\r?\n/);
  for (const line of lines) {
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

  return {
    text: trimTextBlock(textParts.join('\n')),
    parts,
    toolCalls,
  };
}

function createMutableMessage(event: AgentTranscriptEvent, role: AgentTranscriptMessageRole): MutableTranscriptMessage {
  const eventTime = getEventTime(event);
  return {
    id: `${role}-${event.id}`,
    role,
    textParts: [],
    parts: [],
    terminalTextParts: [],
    terminalEventIds: [],
    terminalSources: [],
    terminalStartedAt: undefined,
    terminalFinishedAt: undefined,
    createdAt: eventTime,
    updatedAt: eventTime,
    eventIds: [],
    sources: [],
    toolCalls: [],
  };
}

function appendTextPart(message: MutableTranscriptMessage, text: string, id: string) {
  const normalizedText = trimTextBlock(text);
  if (!normalizedText) {
    return;
  }
  message.textParts.push(normalizedText);
  message.parts.push({
    id,
    type: 'text',
    text: normalizedText,
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

function appendEventMetadata(message: MutableTranscriptMessage, event: AgentTranscriptEvent) {
  message.eventIds.push(event.id);
  uniqueAppend(message.sources, event.source);
  const eventTime = getEventTime(event);
  if (!message.createdAt || (eventTime && eventTime < message.createdAt)) {
    message.createdAt = eventTime;
  }
  if (!message.updatedAt || (eventTime && eventTime > message.updatedAt)) {
    message.updatedAt = eventTime;
  }
}

function appendTerminalEvent(message: MutableTranscriptMessage, event: AgentTranscriptEvent) {
  message.terminalTextParts.push(getEventText(event));
  message.terminalEventIds.push(event.id);
  uniqueAppend(message.terminalSources, event.source);
  const eventTime = getEventTime(event);
  if (!message.terminalStartedAt || (eventTime && eventTime < message.terminalStartedAt)) {
    message.terminalStartedAt = eventTime;
  }
  if (!message.terminalFinishedAt || (eventTime && eventTime > message.terminalFinishedAt)) {
    message.terminalFinishedAt = eventTime;
  }
}

function flushTerminalParts(message: MutableTranscriptMessage) {
  if (!message.terminalTextParts.length) {
    return;
  }

  const terminal = parseTerminalText({
    text: message.terminalTextParts.join(''),
    eventIds: message.terminalEventIds,
    source: message.terminalSources.includes('terminal-live') ? 'terminal-live' : message.terminalSources[0],
    startedAt: message.terminalStartedAt,
    finishedAt: message.terminalFinishedAt,
  });
  if (terminal.text) {
    message.textParts.push(terminal.text);
  }
  message.parts.push(...terminal.parts);
  message.toolCalls.push(...terminal.toolCalls);
  message.terminalTextParts = [];
  message.terminalEventIds = [];
  message.terminalSources = [];
  message.terminalStartedAt = undefined;
  message.terminalFinishedAt = undefined;
}

function finalizeMutableMessage(message: MutableTranscriptMessage): AgentTranscriptMessage | null {
  flushTerminalParts(message);

  const text = trimTextBlock(message.textParts.join('\n\n'));
  if (!text && !message.toolCalls.length) {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
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
  const exitCode = getInteger(contentJson.exitCode ?? contentJson.exit_code);
  const rawStatus = getString(contentJson.status).toLowerCase();
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
  const toolName = getString(contentJson.toolName || contentJson.name).toLowerCase();
  if (toolName === 'apply_patch') {
    return 'apply_patch';
  }
  if (toolName === 'terminal' || toolName === 'write_stdin') {
    return 'terminal';
  }
  if (toolName === 'exec' || toolName === 'exec_command') {
    return 'exec';
  }
  return event.eventType?.startsWith('agent.tool.') ? 'tool' : 'unknown';
}

function buildExplicitToolCall(event: AgentTranscriptEvent): AgentTranscriptToolCall {
  const contentJson = getEventJson(event);
  const command = getString(contentJson.command);
  const toolName = getString(contentJson.toolName || contentJson.name);
  const output = event.eventType?.startsWith('agent.command.')
    ? getString(contentJson.output || contentJson.result)
    : getString(contentJson.output || contentJson.result || getEventText(event));
  const exitCode = getInteger(contentJson.exitCode ?? contentJson.exit_code);
  const durationMs = getInteger(contentJson.durationMs ?? contentJson.duration_ms);
  const status = getExplicitToolStatus(event.eventType, contentJson);
  const title =
    command ||
    toolName ||
    (event.eventType?.startsWith('agent.command.') ? 'Command' : getEventText(event)) ||
    'Tool call';
  return {
    id: `event-tool-${event.id}`,
    kind: getExplicitToolKind(event),
    title: truncateInline(title),
    status,
    command: command || undefined,
    output: output || undefined,
    durationMs,
    exitCode,
    source: event.source,
    startedAt: getEventTime(event),
    finishedAt: getEventTime(event),
    eventIds: [event.id],
  };
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

export function buildAgentTranscript(events: AgentTranscriptEvent[]): AgentTranscript {
  const messages: AgentTranscriptMessage[] = [];
  let currentAgentMessage: MutableTranscriptMessage | null = null;

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

  const ensureAgentMessage = (event: AgentTranscriptEvent) => {
    if (!currentAgentMessage) {
      currentAgentMessage = createMutableMessage(event, 'agent');
    }
    appendEventMetadata(currentAgentMessage, event);
    return currentAgentMessage;
  };

  for (const event of [...events].sort(compareEvents)) {
    if (event.eventType === 'agent.user.message') {
      flushAgentMessage();
      const userMessage = createMutableMessage(event, 'user');
      appendEventMetadata(userMessage, event);
      appendTextPart(userMessage, getEventText(event), `text-${event.id}`);
      const finalized = finalizeMutableMessage(userMessage);
      if (finalized) {
        messages.push(finalized);
      }
      continue;
    }

    if (event.eventType?.startsWith('agent.command.') || event.eventType?.startsWith('agent.tool.')) {
      if (currentAgentMessage) {
        flushTerminalParts(currentAgentMessage);
      }
      appendToolCallPart(ensureAgentMessage(event), buildExplicitToolCall(event));
      continue;
    }

    if (event.eventType === 'agent.turn.completed') {
      flushAgentMessage();
      continue;
    }

    if (event.eventType !== 'agent.message') {
      continue;
    }

    const agentMessage = ensureAgentMessage(event);
    if (event.source === 'terminal-live') {
      appendTerminalEvent(agentMessage, event);
      continue;
    }
    flushTerminalParts(agentMessage);
    appendTextPart(agentMessage, getEventText(event), `text-${event.id}`);
  }

  flushAgentMessage();

  const toolCalls = messages.flatMap((message) => message.toolCalls);
  return {
    messages,
    toolCalls,
    stats: getAgentTranscriptToolStats(toolCalls),
  };
}
