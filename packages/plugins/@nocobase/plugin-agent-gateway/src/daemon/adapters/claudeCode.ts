/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from '../types';
import { normalizeAgentProviderCapabilities } from '../../shared/providerCapabilities';
import { AgentAdapter, BuildResumeCommandInput, BuildStartCommandInput, ProviderEventInput } from './types';

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function getEventText(event: JsonRecord) {
  return (
    getString(event.message) ||
    getString(event.text) ||
    getString(event.summary) ||
    getString(getRecord(event.delta).text) ||
    getString(getRecord(event.content).text)
  );
}

function getFallbackEventType(type: string, text: string) {
  const normalizedType = type.toLowerCase();
  if (
    normalizedType.includes('reasoning') ||
    normalizedType.includes('thinking') ||
    normalizedType.includes('summary')
  ) {
    return 'agent.reasoning';
  }
  if (
    normalizedType.includes('progress') ||
    normalizedType.includes('status') ||
    normalizedType.includes('log') ||
    normalizedType.includes('event')
  ) {
    return text ? 'agent.progress' : 'agent.raw';
  }
  return text ? 'agent.message' : 'agent.raw';
}

function getFallbackTextKind(eventType: string) {
  if (eventType === 'agent.reasoning') {
    return 'reasoning';
  }
  if (eventType === 'agent.progress') {
    return 'progress';
  }
  if (eventType === 'agent.raw') {
    return 'raw';
  }
  return 'message';
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

export const claudeCodeAdapter: AgentAdapter = {
  provider: 'claude-code',
  capabilities: normalizeAgentProviderCapabilities('claude-code'),
  projectSkillTargetDirs: ['.claude/skills'],
  buildStartCommand(input: BuildStartCommandInput) {
    const structuredArgs = input.outputMode === 'terminal' ? [] : ['--output-format', 'stream-json'];
    return {
      commandKey: 'claude-code',
      args: ['-p', input.prompt, ...structuredArgs, ...(input.extraArgs || [])],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(_input: BuildResumeCommandInput) {
    throw new Error('Claude-style resume is not supported by this adapter');
  },
  detectSessionId(input: ProviderEventInput) {
    const event = parseClaudeCodeJsonLine(input);
    return getString(event?.sessionId) || getString(event?.session_id) || null;
  },
  normalizeEvent(input: ProviderEventInput) {
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
  },
};
