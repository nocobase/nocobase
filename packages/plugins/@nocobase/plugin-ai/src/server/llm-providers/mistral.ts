/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { ChatMistralAI, MistralAIEmbeddings } from '@langchain/mistralai';
import { checkUrlAgainstWhitelist, serverRequest } from '@nocobase/utils';
import { AttachmentModel } from '@nocobase/plugin-file-manager';
import { EmbeddingProvider, LLMProvider, LLMProviderInvokeOptions } from './provider';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { AIChatContext, AIMessageInput } from '../types/ai-chat-conversation.type';
import { Model } from '@nocobase/database';

const MISTRAL_URL = 'https://api.mistral.ai';
const MISTRAL_REASONING_EFFORT = 'high';
const MISTRAL_REASONING_MODELS = new Set(['mistral-small-latest', 'mistral-medium-3-5']);

type MistralCallOptions = LLMProviderInvokeOptions & {
  response_format?: {
    type: 'text' | 'json_object';
  };
};

type MistralBeforeRequestHook = (request: Request) => Request | void | Promise<Request | void>;

type MistralContentChunk = {
  type?: string;
  text?: string;
  thinking?: MistralContentChunk[];
};

function omitDisabledNumberOptions(options: Record<string, unknown>) {
  for (const key of ['maxTokens', 'maxRetries']) {
    if (options[key] === -1) {
      delete options[key];
    }
  }
}

function extractTextChunks(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  return content
    .filter((chunk): chunk is MistralContentChunk => chunk && typeof chunk === 'object')
    .filter((chunk) => chunk.type === 'text' && typeof chunk.text === 'string')
    .map((chunk) => chunk.text)
    .join('');
}

function extractThinkingChunks(content: unknown): string {
  if (!Array.isArray(content)) {
    return '';
  }
  return content
    .filter((chunk): chunk is MistralContentChunk => chunk && typeof chunk === 'object')
    .filter((chunk) => chunk.type === 'thinking' && Array.isArray(chunk.thinking))
    .map((chunk) => extractTextChunks(chunk.thinking))
    .join('');
}

export const injectMistralReasoningEffort: MistralBeforeRequestHook = async (request) => {
  if (request.method !== 'POST') {
    return;
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return;
  }
  const body = (await request
    .clone()
    .json()
    .catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return;
  }
  if (typeof body.model !== 'string' || !MISTRAL_REASONING_MODELS.has(body.model)) {
    return;
  }
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  return new Request(request, {
    headers,
    body: JSON.stringify({
      ...body,
      reasoning_effort: MISTRAL_REASONING_EFFORT,
    }),
  });
};

export class MistralProvider extends LLMProvider {
  declare chatModel: ChatMistralAI;

  get baseURL() {
    return MISTRAL_URL;
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput, ...modelOptions } = this.modelOptions || {};
    omitDisabledNumberOptions(modelOptions);
    const beforeRequestHooks = Array.isArray(modelOptions.beforeRequestHooks)
      ? ([injectMistralReasoningEffort, ...modelOptions.beforeRequestHooks] as MistralBeforeRequestHook[])
      : [injectMistralReasoningEffort];

