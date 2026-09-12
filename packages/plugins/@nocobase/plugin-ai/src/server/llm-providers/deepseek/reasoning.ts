/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type OpenAI from 'openai';
import type { ReasoningOptions } from '../provider';

export type DeepSeekApiProtocol = 'chat-completions' | 'responses';
export type DeepSeekThinkingMode = 'enabled' | 'disabled';
export type DeepSeekReasoningEffort = 'low' | 'high' | 'max';

type DeepSeekReasoningBehavior = 'switchable' | 'always-on' | 'always-off';

type DeepSeekModelCapabilities = {
  protocol: DeepSeekApiProtocol;
  reasoning: DeepSeekReasoningBehavior;
  defaultThinking: DeepSeekThinkingMode;
  efforts: ReadonlySet<DeepSeekReasoningEffort>;
  supportsFunctionTools: boolean;
  supportsStructuredOutput: boolean;
  supportsWebSearch: boolean;
};

export type DeepSeekReasoningConfig = {
  protocol: DeepSeekApiProtocol;
  recognizedModel: boolean;
  thinking?: DeepSeekThinkingMode;
  effort?: DeepSeekReasoningEffort;
  unsupportedRequestFields: ReadonlySet<string>;
};

type DeepSeekChatRequest = OpenAI.Chat.ChatCompletionCreateParams;
type DeepSeekResponsesRequest = OpenAI.Responses.ResponseCreateParams;
type ReasoningSource = {
  content?: unknown;
  additional_kwargs?: Record<string, unknown>;
  response_metadata?: Record<string, unknown>;
};

const NO_EFFORTS = new Set<DeepSeekReasoningEffort>();
const V4_EFFORTS = new Set<DeepSeekReasoningEffort>(['low', 'high', 'max']);
const THINKING_UNSUPPORTED_FIELDS = new Set(['temperature', 'top_p', 'presence_penalty', 'frequency_penalty']);
const NO_UNSUPPORTED_FIELDS = new Set<string>();

export const DEEPSEEK_MODEL_CAPABILITIES = {
  'deepseek-v4-flash': {
    protocol: 'responses',
    reasoning: 'switchable',
    defaultThinking: 'enabled',
    efforts: V4_EFFORTS,
    supportsFunctionTools: true,
    supportsStructuredOutput: true,
    supportsWebSearch: true,
  },
  'deepseek-v4-pro': {
    protocol: 'responses',
    reasoning: 'switchable',
    defaultThinking: 'enabled',
    efforts: V4_EFFORTS,
    supportsFunctionTools: true,
    supportsStructuredOutput: true,
    supportsWebSearch: true,
  },
  'deepseek-chat': {
    protocol: 'chat-completions',
    reasoning: 'always-off',
    defaultThinking: 'disabled',
    efforts: NO_EFFORTS,
    supportsFunctionTools: true,
    supportsStructuredOutput: true,
    supportsWebSearch: false,
  },
  'deepseek-reasoner': {
    protocol: 'chat-completions',
    reasoning: 'always-on',
    defaultThinking: 'enabled',
    efforts: NO_EFFORTS,
    supportsFunctionTools: true,
    supportsStructuredOutput: true,
    supportsWebSearch: false,
  },
} as const satisfies Record<string, DeepSeekModelCapabilities>;

export type OfficialDeepSeekModel = keyof typeof DEEPSEEK_MODEL_CAPABILITIES;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOfficialDeepSeekModel = (model: string): model is OfficialDeepSeekModel => model in DEEPSEEK_MODEL_CAPABILITIES;

export const getDeepSeekModelCapabilities = (model: string): DeepSeekModelCapabilities | null =>
  isOfficialDeepSeekModel(model) ? DEEPSEEK_MODEL_CAPABILITIES[model] : null;

const normalizeReasoningEffort = (
  mode: Exclude<ReasoningOptions['mode'], 'default' | 'off'>,
): DeepSeekReasoningEffort => {
  if (mode === 'minimal' || mode === 'low') {
    return 'low';
  }
  if (mode === 'xhigh') {
    return 'high';
  }
  return 'high';
};

