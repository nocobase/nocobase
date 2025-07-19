/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

type Message = {
  role: 'user' | 'system' | 'assistant';
  message?: string;
  content?: {
    type: 'text' | 'image_url' | 'image_base64';
    content?: string;
    image_url?: {
      url: string | { url?: string } | (string | { url?: string })[];
    };
  }[];
};

async function encodeLocalImage(url: string) {
  url = path.join(process.cwd(), url);
  const imageData = await fs.promises.readFile(url);
  return `data:image/png;base64,${imageData.toString('base64')}`;
}

async function encodeImage(url: string) {
  if (!url.startsWith('http')) {
    return encodeLocalImage(url);
  }
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return `data:image/png;base64,${Buffer.from(response.data).toString('base64')}`;
}

async function parseMessage(message: Message) {
  switch (message.role) {
    case 'system':
      return new SystemMessage(message.message);
    case 'assistant':
      return new AIMessage(message.message);
    case 'user': {
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
                url = await encodeLocalImage(url);
              } catch (e) {
                throw new Error(`Failed to encode image ${url}: ${e.message}`);
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
              url = await encodeImage(url);
            } catch (e) {
              throw new Error(`Failed to encode image ${url}: ${e.message}`);
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
      }
      return new HumanMessage({
        content,
      });
    }
  }
}

export async function parseMessages(messages: any[]) {
  const msgs = [];
  for (const message of messages) {
    const msg = await parseMessage(message);
    msgs.push(msg);
  }
  this.messages = msgs;
}
