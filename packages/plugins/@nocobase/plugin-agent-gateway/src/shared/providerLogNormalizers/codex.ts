/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS } from '../conversationLimits';
import { JsonRecord } from '../json';
import { NormalizedAgentEvent, ProviderEventInput } from '../providerEvents';

function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getOutputString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '';
}

function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function getRecordArray(value: unknown) {
  return Array.isArray(value) ? value.map(getRecord).filter((record) => Object.keys(record).length) : [];
}

function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(getString).filter(Boolean) : [];
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

function getCodexItemRecord(event: JsonRecord): JsonRecord {
  if (getString(event.type) === 'response_item') {
    return getRecord(event.payload);
  }
  return getRecord(event.item);
}

function getResponseItemContentText(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  return content
    .map((entry) => {
      const record = getRecord(entry);
      return getString(record.text);
    })
    .filter(Boolean)
    .join('\n');
}

function getNestedText(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value.map(getNestedText).filter(Boolean).join('\n');
  }
  const record = getRecord(value);
  if (!Object.keys(record).length) {
    return '';
  }
  return (
    getString(record.text) ||
    getString(record.message) ||
    getString(record.summary) ||
    getString(record.content) ||
    getNestedText(record.content) ||
    getNestedText(record.summary)
  );
}

function getEventItemId(event: JsonRecord, item: JsonRecord) {
  return getString(item.id) || getString(item.call_id || item.callId) || getString(event.id);
}

function getToolArguments(item: JsonRecord) {
  const directArguments = getRecord(item.arguments);
  if (Object.keys(directArguments).length) {
    return directArguments;
  }
  return parseJsonRecordString(item.arguments);
}

