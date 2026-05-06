/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import _ from 'lodash';
import { convertCompletionsDeltaToBaseMessageChunk } from '@langchain/openai';
import { AIMessageChunk, BaseMessageChunk } from '@langchain/core/messages';
import { ReasoningChatOpenAI } from './common/reasoning';
import { AttachmentModel } from '@nocobase/plugin-file-manager';
import { Model } from '@nocobase/database';

export class MiMoProvider extends LLMProvider {
  declare chatModel: ReasoningChatOpenAI;

  get baseURL() {
    return 'https://api.xiaomimimo.com/v1';
  }

  createModel() {
    const { baseURL, apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput } = this.modelOptions || {};
    const { schema } = structuredOutput || {};
    const responseFormatOptions = {
      type: responseFormat ?? 'text',
    };
    if (responseFormat === 'json_schema' && schema) {
      responseFormatOptions['json_schema'] = schema;
    }

    return new ChatMiMoCompletions({
      apiKey,
      ...this.modelOptions,
      modelKwargs: {
        response_format: responseFormatOptions,
      },
      configuration: {
        baseURL: baseURL || this.baseURL,
      },
      verbose: true,
    });
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    const media = ['image/'];
    const supportedMedia = media.some((it) => attachment?.mimetype?.startsWith(it));
    return supportedMedia;
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

  protected builtInTools(): any[] {
    if (this.modelOptions?.builtIn?.webSearch === true) {
      return [
        {
          type: 'web_search',
          force_search: true,
        },
      ];
    }
    return [];
  }

  isToolConflict(): boolean {
    return true;
  }
}

class ChatMiMoCompletions extends ReasoningChatOpenAI {
  _convertCompletionsDeltaToBaseMessageChunk(delta, rawResponse, defaultRole): BaseMessageChunk {
    const chunk = convertCompletionsDeltaToBaseMessageChunk({
      delta,
      rawResponse,
      includeRawResponse: this.__includeRawResponse,
      defaultRole,
    });

    if (chunk instanceof AIMessageChunk) {
      if (delta.reasoning_content) {
        chunk.additional_kwargs.reasoning_content = delta.reasoning_content;
      }
    }

    return chunk;
  }
}

export const mimoProviderOptions: LLMProviderMeta = {
  title: 'MiMo',
  supportWebSearch: true,
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['mimo-v2.5-pro', 'mimo-v2.5'],
  },
  provider: MiMoProvider,
};
