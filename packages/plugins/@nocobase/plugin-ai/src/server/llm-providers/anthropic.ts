/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LLMProvider } from './provider';
import { ChatAnthropic } from '@langchain/anthropic';
import { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import axios from 'axios';
import { encodeFile, stripToolCallTags } from '../utils';
import { Model } from '@nocobase/database';
import { LLMProviderMeta, SupportedModel } from '../manager/ai-manager';
import { Context } from '@nocobase/actions';
import { AIMessageChunk } from '@langchain/core/messages';

export class AnthropicProvider extends LLMProvider {
  declare chatModel: ChatAnthropic;

  get baseURL() {
    return 'https://api.anthropic.com';
  }

  createModel() {
    const { apiKey, baseURL } = this.serviceOptions || {};
    const sanitizedModelOptions = { ...(this.modelOptions || {}) };
    const model = sanitizedModelOptions.model;

    // 新模型要求 处理参数冲突
    const hasTemperature =
      sanitizedModelOptions.temperature !== undefined && sanitizedModelOptions.temperature !== null;
    const hasTopP =
      (sanitizedModelOptions.topP !== undefined && sanitizedModelOptions.topP !== null) ||
      (sanitizedModelOptions.top_p !== undefined && sanitizedModelOptions.top_p !== null);

    if (hasTemperature) {
      delete sanitizedModelOptions.topP;
      delete sanitizedModelOptions.top_p;
      delete sanitizedModelOptions.topK;
      delete sanitizedModelOptions.top_k;
    } else if (hasTopP) {
      delete sanitizedModelOptions.temperature;
      delete sanitizedModelOptions.topK;
      delete sanitizedModelOptions.top_k;
    } else {
      delete sanitizedModelOptions.topK;
      delete sanitizedModelOptions.top_k;
    }

    for (const key of ['topP', 'top_p', 'topK', 'top_k']) {
      if (sanitizedModelOptions[key] === -1) {
        delete sanitizedModelOptions[key];
      }
    }

    return new ChatAnthropic({
      apiKey,
      ...sanitizedModelOptions,
      model,
      anthropicApiUrl: baseURL || this.baseURL,
      verbose: false,
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
      const res = await axios.get(`${baseURL}/v1/models`, {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      return {
        models: res?.data?.data,
      };
    } catch (e) {
      const status = e.response?.status || 500;
      const errorMsg = e.response?.data?.error?.message || e.message;
      return { code: status, errMsg: `Anthropic API Error: ${errorMsg}` };
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
      const blocks = content.content;
      const textBlocks = blocks.filter((msg: any) => msg.type === 'text');
      content.content = textBlocks.map((block: any) => block.text).join('') || '';

      // Extract references from web_search_tool_result blocks (backward compat)
      if (!content.reference) {
        const refs: { title: string; url: string }[] = [];
        for (const block of blocks) {
          if (block.type === 'web_search_tool_result' && Array.isArray(block.content)) {
            for (const item of block.content) {
              if (item.type === 'web_search_result' && item.url) {
                refs.push({ title: item.title || '', url: item.url });
              }
            }
          }
        }
        if (refs.length) {
          content.reference = refs;
        }
      }
    }

    return {
      key: messageId,
      content,
      role,
    };
  }

  parseResponseChunk(chunk: any) {
    if (chunk && Array.isArray(chunk)) {
      const textBlock = chunk.find((block: any) => block.type === 'text');
      if (textBlock) {
        return stripToolCallTags(textBlock.text);
      }
      // Non-text content blocks (server_tool_use, web_search_tool_result) - skip
      return null;
    }
    return stripToolCallTags(chunk);
  }

  protected builtInTools(): any[] {
    if (this.modelOptions?.builtIn?.webSearch === true) {
      return [
        {
          type: 'web_search_20250305',
          name: 'web_search',
        },
      ];
    }
    return [];
  }

  isToolConflict(): boolean {
    return false;
  }

  parseWebSearchAction(chunk: AIMessageChunk): { type: string; query: string }[] {
    if (!Array.isArray(chunk.content)) {
      return [];
    }
    return (chunk.content as any[])
      .filter((block) => block.type === 'server_tool_use' && block.name === 'web_search')
      .map((block) => ({
        type: 'web_search',
        query: block.input?.query || '',
      }));
  }

  async parseAttachment(ctx: Context, attachment: any): Promise<any> {
    const fileManager = this.app.pm.get('file-manager') as PluginFileManagerServer;
    const url = await fileManager.getFileURL(attachment);
    const data = await encodeFile(ctx, decodeURIComponent(url));
    if (attachment.mimetype.startsWith('image/')) {
      return {
        type: 'image_url',
        image_url: {
          url: `data:image/${attachment.mimetype.split('/')[1]};base64,${data}`,
        },
      };
    } else {
      return {
        type: 'document',
        source: {
          type: 'base64',
          media_type: attachment.mimetype,
          data,
        },
      };
    }
  }
}

export const anthropicProviderOptions: LLMProviderMeta = {
  title: 'Anthropic',
  supportedModel: [SupportedModel.LLM],
  models: {
    [SupportedModel.LLM]: [
      'claude-opus-4-0',
      'claude-sonnet-4-0',
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
  },
  provider: AnthropicProvider,
  supportWebSearch: true,
};
