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
    if (context.tools?.length) {
      chain = chain.bindTools(context.tools);
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
    return chain.stream(context.messages, options);
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
}

export interface EmbeddingProviderOptions {
  app: Application;
  serviceOptions?: Record<string, any>;
  modelOptions?: Record<string, any>;
}

export abstract class EmbeddingProvider {
  constructor(protected opts: EmbeddingProviderOptions) {}
  abstract createEmbedding(): EmbeddingsInterface;
  protected abstract getDefaultUrl(): string;

  protected get apiKey() {
    const { serviceOptions } = this.opts;
    const { apiKey } = serviceOptions ?? {};
    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    return apiKey;
  }

  protected get baseUrl() {
    const { serviceOptions } = this.opts;
    const baseUrl = serviceOptions?.baseUrl ?? this.getDefaultUrl();
    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }
    return baseUrl;
  }

  protected get model() {
    const { modelOptions } = this.opts;
    const { model } = modelOptions ?? {};
    if (!model) {
      throw new Error('Embedding model is required');
    }
    return model;
  }
}
