/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { ChatOpenAICompletions } from '@langchain/openai';
import type OpenAI from 'openai';

export const REASONING_MAP_KEY = '__nb_reasoning_map';

export const getToolCallsKey = (toolCalls: Array<{ id?: string; name?: string; function?: { name?: string } }> = []) =>
  toolCalls
    .map((toolCall) => {
      const id = toolCall?.id ?? '';
      const name = toolCall?.name ?? toolCall?.function?.name ?? '';
      return `${id}:${name}`;
    })
    .join('|');

export const collectReasoningMap = (messages: BaseMessage[]) => {
  const reasoningMap = new Map<string, string>();
  for (const message of messages ?? []) {
    if (!AIMessage.isInstance(message)) {
      continue;
    }
    if (!message.tool_calls?.length) {
      continue;
    }
    const reasoningContent = message.additional_kwargs?.reasoning_content;
    if (typeof reasoningContent !== 'string' || !reasoningContent) {
      continue;
    }
    const key = getToolCallsKey(message.tool_calls as any[]);
    if (key) {
      reasoningMap.set(key, reasoningContent);
    }
  }
  return reasoningMap;
};

export const patchRequestMessagesReasoning = (request: any, reasoningMap?: Map<string, string>) => {
  if (!reasoningMap?.size || !Array.isArray(request?.messages)) {
    return;
  }
  const lastMessage = request.messages.at(-1);
  if (lastMessage?.role !== 'tool') {
    return;
  }
  for (const message of request.messages) {
    if (message?.role !== 'assistant') {
      continue;
    }
    if (!Array.isArray(message.tool_calls) || message.tool_calls.length === 0) {
      continue;
    }
    if (message.reasoning_content) {
      continue;
    }
    const key = getToolCallsKey(message.tool_calls);
    const reasoningContent = key ? reasoningMap.get(key) : undefined;
    if (reasoningContent) {
      message.reasoning_content = reasoningContent;
    }
  }
};

export class ReasoningChatOpenAI extends ChatOpenAICompletions {
  async _generate(messages: BaseMessage[], options: any, runManager?: any) {
    const reasoningMap = collectReasoningMap(messages);
    const nextOptions = {
      ...(options || {}),
      [REASONING_MAP_KEY]: reasoningMap,
    };
    return super._generate(messages, nextOptions, runManager);
  }

  async *_streamResponseChunks(messages: BaseMessage[], options: any, runManager?: any) {
    const reasoningMap =
      options?.[REASONING_MAP_KEY] instanceof Map
        ? (options[REASONING_MAP_KEY] as Map<string, string>)
        : collectReasoningMap(messages);
    const nextOptions = {
      ...(options || {}),
      [REASONING_MAP_KEY]: reasoningMap,
    };
    yield* super._streamResponseChunks(messages, nextOptions, runManager);
  }

  _convertCompletionsDeltaToBaseMessageChunk(delta: any, rawResponse: any, defaultRole?: any) {
    const messageChunk = super._convertCompletionsDeltaToBaseMessageChunk(delta, rawResponse, defaultRole);
    if (delta?.reasoning_content) {
      messageChunk.additional_kwargs = {
        ...(messageChunk.additional_kwargs || {}),
        reasoning_content: delta.reasoning_content,
      };
    }
    return messageChunk;
  }

  _convertCompletionsMessageToBaseMessage(message: any, rawResponse: any) {
    const langChainMessage = super._convertCompletionsMessageToBaseMessage(message, rawResponse);
    if (message?.reasoning_content) {
      langChainMessage.additional_kwargs = {
        ...(langChainMessage.additional_kwargs || {}),
        reasoning_content: message.reasoning_content,
      };
    }
    return langChainMessage;
  }

  completionWithRetry(
    request: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>;
  completionWithRetry(
    request: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion>;
  async completionWithRetry(
    request: OpenAI.Chat.ChatCompletionCreateParamsStreaming | OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> | OpenAI.Chat.Completions.ChatCompletion> {
    const reasoningMap = requestOptions?.[REASONING_MAP_KEY] as Map<string, string> | undefined;
    patchRequestMessagesReasoning(request, reasoningMap);
    if (request.stream) {
      return super.completionWithRetry(request as OpenAI.Chat.ChatCompletionCreateParamsStreaming, requestOptions);
    }
    return super.completionWithRetry(request as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, requestOptions);
  }
}
