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
import { getFallbackEventType, getFallbackTextKind, getRecord, getString, isRecord } from './common';

function getEventText(event: JsonRecord) {
  return (
    getString(event.message) ||
    getString(event.text) ||
    getString(event.summary) ||
    getString(getRecord(event.delta).text) ||
    getString(getRecord(event.content).text)
  );
}

export function parseClaudeCodeJsonLine(input: ProviderEventInput): JsonRecord | null {
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

export function detectClaudeCodeSessionId(input: ProviderEventInput) {
  const event = parseClaudeCodeJsonLine(input);
  return getString(event?.sessionId) || getString(event?.session_id) || null;
}

export function normalizeClaudeCodeEvent(input: ProviderEventInput): NormalizedAgentEvent[] {
  const event = parseClaudeCodeJsonLine(input);
  if (!event) {
    return [];
  }
  const type = getString(event.type) || 'event';
  const id = getString(event.id) || getString(event.uuid) || null;
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
