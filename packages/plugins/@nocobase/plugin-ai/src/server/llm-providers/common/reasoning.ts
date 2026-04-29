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

export const collectReasoningMap = (messages: BaseMessage[]) => {
  const reasoningMap = new Map<string, string>();
  for (let i = 0; i < messages.length; i++) {
    const message = (messages ?? [])[i];
    if (!AIMessage.isInstance(message)) {
      continue;
    }
    const reasoningContent = message.additional_kwargs?.reasoning_content;
    if (typeof reasoningContent !== 'string' || !reasoningContent) {
      continue;
    }
    reasoningMap.set(String(i), reasoningContent);
  }
  return reasoningMap;
};

export const patchRequestMessagesReasoning = (request: any, reasoningMap?: Map<string, string>) => {
  if (!reasoningMap?.size || !Array.isArray(request?.messages)) {
    return;
  }
  if (request.messages.some((msg: any) => msg.role === 'tool')) {
    for (let i = 0; i < request.messages.length; i++) {
      const message = request.messages[i];
      if (message?.role !== 'assistant') {
        continue;
      }
      if (message.reasoning_content) {
        continue;
      }
      const reasoningContent = reasoningMap.get(String(i));
      if (reasoningContent) {
        message.reasoning_content = reasoningContent;
      }
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
