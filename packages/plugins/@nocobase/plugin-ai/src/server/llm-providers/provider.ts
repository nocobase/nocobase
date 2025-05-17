/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import axios from 'axios';
import { parseMessages } from './handlers/parse-messages';
import { Model } from '@nocobase/database';
import { encodeFile, parseResponseMessage, stripToolCallTags } from '../utils';
import { Context } from '@nocobase/actions';
import { PluginFileManagerServer } from '@nocobase/plugin-file-manager';
import { Application } from '@nocobase/server';

export abstract class LLMProvider {
  app: Application;
  serviceOptions: Record<string, any>;
  modelOptions: Record<string, any>;
  messages: any[];
  chatModel: any;
  chatHandlers = new Map<string, () => Promise<void> | void>();

  abstract createModel(): BaseChatModel | any;

  get baseURL() {
    return null;
  }

  constructor(opts: {
    app: Application;
    serviceOptions?: any;
    chatOptions?: {
      messages?: any[];
      tools?: any[];
      [key: string]: any;
    };
  }) {
    const { app, serviceOptions, chatOptions } = opts;
    this.app = app;
    this.serviceOptions = app.environment.renderJsonTemplate(serviceOptions);
    if (chatOptions) {
      const { messages, tools, ...modelOptions } = chatOptions;
      this.modelOptions = modelOptions;
      this.messages = messages;
      this.chatModel = this.createModel();
      if (tools?.length) {
        this.chatModel = this.chatModel.bindTools(tools);
      }
      this.registerChatHandler('parse-messages', parseMessages);
    }
  }

  registerChatHandler(name: string, handler: () => Promise<void> | void) {
    this.chatHandlers.set(name, handler.bind(this));
  }

  async invokeChat() {
    for (const handler of this.chatHandlers.values()) {
      await handler();
    }
    return this.chatModel.invoke(this.messages);
  }

  async stream(options?: any) {
    for (const handler of this.chatHandlers.values()) {
      await handler();
    }
    return this.chatModel.stream(this.messages, options);
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
}
