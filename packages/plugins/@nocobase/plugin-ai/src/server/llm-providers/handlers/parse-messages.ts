/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { encodeFile, encodeLocalFile } from '../../utils';

type Message = {
  role: 'user' | 'system' | 'assistant' | 'tool';
  message?: string;
  content?:
    | { type: 'text'; content: string }
    | {
        type: 'text' | 'image_url' | 'image_base64';
        content?: string;
        image_url?: {
          url: string | { url?: string } | (string | { url?: string })[];
        };
      }[]
    | {
        type: 'file';
        content: any;
      }[];
};

async function parseMessage(message: Message) {
  switch (message.role) {
    case 'tool':
      return message;
    case 'system':
      if (message.message) {
        return new SystemMessage(message.message);
      }
      return message;
    case 'assistant':
      if (message.message) {
        return new AIMessage(message.message);
      }
      return message;
    case 'user': {
      if (!Array.isArray(message.content)) {
        return message;
      }
      if (message.content.length === 1) {
        const msg = message.content[0];
        if (msg.type === 'text') {
          return new HumanMessage(msg.content);
        }
      }
      const content = [];
      for (const c of message.content) {
        if (c.type === 'text') {
          content.push({
            type: 'text',
            text: c.content,
          });
        }
        if (c.type === 'image_url') {
          let urls = c.image_url.url;
          if (!Array.isArray(urls)) {
            urls = [urls];
          }
          for (let url of urls) {
            if (typeof url !== 'string') {
              url = url.url;
            }
            if (url && !url.startsWith('http')) {
              try {
                url = await encodeLocalFile(url);
              } catch (e) {
                throw new Error(`Failed to encode file ${url}: ${e.message}`);
              }
            }
            if (!url) {
              continue;
            }
            content.push({
              type: 'image_url',
              image_url: { url },
            });
          }
        }
        if (c.type === 'image_base64') {
          let urls = c.image_url.url;
          if (!Array.isArray(urls)) {
            urls = [urls];
          }
          for (let url of urls) {
            if (typeof url !== 'string') {
              url = url.url;
            }
            try {
              url = await encodeFile(url);
            } catch (e) {
              throw new Error(`Failed to encode file ${url}: ${e.message}`);
            }
            if (!url) {
              continue;
            }
            content.push({
              type: 'image_url',
              image_url: { url },
            });
          }
        }
        if (c.type === 'file') {
          try {
            const msg = await this.parseAttachment(c.content);
            content.push(msg);
          } catch (e) {
            throw new Error(`Failed to parse file ${c.content?.filename}: ${e.message}`);
          }
        }
      }
      return new HumanMessage({
        content,
      });
    }
  }
}

export async function parseMessages() {
  const msgs = [];
  for (const message of this.messages) {
    const msg = await parseMessage.call(this, message);
    msgs.push(msg);
  }
  this.messages = msgs;
}
