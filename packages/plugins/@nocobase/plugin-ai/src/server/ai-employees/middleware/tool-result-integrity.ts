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

type NormalizationStats = {
  messageCount: number;
  toolCallCount: number;
  missingResultCount: number;
  misplacedResultCount: number;
  orphanResultCount: number;
  restoredResultCount: number;
  syntheticResultCount: number;
};

const getValidToolCalls = (message: AIMessage) =>
  (message.tool_calls ?? []).filter((toolCall) => typeof toolCall.id === 'string' && toolCall.id.length > 0);

export const isToolCallHistoryValid = (messages: readonly BaseMessage[]): boolean => {
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    if (ToolMessage.isInstance(message)) {
      return false;
    }
    if (!AIMessage.isInstance(message)) {
      continue;
    }

    const toolCalls = getValidToolCalls(message);
    if (!toolCalls.length) {
      continue;
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
    if (!AIMessage.isInstance(message)) {
      continue;
    }

    const toolCalls = getValidToolCalls(message);
    if (!toolCalls.length) {
      continue;
    }

    const expectedToolCallIds = new Set(toolCalls.map((toolCall) => toolCall.id));
    const contiguousResultIds = new Set<string>();
    for (let offset = 1; offset <= toolCalls.length; offset++) {
      const result = messages[index + offset];
      if (!ToolMessage.isInstance(result)) {
        break;
      }
      if (expectedToolCallIds.has(result.tool_call_id)) {
        contiguousResultIds.add(result.tool_call_id);
      }
    }
    misplacedResultCount += expectedToolCallIds.size - contiguousResultIds.size;
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
      for (const toolCall of getValidToolCalls(message)) {
        toolCallCount++;
        referencedToolCallIds.add(toolCall.id);
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
  const nextToolResultIndexByCallId = new Map<string, number>();
  let restoredResultCount = 0;
  let syntheticResultCount = 0;
  let consumedExistingResultCount = 0;

  for (const message of messages) {
    if (ToolMessage.isInstance(message)) {
      continue;
    }

    normalized.push(message);
    if (!AIMessage.isInstance(message)) {
      continue;
    }

    for (const toolCall of getValidToolCalls(message)) {
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

  const stats: NormalizationStats = {
    messageCount: messages.length,
    toolCallCount,
    missingResultCount: missingToolCallIds.length,
    misplacedResultCount: countMisplacedResults(messages),
    orphanResultCount: toolResultCount - consumedExistingResultCount,
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
