/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from '../types';
import {
  AgentAdapter,
  BuildResumeCommandInput,
  BuildStartCommandInput,
  NormalizedAgentEvent,
  ProviderEventInput,
} from './types';

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseCodexJsonlLine(input: ProviderEventInput): JsonRecord | null {
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

function normalizeCommandExecution(event: JsonRecord): NormalizedAgentEvent[] {
  const item = isRecord(event.item) ? event.item : {};
  if (item.type !== 'command_execution') {
    return [];
  }
  const status = getString(item.status);
  const command = getString(item.command);
  const output = getString(item.aggregated_output);
  const eventType = event.type === 'item.started' ? 'agent.command.started' : 'agent.command.completed';

  return [
    {
      eventType,
      level: status === 'failed' ? 'error' : 'info',
      message: output || command || eventType,
      payloadJson: {
        command,
        status,
        exitCode: item.exit_code ?? null,
      },
    },
  ];
}

function normalizeAgentMessage(event: JsonRecord): NormalizedAgentEvent[] {
  const item = isRecord(event.item) ? event.item : {};
  if (event.type !== 'item.completed' || item.type !== 'agent_message') {
    return [];
  }
  return [
    {
      eventType: 'agent.message',
      level: 'info',
      message: getString(item.text) || null,
      payloadJson: {
        itemId: getString(item.id) || null,
      },
    },
  ];
}

export const codexAdapter: AgentAdapter = {
  provider: 'codex',
  capabilities: {
    structuredEvents: true,
    detectSessionId: true,
    resumeWithMessage: true,
    liveSemanticMessage: false,
    stdinMessage: false,
    interrupt: true,
    terminate: true,
  },
  buildStartCommand(input: BuildStartCommandInput) {
    return {
      commandKey: 'codex',
      args: ['exec', '--json', ...(input.extraArgs || []), input.prompt],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  buildResumeCommand(input: BuildResumeCommandInput) {
    return {
      commandKey: 'codex',
      args: ['exec', 'resume', '--json', ...(input.extraArgs || []), input.providerSessionId, input.message],
      cwd: input.cwd,
      timeoutMs: input.timeoutMs,
    };
  },
  detectSessionId(input: ProviderEventInput) {
    const event = parseCodexJsonlLine(input);
    if (!event || event.type !== 'thread.started') {
      return null;
    }
    return getString(event.thread_id) || null;
  },
  normalizeEvent(input: ProviderEventInput) {
    const event = parseCodexJsonlLine(input);
    if (!event) {
      return [];
    }
    if (event.type === 'thread.started') {
      return [
        {
          eventType: 'agent.session.started',
          level: 'info',
          message: getString(event.thread_id) || null,
          payloadJson: {
            providerSessionId: getString(event.thread_id) || null,
          },
        },
      ];
    }
    if (event.type === 'turn.started' || event.type === 'turn.completed') {
      return [
        {
          eventType: event.type === 'turn.started' ? 'agent.turn.started' : 'agent.turn.completed',
          level: 'info',
          message: event.type,
          payloadJson: event,
        },
      ];
    }
    return [...normalizeCommandExecution(event), ...normalizeAgentMessage(event)];
  },
};
