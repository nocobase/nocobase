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
import { getFallbackEventType, getFallbackTextKind, getRecord, getRecordArray, getString, isRecord } from './common';

function getEventText(event: JsonRecord) {
  const message = getRecord(event.message);
  return (
    getString(event.message) ||
    getString(message.text) ||
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
  return getString(event?.sessionId) || getString(event?.session_id) || getString(event?.sessionID) || null;
}

function getContentBlocks(event: JsonRecord) {
  const message = getRecord(event.message);
  return getRecordArray(message.content || event.content);
}

function normalizeAssistantContent(event: JsonRecord): NormalizedAgentEvent[] {
  if (getString(event.type) !== 'assistant') {
    return [];
  }
  const eventId = getString(event.uuid || event.id);
  const blocks = getContentBlocks(event);
  if (!blocks.length) {
    return [];
  }
  return blocks.flatMap((block, index): NormalizedAgentEvent[] => {
    const blockType = getString(block.type);
    const blockId = getString(block.id) || `${eventId || 'assistant'}:${index}`;
    if (blockType === 'text') {
      return [
        {
          eventType: 'agent.message',
          level: 'info',
          providerEventId: `assistant:text:${blockId}`,
          correlationId: eventId || blockId,
          message: getString(block.text) || null,
          payloadJson: { itemId: blockId },
        },
      ];
    }
    if (blockType === 'thinking') {
      return [
        {
          eventType: 'agent.reasoning',
          level: 'info',
          providerEventId: `assistant:thinking:${blockId}`,
          correlationId: eventId || blockId,
          message: getString(block.thinking || block.text) || null,
          payloadJson: { itemId: blockId, textKind: 'reasoning', rawProviderEvent: event },
        },
      ];
    }
    if (blockType === 'tool_use') {
      return [
        {
          eventType: 'agent.tool.started',
          level: 'info',
          providerEventId: `assistant:tool_use:${blockId}`,
          correlationId: blockId,
          message: getString(block.name) || 'tool',
          payloadJson: {
            itemId: blockId,
            callId: blockId,
            toolName: getString(block.name) || 'tool',
            status: 'running',
            input: block.input,
          },
        },
      ];
    }
    return [];
  });
}

function normalizeToolResults(event: JsonRecord): NormalizedAgentEvent[] {
  if (getString(event.type) !== 'user') {
    return [];
  }
  return getContentBlocks(event).flatMap((block): NormalizedAgentEvent[] => {
    if (getString(block.type) !== 'tool_result') {
      return [];
    }
    const callId = getString(block.tool_use_id || block.toolUseId);
    const failed = block.is_error === true;
    return [
      {
        eventType: failed ? 'agent.tool.failed' : 'agent.tool.completed',
        level: failed ? 'error' : 'info',
        providerEventId: callId ? `user:tool_result:${callId}` : null,
        correlationId: callId || null,
        message: failed ? 'Tool failed' : 'Tool completed',
        payloadJson: {
          callId: callId || null,
          status: failed ? 'failed' : 'succeeded',
          output: block.content,
        },
      },
    ];
  });
}

export function normalizeClaudeCodeEvent(input: ProviderEventInput): NormalizedAgentEvent[] {
  const event = parseClaudeCodeJsonLine(input);
  if (!event) {
    return [];
  }
  const sessionId = detectClaudeCodeSessionId({ event });
  if (getString(event.type) === 'system' && getString(event.subtype) === 'init' && sessionId) {
    return [
      {
        eventType: 'agent.session.started',
        level: 'info',
        providerEventId: `session.started:${sessionId}`,
        message: sessionId,
        payloadJson: { providerSessionId: sessionId },
      },
    ];
  }
  const structuredEvents = [...normalizeAssistantContent(event), ...normalizeToolResults(event)];
  if (structuredEvents.length) {
    return structuredEvents;
  }
  if (getString(event.type) === 'result') {
    const id = getString(event.uuid || event.id) || null;
    return [
      {
        eventType: 'agent.turn.completed',
        level: event.is_error === true ? 'error' : 'info',
        providerEventId: id,
        correlationId: id,
        message: getString(event.result) || 'result',
        payloadJson: event,
      },
    ];
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
