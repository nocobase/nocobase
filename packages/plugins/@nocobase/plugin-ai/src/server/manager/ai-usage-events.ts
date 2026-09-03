/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';
import { Transaction } from '@nocobase/database';
import { AIMessage } from '../types';

const SKIPPED_MESSAGE_ROLES = new Set(['user', 'tool', 'system']);

type RecordLike = Record<string, unknown> & {
  get?: (key: string) => unknown;
};

export type NormalizedUsageMetadata = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
};

export type AIUsageEventValues = {
  occurredAt: Date;
  sessionId: string;
  messageId: string;
  userId?: unknown;
  aiEmployeeUsername?: unknown;
  from: string;
  category: string;
  eventType: 'llm_message';
  role: string;
  provider: string;
  llmService?: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  toolCallCount: number;
  autoToolCallCount: number;
  status: 'success';
  rawUsageMetadata: Record<string, unknown>;
  rawResponseMetadata?: Record<string, unknown>;
};

export function normalizeUsageMetadata(usageMetadata: Record<string, unknown>): NormalizedUsageMetadata {
  const inputTokens =
    getNumericValue(usageMetadata, ['input_tokens', 'prompt_tokens', 'inputTokens', 'promptTokens']) ?? 0;
  const outputTokens =
    getNumericValue(usageMetadata, ['output_tokens', 'completion_tokens', 'outputTokens', 'completionTokens']) ?? 0;
  const totalTokens = getNumericValue(usageMetadata, ['total_tokens', 'totalTokens']) ?? inputTokens + outputTokens;
  const cachedTokens =
    getNumericValue(usageMetadata, ['cached_tokens', 'cachedTokens']) ??
    getNestedNumericValue(usageMetadata, ['input_token_details', 'cache_read']) ??
    getNestedNumericValue(usageMetadata, ['input_token_details', 'cached_tokens']) ??
    getNestedNumericValue(usageMetadata, ['prompt_tokens_details', 'cached_tokens']) ??
    0;
  const reasoningTokens =
    getNumericValue(usageMetadata, ['reasoning_tokens', 'reasoningTokens']) ??
    getNestedNumericValue(usageMetadata, ['output_token_details', 'reasoning']) ??
    getNestedNumericValue(usageMetadata, ['completion_tokens_details', 'reasoning_tokens']) ??
    0;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
    cachedTokens,
    reasoningTokens,
  };
}

export function buildAIUsageEventValues(
  sessionId: string,
  message: AIMessage,
  conversation: RecordLike,
): AIUsageEventValues | null {
  const role = readString(message, 'role');
  if (!role || SKIPPED_MESSAGE_ROLES.has(role)) {
    return null;
  }

  const metadata = readRecord(message, 'metadata');
  const provider = readString(metadata, 'provider');
  const model = readString(metadata, 'model');
  if (!provider || !model) {
    return null;
  }

  const usageMetadata = readRecord(metadata, 'usage_metadata') ?? {};
  const responseMetadata = readRecord(metadata, 'response_metadata');
  const normalizedUsage = normalizeUsageMetadata(usageMetadata);
  const toolCalls = readArray(message, 'toolCalls');
  const autoCallTools = readArray(metadata, 'autoCallTools');
  const llmService = readString(metadata, 'llmService');

  return {
    occurredAt: normalizeDate(readValue(message, 'createdAt')),
    sessionId,
    messageId: String(readValue(message, 'messageId') ?? ''),
    userId: readValue(conversation, 'userId'),
    aiEmployeeUsername: readValue(conversation, 'aiEmployeeUsername'),
    from: readString(conversation, 'from') ?? 'main-agent',
    category: readString(conversation, 'category') ?? 'chat',
    eventType: 'llm_message',
    role,
    provider,
    ...(llmService ? { llmService } : {}),
    model,
    ...normalizedUsage,
    toolCallCount: toolCalls?.length ?? 0,
    autoToolCallCount: autoCallTools?.length ?? 0,
    status: 'success',
    rawUsageMetadata: usageMetadata,
    ...(responseMetadata ? { rawResponseMetadata: responseMetadata } : {}),
  };
}

export async function recordAIUsageEventsForMessages(
  ctx: Context,
  sessionId: string,
  messages: AIMessage[],
  transaction?: Transaction,
) {
  const recordableMessages = messages.filter(isRecordableLLMMessage);
  if (recordableMessages.length === 0) {
    return;
  }

  const conversation = await ctx.db.getRepository('aiConversations').findOne({
    filter: {
      sessionId,
    },
    transaction,
  });
  if (!conversation) {
    return;
  }

  const usageEvents = recordableMessages
    .map((message) => buildAIUsageEventValues(sessionId, message, conversation as RecordLike))
    .filter(isUsageEventValues);
  if (usageEvents.length === 0) {
    return;
  }

  const usageEventsRepo = ctx.db.getRepository('aiUsageEvents');
  for (const values of usageEvents) {
    await usageEventsRepo.updateOrCreate({
      filterKeys: ['messageId', 'eventType'],
      values,
      transaction,
    });
  }
}

function isUsageEventValues(value: AIUsageEventValues | null): value is AIUsageEventValues {
  return value !== null && value.messageId !== '';
}

function isRecordableLLMMessage(message: AIMessage): boolean {
  const role = readString(message, 'role');
  if (!role || SKIPPED_MESSAGE_ROLES.has(role)) {
    return false;
  }
  const metadata = readRecord(message, 'metadata');
  return Boolean(readString(metadata, 'provider') && readString(metadata, 'model'));
}

function isRecord(value: unknown): value is RecordLike {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readValue(source: unknown, key: string): unknown {
  if (!isRecord(source)) {
    return undefined;
  }
  const value = source[key];
  if (value !== undefined) {
    return value;
  }
  if (typeof source.get === 'function') {
    return source.get(key);
  }
  return undefined;
}

function readString(source: unknown, key: string): string | undefined {
  const value = readValue(source, key);
  return typeof value === 'string' && value !== '' ? value : undefined;
}

function readRecord(source: unknown, key: string): Record<string, unknown> | undefined {
  const value = readValue(source, key);
  return isRecord(value) ? value : undefined;
}

function readArray(source: unknown, key: string): unknown[] | undefined {
  const value = readValue(source, key);
  return Array.isArray(value) ? value : undefined;
}

function getNumericValue(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const normalized = normalizeNumber(source[key]);
    if (normalized !== undefined) {
      return normalized;
    }
  }
}

function getNestedNumericValue(source: Record<string, unknown>, path: string[]): number | undefined {
  let current: unknown = source;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return normalizeNumber(current);
}

function normalizeNumber(value: unknown): number | undefined {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return Math.max(0, Math.trunc(numeric));
}

function normalizeDate(value: unknown): Date {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) {
      return date;
    }
  }
  return new Date();
}
