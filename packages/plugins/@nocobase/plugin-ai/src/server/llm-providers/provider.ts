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
import { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { Application } from '@nocobase/server';
import axios from 'axios';
import { AIChatContext } from '../types/ai-chat-conversation.type';
import { encodeFile, parseResponseMessage, stripToolCallTags } from '../utils';
import { EmbeddingsInterface } from '@langchain/core/embeddings';
import { AIMessageChunk } from '@langchain/core/messages';

export interface LLMProviderOptions {
  app: Application;
  serviceOptions?: Record<string, any>;
  modelOptions?: Record<string, any>;
}

export abstract class LLMProvider {
  app: Application;
  serviceOptions: Record<string, any>;
  modelOptions: Record<string, any>;
  chatModel: any;

  abstract createModel(): BaseChatModel | any;

  get baseURL() {
    return null;
  }

  constructor(opts: LLMProviderOptions) {
    const { app, serviceOptions, modelOptions } = opts;
    this.app = app;
    this.serviceOptions = app.environment.renderJsonTemplate(serviceOptions);
    if (modelOptions) {
      this.modelOptions = modelOptions;
      this.chatModel = this.createModel();
    }
  }

  prepareChain(context: AIChatContext) {
    let chain = this.chatModel;

    if (this.builtInTools()?.length) {
      const tools = [...this.builtInTools()];
      if (!this.isToolConflict() && context.tools?.length) {
        tools.push(...context.tools);
      }
      chain = chain.bindTools?.(tools);
    } else if (context.tools?.length) {
      chain = chain.bindTools?.(context.tools);
    }

    if (context.structuredOutput) {
      const { schema, options } = this.getStructuredOutputOptions(context.structuredOutput) || {};
      if (schema) {
        chain = chain.withStructuredOutput(schema, options);
      }
    }
    return chain;
  }

  async invokeChat(context: AIChatContext, options?: any) {
    const chain = this.prepareChain(context);
    return chain.invoke(context.messages, options);
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
    let baseURL = options.baseURL || this.baseURL;
    if (!baseURL) {
      return { code: 400, errMsg: 'baseURL is required' };
    }
    if (!apiKey) {
      return { code: 400, errMsg: 'API Key required' };
    }
    if (baseURL && baseURL.endsWith('/')) {
      baseURL = baseURL.slice(0, -1);
    }
    try {
      if (baseURL && baseURL.endsWith('/')) {
        baseURL = baseURL.slice(0, -1);
      }
      const res = await axios.get(`${baseURL}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return { models: res?.data.data };
    } catch (e) {
      return { code: 500, errMsg: e.message };
    }
  }

  parseResponseMessage(message: Model) {
    return parseResponseMessage(message);
  }

  parseResponseChunk(chunk: any) {
    return stripToolCallTags(chunk);
  }

  async parseAttachment(attachment: any): Promise<any> {
    const fileManager = this.app.pm.get('file-manager') as PluginFileManagerServer;
    const url = await fileManager.getFileURL(attachment);
    const data = await encodeFile(decodeURIComponent(url));
    if (attachment.mimetype.startsWith('image/')) {
      return {
        type: 'image_url',
        image_url: {
          url: `data:image/${attachment.mimetype.split('/')[1]};base64,${data}`,
        },
      };
    } else {
      return {
        type: 'input_file',
        filename: attachment.filename,
        file_data: data,
      };
    }
  }

  getStructuredOutputOptions(structuredOutput: AIChatContext['structuredOutput']) {
    const { responseFormat } = this.modelOptions || {};
    const { schema, name, description, strict } = structuredOutput || {};
    if (!schema) {
      return;
    }
    const methods = {
      json_object: 'jsonMode',
      json_schema: 'jsonSchema',
    };
    const options = {
      includeRaw: true,
      name,
      method: methods[responseFormat],
    };
    if (strict) {
      options['strict'] = strict;
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
      console.log(result);
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

  protected isToolConflict(): boolean {
    return true;
  }

  parseWebSearchAction(chunk: AIMessageChunk): { type: string; query: string }[] {
    return [];
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
    this.serviceOptions = app.environment.renderJsonTemplate(serviceOptions ?? {});
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

  protected get baseUrl() {
    const baseUrl = this.serviceOptions?.baseUrl ?? this.getDefaultUrl();
    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }
    return baseUrl;
  }

  protected get model() {
    const { model } = this.modelOptions ?? {};
    if (!model) {
      throw new Error('Embedding model is required');
    }
    return model;
  }
}