function getCommandFromRecord(record: JsonRecord) {
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

function getToolCommand(item: JsonRecord) {
  const directCommand = getCommandFromRecord(item);
  if (directCommand) {
    return directCommand;
  }
  const inputCommand = getCommandFromRecord(getRecord(item.input));
  if (inputCommand) {
    return inputCommand;
  }
  const argumentsRecord = getToolArguments(item);
  const argumentsCommand = getCommandFromRecord(argumentsRecord);
  if (argumentsCommand) {
    return argumentsCommand;
  }
  return getCommandFromToolUses(argumentsRecord.tool_uses || argumentsRecord.toolUses);
}

function getCollabAgentName(prompt: string) {
  const match =
    prompt.match(/\b(?:name|called|named)\s+(?:for\s+this\s+task\s+is\s+|is\s+)?([A-Z][\p{L}\p{N} ._-]{1,60})\b/u) ||
    prompt.match(/名字(?:分别)?(?:叫|为)\s*([A-Z\p{L}][\p{L}\p{N} ._-]{1,60})/u);
  return (
    match?.[1]
      ?.trim()
      .replace(/[.。:：,，;；].*$/, '')
      .trim() || ''
  );
}

function getCollabAgentStates(value: unknown) {
  const agents: Array<{ threadId: string; status?: string; message?: string | null }> = [];
  const states = getRecord(value);
  for (const [threadId, rawState] of Object.entries(states)) {
    const state = getRecord(rawState);
    if (!threadId) {
      continue;
    }
    agents.push({
      threadId,
      status: getString(state.status) || undefined,
      message: typeof state.message === 'string' ? state.message : null,
    });
  }
  return agents;
}

function getParticipantRecord(event: JsonRecord, item: JsonRecord): JsonRecord {
  const explicitParticipant = getRecord(item.participant || event.participant);
  if (Object.keys(explicitParticipant).length) {
    return explicitParticipant;
  }

  const subAgent = getRecord(item.subAgent || item.subagent || event.subAgent || event.subagent);
  if (Object.keys(subAgent).length) {
    return {
      ...subAgent,
      type: getString(subAgent.type) || 'sub-agent',
    };
  }

  const agent = getRecord(item.agent || event.agent || item.actor || event.actor);
  if (Object.keys(agent).length) {
    const rawType = getString(agent.type || agent.kind);
    return {
      ...agent,
      type:
        rawType ||
        (getString(agent.parentId || agent.parentParticipantId || agent.parent_agent_id) ? 'sub-agent' : 'root-agent'),
    };
  }

  const participantName =
    getString(item.participantName) ||
    getString(event.participantName) ||
    getString(item.agentName) ||
    getString(event.agentName) ||
    getString(item.subAgentName) ||
    getString(event.subAgentName);
  if (!participantName) {
    return {};
  }
  return {
    type: 'sub-agent',
    name: participantName,
    id: getString(item.participantId || event.participantId || item.agentId || event.agentId) || undefined,
    parentId: getString(item.parentParticipantId || event.parentParticipantId) || undefined,
    provider: 'codex',
  };
}

function withParticipantPayload(payloadJson: JsonRecord, participant: JsonRecord) {
  if (!Object.keys(participant).length) {
    return payloadJson;
  }
  return {
    ...payloadJson,
    participant,
  };
}

export function parseCodexTerminalSessionId(input: ProviderEventInput) {
  const rawLine = getString(input.rawLine);
  const match = rawLine.match(/^session id:\s*([0-9a-z-]{8,})$/i);
  return match?.[1] || null;
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

function getCommandOutputPayload(value: unknown): JsonRecord {
  const output = getOutputString(value);
  if (!output) {
    return {};
  }
  if (output.length <= COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS) {
    return {
      output,
    };
  }
  return {
    output: output.slice(0, COMMAND_OUTPUT_PAYLOAD_LIMIT_CHARS),
    outputTruncated: true,
    originalOutputLength: output.length,
  };
}

function normalizeCommandExecution(event: JsonRecord): NormalizedAgentEvent[] {
  const item = getCodexItemRecord(event);
  if (item.type !== 'command_execution') {
    return [];
  }
  const status = getString(item.status);
  const eventType = event.type === 'item.started' ? 'agent.command.started' : 'agent.command.completed';
  const itemId = getString(item.id);
  const participant = getParticipantRecord(event, item);
  const message =
    eventType === 'agent.command.started'
      ? 'Command started'
      : status === 'failed'
        ? 'Command failed'
        : 'Command completed';

  return [
    {
      eventType,
      level: status === 'failed' ? 'error' : 'info',
      providerEventId: itemId ? `${getString(event.type)}:${itemId}` : null,
      correlationId: itemId || null,
      message,
      payloadJson: withParticipantPayload(
        {
          command: getString(item.command),
          ...getCommandOutputPayload(item.aggregated_output || item.aggregatedOutput || item.output),
          status,
          exitCode: item.exit_code ?? null,
        },
        participant,
      ),
    },
  ];
}

function normalizeAgentMessage(event: JsonRecord): NormalizedAgentEvent[] {
  const item = getCodexItemRecord(event);
  if (event.type === 'item.completed' && item.type === 'agent_message') {
    const participant = getParticipantRecord(event, item);
    return [
      {
        eventType: 'agent.message',
        level: 'info',
        providerEventId: getString(item.id) ? `${getString(event.type)}:${getString(item.id)}` : null,
        correlationId: getString(item.id) || null,
        message: getString(item.text) || null,
        payloadJson: withParticipantPayload(
          {
            itemId: getString(item.id) || null,
          },
          participant,
        ),
      },
    ];
  }

  if (event.type !== 'response_item' || item.type !== 'message' || getString(item.role) === 'user') {
    return [];
  }
  const participant = getParticipantRecord(event, item);
  const itemId = getString(item.id);
  const message = getResponseItemContentText(item.content);
  return [
    {
      eventType: 'agent.message',
      level: 'info',
      providerEventId: itemId ? `response_item:${itemId}` : null,
      correlationId: itemId || null,
      message: message || null,
      payloadJson: withParticipantPayload(
        {
          itemId: itemId || null,
        },
        participant,
      ),
    },
  ];
}

function normalizeReasoningEvent(event: JsonRecord): NormalizedAgentEvent[] {
  const item = getCodexItemRecord(event);
  const itemType = getString(item.type).toLowerCase();
  const eventType = getString(event.type).toLowerCase();
  if (
    !(
      itemType.includes('reasoning') ||
      itemType.includes('thought') ||
      eventType.includes('reasoning') ||
      eventType.includes('thought')
    )
  ) {
    return [];
  }
  const itemId = getEventItemId(event, item);
  const message =
    getNestedText(item.summary) ||
    getNestedText(item.text) ||
    getNestedText(item.message) ||
    getNestedText(item.content) ||
    getNestedText(event.summary) ||
    getNestedText(event.message) ||
    getNestedText(event.text);
  return [
    {
      eventType: 'agent.reasoning',
      level: 'info',
      providerEventId: itemId ? `${getString(event.type) || 'reasoning'}:${itemId}` : null,
      correlationId: itemId || null,
      message: message || itemType || eventType || 'reasoning',
      payloadJson: {
        itemId: itemId || null,
        textKind: 'reasoning',
        rawProviderEvent: event,
      },
    },
  ];
}

function normalizeRawProviderEvent(event: JsonRecord): NormalizedAgentEvent[] {
  const item = getCodexItemRecord(event);
  const itemType = getString(item.type);
  const eventType = getString(event.type) || 'event';
  const itemId = getEventItemId(event, item);
  const message =
    getNestedText(item.message) ||
    getNestedText(item.text) ||
    getNestedText(item.summary) ||
    getNestedText(event.message) ||
    getNestedText(event.text) ||
    itemType ||
    eventType;
  return [
    {
      eventType: 'agent.raw',
      level: itemType === 'error' || event.level === 'error' ? 'error' : event.level === 'warn' ? 'warn' : 'debug',
      providerEventId: itemId ? `${eventType}:${itemId}` : null,
      correlationId: itemId || null,
      message,
      payloadJson: {
        itemId: itemId || null,
        providerEventType: eventType,
        itemType: itemType || null,
        textKind: 'raw',
        rawProviderEvent: event,
      },
    },
  ];
}

function normalizeToolEvent(event: JsonRecord): NormalizedAgentEvent[] {
  const item = getCodexItemRecord(event);
  const itemType = getString(item.type).toLowerCase();
  const toolName =
    getString(item.tool) ||
    getString(item.toolName) ||
    getString(item.name) ||
    getString(item.tool_name) ||
    getString(item.function_name) ||
    getString(event.toolName) ||
    getString(event.name);
  const callId = getString(item.call_id || item.callId);
  const isResponseItem = getString(event.type) === 'response_item';
  const isToolOutput =
    itemType === 'function_call_output' ||
    itemType === 'custom_tool_call_output' ||
    itemType === 'tool_search_output' ||
    itemType === 'mcp_call_output';
  const isToolRequest =
    itemType === 'function_call' ||
    itemType === 'custom_tool_call' ||
    itemType === 'tool_search_call' ||
    itemType === 'mcp_call' ||
    itemType.includes('tool_call');
  if (!toolName && !callId && !itemType.includes('tool') && itemType !== 'function_call') {
    return [];
  }

  const rawStatus = getString(item.status || event.status);
  let eventType = 'agent.tool.completed';
  if (isResponseItem && isToolOutput) {
    eventType = rawStatus === 'failed' ? 'agent.tool.failed' : 'agent.tool.completed';
  } else if (isResponseItem && isToolRequest) {
    eventType = 'agent.tool.started';
  } else if (event.type === 'item.started' || rawStatus === 'in_progress' || rawStatus === 'running') {
    eventType = 'agent.tool.started';
  } else if (rawStatus === 'failed') {
    eventType = 'agent.tool.failed';
  }
  const itemId = getString(item.id) || callId || getString(event.id);
  const participant = getParticipantRecord(event, item);
  const collabTool = itemType === 'collab_tool_call' ? getString(item.tool) : '';
  const prompt = getString(item.prompt);
  const receiverThreadIds = getStringArray(item.receiver_thread_ids || item.receiverThreadIds);
  const senderThreadId = getString(item.sender_thread_id || item.senderThreadId);
  const agents = getCollabAgentStates(item.agents_states || item.agentsStates);
  const argumentsRecord = getToolArguments(item);
  const inputValue =
    item.input ?? item.parameters ?? (Object.keys(argumentsRecord).length ? argumentsRecord : item.arguments);
  const command = getToolCommand(item);
  const outputValue = item.output ?? item.result ?? item.stdout ?? item.stderr ?? item.error;
  const providerEventType = isResponseItem && itemType ? `${getString(event.type)}:${itemType}` : getString(event.type);
  return [
    {
      eventType,
      level: eventType === 'agent.tool.failed' ? 'error' : 'info',
      providerEventId: itemId ? `${providerEventType}:${itemId}` : null,
      correlationId: callId || itemId || null,
      message: toolName || itemType || eventType,
      payloadJson: withParticipantPayload(
        {
          itemId: itemId || null,
          ...(callId ? { callId } : {}),
          toolName: toolName || itemType || null,
          status: rawStatus || null,
          ...(command ? { command } : {}),
          ...(inputValue !== undefined ? { input: inputValue } : {}),
          ...(Object.keys(argumentsRecord).length ? { arguments: argumentsRecord } : {}),
          ...getCommandOutputPayload(outputValue),
          ...(outputValue !== undefined && !getOutputString(outputValue) ? { output: outputValue } : {}),
          ...(collabTool
            ? {
                collab: {
                  tool: collabTool,
                  senderThreadId: senderThreadId || null,
                  receiverThreadIds,
                  prompt: prompt || null,
                  spawnedAgentName: getCollabAgentName(prompt) || null,
                  agents,
                },
              }
            : {}),
        },
        participant,
      ),
    },
  ];
}

export function detectCodexSessionId(input: ProviderEventInput) {
  const event = parseCodexJsonlLine(input);
  if (event?.type === 'thread.started') {
    return getString(event.thread_id) || null;
  }
  return parseCodexTerminalSessionId(input);
}

export function normalizeCodexEvent(input: ProviderEventInput): NormalizedAgentEvent[] {
  const event = parseCodexJsonlLine(input);
  if (!event) {
    const providerSessionId = parseCodexTerminalSessionId(input);
    if (providerSessionId) {
      return [
        {
          eventType: 'agent.session.started',
          level: 'info',
          providerEventId: `session.id:${providerSessionId}`,
          message: providerSessionId,
          payloadJson: {
            providerSessionId,
          },
        },
      ];
    }
    return [];
  }
  if (event.type === 'thread.started') {
    return [
      {
        eventType: 'agent.session.started',
        level: 'info',
        providerEventId: getString(event.thread_id) ? `thread.started:${getString(event.thread_id)}` : null,
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
        providerEventId: getString(event.id) || null,
        message: event.type,
        payloadJson: event,
      },
    ];
  }
  const normalizedEvents = [
    ...normalizeCommandExecution(event),
    ...normalizeAgentMessage(event),
    ...normalizeReasoningEvent(event),
    ...normalizeToolEvent(event),
  ];
  return normalizedEvents.length ? normalizedEvents : normalizeRawProviderEvent(event);
}