export const resolveDeepSeekReasoningConfig = (
  model: string,
  reasoning?: ReasoningOptions,
): DeepSeekReasoningConfig => {
  const capabilities = getDeepSeekModelCapabilities(model);
  if (!capabilities) {
    return {
      protocol: 'chat-completions',
      recognizedModel: false,
      unsupportedRequestFields: NO_UNSUPPORTED_FIELDS,
    };
  }

  const mode = reasoning?.mode ?? 'default';
  if (mode === 'default') {
    return {
      protocol: capabilities.protocol,
      recognizedModel: true,
      unsupportedRequestFields:
        capabilities.defaultThinking === 'enabled' ? THINKING_UNSUPPORTED_FIELDS : NO_UNSUPPORTED_FIELDS,
    };
  }

  if (mode === 'off') {
    if (capabilities.reasoning === 'always-on') {
      throw new Error(`DeepSeek model "${model}" does not support disabling reasoning`);
    }
    return {
      protocol: capabilities.protocol,
      recognizedModel: true,
      ...(capabilities.reasoning === 'switchable' ? { thinking: 'disabled' as const } : {}),
      unsupportedRequestFields: NO_UNSUPPORTED_FIELDS,
    };
  }

  if (capabilities.reasoning === 'always-off') {
    throw new Error(`DeepSeek model "${model}" does not support reasoning`);
  }

  const effort = normalizeReasoningEffort(mode);
  return {
    protocol: capabilities.protocol,
    recognizedModel: true,
    ...(capabilities.reasoning === 'switchable' ? { thinking: 'enabled' as const } : {}),
    ...(capabilities.efforts.has(effort) ? { effort } : {}),
    unsupportedRequestFields: THINKING_UNSUPPORTED_FIELDS,
  };
};

export const getDeepSeekReasoningRequestParams = (config: DeepSeekReasoningConfig): Record<string, unknown> => {
  if (!config.recognizedModel) {
    return {};
  }
  if (config.protocol === 'responses') {
    if (config.thinking === 'disabled') {
      return { reasoning: { effort: 'none' } };
    }
    return config.effort ? { reasoning: { effort: config.effort } } : {};
  }
  return {
    ...(config.thinking ? { thinking: { type: config.thinking } } : {}),
    ...(config.effort ? { reasoning_effort: config.effort } : {}),
  };
};

const removeUnsupportedRequestFields = (request: Record<string, unknown>, fields: ReadonlySet<string>) => {
  for (const field of fields) {
    delete request[field];
  }
};

export const normalizeDeepSeekChatRequest = <Request extends DeepSeekChatRequest>(
  request: Request,
  config: DeepSeekReasoningConfig,
): Request => {
  if (!config.recognizedModel) {
    return request;
  }
  const mutableRequest = request as unknown as Record<string, unknown>;
  delete mutableRequest.thinking;
  delete mutableRequest.reasoning_effort;
  Object.assign(mutableRequest, getDeepSeekReasoningRequestParams(config));
  removeUnsupportedRequestFields(mutableRequest, config.unsupportedRequestFields);
  return request;
};

const normalizeResponsesReasoningItems = (input: unknown) => {
  if (!Array.isArray(input)) {
    return;
  }
  for (const item of input) {
    if (!isRecord(item) || item.type !== 'reasoning') {
      continue;
    }
    const hasReasoningContent =
      Array.isArray(item.content) &&
      item.content.some((part) => isRecord(part) && part.type === 'reasoning_text' && typeof part.text === 'string');
    if (hasReasoningContent || !Array.isArray(item.summary)) {
      continue;
    }
    const text = item.summary
      .filter(isRecord)
      .map((part) => part.text)
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join('');
    if (text) {
      item.content = [{ type: 'reasoning_text', text }];
      item.summary = [];
    }
  }
};

