/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatDeepSeek, type ChatDeepSeekInput } from '@langchain/deepseek';
import { AIMessage, AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { BaseChatOpenAIFields, ChatOpenAI, ChatOpenAIFields, ChatOpenAIResponses } from '@langchain/openai';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import type OpenAI from 'openai';
import { Model } from '@nocobase/database';
import { LLMProvider, ReasoningOptions, ResolvedReasoningOptions } from '../provider';
import { LLMProviderMeta, SupportedModel } from '../../manager/ai-manager';
import {
  collectReasoningMap,
  MODEL_KWARGS_KEY,
  patchRequestMessagesReasoning,
  patchRequestModelKwargs,
  REASONING_MAP_KEY,
} from '../common/reasoning';
import {
  adaptDeepSeekResponsesStream,
  DeepSeekReasoningConfig,
  extractDeepSeekReasoningText,
  getDeepSeekModelCapabilities,
  getDeepSeekReasoningRequestParams,
  getDeepSeekResponsesReasoningItem,
  normalizeDeepSeekChatRequest,
  normalizeDeepSeekResponsesRequest,
  resolveDeepSeekReasoningConfig,
} from './reasoning';
import { stripToolCallTags } from '../../utils';
import type { AIMessageInput } from '../../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const collectReferences = (content: unknown, responseMetadata: unknown) => {
  const references: { title: string; url: string }[] = [];
  const addAnnotations = (annotations: unknown) => {
    if (!Array.isArray(annotations)) {
      return;
    }
    for (const annotation of annotations) {
      if (!isRecord(annotation)) {
        continue;
      }
      const value = isRecord(annotation.value) ? annotation.value : annotation;
      const url = typeof annotation.url === 'string' ? annotation.url : value.url;
      const title = typeof annotation.title === 'string' ? annotation.title : value.title;
      if (typeof url === 'string') {
        references.push({ title: typeof title === 'string' ? title : '', url });
      }
    }
  };

  if (Array.isArray(content)) {
    for (const block of content) {
      if (isRecord(block) && block.type === 'text') {
        addAnnotations(block.annotations);
      }
    }
  }
  if (isRecord(responseMetadata) && Array.isArray(responseMetadata.output)) {
    for (const item of responseMetadata.output) {
      if (!isRecord(item) || item.type !== 'message' || !Array.isArray(item.content)) {
        continue;
      }
      for (const part of item.content) {
        if (isRecord(part) && part.type === 'output_text') {
          addAnnotations(part.annotations);
        }
      }
    }
  }
  return Array.from(new Map(references.map((reference) => [reference.url, reference])).values());
};

class ReasoningDeepSeek extends ChatDeepSeek {
  constructor(
    fields: ChatDeepSeekInput,
    private readonly reasoningConfig: DeepSeekReasoningConfig,
  ) {
    super(fields);
  }

  async _generate(messages: BaseMessage[], options: this['ParsedCallOptions'], runManager?: CallbackManagerForLLMRun) {
    const reasoningMap = collectReasoningMap(messages);
    return super._generate(
      messages,
      {
        ...(options || {}),
        [REASONING_MAP_KEY]: reasoningMap,
      } as unknown as this['ParsedCallOptions'],
      runManager,
    );
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun,
  ) {
    const reasoningMap =
      options?.[REASONING_MAP_KEY] instanceof Map
        ? (options[REASONING_MAP_KEY] as Map<string, string>)
        : collectReasoningMap(messages);
    yield* super._streamResponseChunks(
      messages,
      {
        ...(options || {}),
        [REASONING_MAP_KEY]: reasoningMap,
      } as unknown as this['ParsedCallOptions'],
      runManager,
    );
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
    const modelKwargs = requestOptions?.[MODEL_KWARGS_KEY] as Record<string, unknown> | undefined;
    patchRequestMessagesReasoning(request, reasoningMap);
    patchRequestModelKwargs(request, modelKwargs);
    normalizeDeepSeekChatRequest(request, this.reasoningConfig);
    if (request.stream === true) {
      return super.completionWithRetry(request as OpenAI.Chat.ChatCompletionCreateParamsStreaming, requestOptions);
    }
    return super.completionWithRetry(request as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, requestOptions);
  }
}

