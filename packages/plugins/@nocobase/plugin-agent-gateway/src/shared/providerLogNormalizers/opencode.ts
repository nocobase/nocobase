/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from '../json';
import { NormalizedAgentEvent, ProviderEventInput } from '../providerEvents';
import {
  getFallbackEventType,
  getFallbackTextKind,
  getNumber,
  getOutputString,
  getRecord,
  getString,
  isRecord,
} from './common';

function getCommandFromRecord(record: JsonRecord) {
  return getString(record.command || record.cmd || record.commandLine || record.command_line);
}

function getEventText(event: JsonRecord) {
  return (
    getString(event.message) ||
    getString(event.text) ||
    getString(event.summary) ||
    getString(getRecord(event.part).text) ||
    getString(getRecord(event.delta).text)
  );
}

function getDurationMs(start: unknown, end: unknown) {
  const startMs = getNumber(start);
  const endMs = getNumber(end);
  return typeof startMs === 'number' && typeof endMs === 'number' && endMs >= startMs ? endMs - startMs : undefined;
}

function getOpenCodeStatus(rawStatus: string, exitCode: number | undefined) {
  if (exitCode !== undefined && exitCode !== 0) {
    return 'failed';
  }
  if (/^(?:error|failed|failure|rejected|canceled|cancelled)$/i.test(rawStatus)) {
    return 'failed';
  }
  if (/^(?:running|pending|started|in_progress)$/i.test(rawStatus)) {
    return 'running';
  }
  if (/^(?:completed|success|succeeded|done)$/i.test(rawStatus)) {
    return 'succeeded';
  }
  return rawStatus || null;
}

function normalizeTextEvent(event: JsonRecord): NormalizedAgentEvent[] {
  if (getString(event.type) !== 'text') {
    return [];
  }
  const part = getRecord(event.part);
  const partId = getString(part.id);
  const text = getString(part.text);
  return [
    {
      eventType: 'agent.message',
      level: 'info',
      providerEventId: partId ? `text:${partId}` : null,
      correlationId: getString(part.messageID || part.messageId) || partId || null,
      message: text || null,
      payloadJson: {
        itemId: partId || null,
        sessionId: getString(event.sessionID || event.sessionId) || null,
      },
    },
  ];
}

function normalizeStepEvent(event: JsonRecord): NormalizedAgentEvent[] {
  const type = getString(event.type);
  if (type !== 'step_start' && type !== 'step_finish') {
    return [];
  }
  const part = getRecord(event.part);
  const partId = getString(part.id);
  const eventType = type === 'step_start' ? 'agent.turn.started' : 'agent.turn.completed';
  return [
    {
      eventType,
      level: 'info',
      providerEventId: partId ? `${type}:${partId}` : null,
      correlationId: getString(part.messageID || part.messageId) || partId || null,
      message: type,
      payloadJson: event,
    },
  ];
}

function normalizeToolUseEvent(event: JsonRecord): NormalizedAgentEvent[] {
  if (getString(event.type) !== 'tool_use') {
    return [];
  }
  const part = getRecord(event.part);
  const state = getRecord(part.state);
  const input = getRecord(state.input);
  const metadata = getRecord(state.metadata);
  const time = getRecord(state.time || part.time);
  const toolName = getString(part.tool || state.tool || event.tool) || 'tool';
  const callId = getString(part.callID || part.callId || state.callID || state.callId || part.id);
  const rawStatus = getString(state.status);
  const exitCode = getNumber(metadata.exit ?? metadata.exitCode ?? state.exit ?? state.exitCode);
  const status = getOpenCodeStatus(rawStatus, exitCode);
  const command = getCommandFromRecord(input) || getCommandFromRecord(state);
  const output =
    getOutputString(state.output) ||
    getOutputString(state.result) ||
    getOutputString(metadata.output) ||
    getOutputString(metadata.stderr) ||
    getOutputString(metadata.stdout);
  const durationMs = getDurationMs(time.start, time.end);
  const eventType =
    status === 'running' ? 'agent.tool.started' : status === 'failed' ? 'agent.tool.failed' : 'agent.tool.completed';
  return [
    {
      eventType,
      level: status === 'failed' ? 'error' : 'info',
      providerEventId: callId ? `tool_use:${callId}` : null,
      correlationId: callId || null,
      message: toolName,
      payloadJson: {
        itemId: getString(part.id) || callId || null,
        ...(callId ? { callId } : {}),
        toolName,
        status,
        ...(command ? { command } : {}),
        ...(Object.keys(input).length ? { input } : {}),
        ...(output ? { output } : {}),
        ...(exitCode !== undefined ? { exitCode } : {}),
        ...(durationMs !== undefined ? { durationMs } : {}),
        ...(Object.keys(metadata).length ? { metadata } : {}),
      },
    },
  ];
}

export function parseOpenCodeJsonLine(input: ProviderEventInput): JsonRecord | null {
  if (isRecord(input.event)) {
    return input.event;
  }
  const rawLine = getString(input.rawLine);
  if (!rawLine) {
    return null;
  }
  try {
    const parsed = JSON.parse(rawLine) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function detectOpenCodeSessionId(input: ProviderEventInput) {
  const event = parseOpenCodeJsonLine(input);
  return getString(event?.sessionId) || getString(event?.session_id) || null;
}

export function normalizeOpenCodeEvent(input: ProviderEventInput): NormalizedAgentEvent[] {
  const event = parseOpenCodeJsonLine(input);
  if (!event) {
    return [];
  }
  const normalizedEvents = [
    ...normalizeTextEvent(event),
    ...normalizeStepEvent(event),
    ...normalizeToolUseEvent(event),
  ];
  if (normalizedEvents.length) {
    return normalizedEvents;
  }
  const type = getString(event.type) || 'event';
  const id = getString(event.id) || getString(event.eventId) || null;
  const message = getEventText(event);
  const eventType = type.startsWith('agent.') ? type : getFallbackEventType(type, message);
  return [
    {
      eventType,
      level: event.level === 'error' ? 'error' : event.level === 'warn' ? 'warn' : 'info',
      providerEventId: id,
      correlationId: getString(event.correlationId) || id,
      message: message || type,
      payloadJson: {
        ...event,
        textKind: getFallbackTextKind(eventType),
        rawProviderEvent: event,
      },
    },
  ];
}