    return new ChatMistralAI({
      apiKey,
      ...modelOptions,
      beforeRequestHooks,
      serverURL: this.getResolvedServerURL(),
      verbose: false,
    });
  }

  async stream(context: AIChatContext, options?: MistralCallOptions) {
    return super.stream(context, this.withResponseFormat(options));
  }

  async invoke(context: AIChatContext, options?: MistralCallOptions) {
    return super.invoke(context, this.withResponseFormat(options));
  }

  async listModels(): Promise<{
    models?: { id: string }[];
    code?: number;
    errMsg?: string;
  }> {
    const options = this.serviceOptions || {};
    const apiKey = options.apiKey;
    let url: string;
    try {
      url = this.buildMistralRequestURL('v1/models');
    } catch (e) {
      return { code: 400, errMsg: e instanceof Error ? e.message : String(e) };
    }
    if (!apiKey) {
      return { code: 400, errMsg: 'API Key required' };
    }
    try {
      const res = await serverRequest({
        method: 'GET',
        url,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return { models: res?.data?.data };
    } catch (e) {
      const error = e as {
        response?: {
          status?: number;
          data?: string | { message?: string; detail?: string | { message?: string } };
          statusText?: string;
        };
        message?: string;
      };
      const status = error.response?.status || 500;
      const data = error.response?.data;
      const errorMsg =
        (typeof data === 'object' ? data.message : undefined) ||
        (typeof data === 'object' && typeof data.detail === 'object' ? data.detail.message : undefined) ||
        (typeof data === 'object' && typeof data.detail === 'string' ? data.detail : undefined) ||
        (typeof data === 'string' ? data : undefined) ||
        error.response?.statusText ||
        error.message;
      return { code: status, errMsg: errorMsg };
    }
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    return attachment.mimetype?.startsWith('image/') ?? false;
  }

  reshapeAIMessage({ aiMessage, values }: { aiMessage: AIMessage; values: AIMessageInput }) {
    const reasoning = extractThinkingChunks(aiMessage.content);
    if (Array.isArray(aiMessage.content)) {
      aiMessage.content = extractTextChunks(aiMessage.content);
    }
    if (!reasoning) {
      return;
    }
    values.metadata.additional_kwargs = {
      ...(values.metadata.additional_kwargs ?? {}),
      reasoning_content: reasoning,
    };
  }

  parseResponseMessage(message: Model) {
    const result = super.parseResponseMessage(message);
    if (['user', 'tool'].includes(result?.role)) {
      return result;
    }
    const metadataReasoning = result?.content?.metadata?.additional_kwargs?.reasoning_content;
    if (typeof metadataReasoning === 'string' && metadataReasoning) {
      result.content = {
        ...(result.content ?? {}),
        reasoning: {
          status: 'stop',
          content: metadataReasoning,
        },
      };
      return result;
    }
    const rawContent = result?.content?.content;
    const reasoning = extractThinkingChunks(rawContent);
    if (reasoning) {
      result.content = {
        ...(result.content ?? {}),
        content: extractTextChunks(rawContent),
        reasoning: {
          status: 'stop',
          content: reasoning,
        },
      };
    }
    return result;
  }

  parseResponseChunk(chunk: unknown) {
    if (Array.isArray(chunk)) {
      return extractTextChunks(chunk);
    }
    return super.parseResponseChunk(chunk);
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } | null {
    const content = extractThinkingChunks(chunk?.content);
    if (!content) {
      return null;
    }
    return {
      status: 'streaming',
      content,
    };
  }

  private withResponseFormat(options?: MistralCallOptions): MistralCallOptions | undefined {
    const responseFormat = this.modelOptions?.responseFormat;
    if (responseFormat !== 'json_object') {
      return options;
    }
    return {
      ...(options || {}),
      response_format: {
        type: responseFormat,
      },
    };
  }

  private getResolvedServerURL(): string {
    return this.getResolvedBaseURL().replace(/\/v1$/, '');
  }

  private buildMistralRequestURL(pathname: string): string {
    const url = new URL(pathname.replace(/^\/+/, ''), `${this.getResolvedServerURL()}/`).toString();
    checkUrlAgainstWhitelist(url);
    return url;
  }
}

export class MistralEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return MISTRAL_URL;
  }

  createEmbedding(): EmbeddingsInterface {
    return new MistralAIEmbeddings({
      apiKey: this.apiKey,
      serverURL: this.baseURL.replace(/\/v1$/, ''),
      model: this.model,
    });
  }
}

export const mistralProviderOptions: LLMProviderMeta = {
  title: 'Mistral AI',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-medium-3-5',
      'mistral-small-latest',
      'ministral-8b-latest',
      'ministral-3b-latest',
      'codestral-latest',
      'pixtral-large-latest',
    ],
    [SupportedModel.EMBEDDING]: ['mistral-embed'],
  },
  provider: MistralProvider,
  embedding: MistralEmbeddingProvider,
};
