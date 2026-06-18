/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatDeepSeek } from '@langchain/deepseek';
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { LLMProvider, ParsedAttachmentResult } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { Model } from '@nocobase/database';
import _ from 'lodash';
import {
  collectReasoningMap,
  MODEL_KWARGS_KEY,
  patchRequestMessagesReasoning,
  patchRequestModelKwargs,
  REASONING_MAP_KEY,
} from './common/reasoning';
import { Context } from '@nocobase/actions';
import PluginAIServer from '../plugin';
import path from 'node:path';
import { AttachmentModel } from '@nocobase/plugin-file-manager';

type DeepSeekCompletionWithRetry = ChatDeepSeek['completionWithRetry'];

class ReasoningDeepSeek extends ChatDeepSeek {
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

  completionWithRetry = (async (request: unknown, requestOptions?: unknown) => {
    const reasoningMap = requestOptions?.[REASONING_MAP_KEY] as Map<string, string> | undefined;
    const modelKwargs = requestOptions?.[MODEL_KWARGS_KEY] as Record<string, unknown> | undefined;
    patchRequestMessagesReasoning(request, reasoningMap);
    patchRequestModelKwargs(request, modelKwargs);
    return super.completionWithRetry(request as never, requestOptions as never);
  }) as DeepSeekCompletionWithRetry;
}

export class DeepSeekProvider extends LLMProvider {
  declare chatModel: ChatDeepSeek;

  get baseURL() {
    return 'https://api.deepseek.com';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat } = this.modelOptions || {};

    const modelKwargs: Record<string, any> = {};

    // Only set response_format when responseFormat is explicitly provided
    if (responseFormat) {
      modelKwargs['response_format'] = {
        type: responseFormat,
      };
    }

    return new ReasoningDeepSeek({
      apiKey,
      ...this.modelOptions,
      modelKwargs,
      configuration: {
        baseURL: this.getResolvedBaseURL(),
      },
      verbose: false,
    });
  }

  parseResponseMessage(message: Model) {
    const result = super.parseResponseMessage(message);
    if (['user', 'tool'].includes(result?.role)) {
      return result;
    }
    const { metadata } = message?.toJSON() ?? {};
    if (!_.isEmpty(metadata?.additional_kwargs?.reasoning_content)) {
      result.content = {
        ...(result.content ?? {}),
        reasoning: {
          status: 'stop',
          content: metadata?.additional_kwargs.reasoning_content,
        },
      };
    }
    return result;
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } {
    if (!_.isEmpty(chunk?.additional_kwargs?.reasoning_content)) {
      return {
        status: 'streaming',
        content: chunk.additional_kwargs.reasoning_content as string,
      };
    }
    return null;
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    return false;
  }
}

export const deepseekProviderOptions: LLMProviderMeta = {
  title: 'DeepSeek',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['deepseek-chat', 'deepseek-reasoner'],
  },
  provider: DeepSeekProvider,
};