export const normalizeDeepSeekResponsesRequest = <Request extends DeepSeekResponsesRequest>(
  request: Request,
  config: DeepSeekReasoningConfig,
): Request => {
  if (!config.recognizedModel) {
    return request;
  }
  const mutableRequest = request as unknown as Record<string, unknown>;
  delete mutableRequest.reasoning;
  Object.assign(mutableRequest, getDeepSeekReasoningRequestParams(config));
  removeUnsupportedRequestFields(mutableRequest, config.unsupportedRequestFields);
  normalizeResponsesReasoningItems(request.input);
  return request;
};

const getReasoningItemText = (value: unknown): string => {
  if (!isRecord(value)) {
    return '';
  }
  if (Array.isArray(value.content)) {
    const content = value.content
      .filter(isRecord)
      .filter((part) => part.type === 'reasoning_text')
      .map((part) => part.text)
      .filter((text): text is string => typeof text === 'string' && text.length > 0)
      .join('');
    if (content) {
      return content;
    }
  }
  if (Array.isArray(value.summary)) {
    return value.summary
      .filter(isRecord)
      .map((part) => part.text)
      .filter((text): text is string => typeof text === 'string' && text.length > 0)
      .join('');
  }
  return '';
};

export const extractDeepSeekReasoningText = (source: Partial<ReasoningSource>): string => {
  const reasoningContent = source.additional_kwargs?.reasoning_content;
  if (typeof reasoningContent === 'string' && reasoningContent.length > 0) {
    return reasoningContent;
  }

  if (Array.isArray(source.content)) {
    const contentBlockText = source.content
      .filter(isRecord)
      .filter((block) => block.type === 'reasoning')
      .map((block) => (typeof block.reasoning === 'string' ? block.reasoning : ''))
      .filter(Boolean)
      .join('');
    if (contentBlockText) {
      return contentBlockText;
    }
  }

  const additionalReasoningText = getReasoningItemText(source.additional_kwargs?.reasoning);
  if (additionalReasoningText) {
    return additionalReasoningText;
  }

  const output = source.response_metadata?.output;
  if (Array.isArray(output)) {
    const reasoningItem = output.find((item) => isRecord(item) && item.type === 'reasoning');
    return getReasoningItemText(reasoningItem);
  }
  return '';
};

export const getDeepSeekResponsesReasoningItem = (source: Partial<ReasoningSource>): Record<string, unknown> | null => {
  const output = source.response_metadata?.output;
  if (Array.isArray(output)) {
    const reasoningItem = output.find((item) => isRecord(item) && item.type === 'reasoning');
    if (isRecord(reasoningItem)) {
      return reasoningItem;
    }
  }
  return isRecord(source.additional_kwargs?.reasoning) ? source.additional_kwargs.reasoning : null;
};

export async function* adaptDeepSeekResponsesStream(
  stream: AsyncIterable<OpenAI.Responses.ResponseStreamEvent>,
): AsyncGenerator<OpenAI.Responses.ResponseStreamEvent> {
  const emittedWebSearchItems = new Set<string>();
  for await (const event of stream) {
    if (event.type === 'response.reasoning_text.delta') {
      yield {
        type: 'response.reasoning_summary_text.delta',
        delta: event.delta,
        item_id: event.item_id,
        output_index: event.output_index,
        sequence_number: event.sequence_number,
        summary_index: event.content_index,
      };
      continue;
    }
    if (
      event.type === 'response.output_item.added' &&
      event.item.type === 'web_search_call' &&
      isRecord(event.item.action) &&
      typeof event.item.action.query === 'string'
    ) {
      emittedWebSearchItems.add(event.item.id);
      yield {
        type: 'response.output_item.done',
        item: event.item,
        output_index: event.output_index,
        sequence_number: event.sequence_number,
      };
      continue;
    }
    if (
      event.type === 'response.output_item.done' &&
      event.item.type === 'web_search_call' &&
      emittedWebSearchItems.has(event.item.id)
    ) {
      continue;
    }
    yield event;
  }
}
