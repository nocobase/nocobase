/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { createMiddleware } from 'langchain';
import type { AIToolMessage } from '../../types/ai-message.type';

const SYNTHETIC_TOOL_RESULT_ERROR = 'Tool execution was interrupted before a result was recorded.';

type ToolResultIntegrityLogger = {
  warn: (message: string, meta?: Record<string, unknown>) => void;
};

export type NormalizeToolCallHistoryOptions = {
  sessionId: string;
  logger?: ToolResultIntegrityLogger;
  loadToolResults: (toolCallIds: string[]) => Promise<Map<string, AIToolMessage>>;
};

type RawToolCall = Record<string, unknown> & {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

type NormalizationStats = {
  messageCount: number;
  toolCallCount: number;
  missingResultCount: number;
  misplacedResultCount: number;
  duplicateToolCallCount: number;
  orphanResultCount: number;
  restoredResultCount: number;
  syntheticResultCount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getRawToolCalls = (message: AIMessage): unknown[] | undefined => {
  if (!Object.prototype.hasOwnProperty.call(message.additional_kwargs, 'tool_calls')) {
    return undefined;
  }
  return Array.isArray(message.additional_kwargs.tool_calls) ? message.additional_kwargs.tool_calls : [];
};

const getRawToolCallId = (toolCall: unknown): string | undefined => {
  if (!isRecord(toolCall)) {
    return;
  }
  return typeof toolCall.id === 'string' && toolCall.id ? toolCall.id : undefined;
};

const areParsedAndRawToolCallsConsistent = (message: AIMessage): boolean => {
  const parsedToolCalls = message.tool_calls ?? [];
  const parsedIds = new Set<string>();
  for (const toolCall of parsedToolCalls) {
    if (!toolCall.id || parsedIds.has(toolCall.id)) {
      return false;
    }
    parsedIds.add(toolCall.id);
  }

  const functionCallIds = message.additional_kwargs.__openai_function_call_ids__;
  const hasConsistentFunctionCallIds =
    functionCallIds === undefined ||
    (isRecord(functionCallIds) && Object.keys(functionCallIds).every((id) => parsedIds.has(id)));
  if (
    Object.prototype.hasOwnProperty.call(message.additional_kwargs, 'tool_calls') &&
    !Array.isArray(message.additional_kwargs.tool_calls)
  ) {
    return false;
  }
  const rawToolCalls = getRawToolCalls(message);
  if (rawToolCalls === undefined) {
    return hasConsistentFunctionCallIds;
  }

  const rawIds = new Set<string>();
  for (const rawToolCall of rawToolCalls) {
    const id = getRawToolCallId(rawToolCall);
    if (!id || rawIds.has(id)) {
      return false;
    }
    rawIds.add(id);
  }

  if (rawIds.size !== parsedIds.size || !Array.from(parsedIds).every((id) => rawIds.has(id))) {
    return false;
  }

  return hasConsistentFunctionCallIds;
};

export const isToolCallHistoryValid = (messages: readonly BaseMessage[]): boolean => {
  const seenToolCallIds = new Set<string>();

  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (ToolMessage.isInstance(message)) {
      return false;
    }
    if (!AIMessage.isInstance(message)) {
      continue;
    }

    const toolCalls = message.tool_calls ?? [];
    if (!areParsedAndRawToolCallsConsistent(message)) {
      return false;
    }
    if (!toolCalls.length) {
      continue;
    }

    for (const toolCall of toolCalls) {
      if (!toolCall.id || seenToolCallIds.has(toolCall.id)) {
        return false;
      }
      seenToolCallIds.add(toolCall.id);
    }

    const expectedToolCallIds = new Set(toolCalls.map((toolCall) => toolCall.id));
    const seenToolResultIds = new Set<string>();
    for (let resultIndex = 0; resultIndex < toolCalls.length; resultIndex++) {
      index++;
      if (index >= messages.length) {
        return false;
      }
      const result = messages[index];
      if (
        !ToolMessage.isInstance(result) ||
        !expectedToolCallIds.has(result.tool_call_id) ||
        seenToolResultIds.has(result.tool_call_id)
      ) {
        return false;
      }
      seenToolResultIds.add(result.tool_call_id);
    }
  }

  return true;
};

const hasMessageContent = (content: BaseMessage['content']): boolean => {
  if (typeof content === 'string') {
    return content.length > 0;
  }
  return content.length > 0;
};

const filterRawToolCalls = (rawToolCalls: unknown[], retainedIds: Set<string>): RawToolCall[] | undefined => {
  const seenIds = new Set<string>();
  const retainedRawToolCalls: RawToolCall[] = [];
  for (const rawToolCall of rawToolCalls) {
    const id = getRawToolCallId(rawToolCall);
    if (!id || !retainedIds.has(id) || seenIds.has(id) || !isRecord(rawToolCall)) {
      continue;
    }
    seenIds.add(id);
    retainedRawToolCalls.push(rawToolCall as RawToolCall);
  }
  return seenIds.size === retainedIds.size ? retainedRawToolCalls : undefined;
};

const cloneAIMessageWithToolCalls = (message: AIMessage, toolCalls: AIMessage['tool_calls']): AIMessage => {
  const retainedIds = new Set(toolCalls.map((toolCall) => toolCall.id).filter((id): id is string => Boolean(id)));
  const additionalKwargs = { ...message.additional_kwargs };
  const rawToolCalls = getRawToolCalls(message);
  if (rawToolCalls !== undefined) {
    const retainedRawToolCalls = filterRawToolCalls(rawToolCalls, retainedIds);
    if (retainedRawToolCalls?.length) {
      additionalKwargs.tool_calls = retainedRawToolCalls;
    } else {
      delete additionalKwargs.tool_calls;
    }
  }

  const functionCallIds = additionalKwargs.__openai_function_call_ids__;
  if (isRecord(functionCallIds)) {
    const retainedFunctionCallIds = Object.fromEntries(
      Object.entries(functionCallIds).filter(([callId]) => retainedIds.has(callId)),
    );
    if (Object.keys(retainedFunctionCallIds).length) {
      additionalKwargs.__openai_function_call_ids__ = retainedFunctionCallIds;
    } else {
      delete additionalKwargs.__openai_function_call_ids__;
    }
  } else if (functionCallIds !== undefined) {
    delete additionalKwargs.__openai_function_call_ids__;
  }

  return new AIMessage({
    id: message.id,
    content: message.content,
    name: message.name,
    additional_kwargs: additionalKwargs,
    response_metadata: message.response_metadata,
    tool_calls: toolCalls,
    invalid_tool_calls: message.invalid_tool_calls,
    usage_metadata: message.usage_metadata,
  });
};

const serializeToolResultContent = (content: unknown): string => {
  if (typeof content === 'string') {
    return content;
  }
  return JSON.stringify(content ?? null);
};

const createSyntheticToolResult = (sessionId: string, toolCall: NonNullable<AIMessage['tool_calls']>[number]) =>
  new ToolMessage({
    id: `synthetic-tool-result:${sessionId}:${toolCall.id}`,
    tool_call_id: toolCall.id,
    name: toolCall.name,
    status: 'error',
    content: JSON.stringify({
      status: 'error',
      error: SYNTHETIC_TOOL_RESULT_ERROR,
    }),
  });

const createRestoredToolResult = (
  sessionId: string,
  toolCall: NonNullable<AIMessage['tool_calls']>[number],
  persisted?: AIToolMessage,
): ToolMessage | undefined => {
  if (!persisted || (persisted.invokeStatus !== 'confirmed' && persisted.invokeStatus !== 'done')) {
    return;
  }
  try {
    return new ToolMessage({
      id: `restored-tool-result:${sessionId}:${toolCall.id}`,
      tool_call_id: toolCall.id,
      name: toolCall.name,
      status: persisted.status === 'error' ? 'error' : 'success',
      content: serializeToolResultContent(persisted.content),
    });
  } catch {
    return;
  }
};

const countMisplacedResults = (messages: readonly BaseMessage[]): number => {
  let misplacedResultCount = 0;
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (!AIMessage.isInstance(message) || !message.tool_calls?.length) {
      continue;
    }
    for (let toolCallIndex = 0; toolCallIndex < message.tool_calls.length; toolCallIndex++) {
      const toolCall = message.tool_calls[toolCallIndex];
      const result = messages[index + toolCallIndex + 1];
      if (!ToolMessage.isInstance(result) || result.tool_call_id !== toolCall.id) {
        misplacedResultCount++;
      }
    }
  }
  return misplacedResultCount;
};

