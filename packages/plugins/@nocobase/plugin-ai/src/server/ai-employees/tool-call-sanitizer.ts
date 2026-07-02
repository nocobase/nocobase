/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage } from '@langchain/core/messages';

type AdditionalKwargs = Record<string, unknown>;

type DiscardedToolCallsInfo = {
  rawToolCallCount: number;
  parsedToolCallCount: number;
  rawToolCallIds: string[];
  rawToolCallNames: string[];
};

type SanitizeAdditionalKwargsOptions = {
  onDiscard?: (info: DiscardedToolCallsInfo) => void;
};

type SanitizeAdditionalKwargsResult = {
  changed: boolean;
  additionalKwargs?: AdditionalKwargs;
};

const hasRawToolCalls = (additionalKwargs?: AdditionalKwargs) =>
  Array.isArray(additionalKwargs?.tool_calls) && additionalKwargs.tool_calls.length > 0;

const hasParsedToolCalls = (toolCalls?: unknown[] | null) => Array.isArray(toolCalls) && toolCalls.length > 0;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const collectRawToolCallValues = (toolCalls: unknown[], key: 'id' | 'name') =>
  toolCalls
    .map((toolCall) => {
      if (!isRecord(toolCall)) {
        return null;
      }
      if (key === 'name') {
        const fn = toolCall.function;
        if (isRecord(fn) && typeof fn.name === 'string') {
          return fn.name;
        }
      }
      const value = toolCall[key];
      return typeof value === 'string' ? value : null;
    })
    .filter((value): value is string => Boolean(value));

export const sanitizeAdditionalKwargsForToolCalls = (
  additionalKwargs: AdditionalKwargs | undefined,
  parsedToolCalls?: unknown[] | null,
  options: SanitizeAdditionalKwargsOptions = {},
): SanitizeAdditionalKwargsResult => {
  if (!hasRawToolCalls(additionalKwargs) || hasParsedToolCalls(parsedToolCalls)) {
    return {
      changed: false,
      additionalKwargs,
    };
  }

  const rawToolCalls = additionalKwargs.tool_calls as unknown[];
  options.onDiscard?.({
    rawToolCallCount: rawToolCalls.length,
    parsedToolCallCount: parsedToolCalls?.length ?? 0,
    rawToolCallIds: collectRawToolCallValues(rawToolCalls, 'id'),
    rawToolCallNames: collectRawToolCallValues(rawToolCalls, 'name'),
  });

  const sanitized = { ...additionalKwargs };
  delete sanitized.tool_calls;

  return {
    changed: true,
    additionalKwargs: Object.keys(sanitized).length > 0 ? sanitized : undefined,
  };
};

export const sanitizeLangChainAIMessage = (message: AIMessage, options: SanitizeAdditionalKwargsOptions = {}) => {
  const sanitized = sanitizeAdditionalKwargsForToolCalls(message.additional_kwargs, message.tool_calls, options);

  if (!sanitized.changed) {
    return null;
  }

  message.additional_kwargs = sanitized.additionalKwargs ?? {};
  message.lc_kwargs.additional_kwargs = message.additional_kwargs;

  return message;
};
