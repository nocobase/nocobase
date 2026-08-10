/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Model } from '@nocobase/database';
import { type AttachmentModel, PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { Application } from '@nocobase/server';
import { checkUrlAgainstWhitelist, serverRequest } from '@nocobase/utils';
import { AIChatContext, AIMessageInput } from '../types/ai-chat-conversation.type';
import { buildTool, encodeReadableStream, parseResponseMessage, stripToolCallTags } from '../utils';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { AIMessage, AIMessageChunk } from '@langchain/core/messages';
import { Context } from '@nocobase/actions';
import '@langchain/core/utils/stream';
import { LLMResult } from '@langchain/core/outputs';
import { ContentBlock } from '@langchain/core/messages';
import { CachedDocumentLoader, SUPPORTED_DOCUMENT_EXTNAMES } from '../document-loader';
import path from 'node:path';
import PluginAIServer from '../plugin';
import { MODEL_KWARGS_KEY } from './common/reasoning';

export type ParsedAttachmentResult = {
  placement: string;
  content: any;
};

export type LLMProviderInvokeOptions = {
  modelKwargs?: Record<string, any>;
  modelRequestParams?: Record<string, any>;
  [key: string]: any;
};

export type LLMModelRequestBuilderResult = {
  context: AIChatContext;
  options?: LLMProviderInvokeOptions;
};

export type LLMModelRequestBuilder = (input: {
  context: AIChatContext;
  options?: LLMProviderInvokeOptions;
}) => LLMModelRequestBuilderResult;

export interface LLMProviderOptions {
  app: Application;
  serviceOptions?: Record<string, any>;
  modelOptions?: Record<string, any>;
}

function assertBaseURLString(baseURL: unknown): asserts baseURL is string {
  if (typeof baseURL !== 'string') {
    throw new Error('baseURL must be a string');
  }
}

function normalizeBaseURL(baseURL: unknown): string {
  assertBaseURLString(baseURL);
  const trimmedBaseURL = baseURL.trim();
  checkUrlAgainstWhitelist(trimmedBaseURL);
  return new URL(trimmedBaseURL).toString().replace(/\/$/, '');
}

function isBlankBaseURL(baseURL: string): boolean {
  return baseURL.trim() === '';
}

function getServiceBaseURL(serviceOptions?: Record<string, any>): unknown {
  const baseURL = serviceOptions?.baseURL;
  if (typeof baseURL === 'string' && isBlankBaseURL(baseURL)) {
    return null;
  }
  return baseURL;
}

function resolveServiceOptions(serviceOptions: Record<string, any> | undefined, app: Application) {
  const rendered = app.environment.renderJsonTemplate(serviceOptions ?? {});
  if (rendered?.baseURL != null) {
    assertBaseURLString(rendered.baseURL);
    if (isBlankBaseURL(rendered.baseURL)) {
      delete rendered.baseURL;
      return rendered;
    }
    rendered.baseURL = normalizeBaseURL(rendered.baseURL);
  }
  return rendered;
}

export abstract class LLMProvider {
  app: Application;
  serviceOptions: Record<string, any>;
  modelOptions: Record<string, any> | undefined;
  chatModel: any;

  abstract createModel(): BaseChatModel | any;

  get baseURL(): string | null {
    return null;
  }

  constructor(opts: LLMProviderOptions) {
    const { app, serviceOptions, modelOptions } = opts;
    this.app = app;
    this.serviceOptions = resolveServiceOptions(serviceOptions, app);
    if (modelOptions) {
      this.modelOptions = modelOptions;
      this.chatModel = this.createModel();
    }
  }

  protected getModelRequestBuilder(_model?: string): LLMModelRequestBuilder | null {
    return null;
  }

  prepareChain(context: AIChatContext) {
    let chain = this.chatModel;
    const toolDefinitions = context.tools?.map(buildTool);

    if (this.builtInTools()?.length) {
      const tools = [...this.builtInTools()];
      if (!this.isToolConflict() && toolDefinitions?.length) {
        tools.push(...toolDefinitions);
      }
      chain = chain.bindTools?.(tools);
    } else if (toolDefinitions?.length) {
      chain = chain.bindTools?.(toolDefinitions);
    }

    if (context.structuredOutput) {
      const { schema, options } = this.getStructuredOutputOptions(context.structuredOutput) || {};
      if (schema) {
        chain = chain.withStructuredOutput(schema, options);
      }
    }
    return chain;
  }

  async invoke(context: AIChatContext, options?: LLMProviderInvokeOptions) {
    const builder = this.getModelRequestBuilder(this.modelOptions?.model);
    const request = builder?.({ context, options }) || { context, options };
    const chain = this.prepareChain(request.context);
    const requestInvokeOptions = options?.signal
      ? {
          ...(request.options || {}),
          signal: request.options?.signal ?? options.signal,
        }
      : request.options;
    const { modelKwargs, modelRequestParams, options: requestOptions, ...restOptions } = requestInvokeOptions || {};
    const invokeOptions = modelKwargs
      ? {
          ...restOptions,
          [MODEL_KWARGS_KEY]: modelKwargs,
          options: {
            ...(requestOptions || {}),
            [MODEL_KWARGS_KEY]: modelKwargs,
          },
        }
      : {
          ...restOptions,
          ...(requestOptions ? { options: requestOptions } : {}),
        };
    return chain.invoke(request.context.messages, invokeOptions);
  }

  async stream(context: AIChatContext, options?: any) {
    const chain = this.prepareChain(context);
    return chain.streamEvents(context.messages, options);
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
      url = this.buildRequestURL('models');
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
      return { models: res?.data.data };
    } catch (e) {
      const status = e.response?.status || 500;
      const data = e.response?.data;
      const errorMsg =
        data?.error?.message ||
        data?.message ||
        (typeof data?.error === 'string' ? data.error : undefined) ||
        (typeof data === 'string' ? data : undefined) ||
        e.response?.statusText ||
        e.message;
      return { code: status, errMsg: errorMsg };
    }
  }

  parseResponseMessage(message: Model) {
    return parseResponseMessage(message);
  }

  parseResponseChunk(chunk: any) {
    return stripToolCallTags(chunk);
  }

  async parseAttachment(ctx: Context, attachment: AttachmentModel): Promise<ParsedAttachmentResult> {
    const dataSourceKey = attachment?.source?.dataSourceKey;
    const isExternalAttachment = Boolean(dataSourceKey && dataSourceKey !== 'main');
    if ((!attachment?.storageId && !isExternalAttachment) || !attachment?.filename) {
      return {
        placement: 'system',
        content:
          'The user provided an attachment, but it is unavailable or invalid and cannot be parsed. Do not use this attachment as evidence; tell the user the attachment is unavailable.',
      };
    }
    if (this.isApiSupportedAttachment(attachment)) {
      return await this.convertToContent(ctx, attachment);
    } else if (this.isDocumentLoaderSupportedAttachment(attachment)) {
      return await this.loadDocument(ctx, attachment);
    } else {
      const safeFilename = attachment.filename ? path.basename(attachment.filename) : 'document';
      return {
        placement: 'system',
        content: `The user has uploaded a ${attachment.mimetype} file (filename: ${safeFilename}). Please inform the user directly that you do not support parsing ${attachment.mimetype} content.`,
      };
    }
  }

  protected isApiSupportedAttachment(attachment: AttachmentModel): boolean {
    const media = ['image/'];
    const pdf = ['application/pdf'];
    const supportedMedia = media.some((it) => attachment?.mimetype?.startsWith(it));
    const supportedPdf = pdf.some((it) => attachment?.mimetype?.includes(it));
    return supportedMedia || supportedPdf;
  }

  protected isDocumentLoaderSupportedAttachment(attachment: AttachmentModel): boolean {
    const ext = path.extname(attachment?.filename ?? '').toLocaleLowerCase();
    return SUPPORTED_DOCUMENT_EXTNAMES.includes(ext);
  }

  protected async encodeAttachment(ctx: Context, attachment: AttachmentModel) {
    const fileManager = this.app.pm.get('file-manager') as PluginFileManagerServer;
    if (typeof ctx.get !== 'function') {
      const { stream } = await fileManager.getFileStream(attachment);
      return await encodeReadableStream(stream);
    }
    const { stream } = await fileManager.getFileStream(attachment, {
      requestOptions: {
        headers: {
          Referer: ctx.get('referer') || '',
          'User-Agent': ctx.get('user-agent') || '',
        },
      },
    });
    return await encodeReadableStream(stream);
  }

  protected async convertToContent(ctx: Context, attachment: AttachmentModel): Promise<ParsedAttachmentResult> {
    const data = await this.encodeAttachment(ctx, attachment);
    if (attachment.mimetype.startsWith('image/')) {
      return {
        placement: 'contentBlocks',
        content: {
          type: 'image_url',
          image_url: {
            url: `data:image/${attachment.mimetype.split('/')[1]};base64,${data}`,
          },
        },
      } as ParsedAttachmentResult;
    } else {
      return {
        placement: 'contentBlocks',
        content: {
          type: 'file',
          mimeType: attachment.mimetype,
          metadata: {
            filename: attachment.filename,
          },
          data,
        } as ContentBlock.Multimodal.File,
      } as ParsedAttachmentResult;
    }
  }

  protected async loadDocument(ctx: Context, attachment: any): Promise<any> {
    const safeFilename = attachment.filename ? path.basename(attachment.filename) : 'document';

    const loaderOptions =
      typeof ctx.get === 'function'
        ? {
            requestOptions: {
              headers: {
                Referer: ctx.get('referer') || '',
                'User-Agent': ctx.get('user-agent') || '',
              },
            },
          }
        : undefined;

    const parsed = await this.documentLoader.load(attachment, loaderOptions);
    if (!parsed.supported) {
      return {
        placement: 'system',
        content: `File ${safeFilename} is not a supported document type for text parsing.`,
      };
    }
    if (parsed.text.length === 0) {
      return {
        placement: 'system',
        content: `The file provided by the user is an empty file, file name is "${safeFilename}"`,
      };
    }
    return {
      placement: 'system',
      content: `<parsed_document filename="${safeFilename}">\n${parsed.text}\n</parsed_document>`,
    };
  }

  getStructuredOutputOptions(structuredOutput: AIChatContext['structuredOutput']): any {
    const { responseFormat } = this.modelOptions || {};
    const { schema, name, description, strict } = structuredOutput || {};
    if (!schema) {
      return;
    }
    const methods: Record<string, string> = {
      json_object: 'jsonMode',
      json_schema: 'jsonSchema',
    };
    const options: Record<string, any> = {
      includeRaw: true,
      name,
      method: methods[responseFormat],
    };
    if (strict) {
      options['strict'] = strict;
      options['method'] = 'jsonSchema';
    }
    return {
      schema: {
        name,
        description,
        parameters: schema,
      },
      options,
    };
  }

  async testFlight(): Promise<{ status: 'success' | 'error'; code: number; message?: string }> {
    try {
      const result = await this.chatModel.invoke('hello');
    } catch (error) {
      return {
        status: 'error',
        code: 1,
        message: error.message,
      };
    }
    return {
      status: 'success',
      code: 0,
    };
  }

  protected builtInTools(): any[] {
    return [];
  }

  isToolConflict(): boolean {
    return false;
  }

  resolveTools(toolDefinitions: any[]): any[] {
    const builtIn = this.builtInTools();
    if (builtIn.length > 0 && toolDefinitions.length > 0 && this.isToolConflict()) {
      return [...builtIn];
    }
    return [...builtIn, ...toolDefinitions];
  }

  parseWebSearchAction(chunk: AIMessageChunk): { type: string; query: string }[] {
    return [];
  }

  parseReasoningContent(chunk: AIMessageChunk): { status: string; content: string } | null {
    return null;
  }

  parseResponseMetadata(output: LLMResult): any {
    return [null, null];
  }

  parseResponseError(err) {
    return err?.message ?? 'Unexpected LLM service error';
  }

  reshapeAIMessage(_options: { aiMessage: AIMessage; values: AIMessageInput }) {}

  protected get documentLoader(): CachedDocumentLoader {
    return this.aiPlugin.documentLoaders.cached;
  }

  protected getResolvedBaseURL(): string {
    const baseURL = getServiceBaseURL(this.serviceOptions) ?? this.baseURL;
    if (!baseURL) {
      throw new Error('baseURL is required');
    }
    return normalizeBaseURL(baseURL);
  }

  protected buildRequestURL(pathname: string): string {
    const url = new URL(pathname.replace(/^\/+/, ''), `${this.getResolvedBaseURL()}/`).toString();
    checkUrlAgainstWhitelist(url);
    return url;
  }

  protected get aiPlugin(): PluginAIServer {
    return this.app.pm.get('ai');
  }
}

export interface EmbeddingProviderOptions {
  app: Application;
  serviceOptions?: Record<string, any>;
  modelOptions?: Record<string, any>;
}

export abstract class EmbeddingProvider {
  protected app: Application;
  protected serviceOptions?: Record<string, any>;
  protected modelOptions?: Record<string, any>;
  constructor(protected opts: EmbeddingProviderOptions) {
    const { app, serviceOptions, modelOptions } = this.opts;
    this.app = app;
    this.serviceOptions = resolveServiceOptions(serviceOptions, app);
    this.modelOptions = modelOptions;
  }
  abstract createEmbedding(): EmbeddingsInterface;
  protected abstract getDefaultUrl(): string;

  protected get apiKey() {
    const { apiKey } = this.serviceOptions ?? {};
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    return apiKey;
  }

  protected get baseURL() {
    const baseURL = getServiceBaseURL(this.serviceOptions) ?? this.getDefaultUrl();
    if (!baseURL) {
      throw new Error('baseURL is required');
    }
    return normalizeBaseURL(baseURL);
  }

  protected get model() {
    const { model } = this.modelOptions ?? {};
    if (!model) {
      throw new Error('Embedding model is required');
    }
    return model;
  }
}
