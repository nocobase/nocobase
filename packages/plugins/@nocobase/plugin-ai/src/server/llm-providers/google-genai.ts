/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { EmbeddingProvider, LLMProvider } from './provider';
import axios from 'axios';
import { Model } from '@nocobase/database';
import { encodeFile } from '../utils';
import { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { EmbeddingsInterface } from '@langchain/core/embeddings';

const GOOGLE_GEN_AI_URL = 'https://generativelanguage.googleapis.com/v1beta/';

export class GoogleGenAIProvider extends LLMProvider {
  declare chatModel: ChatGoogleGenerativeAI;

  get baseURL() {
    return GOOGLE_GEN_AI_URL;
  }

  createModel() {
    const { apiKey } = this.serviceOptions || {};
    const { model, responseFormat } = this.modelOptions || {};

    return new ChatGoogleGenerativeAI({
      apiKey,
      ...this.modelOptions,
      model,
      json: responseFormat === 'json',
      // verbose: true,
    });
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
      const res = await axios.get(`${baseURL}/models?key=${apiKey}`);
      return {
        models: res?.data?.models.map((model) => ({
          id: model.name,
        })),
      };
    } catch (e) {
      return { code: 500, errMsg: e.message };
    }
  }

  parseResponseMessage(message: Model) {
    const { content: rawContent, messageId, metadata, role, toolCalls, attachments, workContext } = message;
    const content = {
      ...rawContent,
      messageId,
      metadata,
      attachments,
      workContext,
    };

    if (toolCalls) {
      content.tool_calls = toolCalls;
    }

    if (Array.isArray(content.content)) {
      const textMessage = content.content.find((msg) => msg.type === 'text');
      content.content = textMessage?.text;
    }

    return {
      key: messageId,
      content,
      role,
    };
  }

  async parseAttachment(attachment: any) {
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
        type: attachment.mimetype,
        data,
      };
    }
  }
}

export class GoogleGenAIEmbeddingProvider extends EmbeddingProvider {
  protected getDefaultUrl(): string {
    return GOOGLE_GEN_AI_URL;
  }

  createEmbedding(): EmbeddingsInterface {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      model: this.model,
    });
  }
}

export const googleGenAIProviderOptions: LLMProviderMeta = {
  title: 'Google generative AI',
  supportedModel: [SupportedModel.LLM, SupportedModel.EMBEDDING],
  models: {
    [SupportedModel.LLM]: [
      'models/gemini-2.5-pro',
      'models/gemini-2.5-flash',
      'models/gemini-2.5-flash-lite',
      'models/gemini-2.0-flash',
      'models/gemini-2.0-flash-lite',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
    ],
    [SupportedModel.EMBEDDING]: ['gemini-embedding-001', 'models/text-embedding-004'],
  },
  provider: GoogleGenAIProvider,
  embedding: GoogleGenAIEmbeddingProvider,
};