class DeepSeekChatOpenAIResponses extends ChatOpenAIResponses {
  constructor(
    fields: BaseChatOpenAIFields,
    private readonly reasoningConfig: DeepSeekReasoningConfig,
  ) {
    super(fields);
  }

  completionWithRetry(
    request: OpenAI.Responses.ResponseCreateParamsStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<AsyncIterable<OpenAI.Responses.ResponseStreamEvent>>;
  completionWithRetry(
    request: OpenAI.Responses.ResponseCreateParamsNonStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<OpenAI.Responses.Response>;
  async completionWithRetry(
    request: OpenAI.Responses.ResponseCreateParamsStreaming | OpenAI.Responses.ResponseCreateParamsNonStreaming,
    requestOptions?: OpenAI.RequestOptions,
  ): Promise<AsyncIterable<OpenAI.Responses.ResponseStreamEvent> | OpenAI.Responses.Response> {
    normalizeDeepSeekResponsesRequest(request, this.reasoningConfig);
    if (request.stream === true) {
      const stream = await super.completionWithRetry(
        request as OpenAI.Responses.ResponseCreateParamsStreaming,
        requestOptions,
      );
      return adaptDeepSeekResponsesStream(stream);
    }
    return super.completionWithRetry(request as OpenAI.Responses.ResponseCreateParamsNonStreaming, requestOptions);
  }
}

export class DeepSeekProvider extends LLMProvider {
  declare chatModel: ChatDeepSeek | ChatOpenAI;

  get baseURL() {
    return 'https://api.deepseek.com';
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { responseFormat, structuredOutput, ...modelOptions } = this.modelOptions || {};
    const model = typeof modelOptions.model === 'string' ? modelOptions.model : '';
    const reasoningConfig = resolveDeepSeekReasoningConfig(model, this.modelReasoningOptions);
    const reasoningParams = getDeepSeekReasoningRequestParams(reasoningConfig);

    if (reasoningConfig.protocol === 'responses') {
      const { name, schema, strict } = structuredOutput || {};
      let responseFormatOptions: Record<string, unknown> = {
        type: responseFormat ?? 'text',
      };
      if (responseFormat === 'json_schema' && schema) {
        responseFormatOptions = {
          ...responseFormatOptions,
          schema,
          name: name ?? 'default',
          strict: strict ?? false,
        };
      }
      const fields: ChatOpenAIFields = {
        apiKey,
        ...modelOptions,
        modelKwargs: {
          text: {
            format: responseFormatOptions,
          },
          ...reasoningParams,
        },
        configuration: {
          baseURL: this.getResolvedBaseURL(),
        },
        verbose: false,
      };
      return new ChatOpenAI({
        ...fields,
        responses: new DeepSeekChatOpenAIResponses(fields, reasoningConfig),
        useResponsesApi: true,
      });
    }

    const modelKwargs: Record<string, unknown> = {
      ...reasoningParams,
    };
    if (responseFormat) {
      modelKwargs.response_format = {
        type: responseFormat,
      };
    }
    return new ReasoningDeepSeek(
      {
        apiKey,
        ...modelOptions,
        modelKwargs,
        configuration: {
          baseURL: this.getResolvedBaseURL(),
        },
        verbose: false,
      },
      reasoningConfig,
    );
  }

  parseResponseChunk(chunk: unknown) {
    if (Array.isArray(chunk)) {
      const text = chunk
        .filter(isRecord)
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .filter((value): value is string => typeof value === 'string')
        .join('');
      return text ? stripToolCallTags(text) : null;
    }
    return typeof chunk === 'string' ? stripToolCallTags(chunk) : null;
  }

  parseResponseMessage(message: Model) {
    const result = super.parseResponseMessage(message);
    if (['user', 'tool'].includes(result?.role)) {
      return result;
    }
    const json = message?.toJSON?.() ?? {};
    const metadata = isRecord(json.metadata) ? json.metadata : {};
    const additionalKwargs = isRecord(metadata.additional_kwargs) ? metadata.additional_kwargs : {};
    const responseMetadata = isRecord(metadata.response_metadata) ? metadata.response_metadata : {};
    const reasoningContent = extractDeepSeekReasoningText({
      additional_kwargs: additionalKwargs,
      response_metadata: responseMetadata,
    });
    if (reasoningContent) {
      result.content = {
        ...(result.content ?? {}),
        reasoning: {
          status: 'stop',
          content: reasoningContent,
        },
      };
    }
    const references = collectReferences(result?.content?.content, responseMetadata);
    if (references.length) {
      result.content.reference = references;
    }
    return result;
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } | null {
    const content = extractDeepSeekReasoningText({
      content: chunk.content,
      additional_kwargs: chunk.additional_kwargs,
    });
    return content ? { status: 'streaming', content } : null;
  }

  reshapeAIMessage({ aiMessage, values }: { aiMessage: AIMessage; values: AIMessageInput }) {
    const reasoningItem = getDeepSeekResponsesReasoningItem(aiMessage);
    const reasoningContent = extractDeepSeekReasoningText(aiMessage);
    if (reasoningItem || reasoningContent) {
      const additionalKwargs = {
        ...(values.metadata.additional_kwargs ?? {}),
        ...(reasoningItem ? { reasoning: reasoningItem } : {}),
        ...(reasoningContent ? { reasoning_content: reasoningContent } : {}),
      };
      values.metadata.additional_kwargs = additionalKwargs;
      aiMessage.additional_kwargs = {
        ...aiMessage.additional_kwargs,
        ...(reasoningItem ? { reasoning: reasoningItem } : {}),
      };
      aiMessage.lc_kwargs.additional_kwargs = aiMessage.additional_kwargs;
    }

    const references = collectReferences(aiMessage.content, aiMessage.response_metadata);
    if (references.length) {
      values.content.reference = references;
    }
  }

  prepareStoredAssistantAdditionalKwargs(
    additionalKwargs?: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (getDeepSeekModelCapabilities(String(this.modelOptions?.model))?.protocol !== 'responses' || !additionalKwargs) {
      return additionalKwargs;
    }
    const nextAdditionalKwargs = { ...additionalKwargs };
    delete nextAdditionalKwargs.reasoning;
    delete nextAdditionalKwargs.reasoning_content;
    return Object.keys(nextAdditionalKwargs).length ? nextAdditionalKwargs : undefined;
  }

  protected builtInTools(): Record<string, unknown>[] {
    if (
      getDeepSeekModelCapabilities(String(this.modelOptions?.model))?.supportsWebSearch === true &&
      this.modelOptions?.builtIn?.webSearch === true
    ) {
      return [{ type: 'web_search' }];
    }
    return [];
  }

  parseWebSearchAction(chunk: AIMessageChunk): { type: string; query: string }[] {
    const toolOutputs = chunk.additional_kwargs?.tool_outputs;
    if (!Array.isArray(toolOutputs)) {
      return [];
    }
    return toolOutputs
      .filter(isRecord)
      .filter((tool) => tool.type === 'web_search_call' && isRecord(tool.action))
      .map((tool) => tool.action as Record<string, unknown>)
      .filter((action) => typeof action.query === 'string')
      .map((action) => ({
        type: typeof action.type === 'string' ? action.type : 'web_search',
        query: action.query as string,
      }));
  }

  protected resolveReasoningOptions(reasoning?: ReasoningOptions): ResolvedReasoningOptions {
    const model = typeof this.modelOptions?.model === 'string' ? this.modelOptions.model : '';
    const config = resolveDeepSeekReasoningConfig(model, reasoning);
    const params = getDeepSeekReasoningRequestParams(config);
    return Object.keys(params).length ? { modelKwargs: params } : {};
  }

  isToolConflict(): boolean {
    return false;
  }

  protected isApiSupportedAttachment(): boolean {
    return false;
  }
}

export const deepseekProviderOptions: LLMProviderMeta = {
  title: 'DeepSeek',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner'],
  },
  supportWebSearch: true,
  webSearchModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  provider: DeepSeekProvider,
};