export const normalizeToolCallHistory = async (
  messages: readonly BaseMessage[],
  options: NormalizeToolCallHistoryOptions,
): Promise<BaseMessage[]> => {
  const toolResultsByCallId = new Map<string, ToolMessage[]>();
  const referencedToolCallIds = new Set<string>();
  let toolCallCount = 0;
  let toolResultCount = 0;

  for (const message of messages) {
    if (AIMessage.isInstance(message)) {
      for (const toolCall of message.tool_calls ?? []) {
        toolCallCount++;
        if (toolCall.id) {
          referencedToolCallIds.add(toolCall.id);
        }
      }
    } else if (ToolMessage.isInstance(message)) {
      toolResultCount++;
      if (message.tool_call_id) {
        const results = toolResultsByCallId.get(message.tool_call_id) ?? [];
        results.push(message);
        toolResultsByCallId.set(message.tool_call_id, results);
      }
    }
  }

  const missingToolCallIds = Array.from(referencedToolCallIds).filter((id) => !toolResultsByCallId.has(id));
  const persistedResults = missingToolCallIds.length ? await options.loadToolResults(missingToolCallIds) : new Map();
  const normalized: BaseMessage[] = [];
  const seenToolCallIds = new Set<string>();
  const nextToolResultIndexByCallId = new Map<string, number>();
  let duplicateToolCallCount = 0;
  let restoredResultCount = 0;
  let syntheticResultCount = 0;
  let consumedExistingResultCount = 0;

  for (const message of messages) {
    if (ToolMessage.isInstance(message)) {
      continue;
    }
    if (!AIMessage.isInstance(message)) {
      normalized.push(message);
      continue;
    }

    const toolCalls = message.tool_calls ?? [];
    if (!toolCalls.length) {
      const functionCallIds = message.additional_kwargs.__openai_function_call_ids__;
      if (
        Object.prototype.hasOwnProperty.call(message.additional_kwargs, 'tool_calls') ||
        functionCallIds !== undefined
      ) {
        normalized.push(cloneAIMessageWithToolCalls(message, []));
      } else {
        normalized.push(message);
      }
      continue;
    }

    const retainedToolCalls = toolCalls.filter((toolCall) => {
      if (!toolCall.id || seenToolCallIds.has(toolCall.id)) {
        duplicateToolCallCount++;
        return false;
      }
      seenToolCallIds.add(toolCall.id);
      return true;
    });

    if (!retainedToolCalls.length) {
      if (hasMessageContent(message.content)) {
        normalized.push(cloneAIMessageWithToolCalls(message, []));
      }
      continue;
    }

    normalized.push(cloneAIMessageWithToolCalls(message, retainedToolCalls));
    for (const toolCall of retainedToolCalls) {
      const existingResults = toolResultsByCallId.get(toolCall.id);
      const existingResultIndex = nextToolResultIndexByCallId.get(toolCall.id) ?? 0;
      const existingResult = existingResults?.[existingResultIndex];
      if (existingResult) {
        nextToolResultIndexByCallId.set(toolCall.id, existingResultIndex + 1);
        normalized.push(existingResult);
        consumedExistingResultCount++;
        continue;
      }

      const restoredResult = createRestoredToolResult(options.sessionId, toolCall, persistedResults.get(toolCall.id));
      if (restoredResult) {
        normalized.push(restoredResult);
        restoredResultCount++;
        continue;
      }

      normalized.push(createSyntheticToolResult(options.sessionId, toolCall));
      syntheticResultCount++;
    }
  }

  const totalToolResultCount = toolResultCount;
  const stats: NormalizationStats = {
    messageCount: messages.length,
    toolCallCount,
    missingResultCount: missingToolCallIds.length,
    misplacedResultCount: countMisplacedResults(messages),
    duplicateToolCallCount,
    orphanResultCount: totalToolResultCount - consumedExistingResultCount,
    restoredResultCount,
    syntheticResultCount,
  };
  options.logger?.warn('Normalize invalid tool call history before model call', {
    sessionId: options.sessionId,
    ...stats,
  });

  return normalized;
};

export const toolResultIntegrityMiddleware = (options: NormalizeToolCallHistoryOptions) =>
  createMiddleware({
    name: 'ToolResultIntegrityMiddleware',
    wrapModelCall: async (request, handler) => {
      if (isToolCallHistoryValid(request.messages)) {
        return handler(request);
      }

      request.messages = await normalizeToolCallHistory(request.messages, options);
      return handler(request);
    },
  });
